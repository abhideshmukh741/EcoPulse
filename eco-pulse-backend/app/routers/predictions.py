from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from app.ml.model import predict_emissions
from app.database import get_supabase
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/api/predictions", tags=["Predictions"])

# ── Schemas ───────────────────────────────────────────────────────────────────

class PredictionInput(BaseModel):
    # Core campus scenario variables
    academic_phase:        str             = Field("regular", description="vacation | regular | exams | fest")
    student_footfall:      int             = Field(4180,       description="Students on campus that day (800-8000)")
    ambient_temp:          float           = Field(32.0,       description="Ambient temperature (°C)")
    lab_compute_load:      str             = Field("medium",   description="low | medium | high")
    solar_kwp:             float           = Field(200.0,      description="Installed solar capacity (kWp)")

    # Optional activity telemetry (for granular reporting or custom override)
    grid_daily_kwh:        Optional[float] = Field(None,       description="Grid electricity drawn (kWh/day)")
    solar_generation_kwh:  Optional[float] = Field(None,       description="Actual solar generation (kWh/day)")
    diesel_liters:         Optional[float] = Field(None,       description="Diesel consumed (litres/day)")
    petrol_liters:         Optional[float] = Field(None,       description="Petrol consumed (litres/day)")
    transport_km:          Optional[float] = Field(None,       description="Total vehicle km driven (km/day)")
    water_liters:          Optional[int]   = Field(None,       description="Water consumed (litres/day)")
    waste_kg:              Optional[float] = Field(None,       description="Waste generated (kg/day)")
    food_meals:            Optional[int]   = Field(None,       description="Meals served on campus")

    # Optional scope emissions (pre-calculated)
    scope1_tco2e:          Optional[float] = Field(None,       description="Direct emissions (tCO2e/day)")
    scope2_tco2e:          Optional[float] = Field(None,       description="Electricity emissions (tCO2e/day)")
    scope3_tco2e:          Optional[float] = Field(None,       description="Indirect emissions (tCO2e/day)")

    # Lag features
    lag_1_co2e:           Optional[float] = Field(None,       description="Yesterday's total emission (tCO2e)")
    lag_7_co2e:           Optional[float] = Field(None,       description="7-day rolling avg emission (tCO2e)")
    lag_30_co2e:          Optional[float] = Field(None,       description="30-day rolling avg emission (tCO2e)")


class PredictionResponse(BaseModel):
    daily_tons_co2e:     float
    monthly_estimate:    float
    confidence:          float
    peak_risk:           str
    cost_estimate_lakhs: float
    breakdown:           Optional[Dict[str, float]] = None


# ── Helper ────────────────────────────────────────────────────────────────────

def _run_model(body: PredictionInput) -> dict:
    kwargs = body.model_dump(exclude_none=True)
    return predict_emissions(**kwargs)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/predict")
async def run_prediction(body: PredictionInput):
    """Run AI model and persist the result to Supabase (no auth required)."""
    result = _run_model(body)
    saved = False
    record_id = None
    try:
        db = get_supabase()
        record = db.table("predictions").insert({
            "user_id": None,
            "inputs": body.model_dump(exclude_none=True),
            "daily_tons_co2e": result["daily_tons_co2e"],
            "monthly_estimate": result["monthly_estimate"],
            "confidence": result["confidence"],
            "peak_risk": result["peak_risk"],
            "cost_estimate_lakhs": result["cost_estimate_lakhs"],
        }).execute()
        saved = True
        record_id = record.data[0]["id"] if record.data else None
    except Exception as exc:
        print(f"[predictions] Failed to save to Supabase: {exc}")
    return {**result, "saved": saved, "id": record_id}


@router.post("/predict/save")
async def predict_and_save(body: PredictionInput, current_user: dict = Depends(get_current_user)):
    """Run AI model + save result for authenticated user."""
    result = _run_model(body)
    record_id = None
    try:
        db = get_supabase()
        record = db.table("predictions").insert({
            "user_id": current_user["sub"],
            "inputs":  body.model_dump(exclude_none=True),
            "daily_tons_co2e": result["daily_tons_co2e"],
            "monthly_estimate": result["monthly_estimate"],
            "confidence": result["confidence"],
            "peak_risk": result["peak_risk"],
            "cost_estimate_lakhs": result["cost_estimate_lakhs"],
        }).execute()
        record_id = record.data[0]["id"] if record.data else None
    except Exception as exc:
        print(f"[predictions] Failed to save to Supabase: {exc}")
    return {"message": "Prediction saved", "id": record_id, "prediction": result}


@router.get("/history")
async def prediction_history(limit: int = 20, current_user: dict = Depends(get_current_user)):
    """Return past predictions for the authenticated user."""
    db = get_supabase()
    result = db.table("predictions") \
        .select("id, daily_tons_co2e, monthly_estimate, peak_risk, confidence, created_at") \
        .eq("user_id", current_user["sub"]) \
        .order("created_at", desc=True) \
        .limit(limit) \
        .execute()
    if not result.data:
        result = db.table("predictions") \
            .select("id, daily_tons_co2e, monthly_estimate, peak_risk, confidence, created_at") \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
    return result.data
