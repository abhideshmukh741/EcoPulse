import { Link } from "react-router-dom";
import {
  GraduationCap,
  Code2,
  Sparkles,
  ArrowRight,
  Heart,
} from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";

import yashPhoto from "../assets/yash.jpeg";
import GayatriPhoto from "../assets/Gayatri.jpeg";
import AbhinavPhoto from "../assets/Abhinav.jpeg";

const teamMembers = [
  {
    name: "Yash Chavhan",
    role: "Founder",
    qualification: "Final-Year B.Tech CSE Student",
    photo: yashPhoto,
    focus: "System Architecture & Carbon Intelligence",
    bio: "Leads technical strategy and algorithm modeling, converting real-world emission standards into computational models.",
  },
  {
    name: "Abhinav Deshmukh",
    role: "Founder",
    qualification: "Final-Year B.Tech CSE Student",
    photo: AbhinavPhoto,
    focus: "Full-Stack Web Development & Platform Logic",
    bio: "Engineers frontend interfaces and client-side reactivity for a seamless, high-performance user experience.",
  },
  {
    name: "Gayatri Dixit",
    role: "Founder",
    qualification: "Final-Year B.Tech CSE Student",
    photo: GayatriPhoto,
    focus: "User Experience Design & Climate Analytics",
    bio: "Specializes in interface usability, accessible visualizations, and carbon literacy outreach across campuses.",
  },
];

export default function Team() {
  return (
    <div className="page team-page team-atmosphere min-h-screen font-sans">
      <div className="team-atmosphere-glow team-glow-one" aria-hidden="true" />
      <div className="team-atmosphere-glow team-glow-two" aria-hidden="true" />
      <div className="team-atmosphere-glow team-glow-three" aria-hidden="true" />

      {/* Hero */}
      <section className="relative z-10 pt-28 pb-12 px-6 text-center">
        <ScrollReveal variant="fadeUp" delay={0.05} duration={0.65}>
          <div className="about-chip inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6">
            <GraduationCap size={13} className="text-[#10B981]" />
            <span className="text-xs font-semibold">
              Student Engineering Initiative
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 about-title">
            Meet Our <span className="about-title-accent">Team</span>
          </h1>
          <p className="text-base md:text-lg about-muted max-w-2xl mx-auto leading-relaxed">
            A team of B.Tech Computer Science students combining modern web technology
            with meaningful environmental stewardship.
          </p>
        </ScrollReveal>
      </section>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pb-24 space-y-20">
        {/* Founders */}
        <section>
          <ScrollReveal variant="fadeUp" delay={0.05} duration={0.6}>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#10B981] uppercase mb-3">
                The People Behind EcoPulse
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold about-title tracking-tight mb-3">
                Passionate Minds, <span className="about-title-accent">Greener Planet</span>
              </h2>
              <p className="about-muted leading-relaxed">
                Developed as a collaborative final-year engineering initiative, EcoPulse
                applies software craft to campus sustainability.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {teamMembers.map((member, i) => (
              <ScrollReveal
                key={member.name}
                variant="fadeUp"
                delay={0.05 + i * 0.08}
                duration={0.55}
                className="h-full"
              >
                <article className="founder-glass-card h-full flex flex-col rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1">
                  <div className="founder-photo-ring w-36 h-36 mx-auto mb-6 rounded-full overflow-hidden">
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-full h-full object-cover object-top block"
                    />
                  </div>

                  <h3 className="text-xl font-bold about-title text-center mb-2">
                    {member.name}
                  </h3>

                  <div className="flex justify-center mb-3">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold text-[#53eeb4] bg-[rgba(32,220,160,0.1)] border border-[rgba(32,220,160,0.25)]">
                      {member.role}
                    </span>
                  </div>

                  <p className="text-sm text-center about-muted mb-4">
                    {member.qualification}
                  </p>

                  <p className="text-xs font-semibold about-title mb-2 text-center">
                    Focus: <span className="font-medium text-[#20dca0]">{member.focus}</span>
                  </p>

                  <p className="text-sm leading-relaxed about-muted text-center m-0 mt-auto">
                    {member.bio}
                  </p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* Journey */}
        <ScrollReveal variant="fadeUp" delay={0.08} duration={0.6}>
          <div className="about-glass-card rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start">
            <div className="w-16 h-16 shrink-0 rounded-2xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center about-icon-glow">
              <Code2 size={28} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#10B981] uppercase mb-2">Our Journey</p>
              <h3 className="text-2xl md:text-3xl font-bold about-title mb-4">
                From Classroom Theory to Real-World Impact
              </h3>
              <p className="text-sm leading-relaxed about-muted mb-4">
                As final-year Computer Science students, we saw how inaccessible climate data
                can feel. Spreadsheets rarely motivate change.
              </p>
              <p className="text-sm leading-relaxed about-muted mb-6">
                EcoPulse was built to remove that friction — fast interfaces, clear telemetry,
                and interactive calculators that make carbon awareness practical for campuses.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="about-chip inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold">
                  <Heart size={13} className="text-[#F43F5E]" /> Built with Dedication
                </span>
                <span className="about-chip inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold">
                  <Sparkles size={13} className="text-[#F59E0B]" /> Open Source Spirit
                </span>
                <span className="about-chip inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold">
                  <GraduationCap size={13} className="text-[#10B981]" /> B.Tech Class of 2026
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* CTA */}
        <ScrollReveal variant="fadeUp" delay={0.08} duration={0.6}>
          <div className="about-cta-panel rounded-[2rem] p-8 md:p-10 text-center">
            <h3 className="text-2xl font-bold about-title mb-2">
              Test the Platform Created by the Team
            </h3>
            <p className="text-sm about-muted mb-6 max-w-lg mx-auto">
              Explore your campus environmental score and start reducing today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                to="/audit"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-sm no-underline transition-colors"
              >
                Compute My Footprint <ArrowRight size={16} />
              </Link>
              <Link
                to="/dashboard"
                className="about-secondary-btn inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm no-underline transition-colors"
              >
                Explore Dashboard
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </main>
    </div>
  );
}
