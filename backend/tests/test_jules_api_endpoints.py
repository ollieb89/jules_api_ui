import pytest
from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APIClient

from jules.models import JulesSettings
from jules.exceptions.api_error import ApiRequestError


@pytest.fixture
def api_client(db):
    user_model = get_user_model()
    user = user_model.objects.create_user(username='tester', password='pass')
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def test_sources_list_serializes_optional_metadata(api_client, monkeypatch):
    class StubClient:
        def list_sources(self):
            return {
                'sources': [
                    {
                        'name': 'sources/456',
                        'display_name': 'CLI Repo',
                        'github_metadata': None,
                    }
                ]
            }

    monkeypatch.setattr('jules.views.JulesApiClient', lambda: StubClient())

    response = api_client.get('/api/jules/sources/')

    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    assert payload['sources'] == [
        {
            'name': 'sources/456',
            'display_name': 'CLI Repo',
            'github_metadata': None,
        }
    ]


def test_sources_list_handles_api_request_error(api_client, monkeypatch):
    class StubClient:
        def list_sources(self):
            raise ApiRequestError(
                'Bad gateway.',
                status_code=502,
                details={'upstream_status': 502, 'upstream_request_id': 'req-1'},
                user_message='Source service unavailable.',
                retry_after=4,
            )

    monkeypatch.setattr('jules.views.JulesApiClient', lambda: StubClient())

    with override_settings(DEBUG=True):
        response = api_client.get('/api/jules/sources/')

    assert response.status_code == status.HTTP_502_BAD_GATEWAY
    payload = response.json()
    assert payload['error']['message'] == 'Source service unavailable.'
    assert payload['error']['detail'] == {
        'upstream_status': 502,
        'upstream_request_id': 'req-1',
    }
    assert payload['retry_after_seconds'] == 4


def test_sessions_list_uses_default_pagination(api_client, monkeypatch):
    captured: dict[str, object] = {}

    class StubClient:
        def list_sessions(self, page_size, page_token):
            captured['page_size'] = page_size
            captured['page_token'] = page_token
            return {
                'sessions': [
                    {
                        'name': 'sessions/10',
                        'displayName': 'Session Ten',
                        'state': 'ACTIVE',
                        'prompt': 'Handle things',
                        'source': 'sources/123',
                        'createTime': '2024-02-01T00:00:00Z',
                        'updateTime': '2024-02-02T00:00:00Z',
                    }
                ]
            }

    monkeypatch.setattr('jules.views.JulesApiClient', lambda: StubClient())
    monkeypatch.setattr('jules.views.is_sessions_cache_fresh', lambda: False)

    response = api_client.get('/api/jules/sessions/')

    assert response.status_code == status.HTTP_200_OK
    assert captured == {'page_size': 100, 'page_token': None}
    payload = response.json()
    assert payload['sessions'][0]['display_name'] == 'Session Ten'


def test_sessions_retrieve_serializes_fields(api_client, monkeypatch):
    class StubClient:
        def get_session(self, session_id):  # noqa: ARG002
            return {
                'name': 'sessions/42',
                'displayName': 'Deep Dive',
                'state': 'COMPLETED',
                'prompt': 'Review logs',
                'source': 'sources/789',
                'createTime': '2024-04-01T00:00:00Z',
                'updateTime': '2024-04-02T00:00:00Z',
            }

    monkeypatch.setattr('jules.views.JulesApiClient', lambda: StubClient())

    response = api_client.get('/api/jules/sessions/42/?refresh=1')

    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    assert payload == {
        'name': 'sessions/42',
        'display_name': 'Deep Dive',
        'state': 'COMPLETED',
        'prompt': 'Review logs',
        'source': 'sources/789',
        'create_time': '2024-04-01T00:00:00+00:00',
        'update_time': '2024-04-02T00:00:00+00:00',
    }


def test_sessions_list_handles_api_error(api_client, monkeypatch):
    class StubClient:
        def list_sessions(self, page_size, page_token):  # noqa: ARG002
            raise ApiRequestError(
                'Upstream request failed.',
                status_code=503,
                details={'upstream_status': 503},
                user_message='Upstream service is unavailable. Please try again shortly.',
                retry_after=2,
            )

    monkeypatch.setattr('jules.views.JulesApiClient', lambda: StubClient())

    # Bypass cache check
    monkeypatch.setattr('jules.views.is_sessions_cache_fresh', lambda: False)

    with override_settings(DEBUG=True):
        response = api_client.get('/api/jules/sessions/')

    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    payload = response.json()
    assert payload['error']['message'] == (
        'Upstream service is unavailable. Please try again shortly.'
    )
    assert payload['error']['detail'] == {'upstream_status': 503}
    assert payload['retry_after_seconds'] == 2


