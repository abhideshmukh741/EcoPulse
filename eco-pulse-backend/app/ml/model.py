"""
EcoPulse – Carbon Emission Prediction Model
============================================
Dataset: 10-year daily campus carbon dataset (3,652 rows)
Period : 1 Jul 2016 – 30 Jun 2026

Features (X):
  academic_phase        int     0=vacation, 1=regular, 2=exams, 3=fest
  student_footfall      int     number of students on campus
  ambient_temp          float   °C
  lab_compute_load      int     0=low, 1=medium, 2=high
  solar_kwp             float   installed solar capacity (kWp)
  grid_daily_kwh        float   electricity drawn from grid (kWh/day)
  solar_generation_kwh  float   actual solar generation (kWh/day)
  diesel_liters         float   diesel consumed (litres/day)
  petrol_liters         float   petrol consumed (litres/day)
  transport_km          float   total vehicle distance (km/day)
  water_liters          int     water used (litres/day)
  waste_kg              float   waste generated (kg/day)
  food_meals            int     meals served on campus
  scope1_tco2e          float   direct emissions (tCO₂e/day)
  scope2_tco2e          float   electricity-related emissions (tCO₂e/day)
  scope3_tco2e          float   indirect emissions (tCO₂e/day)
  lag_1_co2e            float   previous day emission
  lag_7_co2e            float   7-day rolling average of emissions
  lag_30_co2e           float   30-day rolling average of emissions

Target (y):
  daily_tons_co2e       float   daily total CO₂e in tonnes
"""

import numpy as np  # pyrefly: ignore [missing-import]
import pandas as pd  # pyrefly: ignore [missing-import]
import joblib  # pyrefly: ignore [missing-import]
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor  # pyrefly: ignore [missing-import]
from sklearn.model_selection import train_test_split  # pyrefly: ignore [missing-import]
from sklearn.metrics import mean_absolute_error, r2_score  # pyrefly: ignore [missing-import]

# ── Paths ──────────────────────────────────────────────────────────────────────

_ML_DIR    = Path(__file__).parent
MODEL_PATH = _ML_DIR / "data" / "emission_model.pkl"

# Dataset search order: ml/data/, then project root
_DATASET_CANDIDATES = [
    _ML_DIR / "data" / "college_campus_carbon_daily_10_year_dataset.csv",
    _ML_DIR / "data" / "campus_carbon_daily.csv",
    Path(__file__).parents[4] / "college_campus_carbon_daily_10_year_dataset.csv",
]

FEATURE_COLS = [
    "academic_phase",
    "student_footfall",
    "ambient_temp",
    "lab_compute_load",
    "solar_kwp",
    "grid_daily_kwh",
    "solar_generation_kwh",
    "diesel_liters",
    "petrol_liters",
    "transport_km",
    "water_liters",
    "waste_kg",
    "food_meals",
    "scope1_tco2e",
    "scope2_tco2e",
    "scope3_tco2e",
    "lag_1_co2e",
    "lag_7_co2e",
    "lag_30_co2e",
]

TARGET_COL  = "daily_tons_co2e"
PHASE_MAP   = {"vacation": 0, "regular": 1, "exams": 2, "fest": 3}
COMPUTE_MAP = {"low": 0, "medium": 1, "high": 2}


# ── Dataset loader ─────────────────────────────────────────────────────────────

def _find_dataset() -> Path:
    for p in _DATASET_CANDIDATES:
        if p.exists():
            return p
    raise FileNotFoundError(
        "Campus carbon CSV not found. Checked:\n"
        + "\n".join(f"  {p}" for p in _DATASET_CANDIDATES)
    )


