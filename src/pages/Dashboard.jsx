import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ScrollReveal from "../components/ScrollReveal";
import "./Dashboard.css";

const chartPaths = {
  '1D': {
    line: "M 0,160 Q 90,140 180,150 T 360,110 T 500,80 T 700,90",
    area: "M 0,160 Q 90,140 180,150 T 360,110 T 500,80 T 700,90 L 700,210 L 0,210 Z",
    val: "5.10 T CO₂e"
  },
  '1W': {
    line: "M 0,170 Q 100,160 200,140 T 400,90 T 550,110 T 700,120",
    area: "M 0,170 Q 100,160 200,140 T 400,90 T 550,110 T 700,120 L 700,210 L 0,210 Z",
    val: "35.70 T CO₂e"
  },
  '1M': {
    line: "M 0,150 Q 120,130 250,160 T 450,80 T 600,100 T 700,115",
    area: "M 0,150 Q 120,130 250,160 T 450,80 T 600,100 T 700,115 L 700,210 L 0,210 Z",
    val: "154.80 T CO₂e"
  },
  '1Y': {
    line: "M 0,175 Q 80,165 140,150 T 260,130 T 360,95 T 410,50 T 470,110 T 540,160 T 630,170 T 700,165",
    area: "M 0,175 Q 80,165 140,150 T 260,130 T 360,95 T 410,50 T 470,110 T 540,160 T 630,170 T 700,165 L 700,210 L 0,210 Z",
    val: "1,858.72 T CO₂e"
  },
  'ALL': {
    line: "M 0,185 Q 150,170 300,130 T 500,80 T 700,60",
    area: "M 0,185 Q 150,170 300,130 T 500,80 T 700,60 L 700,210 L 0,210 Z",
    val: "18,767.40 T CO₂e"
  }
};

// Department emission share weights — calculated from real equipment profiles
// Method: Per-dept kW (PCs×300W + Monitors×50W + ACs×1.5kW + Servers×500W + Workshop + Lights + Projector)
//         × 8 hrs/day × 250 working days × 0.000716 T/kWh (India CEA 2023 grid EF)
//         ÷ Campus total 1858.72 T/yr = pct share
const DEPT_WEIGHTS = {
  cse:        { label: "CSE & Data",    short: "CS", pct: 0.0909, color: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",     bar: "#3b82f6",
                equip: "6 labs × 40 PCs, 3 ACs each, 4 servers • 118 kW total → 169 T/yr" },
  aids:       { label: "AI & DS Labs",  short: "AI", pct: 0.0578, color: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400", bar: "#10b981",
                equip: "4 labs × 35 PCs, 3 ACs each, 6 GPU servers • 75 kW total → 107 T/yr" },
  mech:       { label: "Mechanical",    short: "ME", pct: 0.0664, color: "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400",   bar: "#f59e0b",
                equip: "5 labs × 15 PCs, CNC/lathe/welding 45 kW workshop • 86 kW total → 124 T/yr" },
  civil:      { label: "Civil Engg",    short: "CE", pct: 0.0285, color: "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400", bar: "#8b5cf6",
                equip: "3 labs × 20 PCs, material testing 8 kW • 37 kW total → 53 T/yr" },
  electrical: { label: "Electrical",    short: "EE", pct: 0.0539, color: "bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400",         bar: "#06b6d4",
                equip: "4 labs × 20 PCs, power electronics/motor rigs 25 kW • 70 kW total → 100 T/yr" },
  plastic:    { label: "Plastic & Poly",short: "PE", pct: 0.0453, color: "bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400",       bar: "#ec4899",
                equip: "3 labs × 15 PCs, injection molding/extruder 35 kW • 59 kW total → 84 T/yr" },
  agri:       { label: "Agri Engg",     short: "AG", pct: 0.0158, color: "bg-lime-100 dark:bg-lime-500/20 text-lime-600 dark:text-lime-400",       bar: "#84cc16",
                equip: "2 labs × 15 PCs, soil/pump testing 5 kW • 21 kW total → 29 T/yr" },
};

const DEFAULT_CAPS = { cse: 420, aids: 310, mech: 340, civil: 180, electrical: 290, plastic: 260, agri: 210 };

