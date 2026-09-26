import { useRef } from "react";
import { Link } from "react-router-dom";
import ScrollReveal from "../components/ScrollReveal";

export default function Home() {
  const glanceRef = useRef(null);

  const scrollGlance = (dir) => {
    const el = glanceRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 340, behavior: "smooth" });
  };

  return (
    <div className="page home-page home-atmosphere min-h-screen antialiased font-sans overflow-hidden">
      <div className="home-atmosphere-glow home-glow-one" aria-hidden="true" />
      <div className="home-atmosphere-glow home-glow-two" aria-hidden="true" />
      <div className="home-atmosphere-glow home-glow-three" aria-hidden="true" />
      
      {/* 1. Hero Section (Parallax Canvas) */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 overflow-hidden z-10">
        {/* Background Images for Light and Dark Modes */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 pointer-events-none z-0 dark:hidden"
          style={{ backgroundImage: "url('/hero-bg-light.png')" }}
        ></div>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 pointer-events-none z-0 hidden dark:block"
          style={{ backgroundImage: "url('/hero-bg-dark.png')" }}
        ></div>

        <ScrollReveal variant="fadeUp" delay={0.1} duration={0.8}>
          <div className="text-center max-w-4xl mx-auto space-y-8 relative z-10">
            <div className="inline-flex flex-col items-center justify-center space-y-4">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#059669] dark:text-[#55f0b5]">Campus Sustainability Overview</span>
              <div className="home-chip inline-flex items-center gap-2 px-4 py-1.5 rounded-full">
                <span className="text-xs font-semibold">Sustainable Campus Initiative</span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1] home-title">
              A Smarter Campus <br />
              <span className="home-title-accent italic inline-block pr-2">Starts With Better</span>
              <br />
              <span className="home-title-accent italic inline-block pr-2">Data.</span>
            </h1>
            
            <p className="text-lg md:text-xl home-muted leading-relaxed max-w-2xl mx-auto font-medium">
              Monitor energy, infrastructure, transportation, waste, and carbon performance from one centralized platform.
            </p>
            
            <div className="pt-8">
              <div className="home-chip inline-flex items-center gap-3 px-5 py-2.5 rounded-full shadow-md hover:shadow-lg transition-shadow">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#059669] dark:bg-[#10B981]"></span>
                </span>
                <span className="text-sm font-bold tracking-wide">Campus Systems Online</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <main className="relative z-10 max-w-[1400px] mx-auto px-6 pb-32 space-y-32">
        
        {/* 2. Key Statistics (Hover-Expand Stat Tiles) */}
        <section>
          <ScrollReveal variant="fadeUp" delay={0.2} duration={0.8}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Campus Carbon Footprint", value: "2,688", suffix: " tCO₂e / year", trend: "↓ 3.8% vs previous yr", trendColor: "text-[#059669] dark:text-[#10B981]" },
                { title: "Renewable Energy", value: "75%", suffix: "", trend: "of total energy usage", trendColor: "home-muted" },
                { title: "Campus Population", value: "4,180", suffix: "", trend: "Students & Staff", trendColor: "home-muted" },
                { title: "Green Audit Score", value: "86.5", suffix: " / 100", trend: "↑ 6.3% improvement", trendColor: "text-[#059669] dark:text-[#10B981]" }
              ].map((stat, i) => (
                <div key={i} className="group relative home-glass-card rounded-3xl p-8 border border-[#E2E8F0] dark:border-[#2C2E33] shadow-sm overflow-hidden cursor-default hover:-translate-y-2 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <h3 className="text-sm font-semibold home-muted mb-4">{stat.title}</h3>
                    <div className="text-4xl font-black home-title mb-2 tracking-tight">
                      {stat.value}<span className="text-lg font-medium home-muted">{stat.suffix}</span>
                    </div>
                    <div className={`text-xs font-bold tracking-wide ${stat.trendColor}`}>{stat.trend}</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </section>

        {/* 3. Campus at a Glance (Horizontal Cards Reel) */}
        <section className="space-y-10 relative">
          <ScrollReveal variant="fadeRight" delay={0.1} duration={0.6}>
            <div className="flex items-center justify-between">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] dark:text-white tracking-tight">Campus at a Glance</h2>
              <div className="hidden md:flex gap-2">
                <button type="button" onClick={() => scrollGlance(-1)} className="w-10 h-10 rounded-full border border-[#E2E8F0] dark:border-[#2C2E33] flex items-center justify-center text-[#0F172A] dark:text-white hover:bg-white dark:hover:bg-[#1E2025] transition-colors" aria-label="Scroll cards left"><i className="ph ph-arrow-left"></i></button>
                <button type="button" onClick={() => scrollGlance(1)} className="w-10 h-10 rounded-full border border-[#E2E8F0] dark:border-[#2C2E33] flex items-center justify-center text-[#0F172A] dark:text-white hover:bg-white dark:hover:bg-[#1E2025] transition-colors" aria-label="Scroll cards right"><i className="ph ph-arrow-right"></i></button>
              </div>
            </div>
          </ScrollReveal>
          
          <ScrollReveal variant="fadeLeft" delay={0.2} duration={0.8}>
            <div ref={glanceRef} className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {[
                { title: "Academic & Labs", badge: "24 High-Power Labs", desc: "Computer centers, research laboratories and department HVAC systems.", status: "Operational", color: "emerald" },
                { title: "Hostels & Quarters", badge: "1,200 Residents", desc: "Residential facilities, electricity consumption and solar water heating.", status: "Solar Water Heating: 75%", color: "indigo" },
                { title: "Transportation", badge: "12 Buses", desc: "University transit routes and vehicle fleet monitoring.", status: "Clean Fleet: 25%", color: "emerald" },
                { title: "Energy & Solar", badge: "51,000 kWh / month", desc: "Grid consumption, rooftop solar generation and backup DG systems.", status: "Solar Capacity: 200 kWp", color: "indigo" },
                { title: "Mess & Dining", badge: "3,200 Meals / day", desc: "Food consumption, organic waste generation and campus waste treatment.", status: "Biogas Plant: Operational", color: "emerald" }
              ].map((card, i) => (
                <div key={i} className="snap-start shrink-0 w-[300px] md:w-[380px] h-[320px] home-glass-card rounded-3xl p-8 border border-[#E2E8F0] dark:border-[#2C2E33] flex flex-col justify-between group hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                  <div className="absolute -right-20 -top-20 w-48 h-48 bg-[#4F46E5]/5 dark:bg-[#6366F1]/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="relative z-10">
                    <span className="inline-block px-3 py-1 rounded-full bg-[#F7F8FA] dark:bg-[#141518] text-[#4F46E5] dark:text-[#6366F1] text-xs font-bold mb-6 border border-[#E2E8F0] dark:border-[#2C2E33]">
                      {card.badge}
                    </span>
                    <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-4 leading-tight">{card.title}</h3>
                    <p className="text-sm text-[#0F172A]/70 dark:text-[#F1F5F9]/70 leading-relaxed font-medium">{card.desc}</p>
                  </div>
                  <div className="relative z-10 pt-6 mt-auto border-t border-[#E2E8F0] dark:border-[#2C2E33]">
                    <div className={`text-xs font-bold tracking-wide flex items-center gap-2 ${card.color === 'emerald' ? 'text-[#059669] dark:text-[#10B981]' : 'text-[#4F46E5] dark:text-[#6366F1]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${card.color === 'emerald' ? 'bg-[#059669] dark:bg-[#10B981]' : 'bg-[#4F46E5] dark:bg-[#6366F1]'}`}></span>
                      {card.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </section>

        {/* 4. Split Dashboard (Today's Status & Needs Attention) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ScrollReveal variant="fadeRight" delay={0.1} duration={0.8}>
            <div className="home-glass-card rounded-3xl p-8 md:p-12 border border-[#E2E8F0] dark:border-[#2C2E33] shadow-sm h-full flex flex-col">
              <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-8 flex items-center justify-between">
                Today's Campus Status
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#059669] dark:bg-[#10B981]"></span>
                </span>
              </h2>
              <div className="space-y-8 flex-1">
                {[
                  { label: "Solar Generation", value: "380 kW", desc: "Current rooftop solar generation.", status: "Generating", color: "text-[#059669] dark:text-[#10B981]" },
                  { label: "Grid Demand", value: "620 kW", desc: "Current electrical demand across campus.", status: "Monitoring", color: "text-[#4F46E5] dark:text-[#6366F1]" },
                  { label: "Waste Processing", value: "2.8 tons / day", desc: "Organic and dining waste currently being processed.", status: "Operational", color: "text-[#059669] dark:text-[#10B981]" }
                ].map((item, i) => (
                  <div key={i} className="group cursor-default">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="text-lg font-bold text-[#0F172A] dark:text-white group-hover:text-[#4F46E5] dark:group-hover:text-[#6366F1] transition-colors">{item.label}</h4>
                      <span className="text-xl font-black text-[#0F172A] dark:text-white">{item.value}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm text-[#0F172A]/60 dark:text-[#F1F5F9]/60 font-medium">{item.desc}</p>
                      <span className={`text-[10px] uppercase tracking-widest font-bold ${item.color}`}>● {item.status}</span>
                    </div>
                    {i !== 2 && <div className="h-px w-full bg-[#E2E8F0] dark:bg-[#2C2E33] mt-8"></div>}
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-[#E2E8F0] dark:border-[#2C2E33]">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#059669]/10 dark:bg-[#10B981]/10 text-[#059669] dark:text-[#10B981] text-sm font-bold w-full justify-center">
                  12 / 12 Systems Online
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fadeLeft" delay={0.2} duration={0.8}>
            <div className="home-glass-card rounded-3xl p-8 md:p-12 border border-[#E2E8F0] dark:border-[#2C2E33] shadow-sm h-full flex flex-col">
              <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-8">Needs Attention</h2>
              <div className="space-y-6 flex-1 flex flex-col justify-center">
                {[
                  { icon: "🔴", title: "Grid demand above normal range", desc: "Current demand is higher than the weekly average." },
                  { icon: "🟠", title: "Infrastructure data requires review", desc: "2 infrastructure records need verification." },
                  { icon: "🟡", title: "Solar generation below expected output", desc: "Current generation is below today's expected level." },
                  { icon: "🔵", title: "Telemetry synchronized", desc: "Latest campus data has been successfully updated." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-5 p-4 rounded-2xl hover:bg-[#F7F8FA] dark:hover:bg-[#141518] transition-colors border border-transparent hover:border-[#E2E8F0] dark:hover:border-[#2C2E33]">
                    <span className="text-2xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <h4 className="text-base font-bold text-[#0F172A] dark:text-white">{item.title}</h4>
                      <p className="text-sm text-[#0F172A]/60 dark:text-[#F1F5F9]/60 font-medium mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* 5. Sustainability Progress (Scroll Progress Fill) */}
        <ScrollReveal variant="fadeUp" delay={0.1} duration={0.8}>
          <section className="home-glass-card rounded-3xl p-8 md:p-16 border border-[#E2E8F0] dark:border-[#2C2E33] shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-[#4F46E5]/5 to-transparent dark:from-[#6366F1]/5 pointer-events-none"></div>
            <div className="w-full">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] dark:text-white tracking-tight mb-4">Sustainability Progress 2025–2030</h2>
              <p className="text-lg text-[#0F172A]/70 dark:text-[#F1F5F9]/70 font-medium mb-12">Track progress toward a more efficient and sustainable campus.</p>
              
              <div className="space-y-8">
                {[
                  { label: "Energy Efficiency", val: 40 },
                  { label: "Solar Expansion", val: 60 },
                  { label: "Clean Transportation", val: 35 },
                  { label: "Waste Diversion", val: 50 },
                  { label: "Net-Zero Readiness", val: 28 }
                ].map((prog, i) => (
                  <div key={i} className="group">
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-wider">{prog.label}</span>
                      <span className="text-xl font-black text-[#4F46E5] dark:text-[#6366F1]">{prog.val}%</span>
                    </div>
                    <div className="w-full bg-[#E2E8F0] dark:bg-[#141518] rounded-full h-4 border border-[#CBD5E1] dark:border-[#2C2E33] overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-[#4F46E5] to-[#059669] dark:from-[#6366F1] dark:to-[#10B981] rounded-full transition-all duration-1500 ease-out group-hover:brightness-125 relative" style={{ width: `${prog.val}%` }}>
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* 6. Campus Highlights (Scatter Collage) & 7. Carbon Performance */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-16 xl:gap-8 items-center">
          
          {/* Highlights Stack */}
          <ScrollReveal variant="fadeRight" delay={0.1} duration={0.8}>
            <div className="relative h-[600px] w-full flex items-center justify-center">
              <div className="absolute inset-0 bg-[#059669]/5 dark:bg-[#10B981]/5 rounded-[3rem] -rotate-3 scale-95 border border-[#059669]/10 dark:border-[#10B981]/10"></div>
              <div className="absolute inset-0 bg-[#4F46E5]/5 dark:bg-[#6366F1]/5 rounded-[3rem] rotate-3 scale-95 border border-[#4F46E5]/10 dark:border-[#6366F1]/10"></div>
              
              <div className="relative z-10 w-full max-w-lg space-y-4">
                <h3 className="text-3xl font-extrabold text-[#0F172A] dark:text-white mb-8 text-center">Campus Highlights</h3>
                
                {[
                  { icon: "☀️", title: "200 kWp Rooftop Solar", desc: "Clean-energy generation supporting academic and residential facilities.", rotate: "-rotate-2", translate: "-translate-x-4" },
                  { icon: "♻️", title: "Operational Biogas Plant", desc: "Organic food waste is processed through the campus biogas system.", rotate: "rotate-1", translate: "translate-x-2" },
                  { icon: "🚌", title: "25% Clean Transport Fleet", desc: "A portion of the transportation fleet currently uses cleaner fuel alternatives.", rotate: "-rotate-1", translate: "-translate-x-2" },
                  { icon: "⚡", title: "Smart Energy Monitoring", desc: "Monthly electricity consumption is continuously monitored across campus systems.", rotate: "rotate-2", translate: "translate-x-4" },
                  { icon: "🌱", title: "Plantation Offset", desc: "Campus plantation contributes toward reducing the overall carbon footprint.", rotate: "rotate-0", translate: "translate-x-0" }
                ].map((item, i) => (
                  <div key={i} className={`home-glass-card p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#2C2E33] shadow-lg flex items-start gap-4 transition-transform duration-300 hover:scale-[1.02] hover:z-20 relative cursor-default ${item.rotate} ${item.translate}`}>
                    <span className="text-3xl bg-[#F7F8FA] dark:bg-[#141518] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#2C2E33]">{item.icon}</span>
                    <div>
                      <h4 className="font-bold text-[#0F172A] dark:text-white text-base">{item.title}</h4>
                      <p className="text-sm text-[#0F172A]/70 dark:text-[#F1F5F9]/70 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Carbon Performance Banner */}
          <ScrollReveal variant="fadeLeft" delay={0.2} duration={0.8}>
            <div className="bg-[#0F172A] dark:bg-[#1A1C23] rounded-[3rem] p-10 md:p-14 border border-[#1E293B] dark:border-[#2C2E33] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#059669]/20 rounded-full blur-[80px]"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4F46E5]/20 rounded-full blur-[80px]"></div>
              
              <div className="relative z-10">
                <h2 className="text-4xl font-extrabold mb-4 text-white" style={{ color: 'white' }}>Campus Carbon Performance</h2>
                <p className="text-lg text-slate-300 font-medium mb-12 leading-relaxed" style={{ color: '#cbd5e1' }}>
                  EcoPulse combines infrastructure, energy, transportation, and waste data to provide a unified view of campus environmental performance.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Emissions</div>
                    <div className="text-3xl md:text-4xl font-black text-white">2,688 <span className="text-xl text-slate-400 font-medium">tCO₂e / yr</span></div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Per-Capita Intensity</div>
                    <div className="text-3xl md:text-4xl font-black text-white">597 <span className="text-xl text-slate-400 font-medium">kg / student</span></div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#10B981] uppercase tracking-widest mb-2">Solar Renewable Offset</div>
                    <div className="text-3xl md:text-4xl font-black text-[#10B981]">−199 <span className="text-xl opacity-70 font-medium">tCO₂e</span></div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#10B981] uppercase tracking-widest mb-2">Plantation Offset</div>
                    <div className="text-3xl md:text-4xl font-black text-[#10B981]">−28 <span className="text-xl opacity-70 font-medium">tCO₂e</span></div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* 8. Explore EcoPulse & 10. Recent Activity */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Explore Nav Dock */}
          <ScrollReveal variant="fadeUp" delay={0.1} duration={0.8} className="lg:col-span-3">
            <div className="home-glass-card rounded-3xl p-8 md:p-12 border border-[#E2E8F0] dark:border-[#2C2E33] shadow-sm h-full">
              <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-8">Explore EcoPulse</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { to: "/calculator", title: "Audit", desc: "Calculate Campus Emissions" },
                  { to: "/dashboard", title: "Dashboard", desc: "Explore Campus Analytics" },
                  { to: "/predictions", title: "Predictions", desc: "Forecast Future Emissions" },
                  { to: "/settings", title: "Settings", desc: "Manage Campus Data" }
                ].map((nav, i) => (
                  <Link key={i} to={nav.to} className="group block p-6 rounded-2xl bg-[#F7F8FA] dark:bg-[#141518] border border-[#E2E8F0] dark:border-[#2C2E33] hover:border-[#4F46E5] dark:hover:border-[#6366F1] hover:shadow-md transition-all no-underline">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-lg font-bold text-[#0F172A] dark:text-white group-hover:text-[#4F46E5] dark:group-hover:text-[#6366F1] transition-colors no-underline">{nav.title}</h4>
                      <i className="ph ph-arrow-up-right text-xl text-[#0F172A]/30 dark:text-[#F1F5F9]/30 group-hover:text-[#4F46E5] dark:group-hover:text-[#6366F1] transition-colors no-underline"></i>
                    </div>
                    <p className="text-sm text-[#0F172A]/70 dark:text-[#F1F5F9]/70 font-medium no-underline">{nav.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Recent Activity Feed */}
          <ScrollReveal variant="fadeUp" delay={0.2} duration={0.8} className="lg:col-span-2">
            <div className="home-glass-card rounded-3xl p-8 md:p-12 border border-[#E2E8F0] dark:border-[#2C2E33] shadow-sm h-full">
              <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-8 flex items-center justify-between">
                Recent Activity
                <i className="ph ph-clock-counter-clockwise text-xl text-[#0F172A]/40 dark:text-[#F1F5F9]/40"></i>
              </h2>
              <div className="relative border-l-2 border-[#E2E8F0] dark:border-[#2C2E33] ml-2 space-y-8">
                {[
                  { title: "Infrastructure", desc: "Academic facility parameters updated." },
                  { title: "Solar", desc: "Latest solar generation data synchronized." },
                  { title: "Mess & Waste", desc: "Waste-processing records updated." },
                  { title: "Transportation", desc: "Fleet information synchronized." },
                  { title: "Carbon Model", desc: "Emission-factor database updated." }
                ].map((act, i) => (
                  <div key={i} className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-[#4F46E5] dark:bg-[#6366F1] rounded-full -left-[7.5px] top-1.5 shadow-[0_0_0_4px_#F7F8FA] dark:shadow-[0_0_0_4px_#141518]"></div>
                    <div className="text-sm font-bold text-[#0F172A] dark:text-white mb-0.5">{act.title}</div>
                    <div className="text-xs font-medium text-[#0F172A]/60 dark:text-[#F1F5F9]/60">{act.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

        </section>

      </main>
    </div>
  );
}
