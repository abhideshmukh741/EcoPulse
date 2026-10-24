from datetime import date
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.ml.model import (
    predict_emissions,
    train_and_save,
    get_model_status,
    calculate_today_actual,
    save_daily_record,
    get_daily_records,
    predict_30_days,
    compare_predictions_vs_actuals,
    analyze_with_ai_agent,
)
from app.database import get_supabase
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/api/predictions", tags=["Predictions & Dynamic AI Engine"])


# ── Pydantic Request/Response Models ──────────────────────────────────────────

class PredictionInput(BaseModel):
    academic_phase:        str             = Field("regular", description="vacation | regular | exams | fest")
    student_footfall:      int             = Field(4180,       description="Students on campus that day (800-8000)")
    ambient_temp:          float           = Field(32.0,       description="Ambient temperature (°C)")
    lab_compute_load:      str             = Field("medium",   description="low | medium | high")
    solar_kwp:             float           = Field(200.0,      description="Installed solar capacity (kWp)")


class ActualEmissionInput(BaseModel):
    date:                  Optional[str]   = Field(None,       description="Date (YYYY-MM-DD), defaults to today")
    grid_daily_kwh:        float           = Field(4350.0,     description="Grid electricity drawn from 11kV substation (kWh)")
    solar_generation_kwh:  float           = Field(340.0,      description="Rooftop solar generation today (kWh)")
    diesel_liters:         float           = Field(175.0,      description="Diesel fuel consumed (generators & machinery)")
    petrol_liters:         float           = Field(110.0,      description="Petrol consumed by campus fleet/bikes")
    transport_km:          float           = Field(3450.0,     description="Total student/staff vehicle transit km")
    water_liters:          float           = Field(34000.0,    description="Campus water consumption (litres)")
    waste_kg:              float           = Field(250.0,      description="Solid municipal waste collected (kg)")
    food_meals:            int             = Field(2400,       description="Hostel mess & canteen meals served")


class StoreDailyEmissionInput(BaseModel):
    date:                  Optional[str]   = Field(None,       description="Date (YYYY-MM-DD)")
    actual_data:           Dict[str, Any]  = Field(...,        description="Calculated actual emission payload")
    predicted_data:        Dict[str, Any]  = Field(...,        description="Predicted emission payload")
    operational_inputs:    Dict[str, Any]  = Field(...,        description="Operational context (temp, footfall, etc.)")


class Forecast30DaysQuery(BaseModel):
    academic_phase:        str             = Field("regular", description="vacation | regular | exams | fest")
    solar_kwp:             float           = Field(200.0,      description="Installed solar capacity (kWp)")


# ── Step 1: Model Training Endpoints ──────────────────────────────────────────

@router.post("/train")
async def trigger_model_training():
    """Train or retrain the machine learning model with the 10-year campus dataset and any newly stored real daily records."""
    try:
        metrics = train_and_save()
        return {"success": True, "message": "Machine learning model trained successfully", "metrics": metrics}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Model training failed: {exc}")


@router.get("/model-status")
async def get_training_status():
    """Retrieve current model health, R² score, MAE, total training rows, and feature importances."""
    status = get_model_status()
    return status


# ── Step 2: Prediction & Today's Actual Emissions ──────────────────────────────

@router.post("/predict")
async def run_prediction(body: PredictionInput):
    """Predict campus carbon emissions for the given operational inputs."""
    result = predict_emissions(**body.model_dump())
    saved = False
    record_id = None
    try:
        db = get_supabase()
        record = db.table("predictions").insert({
            "user_id": None,
            "inputs": body.model_dump(),
            "daily_tons_co2e": result["daily_tons_co2e"],
            "monthly_estimate": result["monthly_estimate"],
            "confidence": result["confidence"],
            "peak_risk": result["peak_risk"],
            "cost_estimate_lakhs": result["cost_estimate_lakhs"],
        }).execute()
        saved = True
        record_id = record.data[0]["id"] if record.data else None
    except Exception as exc:
        # Graceful fallback when remote DB is offline
        pass
    return {**result, "saved": saved, "id": record_id}


@router.post("/actual/calculate")
async def calculate_actual(body: ActualEmissionInput):
    """Calculate today's verified actual carbon emissions from real operational telemetry according to GHG protocol."""
    actual_res = calculate_today_actual(**body.model_dump())
    calc_date = body.date or date.today().isoformat()
    return {"date": calc_date, **actual_res}


# ── Step 3: Store Daily Carbon Emission Data ───────────────────────────────────

@router.post("/actual/store")
async def store_daily_emission(body: StoreDailyEmissionInput):
    """Store daily emission data (actuals + predictions + variance) for future analysis and continuous model retraining."""
    target_date = body.date or date.today().isoformat()
    saved_record = save_daily_record(
        record_date=target_date,
        actual_data=body.actual_data,
        predicted_data=body.predicted_data,
        operational_inputs=body.operational_inputs,
    )

    # Also persist to Supabase if available
    db_saved = False
    try:
        db = get_supabase()
        db.table("daily_emissions").insert({
            "date": target_date,
            "actual_tons": saved_record["actual_tons"],
            "predicted_tons": saved_record["predicted_tons"],
            "variance_tons": saved_record["variance_tons"],
            "variance_pct": saved_record["variance_pct"],
            "status": saved_record["status"],
            "payload": saved_record,
        }).execute()
        db_saved = True
    except Exception:
        pass

    return {
        "success": True,
        "message": f"Daily actual carbon emissions for {target_date} stored successfully",
        "record": saved_record,
        "db_saved": db_saved,
    }


@router.get("/daily-actuals")
async def list_daily_actuals(limit: int = Query(30, ge=1, le=180)):
    """Retrieve recorded daily emission actuals and prediction history."""
    records = get_daily_records(limit=limit)
    return {"count": len(records), "records": records}


# ── Step 4: Predict Next 30 Days Starting Tomorrow ────────────────────────────

@router.get("/forecast-30-days")
async def get_30_day_forecast(
    solar_kwp: float = Query(200.0, description="Installed solar capacity in kWp"),
    academic_phase: str = Query("regular", description="Semester phase (vacation|regular|exams|fest)"),
):
    """Generate daily carbon emission predictions for the upcoming 30 days starting from tomorrow."""
    forecast = predict_30_days(base_solar_kwp=solar_kwp, academic_phase=academic_phase)
    return forecast


@router.post("/forecast-30-days")
async def post_30_day_forecast(body: Forecast30DaysQuery):
    """Generate custom 30-day daily predictions with specified parameters."""
    forecast = predict_30_days(base_solar_kwp=body.solar_kwp, academic_phase=body.academic_phase)
    return forecast


# ── Step 5: Compare Predicted vs Actual Emissions ──────────────────────────────

@router.get("/comparison")
async def get_comparison_analysis():
    """Compare recorded actual emissions with model predictions day-by-day with variance, accuracy, and budget deltas."""
    comparison = compare_predictions_vs_actuals()
    return comparison


# ── Step 6: AI Agent Carbon Reduction Recommendations ────────────────────────

@router.get("/ai-recommendations")
async def get_ai_recommendations():
    """AI Agent evaluation of prediction vs actual comparison, providing intelligent, prioritized reduction actions."""
    comparison = compare_predictions_vs_actuals()
    ai_analysis = analyze_with_ai_agent(comparison)
    return ai_analysis