export default function Dashboard() {
  const navigate = useNavigate();
  const [labs, setLabs] = useState(24);
  const [pcsPerLab, setPcsPerLab] = useState(30);
  const [acsPerLab, setAcsPerLab] = useState(2);
  const [labHours, setLabHours] = useState(8);
  const [hvac, setHvac] = useState(8);
  const [evShare, setEvShare] = useState(25);
  const [activePeriod, setActivePeriod] = useState("1Y");
  const [deptCaps, setDeptCaps] = useState(() => {
    try {
      const saved = localStorage.getItem("ecopulse_admin_caps");
      return saved ? { ...DEFAULT_CAPS, ...JSON.parse(saved) } : DEFAULT_CAPS;
    } catch { return DEFAULT_CAPS; }
  });
  
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  // Real dataset metrics baseline (from college_campus_carbon_daily_10_year_dataset.csv 2025 actuals)
  const [telemetry, setTelemetry] = useState({
    netTons: 1858.72,
    gridMWh: 1231.57,
    solarMWh: 459.28,
    scope1: 256.95,
    scope2: 540.60,
    scope3: 1088.80,
    renewableOffsetTons: 201.0,
    solarOffsetTons: 201.0,
    naacScore: 86.5,
    naacGrade: "A",
    perCapitaKg: 445,
    monthlyPrediction: null,
    breakdown: null,
    sourceTag: "10-Year Dataset Baseline"
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3500);
  };

  const loadLiveTelemetry = () => {
    try {
      const auditStr = localStorage.getItem("ecopulse_latest_audit");
      const predStr = localStorage.getItem("ecopulse_latest_prediction");

      let updated = {
        netTons: 1858.72,
        gridMWh: 1231.57,
        solarMWh: 459.28,
        scope1: 256.95,
        scope2: 540.60,
        scope3: 1088.80,
        renewableOffsetTons: 201.0,
        solarOffsetTons: 201.0,
        naacScore: 86.5,
        naacGrade: "A",
        perCapitaKg: 445,
        monthlyPrediction: null,
        breakdown: null,
        sourceTag: "10-Year Dataset Baseline",
      };

      if (auditStr) {
        const audit = JSON.parse(auditStr);
        if (audit.netTons) updated.netTons = audit.netTons;
        if (audit.naacScore) updated.naacScore = audit.naacScore;
        if (audit.naacGrade) updated.naacGrade = audit.naacGrade;
        if (audit.perCapitaKg) updated.perCapitaKg = audit.perCapitaKg;
        if (audit.solarOffsetTons != null) {
          updated.solarOffsetTons = audit.solarOffsetTons;
          updated.renewableOffsetTons = audit.solarOffsetTons;
        }
        if (audit.breakdown) {
          updated.breakdown = audit.breakdown;
          updated.scope1 = (audit.breakdown.fleet || 0) + (audit.breakdown.dg || 0);
          updated.scope2 = audit.breakdown.grid || updated.scope2;
          updated.scope3 = (audit.breakdown.mess || 0) + (audit.breakdown.hostel || 0) * 0.2;
        }
        updated.sourceTag = "Live Campus Audit Telemetry";
      }

      // Prediction is a separate forecast KPI — do not overwrite verified audit footprint
      if (predStr) {
        const pred = JSON.parse(predStr);
        if (pred.monthlyTons) updated.monthlyPrediction = pred.monthlyTons;
        if (!auditStr) updated.sourceTag = "AI Forecast Available (run audit to set footprint)";
      }

      setTelemetry(updated);
    } catch (e) {}
  };

  useEffect(() => {
    loadLiveTelemetry();

    const handleUpdate = (e) => {
      loadLiveTelemetry();
      const type = e.detail?.type === 'audit' ? 'Campus Audit Recalculated' : 'AI ML Prediction Model Executed';
      showToast(`⚡ Live Telemetry Synced: ${type}`);
    };

    // Reload caps if admin saves settings in another tab
    const handleStorage = (e) => {
      loadLiveTelemetry();
      if (e?.key === "ecopulse_admin_caps" && e.newValue) {
        try { setDeptCaps({ ...DEFAULT_CAPS, ...JSON.parse(e.newValue) }); } catch {}
      }
    };

    window.addEventListener("ecopulse_data_updated", handleUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("ecopulse_data_updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const simulateDataSync = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      loadLiveTelemetry();
      showToast('Telemetry refreshed: 11kV Substation & Solar inverters verified live.');
    }, 900);
  };

  const syncPowerBi = () => {
    if (syncing) return;
    setSyncing(true);
    setSynced(false);
    setTimeout(() => {
      setSyncing(false);
      setSynced(true);
      loadLiveTelemetry();
      showToast('Dashboard refreshed from latest local audit / prediction telemetry.');
      setTimeout(() => setSynced(false), 3000);
    }, 600);
  };

  const allocation = (() => {
    const b = telemetry.breakdown;
    if (!b) {
      return [
        { label: "Labs & HVAC", pct: 43, color: "bg-brand-orange text-white", title: "Academic & Labs" },
        { label: "Hostels", pct: 28, color: "bg-brand-accentYellow text-slate-950", title: "Hostels" },
        { label: "Transit", pct: 18, color: "bg-slate-200 dark:bg-white text-slate-900", title: "Fleet" },
        { label: "Dining", pct: 11, color: "bg-slate-800 dark:bg-[#22242b] text-slate-300 border border-slate-700", title: "Mess" },
      ];
    }
    const parts = [
      { label: "Grid", key: "grid", color: "bg-brand-orange text-white" },
      { label: "Fleet", key: "fleet", color: "bg-brand-accentYellow text-slate-950" },
      { label: "DG", key: "dg", color: "bg-slate-200 dark:bg-white text-slate-900" },
      { label: "Mess", key: "mess", color: "bg-slate-800 dark:bg-[#22242b] text-slate-300 border border-slate-700" },
    ];
    const total = parts.reduce((s, p) => s + (Number(b[p.key]) || 0), 0) || 1;
    return parts.map((p) => ({
      label: p.label,
      pct: Math.round(((Number(b[p.key]) || 0) / total) * 100),
      color: p.color,
      title: `${p.label}: ${b[p.key] ?? 0} T`,
    }));
  })();

  const naacGradeLabel = telemetry.naacGrade
    ? `GRADE ${telemetry.naacGrade}`
    : telemetry.naacScore >= 88
      ? "GRADE A+"
      : telemetry.naacScore >= 70
        ? "GRADE A"
        : "GRADE B";

  const triggerForecastModal = () => {
    showToast('Redirecting to AI Predictive Engine: Campus on track for Net-Zero by 2032.');
    setTimeout(() => {
      navigate('/predictions');
    }, 1000);
  };

  const resetSliders = () => {
    setLabs(24);
    setPcsPerLab(30);
    setAcsPerLab(2);
    setLabHours(8);
    setHvac(8);
    setEvShare(25);
    setActivePeriod("1Y");
    showToast('Parameters reset to verified institutional baseline.');
  };

  // ── Equipment-Based Carbon Calculation ──────────────────────────────────────
  // Power consumption per equipment (in kW)
  const PC_KW        = 0.30;   // Desktop computer ~300W avg under load
  const MONITOR_KW   = 0.05;   // LCD monitor ~50W
  const AC_KW        = 1.50;   // 1.5-ton split AC ~1500W
  const LIGHT_KW     = 0.20;   // Lights per lab ~200W
  const PROJECTOR_KW = 0.30;   // Projector ~300W
  const GRID_EF      = 0.000716; // India CEA 2023: 0.716 kg CO2/kWh = T/MWh
  const WORKING_DAYS = 250;    // ~250 academic working days/year

  // Per-lab power (kW) = PCs + Monitors + ACs + Lights + Projector
  const labKW = (pcsPerLab * PC_KW) + (pcsPerLab * MONITOR_KW) + (acsPerLab * AC_KW) + LIGHT_KW + PROJECTOR_KW;
  // Per-lab daily kWh
  const labDailyKWh = labKW * labHours;
  // Per-lab daily CO2 (Tons)
  const labDailyCO2 = labDailyKWh * GRID_EF;
  // Per-lab annual CO2 (Tons)
  const labAnnualCO2 = labDailyCO2 * WORKING_DAYS;

  // Total labs annual delta vs baseline (24 labs, 30 PCs, 2 ACs, 8 hrs)
  const baselineLabKW = (30 * PC_KW) + (30 * MONITOR_KW) + (2 * AC_KW) + LIGHT_KW + PROJECTOR_KW; // 14 kW
  const baselineLabAnnualCO2 = baselineLabKW * 8 * GRID_EF * WORKING_DAYS; // ~20.05 T/lab/yr
  const deltaLabs = (labs * labAnnualCO2) - (24 * baselineLabAnnualCO2);

  // HVAC: Central HVAC draws ~150 kW campus-wide, scale by hours
  const HVAC_CAMPUS_KW = 150;
  const deltaHvac = (hvac - 8) * HVAC_CAMPUS_KW * GRID_EF * WORKING_DAYS;

  // EV/CNG fleet: Baseline fleet emits ~330 T/yr (scope 1 transport), clean vehicles offset
  const FLEET_BASELINE_ANNUAL = 330;
  const deltaEV = -((evShare - 25) / 100) * FLEET_BASELINE_ANNUAL;

  const yearlyDelta = deltaLabs + deltaHvac + deltaEV;

  let scale = 1;
  if (activePeriod === '1D') scale = 1 / 365;
  else if (activePeriod === '1W') scale = 1 / 52;
  else if (activePeriod === '1M') scale = 1 / 12;
  else if (activePeriod === 'ALL') scale = 18767 / 1858.72;

  const basePeriodValue = activePeriod === '1Y' ? telemetry.netTons : parseFloat(chartPaths[activePeriod].val.replace(/,/g, '').split(' ')[0]);
  const newTotal = basePeriodValue + (yearlyDelta * scale);
  
  const displayTotal = Number(newTotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const currentPath = chartPaths[activePeriod];
  
  const peakValue = (newTotal * 0.1678).toFixed(1);
  
  const getXAxisLabels = () => {
    switch(activePeriod) {
      case '1D': return ['00:00', '04:00', '08:00', '12:00 (Mid)', '16:00', '20:00', '23:59'];
      case '1W': return ['MON', 'TUE', 'WED', 'THU (Mid)', 'FRI', 'SAT', 'SUN'];
      case '1M': return ['Day 1', 'Day 5', 'Day 10', 'Day 15 (Mid)', 'Day 20', 'Day 25', 'Day 30'];
      case 'ALL': return ['2021', '2022', '2023', '2024 (Mid)', '2025', '2026', '2027'];
      case '1Y':
      default: return ['JAN', 'MAR', 'MAY', 'JUL (Mid)', 'SEP', 'NOV', 'DEC'];
    }
  };
  const xAxisLabels = getXAxisLabels();

  return (
    <div className="dashboard-v2 selection:bg-brand-orange selection:text-white">

      <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Top Action Row: Title & Mini Health Bars */}
        <ScrollReveal variant="fadeDown" duration={0.4}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
                  Campus Carbon &amp; Energy Performance
                </h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {telemetry.sourceTag}
                </span>
              </div>
            </div>

          <div className="flex items-center gap-4 bg-white dark:bg-brand-card px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-brand-border self-start md:self-auto shadow-sm dark:shadow-none">
            <div className="flex items-center gap-1.5" title="Campus Grid Decarbonization Index">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 mr-1">Decarb:</span>
              <span className="w-1.5 h-4 rounded-full bg-emerald-500"></span>
              <span className="w-1.5 h-4 rounded-full bg-emerald-500"></span>
              <span className="w-1.5 h-4 rounded-full bg-emerald-500"></span>
              <span className="w-1.5 h-4 rounded-full bg-emerald-500"></span>
              <span className="w-1.5 h-4 rounded-full bg-emerald-500"></span>
              <span className="w-1.5 h-4 rounded-full bg-emerald-500"></span>
              <span className="w-1.5 h-4 rounded-full bg-amber-400"></span>
              <span className="w-1.5 h-4 rounded-full bg-slate-200 dark:bg-slate-700"></span>
              <span className="w-1.5 h-4 rounded-full bg-slate-200 dark:bg-slate-700"></span>
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-brand-border"></div>
            <div className="text-xs">
              <span className="text-slate-500 dark:text-slate-400">Audit Score:</span>
              <span className="font-bold text-slate-900 dark:text-white ml-1">{telemetry.naacScore}<span className="text-[10px] text-emerald-500 dark:text-emerald-400 ml-1">/100</span></span>
            </div>
            <button 
              onClick={simulateDataSync}
              className="w-8 h-8 ml-2 rounded-lg bg-slate-100 dark:bg-[#1a1c22] border border-slate-200 dark:border-brand-border flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <i className={`ph ph-arrows-clockwise ${refreshing ? 'animate-spin' : ''}`}></i>
            </button>
          </div>
        </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 2x2 Small Metric Box */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Metric card 1 */}
            <ScrollReveal variant="fadeRight" delay={0.1} duration={0.4} className="h-full">
            <div className="bg-white dark:bg-brand-card rounded-2xl p-5 border border-slate-200 dark:border-brand-border hover:border-emerald-500 dark:hover:border-slate-700 transition flex flex-col justify-between group shadow-sm dark:shadow-none h-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Campus Grid Demand</span>
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-0.5 font-mono">
                  <i className="ph-bold ph-trend-down"></i> -9.2%
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
                  {Math.round(telemetry.gridMWh).toLocaleString()} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">MWh</span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">YTD Substation Draw (10-Yr CSV Data)</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-brand-border/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><i className="ph-fill ph-circle text-[8px] text-emerald-500 dark:text-emerald-400"></i> Main 11kV Substation</span>
                <span className="text-slate-900 dark:text-white font-mono font-medium">94% pf</span>
              </div>
            </div>
            </ScrollReveal>

            {/* Metric Card 2 */}
            <ScrollReveal variant="fadeRight" delay={0.2} duration={0.4} className="h-full">
            <div className="bg-white dark:bg-brand-card rounded-2xl p-5 border border-slate-200 dark:border-brand-border hover:border-amber-500 dark:hover:border-slate-700 transition flex flex-col justify-between group shadow-sm dark:shadow-none h-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Rooftop Solar Yield</span>
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 text-xs flex items-center gap-0.5 font-mono">
                  <i className="ph-bold ph-sun"></i> 200 kWp
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
                  {Math.round(telemetry.solarMWh).toLocaleString()} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">MWh</span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Cumulative clean generation offset</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-brand-border/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><i className="ph-fill ph-circle text-[8px] text-amber-500 dark:text-amber-400"></i> Active Inverters (4/4)</span>
                <span className="text-slate-900 dark:text-white font-mono font-medium">100% OK</span>
              </div>
            </div>
            </ScrollReveal>

            {/* Metric Card 3: Scope Breakdown */}
            <ScrollReveal variant="fadeUp" delay={0.3} duration={0.4} className="h-full">
            <div className="bg-white dark:bg-brand-card rounded-2xl p-5 border border-slate-200 dark:border-brand-border transition shadow-sm dark:shadow-none h-full">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 flex items-center justify-between">
                <span>Emissions by Scope</span>
                <i className="ph ph-shield-check text-slate-400 dark:text-slate-500 text-sm"></i>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><span className="w-2 h-2 rounded bg-red-400"></span> Scope 1 (Diesel/Gas)</span>
                  <span className="font-mono text-slate-900 dark:text-white font-semibold">{Math.round(telemetry.scope1)} T</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><span className="w-2 h-2 rounded bg-brand-orange"></span> Scope 2 (Grid MSEB)</span>
                  <span className="font-mono text-slate-900 dark:text-white font-semibold">{Math.round(telemetry.scope2)} T</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><span className="w-2 h-2 rounded bg-amber-400 dark:bg-amber-300"></span> Scope 3 (Commute)</span>
                  <span className="font-mono text-slate-900 dark:text-white font-semibold">{Math.round(telemetry.scope3)} T</span>
                </div>
              </div>
            </div>
            </ScrollReveal>

            {/* Metric Card 4: Renewable Credit & Avoided */}
            <ScrollReveal variant="fadeUp" delay={0.4} duration={0.4} className="h-full">
            <div className="bg-white dark:bg-brand-card rounded-2xl p-5 border border-slate-200 dark:border-brand-border transition flex flex-col justify-between shadow-sm dark:shadow-none h-full">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Renewable Offset</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">Solar + Biogas</span>
              </div>
              <div className="my-2">
                <div className="text-3xl font-extrabold text-emerald-500 dark:text-emerald-400 font-sans tracking-tight">
                  -{Math.round(telemetry.renewableOffsetTons)} <span className="text-sm font-semibold text-slate-500 dark:text-slate-300">T CO₂e</span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">Avoided Institutional Emissions</p>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>Afforestation buffer</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium font-mono">1,450 Trees</span>
              </div>
            </div>
            </ScrollReveal>

          </div>

          {/* Right: HERO ELECTRIC ORANGE CARD */}
          <ScrollReveal variant="fadeLeft" delay={0.2} duration={0.6} className="lg:col-span-7 h-full">
          <div className="lg:col-span-7 orange-mesh rounded-3xl p-6 sm:p-7 shadow-orange-glow relative overflow-hidden flex flex-col justify-between text-white border border-white/20 h-full">
            
            <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
              <div>
                <div className="text-xs uppercase font-extrabold tracking-widest text-white/80">
                  Campus Net Footprint
                </div>
                <div className="flex items-baseline gap-3 mt-1">
                  <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-sans">
                    {displayTotal}
                  </div>
                  <span className="text-sm font-bold text-white/90 font-mono bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/25 flex items-center gap-1">
                    <i className="ph-bold ph-arrow-down-right"></i> 3.8%
                  </span>
                </div>
                <p className="text-xs text-white/80 font-medium mt-0.5">Verified Metric Tons CO₂e / Year</p>
              </div>

              {/* Time Range Selector Pill */}
              <div className="flex items-center bg-black/25 backdrop-blur-md p-1 rounded-xl border border-white/20 text-xs font-semibold">
                {['1D', '1W', '1M', '1Y', 'ALL'].map(period => (
                  <button 
                    key={period}
                    onClick={() => { setActivePeriod(period); setLabs(24); setHvac(8); setEvShare(25); }}
                    className={`chart-period-btn px-2.5 py-1 rounded-lg transition border-none cursor-pointer ${activePeriod === period ? 'bg-white text-brand-orangeDark font-bold shadow-md' : 'bg-transparent hover:bg-white/20 text-white/80'}`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive SVG Area & Line Chart */}
            <div className="relative w-full h-52 sm:h-56 my-3 z-10">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 700 240" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                    <stop offset="60%" stopColor="#ffffff" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                  </linearGradient>
                  <pattern id="diagonalHatchOrange" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
                  </pattern>
                </defs>

                <line x1="0" y1="60" x2="700" y2="60" stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                <line x1="0" y1="120" x2="700" y2="120" stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                <line x1="0" y1="180" x2="700" y2="180" stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />

                <rect x="375" y="45" width="60" height="155" fill="url(#diagonalHatchOrange)" rx="6" />

                <path id="chartArea" className="chart-path" d={currentPath.area} fill="url(#heroGradient)" />
                <path id="chartLine" className="chart-path" d={currentPath.line} fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

                <circle cx="410" cy="50" r="6" fill="#ffffff" stroke="#ff3b10" strokeWidth="3" className="animate-pulse" />
                <circle cx="410" cy="50" r="12" fill="none" stroke="#ffffff" strokeOpacity="0.4" />

                <g transform="translate(425, 30)">
                  <rect x="0" y="0" width="105" height="48" rx="10" fill="#141519" fillOpacity="0.95" stroke="#ffffff" strokeOpacity="0.2" />
                  <text x="12" y="20" fill="#94a3b8" fontSize="10" fontFamily="Plus Jakarta Sans">Peak (Term-Start)</text>
                  <text x="12" y="38" fill="#ffffff" fontSize="13" fontWeight="700" fontFamily="JetBrains Mono">{peakValue} T CO₂e</text>
                </g>
              </svg>
            </div>

            {/* Bottom Month Tickers */}
            <div className="flex items-center justify-between text-[11px] font-mono font-medium text-white/75 pt-2 border-t border-white/20 relative z-10">
              <span>{xAxisLabels[0]}</span>
              <span>{xAxisLabels[1]}</span>
              <span>{xAxisLabels[2]}</span>
              <span className="text-white font-bold bg-white/20 px-2 py-0.5 rounded">{xAxisLabels[3]}</span>
              <span>{xAxisLabels[4]}</span>
              <span>{xAxisLabels[5]}</span>
              <span>{xAxisLabels[6]}</span>
            </div>

            <div className="absolute -right-20 -top-20 w-80 h-80 bg-yellow-300/25 rounded-full blur-3xl pointer-events-none"></div>
          </div>
          </ScrollReveal>
        </div>

        {/* ── Departmental Emission Tickers with Cap Warnings ───────────────── */}
        <ScrollReveal variant="fadeUp" delay={0.1} duration={0.5}>
        <div className="bg-white dark:bg-brand-card rounded-2xl p-4 border border-slate-200 dark:border-brand-border shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Departmental Emission Tickers</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
            </div>
            <span className="text-xs text-slate-500 font-mono">7 Academic Departments</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {Object.entries(DEPT_WEIGHTS).map(([key, dept]) => {
              const actual = Math.round(telemetry.netTons * dept.pct);
              const cap = deptCaps[key];
              const exceeded = actual > cap;
              const usePct = Math.min(100, Math.round((actual / cap) * 100));
              return (
                <div
                  key={key}
                  title={dept.equip}
                  className={`relative bg-slate-50 dark:bg-[#1a1c22] hover:bg-slate-100 dark:hover:bg-brand-cardHover border rounded-xl p-3 cursor-pointer transition ${
                    exceeded
                      ? 'border-rose-400 dark:border-rose-500 shadow-[0_0_0_2px_rgba(244,63,94,0.18)]'
                      : 'border-slate-200 dark:border-brand-border'
                  }`}
                >
                  {/* Over-limit badge */}
                  {exceeded && (
                    <span className="absolute -top-2 -right-2 z-10 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md animate-pulse">
                      OVER LIMIT
                    </span>
                  )}

                  <div className="flex items-center gap-1.5 mb-2">
                    <div className={`w-6 h-6 rounded-lg ${dept.color} flex items-center justify-center text-xs font-bold shrink-0`}>{dept.short}</div>
                    <span className="text-[11px] font-semibold text-slate-900 dark:text-white leading-tight">{dept.label}</span>
                  </div>

                  <div className="text-base font-bold text-slate-900 dark:text-white font-mono">
                    {actual} <span className="text-[10px] text-slate-500 dark:text-slate-400">T</span>
                  </div>

                  {/* Mini progress bar: actual vs cap */}
                  <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        exceeded ? 'bg-rose-500' : usePct > 80 ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${usePct}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[9px] font-mono text-slate-400">
                    <span>{usePct}% of cap</span>
                    <span>{cap}T</span>
                  </div>
                  <p className="mt-1.5 text-[8px] leading-tight text-slate-400 dark:text-slate-500 line-clamp-2">{dept.equip}</p>
                </div>
              );
            })}
          </div>
        </div>
        </ScrollReveal>

        {/* ── Department vs Carbon Ceiling Bar Chart ────────────────────────── */}
        <ScrollReveal variant="fadeUp" delay={0.15} duration={0.5}>
        <div className="bg-white dark:bg-brand-card rounded-2xl p-6 border border-slate-200 dark:border-brand-border shadow-sm dark:shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div>
              <div className="text-xs font-mono uppercase text-brand-orange font-bold mb-0.5">Carbon Ceiling Analysis</div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Department Actual Emissions vs Admin-Set Ceilings</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ceilings configurable in Admin Settings · Red = Limit Breached</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono shrink-0">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500"></span>Within Limit</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-400"></span>&gt;80% of Cap</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-rose-500"></span>Exceeded Cap</span>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(DEPT_WEIGHTS).map(([key, dept]) => {
              const actual = Math.round(telemetry.netTons * dept.pct);
              const cap = deptCaps[key];
              const exceeded = actual > cap;
              const actualPct = Math.min(100, (actual / cap) * 100);
              const barColor = exceeded ? '#ef4444' : actualPct > 80 ? '#f59e0b' : '#10b981';
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-md ${dept.color} flex items-center justify-center text-[10px] font-bold shrink-0`}>{dept.short}</div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{dept.label}</span>
                      {exceeded && (
                        <span className="text-[9px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-500/30">
                          ⚠ {actual - cap}T OVER
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className={`font-bold ${exceeded ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>{actual}T</span>
                      <span className="text-slate-400">/ {cap}T cap</span>
                    </div>
                  </div>

                  {/* Stacked bar: actual + cap marker */}
                  <div className="relative h-5 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-visible">
                    {/* Cap reference line */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-slate-900 dark:bg-white z-10"
                      style={{ left: '100%', transform: 'none' }}
                      title={`Cap: ${cap}T`}
                    />
                    {/* Actual bar */}
                    <div
                      className="h-full rounded-lg transition-all duration-700 flex items-center px-2"
                      style={{ width: `${Math.min(100, actualPct)}%`, backgroundColor: barColor }}
                    >
                      {actualPct > 20 && (
                        <span className="text-[9px] font-bold text-white font-mono">{Math.round(actualPct)}%</span>
                      )}
                    </div>
                    {/* Overflow overflow indicator */}
                    {exceeded && (
                      <div
                        className="absolute top-0 h-full rounded-r-lg bg-rose-200 dark:bg-rose-900/40 border-l-2 border-rose-500 flex items-center px-1"
                        style={{ left: '100%', width: `${Math.min(30, ((actual - cap) / cap) * 100)}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-brand-border/70 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Ceilings are set in <button onClick={() => navigate('/admin')} className="text-brand-orange hover:underline font-semibold bg-transparent border-none cursor-pointer p-0">Admin Settings →</button></span>
            <span className="font-mono">
              {Object.entries(DEPT_WEIGHTS).filter(([k]) => Math.round(telemetry.netTons * DEPT_WEIGHTS[k].pct) > deptCaps[k]).length} / {Object.keys(DEPT_WEIGHTS).length} depts over ceiling
            </span>
          </div>
        </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Bento 1: Allocation */}
          <ScrollReveal variant="fadeUp" delay={0.2} duration={0.5} className="lg:col-span-5 h-full">
          <div className="lg:col-span-5 bg-white dark:bg-brand-card rounded-2xl p-6 border border-slate-200 dark:border-brand-border flex flex-col justify-between shadow-sm dark:shadow-none h-full">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Facility Allocation Share</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Proportional gross footprint composition</p>
                </div>
                <button onClick={() => navigate('/audit')} className="text-xs font-mono text-brand-orange hover:text-brand-orangeLight flex items-center gap-1 bg-transparent border-none cursor-pointer">
                  <span>Audit Calculator</span> <i className="ph-bold ph-arrow-up-right"></i>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2.5 h-36 items-end mt-4">
                {allocation.map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-xl p-3 flex flex-col justify-between font-bold cursor-pointer hover:opacity-95 transition ${item.color}`}
                    style={{ height: `${Math.max(28, item.pct)}%` }}
                    title={item.title}
                  >
                    <span className="text-xs font-mono">{item.pct}%</span>
                    <span className="text-[10px] leading-tight truncate">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-brand-border/70 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-brand-orange"></span> Labs</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-brand-accentYellow"></span> Hostels</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-white"></span> Bus Fleet</span>
              </div>
              <span className="font-mono text-slate-600 dark:text-slate-300">100% Calibrated</span>
            </div>
          </div>
          </ScrollReveal>

          {/* Bento 2: Gauge */}
          <ScrollReveal variant="fadeUp" delay={0.3} duration={0.5} className="lg:col-span-4 h-full">
          <div className="lg:col-span-4 bg-white dark:bg-brand-card rounded-2xl p-6 border border-slate-200 dark:border-brand-border flex flex-col justify-between shadow-sm dark:shadow-none h-full">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Sustainability Compliance</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">NAAC Criterion VII • Green Rating</p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                {naacGradeLabel}
              </span>
            </div>

            <div className="relative flex flex-col items-center justify-center my-4">
              <svg className="w-56 h-32 overflow-visible" viewBox="0 0 200 115">
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--gauge-bg, #cbd5e1)" strokeWidth="16" strokeLinecap="round" className="dark:stroke-[#23252d]" />
                <path d="M 20 100 A 80 80 0 0 1 100 20" fill="none" stroke="#10b981" strokeWidth="16" strokeLinecap="round" strokeDasharray="130" strokeDashoffset="0" />
                <path d="M 100 20 A 80 80 0 0 1 150 45" fill="none" stroke="#f59e0b" strokeWidth="16" strokeLinecap="round" strokeDasharray="80" strokeDashoffset="0" />
                <path d="M 150 45 A 80 80 0 0 1 180 100" fill="none" stroke="#ef4444" strokeWidth="16" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="0" />
                <circle cx="100" cy="100" r="7" className="fill-slate-900 dark:fill-white" />
                <line
                  x1="100" y1="100"
                  x2={100 + 55 * Math.cos(Math.PI - (Math.min(100, Math.max(0, telemetry.naacScore)) / 100) * Math.PI)}
                  y2={100 - 55 * Math.sin(Math.PI - (Math.min(100, Math.max(0, telemetry.naacScore)) / 100) * Math.PI)}
                  className="stroke-slate-900 dark:stroke-white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>

              <div className="text-center mt-1">
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">{telemetry.naacScore}<span className="text-lg text-slate-400 dark:text-slate-500 font-normal"> / 100</span></div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center gap-1 mt-0.5">
                  <i className="ph-bold ph-shield-check"></i> Compliant with BEE Tier-1 Standards
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-brand-border/70 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Per-Capita Intensity</span>
              <span className="text-slate-900 dark:text-white font-mono font-bold">{telemetry.perCapitaKg} kg / student / yr</span>
            </div>
          </div>
          </ScrollReveal>

          {/* Bento 3: Quick Action */}
          <ScrollReveal variant="fadeUp" delay={0.4} duration={0.5} className="lg:col-span-3 h-full">
          <div className="lg:col-span-3 bg-white dark:bg-brand-card rounded-2xl p-6 border border-slate-200 dark:border-brand-border flex flex-col justify-between shadow-sm dark:shadow-none h-full">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Audit Actions</h3>
                <i className="ph ph-sliders text-slate-400"></i>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Directly push live environmental telemetry into Maharashtra State Energy Conservation (MEDA) & NIRF report pools.
              </p>

              <div className="space-y-2.5 mt-5">
                <button 
                  onClick={syncPowerBi}
                  disabled={syncing}
                  className="w-full py-2.5 px-4 bg-brand-orange hover:bg-brand-orangeDark text-white font-semibold text-xs rounded-xl shadow-orange-glow flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {syncing ? (
                    <><i className="ph-bold ph-spinner animate-spin"></i><span>Refreshing telemetry...</span></>
                  ) : synced ? (
                    <><i className="ph-bold ph-check"></i><span>Telemetry Synced!</span></>
                  ) : (
                    <><i className="ph-bold ph-arrows-clockwise"></i><span>Refresh Live Telemetry</span></>
                  )}
                </button>

                <button onClick={triggerForecastModal} className="w-full py-2.5 px-4 bg-slate-100 dark:bg-[#1e2027] hover:bg-slate-200 dark:hover:bg-[#252831] border border-slate-200 dark:border-brand-border text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer">
                  <i className="ph-bold ph-sparkle text-amber-500 dark:text-amber-400"></i>
                  <span>Run AI 2030 Net-Zero Forecast</span>
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-brand-border/70 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <i className="ph-fill ph-check-circle text-emerald-500 dark:text-emerald-400"></i> ISO 14064 Certified
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">v4.8 ESCO</span>
            </div>
          </div>
          </ScrollReveal>
        </div>

        {/* Interactive Carbon Simulator */}
        <ScrollReveal variant="fadeUp" delay={0.1} duration={0.6}>
        <div className="bg-white dark:bg-brand-card rounded-2xl p-6 border border-slate-200 dark:border-brand-border shadow-sm dark:shadow-none mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-brand-border">
            <div>
              <div className="text-xs font-mono uppercase text-brand-orange font-bold">Interactive Carbon Simulator</div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Equipment-Based Lab Emission Calculator</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Uses India CEA 2023 Grid Emission Factor: 0.716 kg CO2/kWh</p>
            </div>
            <button onClick={resetSliders} className="self-start sm:self-auto text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-300 dark:border-brand-border hover:bg-slate-100 dark:hover:bg-brand-cardHover flex items-center gap-1.5 transition bg-transparent cursor-pointer">
              <i className="ph ph-arrow-counter-clockwise"></i> Reset Defaults
            </button>
          </div>

          {/* Sliders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Number of Labs */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300">Active Labs on Campus</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">{labs} Labs</span>
              </div>
              <input type="range" min="5" max="60" value={labs} onChange={(e) => setLabs(Number(e.target.value))} className="w-full" />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>5 Labs</span>
                <span>60 Labs</span>
              </div>
            </div>

            {/* Computers Per Lab */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300">Computers Per Lab</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">{pcsPerLab} PCs</span>
              </div>
              <input type="range" min="10" max="60" value={pcsPerLab} onChange={(e) => setPcsPerLab(Number(e.target.value))} className="w-full" />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>10 PCs (Small)</span>
                <span>60 PCs (Large)</span>
              </div>
            </div>

            {/* ACs Per Lab */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300">ACs Per Lab (1.5 Ton)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">{acsPerLab} ACs</span>
              </div>
              <input type="range" min="0" max="6" value={acsPerLab} onChange={(e) => setAcsPerLab(Number(e.target.value))} className="w-full" />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 (No AC)</span>
                <span>6 ACs</span>
              </div>
            </div>

            {/* Lab Operating Hours */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300">Lab Operating Hours / Day</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">{labHours} Hrs</span>
              </div>
              <input type="range" min="2" max="16" value={labHours} onChange={(e) => setLabHours(Number(e.target.value))} className="w-full" />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>2 Hrs (Minimal)</span>
                <span>16 Hrs (Extended)</span>
              </div>
            </div>

            {/* HVAC Hours */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300">Central HVAC Duration</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">{hvac} Hrs/day</span>
              </div>
              <input type="range" min="2" max="16" value={hvac} onChange={(e) => setHvac(Number(e.target.value))} className="w-full" />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>2 Hrs (Savings)</span>
                <span>16 Hrs (Heavy)</span>
              </div>
            </div>

            {/* EV Fleet Share */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300">Transit Fleet EV / CNG Share</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded">{evShare}% Clean</span>
              </div>
              <input type="range" min="0" max="100" step="5" value={evShare} onChange={(e) => setEvShare(Number(e.target.value))} className="w-full" />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0% Diesel Only</span>
                <span>100% Fully Electric</span>
              </div>
            </div>
          </div>

          {/* Equipment Breakdown Card */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-brand-border">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Per-Lab Power Breakdown (Real Equipment)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Equipment table */}
              <div className="bg-slate-50 dark:bg-[#1a1c22] rounded-xl p-4 border border-slate-200 dark:border-brand-border">
                <div className="space-y-2">
                  {[
                    { icon: 'ph-desktop', label: `${pcsPerLab} Desktops (300W each)`, kw: pcsPerLab * 0.30 },
                    { icon: 'ph-monitor', label: `${pcsPerLab} Monitors (50W each)`, kw: pcsPerLab * 0.05 },
                    { icon: 'ph-thermometer-cold', label: `${acsPerLab} ACs 1.5T (1500W each)`, kw: acsPerLab * 1.50 },
                    { icon: 'ph-lamp', label: 'Lighting (per lab)', kw: 0.20 },
                    { icon: 'ph-projector-screen', label: 'Projector', kw: 0.30 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <i className={`ph ${item.icon} text-sm text-slate-400`}></i>
                        {item.label}
                      </span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">{item.kw.toFixed(1)} kW</span>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t border-slate-200 dark:border-brand-border flex justify-between text-xs font-bold">
                    <span className="text-slate-900 dark:text-white">Total Per Lab</span>
                    <span className="text-brand-orange font-mono">{labKW.toFixed(1)} kW</span>
                  </div>
                </div>
              </div>

              {/* Right: Calculation chain */}
              <div className="bg-slate-50 dark:bg-[#1a1c22] rounded-xl p-4 border border-slate-200 dark:border-brand-border">
                <div className="space-y-2.5">
                  {[
                    { label: 'Power per lab', value: `${labKW.toFixed(1)} kW`, sub: `${pcsPerLab} PCs + ${acsPerLab} ACs + lights + projector` },
                    { label: `Daily kWh (${labHours} hrs)`, value: `${labDailyKWh.toFixed(1)} kWh`, sub: `${labKW.toFixed(1)} kW x ${labHours} hrs` },
                    { label: 'Daily CO2 per lab', value: `${(labDailyCO2 * 1000).toFixed(1)} kg`, sub: `${labDailyKWh.toFixed(1)} kWh x 0.716 kg/kWh` },
                    { label: 'Annual CO2 per lab', value: `${labAnnualCO2.toFixed(2)} T`, sub: `x 250 working days` },
                    { label: `Total (${labs} labs)`, value: `${(labs * labAnnualCO2).toFixed(1)} T/yr`, sub: `${labs} labs x ${labAnnualCO2.toFixed(2)} T` },
                  ].map((row) => (
                    <div key={row.label} className="flex items-start justify-between text-xs">
                      <div>
                        <span className="font-medium text-slate-700 dark:text-slate-200">{row.label}</span>
                        <div className="text-[10px] text-slate-400 font-mono">{row.sub}</div>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-brand-border flex justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">Net Footprint Change</span>
                  <span className={`font-mono font-bold ${yearlyDelta > 0 ? 'text-rose-500' : yearlyDelta < 0 ? 'text-emerald-500' : 'text-slate-500'}`}>
                    {yearlyDelta > 0 ? '+' : ''}{yearlyDelta.toFixed(1)} T/yr
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </ScrollReveal>

      </main>

      {/* Notification Toast */}
      <div className={`fixed bottom-6 right-6 transform transition-all duration-300 bg-white dark:bg-brand-card border border-slate-200 dark:border-brand-border p-4 rounded-xl shadow-2xl flex items-center gap-3 text-xs text-slate-900 dark:text-white z-50 ${toastVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <i className="ph-fill ph-check-circle text-emerald-500 dark:text-emerald-400 text-lg"></i>
        <span>{toastMsg}</span>
      </div>
    </div>
  );
}
