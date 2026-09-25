import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Leaf,
  Info,
  TrendingDown,
  Zap,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Cpu,
  Globe2,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";

function InfoCard({ icon, title, shortText, details, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="about-glass-card h-full rounded-3xl overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center gap-4 p-6 text-left bg-transparent border-0 cursor-pointer"
      >
        <div className="w-12 h-12 shrink-0 rounded-2xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center about-icon-glow">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold about-title mb-1">{title}</h3>
          <p className="text-sm about-muted m-0">{shortText}</p>
        </div>
        <span className="about-chip-btn w-9 h-9 shrink-0 rounded-xl text-[#10B981] flex items-center justify-center">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-0 border-t border-white/10 dark:border-[#1f3d34]">
              <div className="pt-4 text-sm leading-relaxed about-muted">
                {details}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const pillars = [
  {
    icon: <ShieldCheck size={26} />,
    title: "Transparent Science",
    text: "Calculations follow IPCC and EPA greenhouse gas factors for reliable footprint metrics.",
  },
  {
    icon: <Cpu size={26} />,
    title: "Intelligent Analytics",
    text: "Live feedback shows how small behavior changes translate into kilograms of CO₂ avoided.",
  },
  {
    icon: <Globe2 size={26} />,
    title: "Community Driven",
    text: "Built by CSE undergraduates putting youth innovation at the center of stewardship.",
  },
];

export default function About() {
  return (
    <div className="page about-page about-atmosphere min-h-screen font-sans">
      <div className="about-atmosphere-glow about-glow-one" aria-hidden="true" />
      <div className="about-atmosphere-glow about-glow-two" aria-hidden="true" />

      {/* Hero */}
      <section className="relative z-10 pt-28 pb-12 px-6 text-center">
        <ScrollReveal variant="fadeUp" delay={0.05} duration={0.65}>
          <div className="about-chip inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6">
            <BookOpen size={13} className="text-[#10B981]" />
            <span className="text-xs font-semibold">
              Mission & Technology Vision
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 about-title">
            About <span className="about-title-accent">EcoPulse</span>
          </h1>
          <p className="text-base md:text-lg about-muted max-w-2xl mx-auto leading-relaxed">
            Discover the purpose, technology foundation, and long-term vision behind EcoPulse —
            an initiative born from computer science engineering research.
          </p>
        </ScrollReveal>
      </section>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pb-24 space-y-20">
        {/* Core identity */}
        <section>
          <ScrollReveal variant="fadeUp" delay={0.05} duration={0.6}>
            <div className="max-w-2xl mb-10">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#10B981] uppercase mb-3">Our Core Identity</p>
              <h2 className="text-3xl md:text-4xl font-extrabold about-title tracking-tight mb-3">
                Technology for a greener future
              </h2>
              <p className="about-muted leading-relaxed">
                EcoPulse turns abstract climate metrics into intuitive, actionable visualizations.
                Expand any card to explore the platform principles and roadmap.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ScrollReveal variant="fadeUp" delay={0.05} duration={0.55} className="h-full">
              <InfoCard
                icon={<Leaf size={22} />}
                title="What is EcoPulse?"
                shortText="A smart platform for carbon awareness."
                defaultOpen
                details={
                  <p className="m-0">
                    EcoPulse helps individuals, students, and institutions understand their carbon
                    footprint. It aggregates transportation, energy, and lifestyle inputs into an
                    accessible interface with clear campus-level insights.
                  </p>
                }
              />
            </ScrollReveal>
            <ScrollReveal variant="fadeUp" delay={0.1} duration={0.55} className="h-full">
              <InfoCard
                icon={<Info size={22} />}
                title="Our Mission"
                shortText="Making sustainability easier to understand."
                defaultOpen
                details={
                  <p className="m-0">
                    We democratize carbon literacy with benchmarks, scores, and actionable levers —
                    so anyone can make meaningful daily reductions without complex spreadsheets.
                  </p>
                }
              />
            </ScrollReveal>
            <ScrollReveal variant="fadeUp" delay={0.05} duration={0.55} className="h-full">
              <InfoCard
                icon={<TrendingDown size={22} />}
                title="Our Vision"
                shortText="A future with lower environmental impact."
                details={
                  <p className="m-0">
                    Climate-conscious decisions should feel natural in everyday tools. EcoPulse aims
                    to power campus and community sustainability campaigns with data-backed engagement.
                  </p>
                }
              />
            </ScrollReveal>
            <ScrollReveal variant="fadeUp" delay={0.1} duration={0.55} className="h-full">
              <InfoCard
                icon={<Zap size={22} />}
                title="Future of EcoPulse"
                shortText="AI-powered sustainability intelligence."
                details={
                  <p className="m-0">
                    Roadmap items include AI emission forecasts, IoT energy streams, reduction
                    milestones, and gamified community leaderboards.
                  </p>
                }
              />
            </ScrollReveal>
          </div>
        </section>

        {/* Pillars */}
        <section>
          <ScrollReveal variant="fadeUp" delay={0.05} duration={0.6}>
            <div className="text-center max-w-2xl mx-auto mb-10">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#10B981] uppercase mb-3">How We Operate</p>
              <h2 className="text-3xl md:text-4xl font-extrabold about-title tracking-tight">
                Built on Three Foundational Pillars
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {pillars.map((p, i) => (
              <ScrollReveal key={p.title} variant="fadeUp" delay={0.05 + i * 0.08} duration={0.55} className="h-full">
                <div className="about-glass-card h-full rounded-3xl p-8 text-center">
                  <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center about-icon-glow">
                    {p.icon}
                  </div>
                  <h3 className="text-xl font-bold about-title mb-3">{p.title}</h3>
                  <p className="text-sm leading-relaxed about-muted m-0">{p.text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* CTA */}
        <ScrollReveal variant="fadeUp" delay={0.08} duration={0.6}>
          <div className="about-cta-panel rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <h3 className="text-2xl font-bold about-title mb-2">
                Ready to calculate your real footprint?
              </h3>
              <p className="text-sm about-muted m-0 leading-relaxed">
                Jump into the interactive campus carbon estimator and see how operations score.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                to="/audit"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-sm no-underline transition-colors"
              >
                Start Calculation <ArrowRight size={16} />
              </Link>
              <Link
                to="/team"
                className="about-secondary-btn inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm no-underline transition-colors"
              >
                Meet the Founders
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </main>
    </div>
  );
}
