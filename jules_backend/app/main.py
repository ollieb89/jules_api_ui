from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.error_handlers import add_exception_handlers
from app.routes import users


app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

add_exception_handlers(app)

# Routes
app.include_router(users.router, prefix=settings.API_PREFIX)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
