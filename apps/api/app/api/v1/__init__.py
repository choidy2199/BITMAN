from fastapi import APIRouter

from app.api.v1 import auth, compare, history, merge, pricelists, user_sheets

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(pricelists.router)
api_router.include_router(user_sheets.router)
api_router.include_router(compare.router)
api_router.include_router(merge.router)
api_router.include_router(history.router)
