"""Test session display_name generation."""

from __future__ import annotations

import pytest

from jules.store import get_or_create_session_stub, upsert_session_from_api


@pytest.mark.django_db
def test_display_name_generated_from_prompt_when_missing() -> None:
    """Test that display_name is generated from prompt when not provided."""
    session_data = {
        "name": "sessions/test1",
        "state": "ACTIVE",
        "prompt": "Create a new authentication system with JWT tokens and refresh capabilities",
        "source": "sources/cli",
        "createTime": "2024-01-01T12:00:00Z",
        "updateTime": "2024-01-02T12:00:00Z",
    }

    session = upsert_session_from_api(session_data)

    # Display name should be first 60 chars of prompt + "..."
    expected = "Create a new authentication system with JWT tokens and refre..."
    assert session.display_name == expected
    assert session.display_name.endswith("...")
    assert len(session.display_name) == 63  # 60 + "..."


@pytest.mark.django_db
def test_display_name_short_prompt_no_ellipsis() -> None:
    """Test that short prompts don't get ellipsis added."""
    session_data = {
        "name": "sessions/test2",
        "state": "ACTIVE",
        "prompt": "Fix the bug",
        "source": "sources/cli",
    }

    session = upsert_session_from_api(session_data)

    assert session.display_name == "Fix the bug"


@pytest.mark.django_db
def test_display_name_preserved_when_provided() -> None:
    """Test that provided display_name is preserved."""
    session_data = {
        "name": "sessions/test3",
        "displayName": "My Custom Session Name",
        "state": "ACTIVE",
        "prompt": "This is a long prompt that would normally be used for display name",
        "source": "sources/cli",
    }

    session = upsert_session_from_api(session_data)

    assert session.display_name == "My Custom Session Name"


@pytest.mark.django_db
def test_display_name_uses_session_name_when_no_prompt() -> None:
    """Test that session name is used when prompt is empty."""
    session_data = {
        "name": "sessions/test4",
        "state": "ACTIVE",
        "prompt": "",
        "source": "sources/cli",
    }

    session = upsert_session_from_api(session_data)

    # Display name should be empty when prompt is empty and no displayName provided
    assert session.display_name == ""


@pytest.mark.django_db
def test_stub_session_uses_name_as_display_name() -> None:
    """Test that stub session creation uses session name as display_name."""
    session = get_or_create_session_stub("sessions/stub123")

    assert session.name == "sessions/stub123"
    assert session.display_name == "sessions/stub123"
    assert session.prompt == ""
    assert session.state == "STATE_UNSPECIFIED"


@pytest.mark.django_db
def test_exactly_60_char_prompt_gets_no_ellipsis() -> None:
    """Test that exactly 60 character prompts don't get ellipsis."""
    prompt_60 = "a" * 60
    session_data = {
        "name": "sessions/test5",
        "state": "ACTIVE",
        "prompt": prompt_60,
        "source": "sources/cli",
    }

    session = upsert_session_from_api(session_data)

    assert session.display_name == prompt_60
    assert len(session.display_name) == 60


@pytest.mark.django_db
def test_61_char_prompt_gets_ellipsis() -> None:
    """Test that 61 character prompts get truncated with ellipsis."""
    prompt_61 = "a" * 61
    session_data = {
        "name": "sessions/test6",
        "state": "ACTIVE",
        "prompt": prompt_61,
        "source": "sources/cli",
    }

    session = upsert_session_from_api(session_data)

    expected = ("a" * 60) + "..."
    assert session.display_name == expected
    assert len(session.display_name) == 63
