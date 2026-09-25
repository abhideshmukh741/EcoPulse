from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from app.ml.model import predict_emissions
from app.database import get_supabase
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/api/predictions", tags=["Predictions"])

# ── Schemas ───────────────────────────────────────────────────────────────────

class PredictionInput(BaseModel):
    # Campus context
    academic_phase:    str   = Field("regular", description="vacation | regular | exams | fest")
    student_footfall:  int   = Field(4180,       description="Students on campus that day")
    ambient_temp:      float = Field(32.0,       description="Ambient temperature (°C)")
    lab_compute_load:  str   = Field("medium",   description="low | medium | high")

    # Energy
    solar_kwp:             float = Field(200.0,   description="Installed solar capacity (kWp)")
    grid_daily_kwh:        float = Field(5000.0,  description="Grid electricity drawn (kWh/day)")
    solar_generation_kwh:  float = Field(350.0,   description="Actual solar generation (kWh/day)")

    # Fuel & transport
    diesel_liters:  float = Field(150.0,   description="Diesel consumed (litres/day)")
    petrol_liters:  float = Field(80.0,    description="Petrol consumed (litres/day)")
    transport_km:   float = Field(2000.0,  description="Total vehicle km driven (km/day)")

    # Resources
    water_liters:  int   = Field(30000, description="Water consumed (litres/day)")
    waste_kg:      float = Field(200.0, description="Waste generated (kg/day)")
    food_meals:    int   = Field(2000,  description="Meals served on campus")

    # Scope emissions (pre-calculated, optional enrichment)
    scope1_tco2e:  float = Field(0.7,  description="Direct emissions (tCO2e/day)")
    scope2_tco2e:  float = Field(3.0,  description="Electricity emissions (tCO2e/day)")
    scope3_tco2e:  float = Field(2.0,  description="Indirect emissions (tCO2e/day)")

    # Lag features — previous observed values
    lag_1_co2e:   float = Field(5.0,  description="Yesterday's total emission (tCO2e)")
    lag_7_co2e:   float = Field(4.8,  description="7-day rolling avg emission (tCO2e)")
    lag_30_co2e:  float = Field(4.5,  description="30-day rolling avg emission (tCO2e)")


class PredictionResponse(BaseModel):
    daily_tons_co2e:     float
    monthly_estimate:    float
    confidence:          float
    peak_risk:           str
    cost_estimate_lakhs: float


# ── Helper ────────────────────────────────────────────────────────────────────

def _run_model(body: PredictionInput) -> dict:
    return predict_emissions(
        academic_phase=body.academic_phase,
        student_footfall=body.student_footfall,
        ambient_temp=body.ambient_temp,
        lab_compute_load=body.lab_compute_load,
        solar_kwp=body.solar_kwp,
        grid_daily_kwh=body.grid_daily_kwh,
        solar_generation_kwh=body.solar_generation_kwh,
        diesel_liters=body.diesel_liters,
        petrol_liters=body.petrol_liters,
        transport_km=body.transport_km,
        water_liters=body.water_liters,
        waste_kg=body.waste_kg,
        food_meals=body.food_meals,
        scope1_tco2e=body.scope1_tco2e,
        scope2_tco2e=body.scope2_tco2e,
        scope3_tco2e=body.scope3_tco2e,
        lag_1_co2e=body.lag_1_co2e,
        lag_7_co2e=body.lag_7_co2e,
        lag_30_co2e=body.lag_30_co2e,
    )


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
            "inputs": body.model_dump(),
            **result,
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
    db = get_supabase()
    record = db.table("predictions").insert({
        "user_id": current_user["sub"],
        "inputs":  body.model_dump(),
        **result,
    }).execute()
    return {"message": "Prediction saved", "id": record.data[0]["id"], "prediction": result}


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
    return result.data

