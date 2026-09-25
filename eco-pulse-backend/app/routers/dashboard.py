from fastapi import APIRouter, Depends
from app.database import get_supabase
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary")
async def get_summary(current_user: dict = Depends(get_current_user)):
    """Top-level KPI cards for the dashboard."""
    db = get_supabase()

    # Latest audit
    audit = db.table("audit_results") \
        .select("net_tons, naac_score, naac_grade, created_at") \
        .eq("user_id", current_user["sub"]) \
        .order("created_at", desc=True) \
        .limit(1).execute()

    # Latest prediction
    pred = db.table("predictions") \
        .select("daily_tons_co2e, monthly_estimate, peak_risk, created_at") \
        .eq("user_id", current_user["sub"]) \
        .order("created_at", desc=True) \
        .limit(1).execute()

    latest_audit = audit.data[0] if audit.data else None
    latest_pred = pred.data[0] if pred.data else None

    return {
        "campus_carbon_footprint": latest_audit["net_tons"] if latest_audit else 2688,
        "naac_score": latest_audit["naac_score"] if latest_audit else 86.5,
        "naac_grade": latest_audit["naac_grade"] if latest_audit else "A",
        "daily_prediction":   latest_pred["daily_tons_co2e"]  if latest_pred else 5.2,
        "monthly_prediction": latest_pred["monthly_estimate"] if latest_pred else 94.5,
        "peak_risk": latest_pred["peak_risk"] if latest_pred else "moderate",
        # Static campus constants
        "renewable_energy_pct": 75,
        "campus_population": 4180,
        "solar_kwp_installed": 200,
    }


@router.get("/trends")
async def get_emission_trends(months: int = 12, current_user: dict = Depends(get_current_user)):
    """Monthly emission trend from saved audits."""
    db = get_supabase()
    result = db.table("audit_results") \
        .select("net_tons, created_at") \
        .eq("user_id", current_user["sub"]) \
        .order("created_at", desc=True) \
        .limit(months).execute()
    return result.data


@router.get("/breakdown")
async def get_breakdown(current_user: dict = Depends(get_current_user)):
    """Latest emission breakdown by source."""
    db = get_supabase()
    result = db.table("audit_results") \
        .select("breakdown, created_at") \
        .eq("user_id", current_user["sub"]) \
        .order("created_at", desc=True) \
        .limit(1).execute()

    if not result.data:
        return {"breakdown": None, "message": "No audits saved yet"}
    return result.data[0]
