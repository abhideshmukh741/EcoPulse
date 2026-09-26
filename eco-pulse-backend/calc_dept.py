"""Calculate per-department carbon footprint based on real equipment profiles."""

EF = 0.000716  # T CO2 per kWh (India CEA 2023)
WORKING_DAYS = 250
HOURS = 8

departments = {
    "cse": {
        "name": "Computer Science & Engineering",
        "labs": 6, "pcs_per_lab": 40, "acs_per_lab": 3,
        "servers": 4, "workshop_kw": 0, "extra_kw": 2.0,
    },
    "aids": {
        "name": "AI & Data Science",
        "labs": 4, "pcs_per_lab": 35, "acs_per_lab": 3,
        "servers": 6, "workshop_kw": 0, "extra_kw": 3.0,
    },
    "mech": {
        "name": "Mechanical & Central Workshop",
        "labs": 5, "pcs_per_lab": 15, "acs_per_lab": 1,
        "servers": 0, "workshop_kw": 45, "extra_kw": 5.0,
    },
    "civil": {
        "name": "Civil Engineering",
        "labs": 3, "pcs_per_lab": 20, "acs_per_lab": 1,
        "servers": 0, "workshop_kw": 8, "extra_kw": 2.0,
    },
    "electrical": {
        "name": "Electrical Engineering",
        "labs": 4, "pcs_per_lab": 20, "acs_per_lab": 2,
        "servers": 0, "workshop_kw": 25, "extra_kw": 3.0,
    },
    "plastic": {
        "name": "Plastic & Polymer Engineering",
        "labs": 3, "pcs_per_lab": 15, "acs_per_lab": 1,
        "servers": 0, "workshop_kw": 35, "extra_kw": 2.0,
    },
    "agri": {
        "name": "Agricultural Engineering",
        "labs": 2, "pcs_per_lab": 15, "acs_per_lab": 1,
        "servers": 0, "workshop_kw": 5, "extra_kw": 1.0,
    },
}

PC_KW = 0.30
MONITOR_KW = 0.05
AC_KW = 1.50
LIGHT_KW = 0.20
PROJECTOR_KW = 0.30
SERVER_KW = 0.50

results = {}
total_annual = 0

print("=== Per-Department Equipment-Based Carbon Calculation ===")
print()

for key, dept in departments.items():
    lab_kw_each = (dept["pcs_per_lab"] * PC_KW) + (dept["pcs_per_lab"] * MONITOR_KW) + \
                  (dept["acs_per_lab"] * AC_KW) + LIGHT_KW + PROJECTOR_KW
    total_lab_kw = lab_kw_each * dept["labs"]
    server_kw = dept["servers"] * SERVER_KW
    total_kw = total_lab_kw + server_kw + dept["workshop_kw"] + dept["extra_kw"]
    daily_kwh = total_kw * HOURS
    annual_co2 = daily_kwh * EF * WORKING_DAYS

    results[key] = annual_co2
    total_annual += annual_co2

    name = dept["name"]
    print(f"  {key:12s} | {name}")
    print(f"             | Labs: {dept['labs']} x {lab_kw_each:.1f}kW = {total_lab_kw:.1f}kW")
    print(f"             | Servers: {server_kw:.1f}kW | Workshop: {dept['workshop_kw']:.1f}kW | Extra: {dept['extra_kw']:.1f}kW")
    print(f"             | Total: {total_kw:.1f}kW -> {daily_kwh:.0f} kWh/day -> {annual_co2:.2f} T/year")
    print()

print(f"Total all departments: {total_annual:.2f} T/year")
print()

campus_total = 1858.72
print("=== Percentage of Campus Total (1858.72 T) ===")
for key, annual in results.items():
    pct = annual / campus_total
    print(f"  {key:12s}: {annual:7.2f} T  ->  pct: {pct:.4f}  ({pct*100:.1f}%)")

print(f"  {'TOTAL':12s}: {total_annual:7.2f} T  ->  pct: {total_annual/campus_total:.4f}  ({total_annual/campus_total*100:.1f}%)")
print()

print("=== JS DEPT_WEIGHTS pct values ===")
for key, annual in results.items():
    pct = round(annual / campus_total, 4)
    print(f"  {key}: {pct},  // {annual:.1f} T/yr")
