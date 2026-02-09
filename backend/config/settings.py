"""
Django settings for backend project.
"""

import os
import sys
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
TESTING = os.getenv("TESTING", "False").lower() == "true" or "pytest" in sys.modules

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    if not DEBUG and not TESTING:
        raise RuntimeError("DJANGO_SECRET_KEY must be set in production")
    SECRET_KEY = "django-insecure-dev-only"

JULES_ENCRYPTION_KEY = os.getenv("JULES_ENCRYPTION_KEY", SECRET_KEY)
JULES_API_KEY_ENCRYPTION_KEY = os.getenv(
    "JULES_API_KEY_ENCRYPTION_KEY", JULES_ENCRYPTION_KEY
)

# Security Settings
# https://docs.djangoproject.com/en/5.0/topics/security/

# Always set these headers to protect against common attacks
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# Production Security Settings
if not DEBUG:
    # Force HTTPS
    SECURE_SSL_REDIRECT = not TESTING
    # Trust the X-Forwarded-Proto header for SSL termination proxies
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

    # Secure cookies (HTTPS only)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    # HTTP Strict Transport Security (HSTS)
    # 31536000 seconds = 1 year
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

    # Referrer policy
    SECURE_REFERRER_POLICY = "same-origin"
else:
    # Development settings
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
    SECURE_SSL_REDIRECT = False

ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party apps
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_q",
    # Local apps
    "users",
    "jules.apps.JulesConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "jules.middleware.CorrelationIdMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases
# Use SQLite in-memory database for tests (faster, isolated, no setup needed)
# Use PostgreSQL for development and production
if "pytest" in sys.modules or TESTING:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }
else:
    DATABASE_URL = os.getenv(
        "DATABASE_URL", "postgresql://user:password@localhost:5432/jules_db"
    )
    # Parse DATABASE_URL
    parsed = urlparse(DATABASE_URL)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": parsed.path[1:] if parsed.path else "jules_db",
            "USER": parsed.username or "user",
            "PASSWORD": parsed.password or "password",
            "HOST": parsed.hostname or "localhost",
            "PORT": parsed.port or "5432",
        }
    }

# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/
STATIC_URL = "static/"

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Django REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 100,
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": os.getenv("DRF_THROTTLE_ANON", "30/min"),
        "user": os.getenv("DRF_THROTTLE_USER", "60/min"),
        "jules_api": os.getenv("DRF_THROTTLE_JULES_API", "120/min"),
    },
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
    ],
    "EXCEPTION_HANDLER": "jules.utils.drf_exception_handler",
}

# CORS settings
# Keep origins minimal in production. Do not use wildcard origins with credentials.
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:4700,http://127.0.0.1:4700",
    ).split(",")
    if origin.strip()
]

# Allow credentials only when required by the frontend auth flow (cookies/HTTP auth).
CORS_ALLOW_CREDENTIALS = os.getenv("CORS_ALLOW_CREDENTIALS", "False").lower() == "true"

CORS_ALLOW_METHODS = [
    method.strip()
    for method in os.getenv(
        "CORS_ALLOW_METHODS",
        "DELETE,GET,OPTIONS,PATCH,POST,PUT",
    ).split(",")
    if method.strip()
]

CORS_ALLOW_HEADERS = [
    header.strip()
    for header in os.getenv(
        "CORS_ALLOW_HEADERS",
        "accept,accept-encoding,authorization,content-type,dnt,origin,user-agent,"
        "x-csrftoken,x-requested-with",
    ).split(",")
    if header.strip()
]

# SSE streaming safeguards
# Keep these limits conservative to avoid long-lived busy loops in production.
SSE_MAX_CONNECTION_SECONDS = int(os.getenv("SSE_MAX_CONNECTION_SECONDS", "300"))
SSE_MIN_POLL_INTERVAL_SECONDS = float(os.getenv("SSE_MIN_POLL_INTERVAL_SECONDS", "1"))
SSE_MAX_POLL_INTERVAL_SECONDS = float(os.getenv("SSE_MAX_POLL_INTERVAL_SECONDS", "60"))

# Jules API Configuration
JULES_API_BASE_URL = os.getenv(
    "JULES_API_BASE_URL", "https://jules.googleapis.com"
).rstrip("/")
JULES_API_VERSION = os.getenv("JULES_API_VERSION", "v1alpha").strip("/")
JULES_API_KEY = os.getenv("JULES_API_KEY", "")

Q_CLUSTER = {
    "name": "jules",
    "workers": 4,
    "recycle": 500,
    "timeout": 60,
    "retry": 120,
    "queue_limit": 50,
    "bulk": 10,
    "orm": "default",
}
