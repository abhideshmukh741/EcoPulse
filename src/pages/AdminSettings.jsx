import { useState } from "react";
import { Download, Save } from "lucide-react";

const ToggleSwitch = ({ isOn, handleToggle }) => {
  return (
    <div 
      onClick={handleToggle}
      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${isOn ? 'bg-[#10b981]' : 'bg-slate-300 dark:bg-slate-600'}`}
    >
      <div 
        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isOn ? 'translate-x-5' : 'translate-x-0'}`} 
      />
    </div>
  );
};

export default function AdminSettings() {
  const [collegeName, setCollegeName] = useState("Maharashtra Institute of Technology");
  const [campusAcres, setCampusAcres] = useState("15");
  const [totalStudents, setTotalStudents] = useState("4180");
  const [naacAccreditation, setNaacAccreditation] = useState("NAAC 'A' Grade + Autonomous");
  const [saveToast, setSaveToast] = useState(false);

  const [departmentCaps, setDepartmentCaps] = useState(() => {
    try {
      const saved = localStorage.getItem("ecopulse_admin_caps");
      return saved ? JSON.parse(saved) : {
        cse: 420, aids: 310, mech: 340, civil: 180, electrical: 290, plastic: 260, agri: 210,
      };
    } catch {
      return { cse: 420, aids: 310, mech: 340, civil: 180, electrical: 290, plastic: 260, agri: 210 };
    }
  });

  const [toggles, setToggles] = useState(() => {
    try {
      const saved = localStorage.getItem("ecopulse_admin_toggles");
      return saved ? JSON.parse(saved) : {
        t1: true, t2: false, t3: false, t4: false, t5: false, t6: false, t7: false,
      };
    } catch {
      return { t1: true, t2: false, t3: false, t4: false, t5: false, t6: false, t7: false };
    }
  });

  const handleToggle = (key) => {
    setToggles((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("ecopulse_admin_toggles", JSON.stringify(next));
      return next;
    });
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const profile = { collegeName, campusAcres, totalStudents, naacAccreditation };
    localStorage.setItem("ecopulse_admin_profile", JSON.stringify(profile));
    localStorage.setItem("ecopulse_admin_caps", JSON.stringify(departmentCaps));
    localStorage.setItem("ecopulse_admin_toggles", JSON.stringify(toggles));
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  return (
    <div className="page settings-page admin-settings-page pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HEADER */}
        <div className="mb-8">
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Institutional Configuration & Governance
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Campus Admin <span className="text-[#10b981]">Settings</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Configure college profile parameters, set departmental carbon ceilings, verify NAAC compliance metrics, and export official carbon audits.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-6">
            
            {/* College Institutional Profile */}
            <div className="bg-white dark:bg-[#232936] rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">College Institutional Profile</h3>
              
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">College/University Name:</label>
                    <input
                      type="text"
                      className="px-3 py-2 bg-transparent border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#10b981]"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Campus Area (Acres):</label>
                    <input
                      type="text"
                      className="px-3 py-2 bg-transparent border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#10b981]"
                      value={campusAcres}
                      onChange={(e) => setCampusAcres(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Student & Staff Headcount:</label>
                    <input
                      type="text"
                      className="px-3 py-2 bg-transparent border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#10b981]"
                      value={totalStudents}
                      onChange={(e) => setTotalStudents(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">NAAC Accreditation Status:</label>
                    <select
                      className="px-3 py-2 bg-transparent border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#10b981] appearance-none"
                      value={naacAccreditation}
                      onChange={(e) => setNaacAccreditation(e.target.value)}
                    >
                      <option value="NAAC 'A+' Grade + Autonomous">NAAC 'A+' Grade + Autonomous</option>
                      <option value="NAAC 'A' Grade + Autonomous">NAAC 'A' Grade + Autonomous</option>
                      <option value="NAAC 'B++' Grade">NAAC 'B++' Grade</option>
                      <option value="NAAC 'B' Grade">NAAC 'B' Grade</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 bg-[#10b981] hover:bg-[#059669] text-white py-2.5 rounded-md flex items-center justify-center gap-2 font-semibold transition-colors cursor-pointer"
                >
                  <Save size={16} /> Save Institutional Profile
                </button>
                {saveToast && <div className="text-xs text-[#10b981] text-center font-bold">Institutional Profile saved successfully!</div>}
              </form>
            </div>

            {/* Department Annual Carbon Ceilings */}
            <div className="bg-white dark:bg-[#232936] rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Department Annual Carbon Ceilings</h3>
              
              <div className="space-y-4">
                {[
                  { label: "Computer Science & Engineering", key: "cse", val: departmentCaps.cse },
                  { label: "AI & Data Science (AI&DS)", key: "aids", val: departmentCaps.aids },
                  { label: "Mechanical & Central Workshop", key: "mech", val: departmentCaps.mech },
                  { label: "Civil Engineering", key: "civil", val: departmentCaps.civil },
                  { label: "Electrical Engineering", key: "electrical", val: departmentCaps.electrical },
                  { label: "Plastic & Polymer Engineering", key: "plastic", val: departmentCaps.plastic },
                  { label: "Agricultural Engineering", key: "agri", val: departmentCaps.agri },
                ].map((dept) => (
                  <div key={dept.key} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{dept.label}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-24 px-3 py-1 bg-transparent border border-slate-300 dark:border-slate-600 rounded-md text-sm text-center text-slate-900 dark:text-white focus:outline-none"
                        value={dept.val}
                        onChange={(e) => setDepartmentCaps({ ...departmentCaps, [dept.key]: Number(e.target.value) })}
                      />
                      <span className="text-xs text-slate-500">Tons</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-6">
            
            {/* NAAC Criterion VII Green Compliance */}
            <div className="bg-white dark:bg-[#232936] rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">NAAC Criterion VII Green Compliance</h3>
              
              <div className="space-y-5">
                {[
                  { key: 't1', label: "7.1.2 Alternate Sources of Energy & Conservation" },
                  { key: 't2', label: "7.1.2 Alternate Sources of Energy & Vehicle V6F Energy" },
                  { key: 't3', label: "7.1.3 Facilities for Management of Degradable & Non-degradable Waste" },
                  { key: 't4', label: "7.1.4 Water Conservation & Harvesting Facilities" },
                  { key: 't5', label: "7.1.5 Green Campus Initiatives & Audit Certificate" },
                  { key: 't6', label: "7.1.6 Quality Audits on Environment & Energy" },
                  { key: 't7', label: "7.1.7 Disabled-Friendly, Barrier-Free Environment" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 dark:text-slate-200">{item.label}</span>
                    <ToggleSwitch isOn={toggles[item.key]} handleToggle={() => handleToggle(item.key)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Download Official Campus Audit Record */}
            <div className="bg-[#e6f7f2] dark:bg-[#1a2d28] rounded-xl p-6 border border-[#b2e8d4] dark:border-[#214a3c] shadow-sm mt-auto">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Download Official Campus Audit Record</h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-5">
                Export authenticated institutional carbon data package for accreditation inspectors and environmental compliance officers.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => {
                    const auditStr = localStorage.getItem("ecopulse_latest_audit");
                    const auditData = auditStr ? JSON.parse(auditStr) : {};
                    const exportData = {
                      institution: collegeName,
                      campusAcres: Number(campusAcres),
                      totalPopulation: Number(totalStudents),
                      naacAccreditation,
                      departmentCaps,
                      naacCriterionViiCompliance: toggles,
                      latestAudit: auditData,
                      exportedAt: new Date().toISOString(),
                      framework: "ISO 14064 & NAAC Criterion VII Standard"
                    };
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `ecopulse_naac_audit_package_${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white py-2.5 rounded-md flex items-center justify-center gap-2 font-semibold transition-colors cursor-pointer"
                >
                  <Download size={18} /> Export NAAC Audit JSON
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
