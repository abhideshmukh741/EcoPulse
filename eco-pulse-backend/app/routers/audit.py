from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.database import get_supabase
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/api/audit", tags=["Audit"])

# ── Schemas ──────────────────────────────────────────────────────────────────

class AuditInput(BaseModel):
    lab_count: int = 24
    hvac_hours: float = 8
    has_server_room: bool = True
    hostel_residents: int = 1200
    solar_water_heater_share: float = 75
    bus_count: int = 12
    bus_daily_km: float = 45
    clean_fleet_share: float = 25
    grid_monthly_kwh: float = 51000
    solar_kwp: float = 200
    dg_run_hours: float = 8
    daily_meals: int = 3200
    has_biogas_plant: str = "yes"   # "yes" | "partial" | "none"
    notes: Optional[str] = None

class AuditResult(BaseModel):
    net_tons: float
    gross_tons: float
    solar_offset_tons: float
    tree_offset_tons: float
    per_capita_kg: float
    naac_score: float
    naac_grade: str
    breakdown: dict

# ── Calculation engine (mirrors frontend logic) ───────────────────────────────

def compute_audit(inp: AuditInput) -> AuditResult:
    lab_base = inp.lab_count * 300 * 250
    hvac_kwh = inp.lab_count * inp.hvac_hours * 18 * 220
    server_kwh = 45000 if inp.has_server_room else 8000
    academic_tons = ((lab_base + hvac_kwh + server_kwh) * 0.72) / 1000

    resident_kwh = inp.hostel_residents * 1.8 * 300
    water_heating = ((100 - inp.solar_water_heater_share) / 100) * inp.hostel_residents * 0.045
    hostel_tons = (resident_kwh * 0.72) / 1000 + water_heating

    annual_km = inp.bus_count * inp.bus_daily_km * 240
    diesel_km = annual_km * ((100 - inp.clean_fleet_share) / 100)
    clean_km = annual_km * (inp.clean_fleet_share / 100)
    fleet_tons = (diesel_km * 0.88 + clean_km * 0.28) / 1000

    annual_grid = inp.grid_monthly_kwh * 12
    solar_gen = inp.solar_kwp * 1380
    solar_offset = (solar_gen * 0.72) / 1000
    dg_tons = (inp.dg_run_hours * 12 * 68) / 1000

    waste_factor = {"yes": 0.018, "partial": 0.032, "none": 0.045}.get(inp.has_biogas_plant, 0.045)
    mess_tons = (inp.daily_meals * 300 * waste_factor) / 1000
    tree_offset = 28.0

    # Grid is the Scope-2 meter total; academic/hostel kWh are attributional for UI only
    grid_tons = (annual_grid * 0.72) / 1000
    gross = fleet_tons + grid_tons + dg_tons + mess_tons + water_heating
    net = max(150, gross - solar_offset - tree_offset)

    per_capita = round((net * 1000) / 4180, 1)
    naac = round(100 - (net / 1500) * 45)
    if inp.solar_kwp >= 180: naac += 6
    if inp.has_biogas_plant == "yes": naac += 4
    naac = max(50, min(96, naac))
    grade = "B" if naac < 70 else ("A+" if naac >= 88 else "A")

    return AuditResult(
        net_tons=round(net, 1),
        gross_tons=round(gross, 1),
        solar_offset_tons=round(solar_offset, 1),
        tree_offset_tons=tree_offset,
        per_capita_kg=per_capita,
        naac_score=naac,
        naac_grade=grade,
        breakdown={
            "academic": round(academic_tons),
            "hostel": round(hostel_tons),
            "fleet": round(fleet_tons),
            "grid": round((annual_grid * 0.72) / 1000),
            "dg": round(dg_tons),
            "mess": round(mess_tons),
        },
    )

# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/calculate", response_model=AuditResult)
async def calculate_audit(body: AuditInput):
    """Calculate emissions without saving (live preview)."""
    return compute_audit(body)


def _persist_audit(body: AuditInput, user_id: str | None = None) -> dict:
    result = compute_audit(body)
    db = get_supabase()
    record = db.table("audit_results").insert({
        "user_id": user_id,
        "inputs": body.model_dump(),
        "net_tons": result.net_tons,
        "gross_tons": result.gross_tons,
        "solar_offset_tons": result.solar_offset_tons,
        "tree_offset_tons": result.tree_offset_tons,
        "per_capita_kg": result.per_capita_kg,
        "naac_score": result.naac_score,
        "naac_grade": result.naac_grade,
        "breakdown": result.breakdown,
        "notes": body.notes,
    }).execute()
    return {"message": "Audit saved", "id": record.data[0]["id"], "result": result}


@router.post("/save", status_code=201)
async def save_audit(body: AuditInput):
    """Calculate + persist audit (public save — matches Predictions flow)."""
    return _persist_audit(body, user_id=None)


@router.post("/save/auth", status_code=201)
async def save_audit_auth(body: AuditInput, current_user: dict = Depends(get_current_user)):
    """Calculate + persist audit result linked to logged-in user."""
    return _persist_audit(body, user_id=current_user["sub"])


@router.get("/history")
async def get_audit_history(limit: int = 20, current_user: dict = Depends(get_current_user)):
    """Fetch past audits for the current user."""
    db = get_supabase()
    result = db.table("audit_results") \
        .select("id, net_tons, naac_score, naac_grade, created_at, notes") \
        .eq("user_id", current_user["sub"]) \
        .order("created_at", desc=True) \
        .limit(limit) \
        .execute()
    return result.data


@router.get("/{audit_id}")
async def get_audit(audit_id: str, current_user: dict = Depends(get_current_user)):
    db = get_supabase()
    result = db.table("audit_results").select("*").eq("id", audit_id).eq("user_id", current_user["sub"]).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Audit not found")
    return result.data[0]
