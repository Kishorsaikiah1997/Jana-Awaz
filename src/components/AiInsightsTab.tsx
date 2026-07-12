import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend, RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import { 
  AlertTriangle, 
  TrendingUp, 
  MapPin, 
  Target, 
  BrainCircuit, 
  Activity, 
  Layers,
  ChevronRight,
  Sparkles,
  Landmark,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  HelpCircle as InfoIcon,
  ShieldAlert,
  HelpCircle as RegionalIcon
} from 'lucide-react';

interface AiInsightsTabProps {
  submissions: any[];
  developmentGroups: any[];
  onThemeSelect: (theme: string) => void;
  onActOnTheme?: (themeName: string, submissionIds: string[]) => void;
  isRefreshingIntel: boolean;
  refreshIntelligence: () => void;
}

const COLORS = ['#1A237E', '#FF9933', '#2E7D32', '#C62828', '#8E24AA', '#00ACC1', '#3949AB'];

export default function AiInsightsTab({ 
  submissions, 
  developmentGroups, 
  onThemeSelect,
  onActOnTheme,
  isRefreshingIntel,
  refreshIntelligence
}: AiInsightsTabProps) {
  const { t } = useTranslation();

  // 1. Pipeline: Actions Taken (Not Reviewed, Initiated, Resolved, Closed)
  const pipelineStats = useMemo(() => {
    let unreviewed = 0;
    let initiated = 0;
    let resolved = 0;
    let closed = 0;

    submissions.forEach(s => {
      const status = s.status || 'pending';
      const hasAction = !!s.last_action_taken || !!s.last_action_date;

      if (status === 'resolved') {
        resolved++;
      } else if (status === 'closed') {
        closed++;
      } else if (status === 'pending') {
        if (hasAction) {
          initiated++;
        } else {
          unreviewed++;
        }
      }
    });

    const total = submissions.length || 1;

    return [
      { name: 'Not Reviewed', value: unreviewed, color: '#C62828', pct: Math.round((unreviewed / total) * 100) },
      { name: 'Initiated / Acted', value: initiated, color: '#FF9933', pct: Math.round((initiated / total) * 100) },
      { name: 'Resolved', value: resolved, color: '#2E7D32', pct: Math.round((resolved / total) * 100) },
      { name: 'Closed & Archived', value: closed, color: '#4A5568', pct: Math.round((closed / total) * 100) }
    ];
  }, [submissions]);

  // 2. Places of Concern (Geographic Hotspots)
  const hotspotData = useMemo(() => {
    const counts = submissions.reduce((acc, curr) => {
      const v = curr.village_ward;
      if (v && v !== 'Unknown') {
        acc[v] = (acc[v] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts)
      .map(([name, count]): { name: string; count: number } => ({ name, count: Number(count) || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [submissions]);

  // 3. Recurring Themes Volume
  const themesVolumeData = useMemo(() => {
    return developmentGroups.map((g, idx) => ({
      name: g.group_name.length > 25 ? g.group_name.substring(0, 22) + '...' : g.group_name,
      fullName: g.group_name,
      count: Number(g.submission_count) || 0,
      evidence: g.evidence_strength || 'Moderate'
    })).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [developmentGroups]);

  // 4. Themes that need Long-Term Solution & Needs to be Raised in Parliament
  const parliamentThemes = useMemo(() => {
    // Dynamically identify or propose strategic parliament questions based on recurring theme keywords
    const matches: any[] = [];
    developmentGroups.forEach((g) => {
      const name = g.group_name.toLowerCase();
      let parliamentQuestion = "";
      let category = "";
      
      if (name.includes('water') || name.includes('drinking') || name.includes('phe')) {
        parliamentQuestion = `Whether the Ministry of Jal Shakti has allocated funds for piped water grid expansion or arsenic mitigation projects in this constituency under the Jal Jeevan Mission?`;
        category = "Water Resources & Public Health Engineering";
      } else if (name.includes('road') || name.includes('highway') || name.includes('pwd') || name.includes('bridge')) {
        parliamentQuestion = `Whether the Ministry of Road Transport and Highways proposes to upgrade critical sub-divisional connectivity corridors or construct concrete bypass flyovers to ease congestion?`;
        category = "Surface Transport & Infrastructure";
      } else if (name.includes('flood') || name.includes('erosion') || name.includes('river') || name.includes('embankment')) {
        parliamentQuestion = `Whether the central government will classify the river bank erosion of critical channels as a national calamity and deploy disaster mitigation funds for permanent geo-bag embankments?`;
        category = "Water Resources & Disaster Management";
      } else if (name.includes('electricity') || name.includes('power') || name.includes('voltage') || name.includes('apdcl')) {
        parliamentQuestion = `Whether the Ministry of Power is introducing modern smart meters or establishing additional high-voltage substations under the Revamped Distribution Sector Scheme (RDSS)?`;
        category = "Power Grid Stability & Energy";
      } else if (name.includes('health') || name.includes('hospital') || name.includes('medical') || name.includes('doctor')) {
        parliamentQuestion = `Whether plans exist to upgrade sub-divisional medical clinics to comprehensive community health centers with digital telemedicine links and adequate specialist quotas?`;
        category = "National Health Mission & Rural Care";
      } else if (name.includes('school') || name.includes('education') || name.includes('college')) {
        parliamentQuestion = `Whether the Ministry of Education has prioritized upgrading government schools to PM-SHRI standards with digital classrooms and modern computer science labs?`;
        category = "Human Resource Development & Education";
      } else if (name.includes('crop') || name.includes('agriculture') || name.includes('irrigation') || name.includes('farmer')) {
        parliamentQuestion = `Whether state-of-the-art cold storage hubs and solar irrigation subsidies will be extended to farmers in flood-affected sub-sectors to secure multi-seasonal crop yield?`;
        category = "Agriculture & Farmers Welfare";
      }

      if (parliamentQuestion) {
        matches.push({
          themeName: g.group_name,
          count: g.submission_count,
          category,
          parliamentQuestion,
          importance: 'National / Policy Level'
        });
      }
    });

    // Fallback if no matching keywords to propose customized ones
    if (matches.length === 0 && developmentGroups.length > 0) {
      developmentGroups.slice(0, 3).forEach((g) => {
        matches.push({
          themeName: g.group_name,
          count: g.submission_count,
          category: "General Policy Interventions",
          parliamentQuestion: `Whether the central ministry plans to allocate specialized financial grants to execute long-term solutions for: "${g.group_name}" under appropriate CSS schemes?`,
          importance: 'Regional & State Policy'
        });
      });
    }

    return matches.slice(0, 4);
  }, [developmentGroups]);

  // 5. Regional and National Importance Spectrum
  const importanceSpectrum = useMemo(() => {
    let localCount = 0;
    let regionalCount = 0;
    let nationalCount = 0;

    submissions.forEach(s => {
      const type = s.submission_type || 'REQUEST';
      const text = (s.text_english || s.text_original || '').toLowerCase();

      // Simple heuristic for scope
      if (type === 'EMERGENCY') {
        localCount++;
      } else if (text.includes('national') || text.includes('parliament') || text.includes('highway') || text.includes('river') || text.includes('scheme') || text.includes('policy')) {
        nationalCount++;
      } else {
        regionalCount++;
      }
    });

    const total = (localCount + regionalCount + nationalCount) || 1;

    return [
      { name: 'Localized (Ward Level)', value: localCount, pct: Math.round((localCount / total) * 100), color: '#FF9933' },
      { name: 'Regional (Constituency Level)', value: regionalCount, pct: Math.round((regionalCount / total) * 100), color: '#1A237E' },
      { name: 'National / Policy Level', value: nationalCount, pct: Math.round((nationalCount / total) * 100), color: '#2E7D32' }
    ];
  }, [submissions]);

  return (
    <div className="flex flex-col h-full bg-[#FAF9F5]">
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full pb-24 space-y-8">
        
        {/* EXECUTIVE BANNER HEADER */}
        <div className="bg-gradient-to-r from-[#121858] via-[#1A237E] to-[#2A36B1] rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border-b-4 border-[#FF9933]">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <BrainCircuit className="w-48 h-48 transform translate-x-12 -translate-y-12" />
          </div>
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-[#FF9933] text-white text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-widest flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Live Graphical Intelligence
              </span>
              <span className="bg-blue-900/50 text-blue-200 text-[10px] font-bold px-2 py-1 rounded">
                Executive Audit Mode
              </span>
            </div>
            <h2 className="text-[26px] md:text-[32px] font-black tracking-tight leading-tight">
              Quick AI Insights Dashboard
            </h2>
            <p className="text-blue-100 text-sm md:text-base max-w-3xl font-medium leading-relaxed">
              Consolidated, fully graphical analysis of grassroots grievances. Instantly audit recurring themes, identify critical hotspots, filter MP dispatch response pipeline, and explore national policy recommendations.
            </p>
          </div>
        </div>

        {/* TOP METRICS & REFRESH ACTION BAR */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
              Data Synchronized: {submissions.length} Citizen Concerns
            </span>
          </div>
          <button 
            onClick={refreshIntelligence}
            disabled={isRefreshingIntel}
            className="bg-[#1A237E] hover:bg-[#121858] disabled:bg-slate-300 text-white px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition flex items-center justify-center gap-2 shadow-sm shrink-0"
          >
            <Activity className={`w-4 h-4 ${isRefreshingIntel ? 'animate-spin' : ''}`} />
            {isRefreshingIntel ? "Running AI Models..." : "Refresh Graphic Intel"}
          </button>
        </div>

        {/* GRID SECTION 1: ACTION PIPELINE & REGIONAL SPECTRUM */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Action Taken Pipeline (Funnel Chart) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-[#1A237E] font-black text-base uppercase tracking-tight">MP Action Response Pipeline</h3>
                <span className="text-[10px] font-bold text-slate-400">STATUS BREAKDOWN</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-6">Real-time funnel tracking concerns from initial receipt to final archival.</p>
              
              {/* Graphical representation: Stacked or pipeline meter list */}
              <div className="space-y-4">
                {pipelineStats.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </span>
                      <span className="text-slate-900 font-black">{item.value} ({item.pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${item.pct}%`, 
                          backgroundColor: item.color 
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t pt-4 flex justify-between items-center text-xs font-semibold text-slate-500 bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-3xl">
              <span>Resolution Target Rate: 85%</span>
              <span className="text-[#2E7D32] font-bold">Current: {pipelineStats[2].pct + pipelineStats[3].pct}% Achieved</span>
            </div>
          </div>

          {/* Regional vs National Importance Spectrum */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-[#1A237E] font-black text-base uppercase tracking-tight">Significance Spectrum</h3>
                <span className="text-[10px] font-bold text-slate-400">POLICY SCOPE</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-4">AI categorization of issues based on jurisdictional scale & policy impact.</p>
              
              {/* Recharts Pie Chart */}
              <div className="h-[180px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={importanceSpectrum}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {importanceSpectrum.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Custom Legend */}
              <div className="space-y-2 mt-4">
                {importanceSpectrum.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-mono text-slate-900">{item.value} ({item.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* GRID SECTION 2: RECURRING THEMES & PLACES OF CONCERN */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Chart 2A: Recurring Themes Volume Bar Chart */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-[#1A237E] font-black text-base uppercase tracking-tight">Recurring Citizen Themes</h3>
                <span className="text-[10px] font-bold text-slate-400">AI DETECTED TOPICS</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-6">Aggregated citizen concerns grouped into high-level development topics.</p>
              
              <div className="h-[250px] w-full">
                {themesVolumeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={themesVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <XAxis dataKey="name" tick={{ fill: '#4A5568', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#4A5568', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 'black', fontSize: '12px' }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {themesVolumeData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.evidence === 'Strong' ? '#1A237E' : entry.evidence === 'Moderate' ? '#FF9933' : '#718096'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 font-bold">No Theme Data Available</div>
                )}
              </div>
            </div>

            {/* Legend / Helper */}
            <div className="flex gap-4 justify-center text-[10px] font-extrabold text-slate-500 pt-4 border-t mt-4">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#1A237E] rounded" /> Strong Evidence Themes</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#FF9933] rounded" /> Moderate Themes</span>
            </div>
          </div>

          {/* Chart 2B: Places of Concern (Geographic Hotspots) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-[#1A237E] font-black text-base uppercase tracking-tight">Places of Concern</h3>
                <span className="text-[10px] font-bold text-slate-400 font-mono">TOP HOTSPOTS</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-6">Constituency village & ward grids with highest incoming report volume.</p>
              
              <div className="space-y-4">
                {hotspotData.length > 0 ? hotspotData.map((hotspot, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-[#FF9933] flex items-center justify-center font-black text-sm shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-slate-700 block truncate">{hotspot.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Villages Registry</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-[#1A237E] block">{hotspot.count} Filings</span>
                      <span className="text-[9px] text-red-500 font-black tracking-wider uppercase bg-red-50 px-1.5 py-0.5 rounded">Action Area</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 text-slate-400 font-medium">No location coordinates mapped.</div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* SECTION 3: PARLIAMENT & STRATEGIC LONG-TERM POLICIES */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b pb-4">
            <div>
              <h3 className="text-[#1A237E] font-black text-lg uppercase tracking-tight flex items-center gap-2">
                <Landmark className="w-5 h-5 text-[#FF9933]" /> Strategic Questions for Parliament
              </h3>
              <p className="text-xs text-slate-500 font-medium">Themes needing long-term policy solutions formulated by AI as ready-to-file Lok Sabha queries.</p>
            </div>
            <span className="bg-[#E8F5E9] text-[#2E7D32] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider self-start sm:self-auto">
              Policy Grounded
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {parliamentThemes.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-[#FFFDF9] rounded-2xl p-5 border-2 border-[#FFE8CC]/60 shadow-sm hover:border-[#FF9933] transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className="bg-[#FFF3E0] text-[#E65100] text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">Theme Count: {item.count}</span>
                  </div>
                  
                  <h4 className="font-extrabold text-sm text-[#1A237E]">
                    Based on Theme: "{item.themeName}"
                  </h4>
                  
                  <p className="text-slate-700 text-xs italic leading-relaxed font-mono bg-white p-3 border border-slate-200 rounded-xl">
                    "{item.parliamentQuestion}"
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2 text-[11px] border-t border-[#FFE8CC]/50">
                  <span className="text-slate-400 font-bold">Policy Jurisdiction: <strong className="text-slate-600">{item.importance}</strong></span>
                  <button 
                    onClick={() => {
                      navigator.clipboard?.writeText(item.parliamentQuestion);
                      alert("Parliament Question copied to clipboard!");
                    }}
                    className="text-[#FF9933] hover:text-[#E65100] font-black uppercase tracking-wider"
                  >
                    Copy Question
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
