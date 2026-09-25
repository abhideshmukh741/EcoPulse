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

export default function Dashboard() {
  const navigate = useNavigate();
  const [labs, setLabs] = useState(24);
  const [hvac, setHvac] = useState(8);
  const [evShare, setEvShare] = useState(25);
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

    window.addEventListener("ecopulse_data_updated", handleUpdate);
    window.addEventListener("storage", loadLiveTelemetry);
    return () => {
      window.removeEventListener("ecopulse_data_updated", handleUpdate);
      window.removeEventListener("storage", loadLiveTelemetry);
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
    setHvac(8);
    setEvShare(25);
    setActivePeriod("1Y");
    showToast('Parameters reset to verified institutional baseline.');
  };

  // Math Logic Fix: Scale the slider deltas by the selected time period
  const deltaLabs = (labs - 24) * 8.5;
  const deltaHvac = (hvac - 8) * 16.2;
  const deltaEV = (evShare - 25) * -1.8;
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
                  <text x="12" y="38" fill="#ffffff" fontSize="13" fontWeight="700" fontFamily="JetBrains Mono">312 T CO₂e</text>
                </g>
              </svg>
            </div>

            {/* Bottom Month Tickers */}
            <div className="flex items-center justify-between text-[11px] font-mono font-medium text-white/75 pt-2 border-t border-white/20 relative z-10">
              <span>JAN</span>
              <span>MAR</span>
              <span>MAY</span>
              <span className="text-white font-bold bg-white/20 px-2 py-0.5 rounded">JUL (Mid)</span>
              <span>SEP</span>
              <span>NOV</span>
              <span>DEC</span>
            </div>

            <div className="absolute -right-20 -top-20 w-80 h-80 bg-yellow-300/25 rounded-full blur-3xl pointer-events-none"></div>
          </div>
          </ScrollReveal>
        </div>

        <ScrollReveal variant="fadeUp" delay={0.1} duration={0.5}>
        <div className="bg-white dark:bg-brand-card rounded-2xl p-4 border border-slate-200 dark:border-brand-border shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Departmental Emission Tickers</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
            </div>
            <span className="text-xs text-slate-500 font-mono">7 Academic Departments + Admin</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* CSE */}
            <div className="bg-slate-50 dark:bg-[#1a1c22] hover:bg-slate-100 dark:hover:bg-brand-cardHover border border-slate-200 dark:border-brand-border rounded-xl p-3 cursor-pointer group transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">CS</div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">CSE & Data</span>
                </div>
                <span className="text-[10px] font-mono text-rose-500 dark:text-rose-400 font-medium">+2.1%</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-base font-bold text-slate-900 dark:text-white font-mono">{Math.round(telemetry.netTons * 0.076)} <span className="text-[10px] text-slate-500 dark:text-slate-400">T</span></span>
                <svg className="w-16 h-5 text-rose-500" viewBox="0 0 60 20" fill="none">
                  <path d="M2 14 L15 12 L28 16 L42 6 L58 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            {/* AI & DS */}
            <div className="bg-slate-50 dark:bg-[#1a1c22] hover:bg-slate-100 dark:hover:bg-brand-cardHover border border-slate-200 dark:border-brand-border rounded-xl p-3 cursor-pointer group transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">AI</div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">AI &amp; DS Labs</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-500 dark:text-emerald-400 font-medium">-4.5%</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-base font-bold text-slate-900 dark:text-white font-mono">{Math.round(telemetry.netTons * 0.053)} <span className="text-[10px] text-slate-500 dark:text-slate-400">T</span></span>
                <svg className="w-16 h-5 text-emerald-500 dark:text-emerald-400" viewBox="0 0 60 20" fill="none">
                  <path d="M2 5 L15 8 L28 4 L42 15 L58 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            {/* Mechanical */}
            <div className="bg-slate-50 dark:bg-[#1a1c22] hover:bg-slate-100 dark:hover:bg-brand-cardHover border border-slate-200 dark:border-brand-border rounded-xl p-3 cursor-pointer group transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold">ME</div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">Mechanical</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-medium">0.0%</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-base font-bold text-slate-900 dark:text-white font-mono">124 <span className="text-[10px] text-slate-500 dark:text-slate-400">T</span></span>
                <svg className="w-16 h-5 text-amber-500 dark:text-amber-400" viewBox="0 0 60 20" fill="none">
                  <path d="M2 10 L15 9 L28 11 L42 10 L58 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            {/* Civil */}
            <div className="bg-slate-50 dark:bg-[#1a1c22] hover:bg-slate-100 dark:hover:bg-brand-cardHover border border-slate-200 dark:border-brand-border rounded-xl p-3 cursor-pointer group transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold">CE</div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">Civil Engg</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-500 dark:text-emerald-400 font-medium">-1.8%</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-base font-bold text-slate-900 dark:text-white font-mono">64 <span className="text-[10px] text-slate-500 dark:text-slate-400">T</span></span>
                <svg className="w-16 h-5 text-emerald-500 dark:text-emerald-400" viewBox="0 0 60 20" fill="none">
                  <path d="M2 6 L18 8 L32 14 L46 12 L58 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            {/* Electrical */}
            <div className="bg-slate-50 dark:bg-[#1a1c22] hover:bg-slate-100 dark:hover:bg-brand-cardHover border border-slate-200 dark:border-brand-border rounded-xl p-3 cursor-pointer group transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center text-xs font-bold">EE</div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">Electrical</span>
                </div>
                <span className="text-[10px] font-mono text-rose-500 dark:text-rose-400 font-medium">+1.4%</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-base font-bold text-slate-900 dark:text-white font-mono">86 <span className="text-[10px] text-slate-500 dark:text-slate-400">T</span></span>
                <svg className="w-16 h-5 text-rose-500 dark:text-rose-400" viewBox="0 0 60 20" fill="none">
                  <path d="M2 15 L14 12 L28 14 L42 8 L58 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
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
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Adjust Campus Parameters to Recalculate Live Footprint</h2>
            </div>
            <button onClick={resetSliders} className="self-start sm:self-auto text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-300 dark:border-brand-border hover:bg-slate-100 dark:hover:bg-brand-cardHover flex items-center gap-1.5 transition bg-transparent cursor-pointer">
              <i className="ph ph-arrow-counter-clockwise"></i> Reset Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300">High-Power Academic Labs</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">{labs} Labs</span>
              </div>
              <input type="range" min="5" max="60" value={labs} onChange={(e) => setLabs(Number(e.target.value))} className="w-full" />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>5 Labs (Eco)</span>
                <span>60 Labs (Max)</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300">HVAC Operation Duration</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">{hvac} Hours/day</span>
              </div>
              <input type="range" min="2" max="16" value={hvac} onChange={(e) => setHvac(Number(e.target.value))} className="w-full" />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>2 Hrs (Savings)</span>
                <span>16 Hrs (Heavy)</span>
              </div>
            </div>

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
