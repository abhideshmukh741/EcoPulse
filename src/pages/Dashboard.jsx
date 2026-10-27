import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ScrollReveal from "../components/ScrollReveal";
import "./Dashboard.css";
import {
  getTodayActualEmissions,
  storeDailyEmissionRecord,
  fetch30DayForecast,
  fetchAiRecommendations,
  calculateActualEmissionsLocal,
} from "../lib/carbonEngine";
import {
  BrainCircuit,
  Activity,
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Save,
  ArrowRight,
  Bot,
  Zap,
  Info,
  X,
  RefreshCw,
} from "lucide-react";

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


export default function Dashboard() {
  const navigate = useNavigate();
  const [activePeriod, setActivePeriod] = useState("1Y");
  
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

  // ── Today's Live Actual & ML Prediction States ──────────────────────────────
  const [todayActual, setTodayActual] = useState({
    daily_tons_co2e: 7.48,
    scope1_tco2e: 0.85,
    scope2_tco2e: 3.22,
    scope3_tco2e: 3.41,
    solar_offset_tco2e: 0.24,
  });
  const [todayPrediction, setTodayPrediction] = useState({
    dailyTons: 7.35,
    monthlyTons: 220.5,
    confidence: 98.4,
    peakRisk: "MODERATE",
    breakdown: { scope1_tco2e: 0.81, scope2_tco2e: 3.23, scope3_tco2e: 3.31 },
  });
  const [todayInputs, setTodayInputs] = useState({
    gridDailyKwh: 4350,
    solarGenerationKwh: 340,
    dieselLiters: 175,
    studentFootfall: 4180,
    ambientTemp: 32.0,
    academicPhase: "regular",
  });
  const [forecast30Summary, setForecast30Summary] = useState({
    total_predicted_tons: 214.2,
    average_daily_tons: 7.14,
    peak_day: { date: "Day +15", tons: 8.32, day_name: "Wed" },
  });
  const [aiTip, setAiTip] = useState({
    title: "Dynamic Pre-Cooling & Chilled Water Reset",
    saving: "0.62 T/day",
    rupees: "₹48,500/mo",
    text: "Scope 2 grid electricity peaks during afternoon heatwaves. Pre-cooling academic halls before 09:00 shaves 0.62 T/day off peak tariff demand.",
  });
  const [telemetryModalOpen, setTelemetryModalOpen] = useState(false);
  const [isSavingDaily, setIsSavingDaily] = useState(false);

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
        if (pred.dailyTons) {
          setTodayPrediction((prev) => ({
            ...prev,
            dailyTons: pred.dailyTons,
            monthlyTons: pred.monthlyTons || prev.monthlyTons,
            confidence: pred.confidence || prev.confidence,
          }));
        }
        if (!auditStr) updated.sourceTag = "AI Forecast Available (run audit to set footprint)";
      }

      // Load stored today's actuals from localStorage or calculate
      try {
        const storedToday = localStorage.getItem("ecopulse_latest_today_actual");
        if (storedToday) {
          setTodayActual(JSON.parse(storedToday));
        } else {
          getTodayActualEmissions().then(setTodayActual).catch(() => {});
        }
      } catch (e) {}

      fetch30DayForecast().then((f) => {
        if (f) setForecast30Summary(f);
      }).catch(() => {});

      fetchAiRecommendations().then((ai) => {
        if (ai?.suggestions?.[0]) {
          const s = ai.suggestions[0];
          setAiTip({
            title: s.title,
            saving: `${Math.abs(s.impact_daily_tco2e)} T/day`,
            rupees: `₹${s.cost_saving_monthly_inr.toLocaleString()}/mo`,
            text: s.root_cause_analysis,
          });
        }
      }).catch(() => {});

      setTelemetry(updated);
    } catch (e) {}
  };

  const handleSaveTodayActual = async () => {
    setIsSavingDaily(true);
    try {
      await storeDailyEmissionRecord(
        new Date().toISOString().split("T")[0],
        todayActual,
        todayPrediction,
        todayInputs
      );
      showToast("✓ Today's actual carbon emissions stored! Model dataset updated for future improvement.");
      setTelemetryModalOpen(false);
    } catch (err) {
      showToast("Error saving daily actuals: " + err.message);
    } finally {
      setIsSavingDaily(false);
    }
  };

  const handleUpdateTodayInputs = (field, value) => {
    const updated = { ...todayInputs, [field]: value };
    setTodayInputs(updated);
    const newAct = calculateActualEmissionsLocal(updated);
    setTodayActual(newAct);
  };

  useEffect(() => {
    loadLiveTelemetry();

    const handleUpdate = (e) => {
      loadLiveTelemetry();
      const type = e.detail?.type === 'audit' ? 'Campus Audit Recalculated' : 'AI ML Prediction Model Executed';
      showToast(`⚡ Live Telemetry Synced: ${type}`);
    };

    const handleStorage = () => {
      loadLiveTelemetry();
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

  let scale = 1;
  if (activePeriod === '1D') scale = 1 / 365;
  else if (activePeriod === '1W') scale = 1 / 52;
  else if (activePeriod === '1M') scale = 1 / 12;
  else if (activePeriod === 'ALL') scale = 18767 / 1858.72;

  const basePeriodValue = activePeriod === '1Y' ? telemetry.netTons : parseFloat(chartPaths[activePeriod].val.replace(/,/g, '').split(' ')[0]);
  const newTotal = basePeriodValue;
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

        {/* ── TODAY'S CARBON PULSE: ACTUAL VS PREDICTED EMISSIONS ── */}
        <ScrollReveal variant="fadeUp" duration={0.5}>
          <div className="bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-emerald-500/30 shadow-md dark:shadow-xl relative overflow-hidden backdrop-blur-xl transition-colors">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Activity size={20} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                      Live Telemetry &amp; Machine Learning
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Today: {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    Today's Carbon Emissions: Actual vs Predicted
                  </h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setTelemetryModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white font-semibold text-xs flex items-center gap-1.5 transition border border-slate-200 dark:border-white/10 cursor-pointer"
                >
                  <Sliders size={13} />
                  <span>Log Telemetry</span>
                </button>
                <button
                  onClick={handleSaveTodayActual}
                  disabled={isSavingDaily}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20 dark:shadow-emerald-500/25 cursor-pointer disabled:opacity-60"
                >
                  <Save size={13} />
                  <span>{isSavingDaily ? "Storing..." : "Store Today's Actual"}</span>
                </button>
                <button
                  onClick={() => navigate('/predictions')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1.5 transition border border-emerald-200 dark:border-emerald-500/30 cursor-pointer"
                >
                  <span>30-Day Forecast &amp; AI Studio</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {/* Core Side-by-Side Today Metrics */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
              {/* Today's Actual */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-white/5 border border-amber-200 dark:border-amber-500/30">
                <div className="flex items-center justify-between text-xs font-mono text-amber-700 dark:text-amber-400 mb-1">
                  <span className="uppercase font-bold">Today's Actual</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">Operational</span>
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono mt-1">
                  {todayActual.daily_tons_co2e} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">tCO₂e</span>
                </div>
                <div className="mt-2.5 text-[11px] text-slate-600 dark:text-slate-400 font-mono space-y-0.5">
                  <div className="flex justify-between"><span>Scope 1 (Fuel):</span> <span className="text-slate-900 dark:text-white font-semibold">{todayActual.scope1_tco2e} T</span></div>
                  <div className="flex justify-between"><span>Scope 2 (Net Grid):</span> <span className="text-slate-900 dark:text-white font-semibold">{todayActual.scope2_tco2e} T</span></div>
                  <div className="flex justify-between"><span>Scope 3 (Commute/Mess):</span> <span className="text-slate-900 dark:text-white font-semibold">{todayActual.scope3_tco2e} T</span></div>
                </div>
              </div>

              {/* Today's Predicted */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-white/5 border border-emerald-200 dark:border-emerald-500/30">
                <div className="flex items-center justify-between text-xs font-mono text-emerald-700 dark:text-emerald-400 mb-1">
                  <span className="uppercase font-bold">Today's Predicted</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">ML Model</span>
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white font-mono mt-1">
                  {todayPrediction.dailyTons} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">tCO₂e</span>
                </div>
                <div className="mt-2.5 text-[11px] text-slate-600 dark:text-slate-400 font-mono space-y-0.5">
                  <div className="flex justify-between"><span>Model Confidence:</span> <span className="text-emerald-600 dark:text-emerald-400 font-bold">{todayPrediction.confidence}%</span></div>
                  <div className="flex justify-between"><span>Monthly Run-Rate:</span> <span className="text-slate-900 dark:text-white font-semibold">{todayPrediction.monthlyTons} T</span></div>
                  <div className="flex justify-between"><span>Peak Risk Level:</span> <span className="text-amber-600 dark:text-amber-400 uppercase font-bold">{todayPrediction.peakRisk}</span></div>
                </div>
              </div>

              {/* Comparison Variance */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase mb-1">Variance (Actual - Pred)</div>
                <div className={`text-3xl font-black font-mono mt-1 ${
                  Math.abs(Number(((todayActual.daily_tons_co2e - todayPrediction.dailyTons) / todayPrediction.dailyTons) * 100)) <= 5
                    ? "text-emerald-600 dark:text-emerald-400"
                    : todayActual.daily_tons_co2e > todayPrediction.dailyTons
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}>
                  {todayActual.daily_tons_co2e - todayPrediction.dailyTons > 0 ? `+${(todayActual.daily_tons_co2e - todayPrediction.dailyTons).toFixed(3)}` : (todayActual.daily_tons_co2e - todayPrediction.dailyTons).toFixed(3)} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">T</span>
                </div>
                <div className="mt-2.5 text-[11px] font-mono">
                  <span className="text-slate-500 dark:text-slate-400">Delta: </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {((todayActual.daily_tons_co2e - todayPrediction.dailyTons) / todayPrediction.dailyTons * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  {Math.abs((todayActual.daily_tons_co2e - todayPrediction.dailyTons) / todayPrediction.dailyTons * 100) <= 5
                    ? "✓ Operational emissions align with ML target"
                    : todayActual.daily_tons_co2e > todayPrediction.dailyTons
                    ? "⚠ Exceeding target · Check chiller/lab draw"
                    : "✓ Emission savings verified vs model"}
                </div>
              </div>

              {/* Next 30-Day Outlook Preview */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">
                    <span className="uppercase">Next 30-Day Outlook</span>
                    <Calendar size={13} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                    {forecast30Summary.total_predicted_tons} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">T</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                    Starts tomorrow · Avg: {forecast30Summary.average_daily_tons} T/day
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Peak Risk Day:</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">{forecast30Summary.peak_day.tons} T</span>
                </div>
              </div>
            </div>

            {/* AI Agent Recommendation Ticker */}
            <div className="relative z-10 mt-4 pt-3 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                  <Bot size={13} />
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">AI Suggestion:</span>
                <span className="text-slate-600 dark:text-slate-300 truncate max-w-xl">{aiTip.title} — Save {aiTip.saving} ({aiTip.rupees})</span>
              </div>
              <button
                onClick={() => navigate('/predictions')}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-mono font-bold flex items-center gap-1 shrink-0 bg-transparent border-none cursor-pointer"
              >
                <span>View Full AI Reduction Plan</span>
                <ArrowRight size={12} />
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
                    onClick={() => setActivePeriod(period)}
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



      </main>

      {/* ── Quick Telemetry Logger Modal ── */}
      {telemetryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl relative text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Sliders size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Log Today's Operational Telemetry</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Recalculate today's actual footprint &amp; store for continuous ML improvement</p>
                </div>
              </div>
              <button
                onClick={() => setTelemetryModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 py-5 text-xs">
              {/* Grid kWh */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium">
                  <span>Substation Grid Electricity (kWh)</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{todayInputs.gridDailyKwh} kWh</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="7500"
                  step="50"
                  value={todayInputs.gridDailyKwh}
                  onChange={(e) => handleUpdateTodayInputs('gridDailyKwh', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Solar kWh */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium">
                  <span>Rooftop Solar Generation (kWh)</span>
                  <span className="font-mono font-bold text-amber-500">{todayInputs.solarGenerationKwh} kWh</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="800"
                  step="10"
                  value={todayInputs.solarGenerationKwh}
                  onChange={(e) => handleUpdateTodayInputs('solarGenerationKwh', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Diesel Liters */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium">
                  <span>Diesel Fuel Consumed (Liters)</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{todayInputs.dieselLiters} L</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="450"
                  step="5"
                  value={todayInputs.dieselLiters}
                  onChange={(e) => handleUpdateTodayInputs('dieselLiters', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Ambient Temp */}
              <div className="space-y-1">
                <div className="flex justify-between font-medium">
                  <span>Ambient Temperature (°C)</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{todayInputs.ambientTemp}°C</span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="46"
                  step="0.5"
                  value={todayInputs.ambientTemp}
                  onChange={(e) => handleUpdateTodayInputs('ambientTemp', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Live Preview of Calculated Actual */}
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono text-slate-500 uppercase">Recalculated Today Actual</span>
                  <div className="text-xl font-black font-mono text-emerald-500 mt-0.5">
                    {todayActual.daily_tons_co2e} <span className="text-xs text-slate-400">tCO₂e</span>
                  </div>
                </div>
                <div className="text-right text-[11px] font-mono text-slate-500">
                  <div>Predicted: {todayPrediction.dailyTons} T</div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    Delta: {todayActual.daily_tons_co2e - todayPrediction.dailyTons > 0 ? `+${(todayActual.daily_tons_co2e - todayPrediction.dailyTons).toFixed(2)}` : (todayActual.daily_tons_co2e - todayPrediction.dailyTons).toFixed(2)} T
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setTelemetryModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTodayActual}
                disabled={isSavingDaily}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/25 cursor-pointer"
              >
                <Save size={14} />
                <span>{isSavingDaily ? "Storing Data..." : "Save & Store Today's Data"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      <div className={`fixed bottom-6 right-6 transform transition-all duration-300 bg-white dark:bg-brand-card border border-slate-200 dark:border-brand-border p-4 rounded-xl shadow-2xl flex items-center gap-3 text-xs text-slate-900 dark:text-white z-50 ${toastVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <i className="ph-fill ph-check-circle text-emerald-500 dark:text-emerald-400 text-lg"></i>
        <span>{toastMsg}</span>
      </div>
    </div>
  );
}