def test_activities_list_serializes_progress_updates(api_client, monkeypatch):
    captured: dict[str, object] = {}

    class StubClient:
        def list_activities(self, session_id, page_size, page_token):
            captured['session_id'] = session_id
            captured['page_size'] = page_size
            captured['page_token'] = page_token
            return {
                'activities': [
                    {
                        'name': 'sessions/1/activities/99',
                        'progressUpdated': {
                            'title': 'Update',
                            'description': 'All done.',
                            'artifacts': [{'bashOutput': 'ok'}],
                        },
                        'createTime': '2024-03-01T00:00:00Z',
                    }
                ]
            }

    monkeypatch.setattr('jules.views.JulesApiClient', lambda: StubClient())
    monkeypatch.setattr('jules.views.is_activities_cache_fresh', lambda x: False)

    response = api_client.get('/api/jules/sessions/1/activities/')

    assert response.status_code == status.HTTP_200_OK
    assert captured == {'session_id': '1', 'page_size': 100, 'page_token': None}
    payload = response.json()
    activity = payload['activities'][0]

    assert len(activity['progress_updated']['artifacts']) == 1
    artifact = activity['progress_updated']['artifacts'][0]
    assert artifact['bash_output'] == 'ok'


def test_activities_list_serializes_plan_approved(api_client, monkeypatch):
    class StubClient:
        def list_activities(self, session_id, page_size, page_token):  # noqa: ARG002
            return {
                'activities': [
                    {
                        'name': 'sessions/2/activities/7',
                        'planApproved': {
                            'plan': {
                                'steps': [
                                    {
                                        'title': 'Approve steps',
                                        'description': 'Ship it.',
                                        'state': 'COMPLETED',
                                    }
                                ],
                                'state': 'COMPLETED',
                            }
                        },
                        'createTime': '2024-05-01T00:00:00Z',
                    }
                ],
                'nextPageToken': 'token-next',
            }

    monkeypatch.setattr('jules.views.JulesApiClient', lambda: StubClient())
    monkeypatch.setattr('jules.views.is_activities_cache_fresh', lambda x: False)

    response = api_client.get('/api/jules/sessions/2/activities/?page_size=1')

    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    assert payload['next_page_token'] == 'token-next'
    activity = payload['activities'][0]
    assert activity['plan_approved']['plan']['state'] == 'COMPLETED'
    assert activity['plan_approved']['plan']['steps'][0]['title'] == 'Approve steps'


def test_activities_list_serializes_plan_approved_with_missing_plan(api_client, monkeypatch):
    """Test that plan_approved activity serializes gracefully when plan is missing."""
    class StubClient:
        def list_activities(self, session_id, page_size, page_token):  # noqa: ARG002
            return {
                'activities': [
                    {
                        'name': 'sessions/2/activities/8',
                        'planApproved': {},  # Empty plan
                        'createTime': '2024-05-01T00:00:00Z',
                    }
                ],
                'nextPageToken': None,
            }

    monkeypatch.setattr('jules.views.JulesApiClient', lambda: StubClient())
    monkeypatch.setattr('jules.views.is_activities_cache_fresh', lambda x: False)

    response = api_client.get('/api/jules/sessions/2/activities/?page_size=1')

    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    activity = payload['activities'][0]
    # Should have plan_approved key with null/missing plan
    assert 'plan_approved' in activity


def test_activities_list_handles_api_error(api_client, monkeypatch):
    class StubClient:
        def list_activities(self, session_id, page_size, page_token):  # noqa: ARG002
            raise ApiRequestError(
                'Timeout.',
                status_code=504,
                details={'upstream_status': 504},
                user_message='Upstream request timed out.',
                retry_after=1,
            )

    monkeypatch.setattr('jules.views.JulesApiClient', lambda: StubClient())
    monkeypatch.setattr('jules.views.is_activities_cache_fresh', lambda x: False)

    with override_settings(DEBUG=True):
        response = api_client.get('/api/jules/sessions/1/activities/')

    assert response.status_code == status.HTTP_504_GATEWAY_TIMEOUT
    payload = response.json()
    assert payload['error']['message'] == 'Upstream request timed out.'
    assert payload['error']['detail'] == {'upstream_status': 504}
    assert payload['retry_after_seconds'] == 1


def test_settings_test_connection_handles_failure(api_client, monkeypatch):
    settings_obj = JulesSettings.get_settings()
    settings_obj.set_api_key('api-key-0000')
    settings_obj.save()

    class StubClient:
        def list_sources(self):
            raise RuntimeError('service down')

    monkeypatch.setattr('jules.views.JulesApiClient', lambda: StubClient())

    response = api_client.post('/api/jules/settings/test/')

    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    payload = response.json()
    assert payload['status'] == 'error'
    assert payload['api_connectivity'] == 'failed'
    assert payload['error'] == 'service down'


def test_settings_test_connection_handles_api_request_error(api_client, monkeypatch):
    settings_obj = JulesSettings.get_settings()
    settings_obj.set_api_key('api-key-5555')
    settings_obj.save()

    class StubClient:
        def list_sources(self):
            raise ApiRequestError(
                'Gateway error.',
                status_code=502,
                details={'upstream_status': 502},
                user_message='Downstream unavailable.',
            )

    monkeypatch.setattr('jules.views.JulesApiClient', lambda: StubClient())

    response = api_client.post('/api/jules/settings/test/')

    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    payload = response.json()
    assert payload['status'] == 'error'
    assert payload['api_connectivity'] == 'failed'
    assert payload['error'] == 'Gateway error.'


@pytest.mark.parametrize(
    'path',
    [
        '/api/jules/sources/',
        '/api/jules/sessions/',
        '/api/jules/settings/',
        '/api/jules/health/',
    ],
)
def test_jules_endpoints_require_authentication(path):
    client = APIClient()

    response = client.get(path)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
