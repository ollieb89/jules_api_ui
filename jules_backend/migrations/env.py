from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

from app.database import Base
from app.config import settings
from app.models import *  # Import all models to ensure they are attached to Base.metadata

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    # Handle potential async driver in URL. Alembic needs sync driver.
    # If URL is postgresql+psycopg://, we strip +psycopg to force default sync behavior (or just ensure sync driver is used)
    # psycopg (v3) supports sync via 'postgresql://' or 'postgresql+psycopg://' seamlessly usually, 
    # but create_engine must be sync.
    
    url = settings.DATABASE_URL.replace("postgresql+psycopg2://", "postgresql+psycopg://") # Handle potential async driver artifact

    # Force psycopg driver (v3) instead of default psycopg2 which is not installed
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    
    # Create configuration dict
    configuration = config.get_section(config.config_ini_section)
    if configuration is None:
        configuration = {}
        
    configuration["sqlalchemy.url"] = url

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
