from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import transactions, wallet, profile, health, metrics, admin

app = FastAPI(title="Nova Pay API Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])
app.include_router(metrics.router, tags=["Metrics"])
app.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])
app.include_router(wallet.router, tags=["Wallet"])
app.include_router(profile.router, tags=["Profile"])
app.include_router(admin.router, tags=["Admin"])

# Expose top-level routes to match the requirements
app.include_router(transactions.router, tags=["Transactions - Top Level"])