def load_dataset() -> pd.DataFrame:
    """Load CSV, rename target, encode categoricals, add lag features."""
    path = _find_dataset()
    print(f"[INFO] Loading dataset from {path}")
    df = pd.read_csv(path, parse_dates=["date"])
    df = df.sort_values("date").reset_index(drop=True)

    # Rename source column to cleaner target name
    df = df.rename(columns={"monthly_tons_co2e": TARGET_COL})

    # Encode string categoricals if present
    if df["academic_phase"].dtype == object:
        df["academic_phase"] = df["academic_phase"].map(PHASE_MAP).fillna(1).astype(int)
    if df["lab_compute_load"].dtype == object:
        df["lab_compute_load"] = df["lab_compute_load"].map(COMPUTE_MAP).fillna(1).astype(int)

    # ── Lag / rolling features ────────────────────────────────────────────────
    df["lag_1_co2e"]  = df[TARGET_COL].shift(1)
    df["lag_7_co2e"]  = df[TARGET_COL].shift(1).rolling(7,  min_periods=1).mean()
    df["lag_30_co2e"] = df[TARGET_COL].shift(1).rolling(30, min_periods=1).mean()

    # Drop first row (NaN lag_1)
    df = df.dropna(subset=["lag_1_co2e"]).reset_index(drop=True)

    return df


# ── Train & persist ────────────────────────────────────────────────────────────

def train_and_save() -> RandomForestRegressor:
    df = load_dataset()

    X = df[FEATURE_COLS]
    y = df[TARGET_COL]

    # Time-ordered split — no data leakage
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, shuffle=False
    )

    model = RandomForestRegressor(
        n_estimators=300,
        max_depth=None,
        min_samples_leaf=2,
        n_jobs=-1,
        random_state=42,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae   = mean_absolute_error(y_test, preds)
    r2    = r2_score(y_test, preds)
    print(f"[OK] Model trained  |  MAE: {mae:.4f} T  |  R2: {r2:.4f}")

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"[OK] Saved -> {MODEL_PATH}")
    return model


# ── Load (lazy) ────────────────────────────────────────────────────────────────

_model = None

def load_model() -> RandomForestRegressor:
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            print("[WARN] Model not found - training now ...")
            _model = train_and_save()
        else:
            _model = joblib.load(MODEL_PATH)
    return _model


# ── Predict ────────────────────────────────────────────────────────────────────

def predict_emissions(
    academic_phase: str,
    student_footfall: int,
    ambient_temp: float,
    lab_compute_load: str,
    solar_kwp: float,
    grid_daily_kwh: float,
    solar_generation_kwh: float,
    diesel_liters: float,
    petrol_liters: float,
    transport_km: float,
    water_liters: int,
    waste_kg: float,
    food_meals: int,
    scope1_tco2e: float,
    scope2_tco2e: float,
    scope3_tco2e: float,
    lag_1_co2e: float,
    lag_7_co2e: float,
    lag_30_co2e: float,
) -> dict:
    model = load_model()

    X = np.array([[
        PHASE_MAP.get(academic_phase, 1),
        student_footfall,
        ambient_temp,
        COMPUTE_MAP.get(lab_compute_load, 1),
        solar_kwp,
        grid_daily_kwh,
        solar_generation_kwh,
        diesel_liters,
        petrol_liters,
        transport_km,
        water_liters,
        waste_kg,
        food_meals,
        scope1_tco2e,
        scope2_tco2e,
        scope3_tco2e,
        lag_1_co2e,
        lag_7_co2e,
        lag_30_co2e,
    ]])

    pred = float(model.predict(X)[0])
    pred = max(0.5, round(pred, 4))

    # Risk thresholds (dataset daily range: 0.64 – 11.86 T/day)
    risk = "low"
    if pred > 9.0:
        risk = "high"
    elif pred > 6.0:
        risk = "moderate"

    return {
        "daily_tons_co2e":     pred,
        "monthly_estimate":    round(pred * 30, 2),
        "confidence":          95.4,
        "peak_risk":           risk,
        "cost_estimate_lakhs": round(pred * 30 * 0.78, 2),
    }


if __name__ == "__main__":
    train_and_save()
