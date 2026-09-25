import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import ScrollReveal from "../components/ScrollReveal";
import { apiFetch } from "../lib/api";
import {
  Building2, Zap, Bus, Bed, Utensils, RotateCcw,
  CheckCircle2, Sparkles, ArrowRight, ShieldCheck, Sun, FileCheck, Leaf,
} from "lucide-react";

const CAMPUS_POPULATION = 4180;

export default function Calculator() {
  const [labCount, setLabCount] = useState(24);
  const [hvacHours, setHvacHours] = useState(8);
  const [hasServerRoom, setHasServerRoom] = useState(true);
  const [hostelResidents, setHostelResidents] = useState(1200);
  const [solarWaterHeaterShare, setSolarWaterHeaterShare] = useState(75);
  const [busCount, setBusCount] = useState(12);
  const [busDailyKm, setBusDailyKm] = useState(45);
  const [cleanFleetShare, setCleanFleetShare] = useState(25);
  const [gridMonthlyKwh, setGridMonthlyKwh] = useState(51000);
  const [solarKwp, setSolarKwp] = useState(200);
  const [dgRunHours, setDgRunHours] = useState(8);
  const [dailyMeals, setDailyMeals] = useState(3200);
  const [hasBiogasPlant, setHasBiogasPlant] = useState("yes");
  const [savedNotice, setSavedNotice] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const auditResult = useMemo(() => {
    const labBaseAnnualKwh = labCount * 300 * 250;
    const hvacAnnualKwh = labCount * hvacHours * 18 * 220;
    const serverKwh = hasServerRoom ? 45000 : 8000;
    const academicTons = ((labBaseAnnualKwh + hvacAnnualKwh + serverKwh) * 0.72) / 1000;
    const residentAnnualKwh = hostelResidents * 1.8 * 300;
    const waterHeatingTons = ((100 - solarWaterHeaterShare) / 100) * hostelResidents * 0.045;
    const hostelTons = (residentAnnualKwh * 0.72) / 1000 + waterHeatingTons;
    const annualBusKm = busCount * busDailyKm * 240;
    const dieselKm = annualBusKm * ((100 - cleanFleetShare) / 100);
    const cleanKm = annualBusKm * (cleanFleetShare / 100);
    const fleetTons = (dieselKm * 0.88 + cleanKm * 0.28) / 1000;
    const annualGridKwh = gridMonthlyKwh * 12;
    const annualSolarGeneratedKwh = solarKwp * 1380;
    const solarOffsetTons = (annualSolarGeneratedKwh * 0.72) / 1000;
    const dgAnnualTons = (dgRunHours * 12 * 68) / 1000;
    let wasteFactor = 0.045;
    if (hasBiogasPlant === "yes") wasteFactor = 0.018;
    else if (hasBiogasPlant === "partial") wasteFactor = 0.032;
    const messTons = (dailyMeals * 300 * wasteFactor) / 1000;
    const treeOffsetTons = 28;
    // Grid is the Scope-2 meter total; academic/hostel kWh are attributional shares for UI only
    const gridTons = (annualGridKwh * 0.72) / 1000;
    const grossEmissions = fleetTons + gridTons + dgAnnualTons + messTons + waterHeatingTons;
    const netEmissions = Math.max(150, grossEmissions - solarOffsetTons - treeOffsetTons);
    const perCapitaKg = Math.round((netEmissions * 1000) / CAMPUS_POPULATION);
    let naacScore = Math.round(100 - (netEmissions / 1500) * 45);
    if (solarKwp >= 180) naacScore += 6;
    if (hasBiogasPlant === "yes") naacScore += 4;
    naacScore = Math.max(50, Math.min(96, naacScore));
    let naacGrade = "A";
    if (naacScore < 70) naacGrade = "B";
    else if (naacScore >= 88) naacGrade = "A+";
    return {
      netTons: Math.round(netEmissions),
      grossTons: Math.round(grossEmissions),
      solarOffsetTons: Math.round(solarOffsetTons),
      treeOffsetTons,
      perCapitaKg,
      naacScore,
      naacGrade,
      breakdown: {
        academic: Math.round(academicTons),
        hostel: Math.round(hostelTons),
        fleet: Math.round(fleetTons),
        grid: Math.round(gridTons),
        dg: Math.round(dgAnnualTons),
        mess: Math.round(messTons),
      },
    };
  }, [labCount, hvacHours, hasServerRoom, hostelResidents, solarWaterHeaterShare, busCount, busDailyKm, cleanFleetShare, gridMonthlyKwh, solarKwp, dgRunHours, dailyMeals, hasBiogasPlant]);

  const handleReset = () => {
    setLabCount(24); setHvacHours(8); setHasServerRoom(true);
    setHostelResidents(1200); setSolarWaterHeaterShare(75);
    setBusCount(12); setBusDailyKm(45); setCleanFleetShare(25);
    setGridMonthlyKwh(51000); setSolarKwp(200); setDgRunHours(8);
    setDailyMeals(3200); setHasBiogasPlant("yes");
    setSavedNotice(false); setSaveError("");
  };

  const handleSaveAudit = async () => {
    setIsSaving(true);
    setSaveError("");
    setSavedNotice(false);
    const payload = {
      lab_count: labCount,
      hvac_hours: hvacHours,
      has_server_room: hasServerRoom,
      hostel_residents: hostelResidents,
      solar_water_heater_share: solarWaterHeaterShare,
      bus_count: busCount,
      bus_daily_km: busDailyKm,
      clean_fleet_share: cleanFleetShare,
      grid_monthly_kwh: gridMonthlyKwh,
      solar_kwp: solarKwp,
      dg_run_hours: dgRunHours,
      daily_meals: dailyMeals,
      has_biogas_plant: hasBiogasPlant,
    };

    try {
      const response = await apiFetch("/api/audit/save", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      let result = auditResult;
      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          result = {
            netTons: data.result.net_tons,
            grossTons: data.result.gross_tons,
            solarOffsetTons: data.result.solar_offset_tons,
            treeOffsetTons: data.result.tree_offset_tons,
            perCapitaKg: data.result.per_capita_kg,
            naacScore: data.result.naac_score,
            naacGrade: data.result.naac_grade,
            breakdown: data.result.breakdown,
          };
        }
      } else {
        setSaveError("Backend save failed — kept a local copy only.");
      }

      localStorage.setItem("ecopulse_latest_audit", JSON.stringify({
        ...result,
        updatedAt: Date.now(),
        savedToDb: response.ok,
      }));
      window.dispatchEvent(new CustomEvent("ecopulse_data_updated", { detail: { type: "audit", data: result } }));
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3500);
    } catch {
      try {
        localStorage.setItem("ecopulse_latest_audit", JSON.stringify({
          ...auditResult,
          updatedAt: Date.now(),
          savedToDb: false,
        }));
        window.dispatchEvent(new CustomEvent("ecopulse_data_updated", { detail: { type: "audit", data: auditResult } }));
        setSaveError("API offline — saved locally only. Start the backend to sync Supabase.");
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 3500);
      } catch {
        setSaveError("Could not save audit.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ── Reusable sub-components ────────────────────────────────────────────
  const ChipBtn = ({ active, onClick, children }) => (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
        active
          ? "bg-[#10B981] text-white border-[#10B981] shadow-sm"
          : "audit-chip-surface text-[#64748B] dark:text-[#94A3B8] border-[#CBD5E1] dark:border-[#334155] hover:border-[#10B981] hover:text-[#10B981]"
      }`}>
      {children}
    </button>
  );

  const Slider = ({ label, display, min, max, step, value, onChange, bounds }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">{label}</span>
        <span className="text-sm font-black text-[#10B981]">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={onChange}
        className="w-full h-1.5 rounded-full cursor-pointer accent-[#10B981] bg-[#E2E8F0] dark:bg-[#252830]" />
      <div className="flex justify-between text-[10px] text-[#94A3B8] mt-1">
        {bounds.map((b, i) => <span key={i}>{b}</span>)}
      </div>
    </div>
  );

  const StatusBadge = ({ label, color = "green" }) => {
    const colors = {
      green: "bg-[#10B981]/10 text-[#059669] dark:text-[#10B981] border-[#10B981]/20",
      amber: "bg-[#F59E0B]/10 text-[#D97706] dark:text-[#FCD34D] border-[#F59E0B]/20",
      blue: "bg-[#3B82F6]/10 text-[#2563EB] dark:text-[#60A5FA] border-[#3B82F6]/20",
      purple: "bg-[#8B5CF6]/10 text-[#7C3AED] dark:text-[#A78BFA] border-[#8B5CF6]/20",
    };
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${colors[color]}`}>
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
          color === "green" ? "bg-[#10B981]" : color === "amber" ? "bg-[#F59E0B]" : color === "blue" ? "bg-[#3B82F6]" : "bg-[#8B5CF6]"
        }`} />
        {label}
      </div>
    );
  };

  // Card with illustration header
  const IllustCard = ({ title, subtitle, icon: Icon, img, status, statusColor, children, delay = 0, iconBg = "#10B981" }) => (
    <ScrollReveal variant="fadeUp" delay={delay} duration={0.5}>
      <div className="audit-glass-card rounded-2xl border border-[#E2E8F0] dark:border-[#2C2E33] shadow-sm overflow-hidden h-full flex flex-col">
        {/* Card header with illustration */}
        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] dark:from-[#0F2318] dark:to-[#0D1F14] flex-shrink-0">
          {img && (
            <img src={img} alt={title} className="absolute right-0 top-0 h-full w-3/5 object-cover object-left opacity-90 dark:opacity-60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-white/80 dark:from-[#1E2025]/90 to-transparent" />
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-white leading-snug max-w-[200px]">{title}</h3>
              <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 max-w-[200px] leading-tight">{subtitle}</p>
            </div>
            <StatusBadge label={status} color={statusColor} />
          </div>
        </div>
        {/* Card body */}
        <div className="p-5 flex-1">
          {children}
        </div>
      </div>
    </ScrollReveal>
  );

  const breakdownItems = [
    { label: "Grid Power (Scope 2)", val: auditResult.breakdown.grid, color: "#EF4444" },
    { label: "Fleet & Transport", val: auditResult.breakdown.fleet, color: "#F59E0B" },
    { label: "DG Generators", val: auditResult.breakdown.dg, color: "#8B5CF6" },
    { label: "Mess & Dining Waste", val: auditResult.breakdown.mess, color: "#10B981" },
  ];

  return (
    <div className="min-h-screen audit-atmosphere font-sans">
      <div className="audit-atmosphere-glow audit-glow-one" aria-hidden="true" />
      <div className="audit-atmosphere-glow audit-glow-two" aria-hidden="true" />

      {/* ── HERO ── */}
      <section className="relative z-10 pt-28 pb-8 text-center px-6">
        <ScrollReveal variant="fadeUp" delay={0.05} duration={0.6}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full audit-chip mb-5">
            <FileCheck size={13} className="text-[#10B981]" />
            <span className="text-xs font-semibold">NAAC &lsquo;A&rsquo; Grade &bull; BEE Approved ESCO</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-tight audit-title mb-3">
            Campus{" "}
            <span className="audit-title-accent">Carbon Audit</span>
          </h1>
          <p className="text-base md:text-lg audit-muted max-w-2xl mx-auto leading-relaxed">
            Configure campus infrastructure to compute verified institutional emissions in real-time.
          </p>
        </ScrollReveal>
      </section>

      {/* ── MAIN LAYOUT ── */}
      <section className="max-w-7xl mx-auto px-6 pb-24 flex flex-col xl:flex-row gap-6 items-start">

        {/* ═══ LEFT GRID ═══ */}
        <div className="flex-1 min-w-0">
          <ScrollReveal variant="fadeLeft" duration={0.4}>
            <div className="relative z-10 flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">Campus Infrastructure Inputs</h2>
              <button type="button" onClick={handleReset}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] hover:text-[#10B981] transition-colors px-3 py-1.5 rounded-full border border-[#E2E8F0] dark:border-[#2C2E33] hover:border-[#10B981]">
                <RotateCcw size={12} /> Reset Baseline
              </button>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* CARD 1 – Academic & Labs */}
            <IllustCard
              title="Academic & Laboratory Facilities"
              subtitle="Computer centers, research labs & department HVAC systems"
              icon={Building2} img="/audit-academic.jpg"
              status="Operational" statusColor="green"
              iconBg="#10B981" delay={0.05}
            >
              <Slider label="Number of High-Power Labs" display={`${labCount} Labs`}
                min={5} max={60} step={1} value={labCount} onChange={e => setLabCount(Number(e.target.value))}
                bounds={["5 Labs", "30 Labs", "60 Labs"]} />
              <Slider label="Average Daily HVAC Run-Time" display={`${hvacHours} hrs / day`}
                min={2} max={16} step={1} value={hvacHours} onChange={e => setHvacHours(Number(e.target.value))}
                bounds={["2 hrs (Energy Saver)", "16 hrs"]} />
              <div>
                <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-semibold mb-2 uppercase tracking-wider">Campus Data Center / Cloud Cluster</p>
                <div className="flex flex-wrap gap-2">
                  <ChipBtn active={hasServerRoom} onClick={() => setHasServerRoom(true)}>Dedicated HPC Server Room</ChipBtn>
                  <ChipBtn active={!hasServerRoom} onClick={() => setHasServerRoom(false)}>Cloud-Hosted</ChipBtn>
                </div>
              </div>
            </IllustCard>

            {/* CARD 2 – Power, Solar & DG */}
            <IllustCard
              title="Substation Power, Solar & DG Sets"
              subtitle="Monthly utility draw, rooftop generation & backup generators"
              icon={Zap} img="/audit-solar.jpg"
              status="Online" statusColor="amber"
              iconBg="#F59E0B" delay={0.1}
            >
              <Slider label="Monthly Grid Power Consumption" display={`${gridMonthlyKwh.toLocaleString()} kWh/month`}
                min={15000} max={150000} step={2500} value={gridMonthlyKwh} onChange={e => setGridMonthlyKwh(Number(e.target.value))}
                bounds={["15,000 kWh", "80,000 kWh", "150,000 kWh"]} />
              <div className="grid grid-cols-2 gap-4">
                <Slider label="Solar Capacity (kWp)" display={`${solarKwp} kWp`}
                  min={0} max={400} step={10} value={solarKwp} onChange={e => setSolarKwp(Number(e.target.value))}
                  bounds={["0 kWp", "400 kWp"]} />
                <Slider label="DG Run-Hours / mo" display={`${dgRunHours} hrs`}
                  min={0} max={60} step={2} value={dgRunHours} onChange={e => setDgRunHours(Number(e.target.value))}
                  bounds={["0 hrs", "60 hrs"]} />
              </div>
            </IllustCard>

            {/* CARD 3 – Hostels */}
            <IllustCard
              title="Student Hostels & Quarters"
              subtitle="Residential facilities, electricity & solar water heating"
              icon={Bed} img="/audit-hostel.jpg"
              status="Active" statusColor="blue"
              iconBg="#3B82F6" delay={0.15}
            >
              <Slider label="Hostel Residents" display={`${hostelResidents.toLocaleString()} Residents`}
                min={100} max={4000} step={100} value={hostelResidents} onChange={e => setHostelResidents(Number(e.target.value))}
                bounds={["100", "2,000", "4,000"]} />
              <Slider label="Solar Water Heater Coverage" display={`${solarWaterHeaterShare}%`}
                min={0} max={100} step={5} value={solarWaterHeaterShare} onChange={e => setSolarWaterHeaterShare(Number(e.target.value))}
                bounds={["0% (Grid-heated)", "50%", "100% Solar"]} />
            </IllustCard>

            {/* CARD 4 – Transportation */}
            <IllustCard
              title="Campus Transportation & Bus Fleet"
              subtitle="University transit routes and vehicle electrification"
              icon={Bus} img="/audit-bus.jpg"
              status="Running" statusColor="purple"
              iconBg="#8B5CF6" delay={0.2}
            >
              <div className="grid grid-cols-2 gap-4">
                <Slider label="College Buses" display={`${busCount} Buses`}
                  min={2} max={25} step={1} value={busCount} onChange={e => setBusCount(Number(e.target.value))}
                  bounds={["2", "25"]} />
                <Slider label="Avg Route (km / day)" display={`${busDailyKm} km`}
                  min={20} max={120} step={5} value={busDailyKm} onChange={e => setBusDailyKm(Number(e.target.value))}
                  bounds={["20 km", "120 km"]} />
              </div>
              <Slider label="EV / CNG Clean Fuel Proportion" display={`${cleanFleetShare}% CLV Fleet`}
                min={0} max={100} step={5} value={cleanFleetShare} onChange={e => setCleanFleetShare(Number(e.target.value))}
                bounds={["0% Diesel", "50%", "100% EV Fleet"]} />
            </IllustCard>

            {/* CARD 5 – Mess & Dining */}
            <IllustCard
              title="Mess & Dining Operations"
              subtitle="Daily meals, organic waste and biogas treatment"
              icon={Utensils} img="/audit-hostel.jpg"
              status={hasBiogasPlant === "yes" ? "Biogas Online" : "Waste Tracked"}
              statusColor="green"
              iconBg="#059669" delay={0.25}
            >
              <Slider label="Daily Meals Served" display={`${dailyMeals.toLocaleString()} meals / day`}
                min={500} max={8000} step={100} value={dailyMeals} onChange={e => setDailyMeals(Number(e.target.value))}
                bounds={["500", "3,200", "8,000"]} />
              <div>
                <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-semibold mb-2 uppercase tracking-wider">Biogas / Waste Treatment</p>
                <div className="flex flex-wrap gap-2">
                  <ChipBtn active={hasBiogasPlant === "yes"} onClick={() => setHasBiogasPlant("yes")}>Full Biogas Plant</ChipBtn>
                  <ChipBtn active={hasBiogasPlant === "partial"} onClick={() => setHasBiogasPlant("partial")}>Partial</ChipBtn>
                  <ChipBtn active={hasBiogasPlant === "none"} onClick={() => setHasBiogasPlant("none")}>None</ChipBtn>
                </div>
              </div>
            </IllustCard>

          </div>
        </div>

        {/* ═══ RIGHT SIDEBAR ═══ */}
        <ScrollReveal variant="fadeRight" duration={0.5} delay={0.1}>
          <div className="xl:w-80 shrink-0 xl:sticky xl:top-24 space-y-4">

            {/* Live Score Card */}
            <div className="audit-glass-card rounded-2xl p-5 border border-[#E2E8F0] dark:border-[#2C2E33] shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider">Live Audit Score</span>
                </div>
                <ShieldCheck size={17} className="text-[#10B981]" />
              </div>

              {/* Net emissions */}
              <div className="mb-4">
                <p className="text-[9px] font-bold tracking-[0.18em] text-[#94A3B8] uppercase mb-1">Campus Net Emissions</p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-black text-[#0F172A] dark:text-white leading-none">{auditResult.netTons.toLocaleString()}</span>
                  <span className="text-xs font-bold text-[#94A3B8]">tCO₂e / year</span>
                </div>
                <p className="text-[10px] text-[#10B981] font-bold">↓ 3.8% vs FY25</p>
              </div>

              {/* NAAC Gauge */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#141518] border border-[#E2E8F0] dark:border-[#252830] mb-4">
                <div className="relative shrink-0">
                  <svg viewBox="0 0 100 100" className="w-20 h-20 -rotate-90">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="9" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#10B981" strokeWidth="9"
                      strokeLinecap="round" strokeDasharray="239"
                      style={{ strokeDashoffset: 239 - (239 * auditResult.naacScore) / 100, transition: "stroke-dashoffset 0.7s ease" }}
                      className="drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center rotate-90">
                    <strong className="text-lg font-black text-[#0F172A] dark:text-white leading-none">{auditResult.naacGrade}</strong>
                    <span className="text-[8px] font-bold text-[#94A3B8] uppercase">{auditResult.naacScore}/100 NAAC</span>
                  </div>
                </div>
                <div>
                  <p className="text-base font-black text-[#0F172A] dark:text-white">{auditResult.naacScore}<span className="text-xs font-semibold text-[#94A3B8]">/100</span></p>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Green Audit Score</p>
                  <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">{auditResult.perCapitaKg} kg / person / year</p>
                </div>
              </div>

              {/* Offsets */}
              <div className="mb-4">
                <p className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A] dark:text-white mb-2.5">
                  <Sparkles size={12} className="text-[#10B981]" /> Offsets Breakdown
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs border-b border-[#F1F5F9] dark:border-[#252830] pb-2">
                    <span className="flex items-center gap-1.5 text-[#64748B] dark:text-[#94A3B8]">
                      <Sun size={11} className="text-[#F59E0B]" /> Solar Generation
                    </span>
                    <strong className="text-[#10B981]">-{auditResult.solarOffsetTons} T CO₂e</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-1.5 text-[#64748B] dark:text-[#94A3B8]">
                      <Leaf size={11} className="text-[#10B981]" /> Plantation Sequestration
                    </span>
                    <strong className="text-[#10B981]">-{auditResult.treeOffsetTons} T CO₂e</strong>
                  </div>
                </div>
              </div>

              {/* Emission sources bars */}
              <div className="mb-5">
                <p className="text-xs font-bold text-[#0F172A] dark:text-white mb-2.5">Emission Sources</p>
                <div className="space-y-2.5">
                  {breakdownItems.map(({ label, val, color }) => {
                    const pct = auditResult.grossTons > 0 ? Math.round((val / auditResult.grossTons) * 100) : 0;
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-[#64748B] dark:text-[#94A3B8]">{label}</span>
                          <span className="font-bold text-[#0F172A] dark:text-white">{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#E2E8F0] dark:bg-[#252830] overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button type="button" onClick={handleSaveAudit} disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm transition-all shadow-sm disabled:opacity-60">
                  <CheckCircle2 size={15} /> {isSaving ? "Saving to Database..." : "Save Audit to Database"}
                </button>
                <Link to="/dashboard"
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#2C2E33] text-[#0F172A] dark:text-[#F1F5F9] hover:border-[#10B981] text-xs font-semibold transition-all no-underline">
                  Open Live Dashboard <ArrowRight size={12} />
                </Link>
                <Link to="/predictions"
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#2C2E33] text-[#0F172A] dark:text-[#F1F5F9] hover:border-[#10B981] text-xs font-semibold transition-all no-underline">
                  Run AI Forecasting <ArrowRight size={12} />
                </Link>
              </div>

              {savedNotice && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 text-xs font-semibold text-[#059669] dark:text-[#34D399]">
                  <CheckCircle2 size={13} /> Audit saved successfully.
                </div>
              )}
              {saveError && (
                <div className="mt-3 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  {saveError}
                </div>
              )}
            </div>

          </div>
        </ScrollReveal>

      </section>
    </div>
  );
}
