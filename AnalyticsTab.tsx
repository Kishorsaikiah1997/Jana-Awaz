import DynamicText from './components/DynamicText';
import { useTranslation } from "react-i18next";
import React, { useState, useMemo } from 'react';
import { RefreshCcw, AlertTriangle, CheckCircle, MapPin, Users, BarChart, ChevronDown, ChevronUp, Share, Share2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, LineChart, Line } from 'recharts';

const URGENCY_COLORS: Record<string, string> = {
  'Critical': '#C62828',
  'High': '#E65100',
  'Medium': '#1A237E',
  'Low': '#2E7D32'
};

export default function AnalyticsTab({
  submissions,
  priorityData,
  isGeneratingPriorities,
  generatePriorities,
  priorityHistory,
  setPriorityData,
  themesData,
  isGeneratingThemes,
  generateThemes,
  setThemeFilter,
  setActiveTab,
  mpLanguage,
  aiReportText,
  isGenerating,
  reportDate,
  generateAIReport,
  activeAnalyticsSection,
  setActiveAnalyticsSection
}: any) {
  const { t } = useTranslation();
  const [expandedPriorities, setExpandedPriorities] = useState<Set<string>>(new Set());
  const [showPriorityHistory, setShowPriorityHistory] = useState(false);

  // Sentiment Analysis Logic
  const sentimentStats = useMemo(() => {
    let criticalHigh = 0;
    const categoryCounts: Record<string, { total: 0, critHigh: 0, crit: 0, high: 0, med: 0, low: 0 }> = {};
    const hourCounts: Record<number, number> = {};
    
    // For weekly trend
    const last7Days = new Date(); last7Days.setDate(last7Days.getDate() - 7);
    const prev7Days = new Date(); prev7Days.setDate(prev7Days.getDate() - 14);
    let thisWeekCount = 0;
    let lastWeekCount = 0;

    const langCounts: Record<string, number> = {};
    const districtCounts: Record<string, number> = {};
    const dayCounts: Record<string, number> = {};
    
    // For heatmap
    const heatmapData = Array(7).fill(0).map(() => Array(4).fill(0));

    submissions.forEach((s: any) => {
      const isCritHigh = s.urgency === 'Critical' || s.urgency === 'High';
      if (isCritHigh) criticalHigh++;
      
      const cat = s.category || 'Other';
      if (!categoryCounts[cat]) categoryCounts[cat] = { total: 0, critHigh: 0, crit: 0, high: 0, med: 0, low: 0 };
      categoryCounts[cat].total++;
      if (isCritHigh) categoryCounts[cat].critHigh++;
      if (s.urgency === 'Critical') categoryCounts[cat].crit++;
      else if (s.urgency === 'High') categoryCounts[cat].high++;
      else if (s.urgency === 'Medium') categoryCounts[cat].med++;
      else if (s.urgency === 'Low') categoryCounts[cat].low++;

      const d = new Date(s.timestamp);
      hourCounts[d.getHours()] = (hourCounts[d.getHours()] || 0) + 1;

      if (d >= last7Days) thisWeekCount++;
      else if (d >= prev7Days) lastWeekCount++;

      const lang = s.language_detected || 'Unknown';
      langCounts[lang] = (langCounts[lang] || 0) + 1;

      if (s.district_en) {
        districtCounts[s.district_en] = (districtCounts[s.district_en] || 0) + 1;
      }

      const dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (d >= last7Days) {
         dayCounts[dayStr] = (dayCounts[dayStr] || 0) + 1;
      }

      // Heatmap (rows: day of week 0-6 where 0 is Sunday, cols: Morning(6-12) 0, Aft(12-17) 1, Eve(17-21) 2, Night(21-6) 3)
      const hr = d.getHours();
      let col = 3;
      if (hr >= 6 && hr < 12) col = 0;
      else if (hr >= 12 && hr < 17) col = 1;
      else if (hr >= 17 && hr < 21) col = 2;
      heatmapData[d.getDay()][col]++;
    });

    const critHighPct = submissions.length ? (criticalHigh / submissions.length) * 100 : 0;
    
    let mood = { label: '😊 Positive', color: 'text-green-700' };
    if (critHighPct > 60) mood = { label: '😟 Distressed', color: 'text-red-700' };
    else if (critHighPct >= 40) mood = { label: '😐 Concerned', color: 'text-orange-600' };
    else if (critHighPct >= 20) mood = { label: '🙂 Moderate', color: 'text-indigo-800' };

    let mostEmotionalCat = '';
    let highestCatPct = 0;
    for (const [cat, counts] of Object.entries(categoryCounts)) {
      if (counts.total >= 3) {
        const pct = (counts.critHigh / counts.total) * 100;
        if (pct > highestCatPct) { highestCatPct = pct; mostEmotionalCat = cat; }
      }
    }

    let peakHour = 0; let peakVal = 0;
    for (const [hr, count] of Object.entries(hourCounts)) {
      if (count > peakVal) { peakVal = count; peakHour = parseInt(hr); }
    }
    const peakHourStr = peakHour === 0 ? '12 AM' : peakHour < 12 ? `${peakHour} AM` : peakHour === 12 ? '12 PM' : `${peakHour-12} PM`;
    let timeOfDay = 'night';
    if (peakHour >= 6 && peakHour < 12) timeOfDay = 'morning';
    else if (peakHour >= 12 && peakHour < 17) timeOfDay = 'afternoon';
    else if (peakHour >= 17 && peakHour < 21) timeOfDay = 'evening';

    let trend = { label: '➡️ Stable', color: 'text-[#1A237E]' };
    if (lastWeekCount > 0) {
      const change = ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100;
      if (change > 20) trend = { label: `📈 Rising +${change.toFixed(0)}%`, color: 'text-red-700' };
      else if (change < -20) trend = { label: `📉 Falling ${change.toFixed(0)}%`, color: 'text-green-700' };
    } else if (thisWeekCount > 0) {
      trend = { label: '📈 Rising', color: 'text-red-700' };
    }

    const urgencyDist = [
      { name: 'Critical', value: 0 }, { name: 'High', value: 0 }, { name: 'Medium', value: 0 }, { name: 'Low', value: 0 }
    ];
    submissions.forEach((s: any) => {
      const u = urgencyDist.find(x => x.name === s.urgency);
      if (u) u.value++;
    });

    const categoryList = Object.entries(categoryCounts).map(([cat, counts]) => {
      const critPct = Math.round((counts.crit / counts.total) * 100);
      let m = '😊';
      const ch = ((counts.crit + counts.high) / counts.total) * 100;
      if (ch > 60) m = '😟'; else if (ch >= 40) m = '😐'; else if (ch >= 20) m = '🙂';
      return { category: cat, total: counts.total, critPct, highPct: Math.round((counts.high/counts.total)*100), medPct: Math.round((counts.med/counts.total)*100), lowPct: Math.round((counts.low/counts.total)*100), mood: m };
    }).sort((a, b) => b.critPct - a.critPct);

    const langChart = Object.entries(langCounts).map(([lang, count]) => ({ name: lang, count })).sort((a,b)=>b.count-a.count);
    const distChart = Object.entries(districtCounts).map(([dist, count]) => ({ name: dist, count })).sort((a,b)=>b.count-a.count).slice(0, 8);
    
    // Sort dates
    const dayChart = Object.entries(dayCounts).map(([date, count]) => ({ date, count })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { mood, mostEmotionalCat, highestCatPct, peakHourStr, timeOfDay, trend, urgencyDist, categoryList, heatmapData, langChart, distChart, dayChart };
  }, [submissions]);

  return (
    <div className="space-y-12 pb-20">
      {/* STICKY SUB-NAV */}
      <div className="sticky top-[73px] sm:top-[73px] z-30 bg-[#FDF6E3] py-3 border-b border-[#E8DCC8] flex gap-4 overflow-x-auto hide-scrollbar shadow-sm px-4 -mx-4 sm:mx-0 sm:px-0">
        {[
          { id: 'priorities', icon: '🎯', label: 'Priorities' },
          { id: 'themes', icon: '🔍', label: 'Themes' },
          { id: 'sentiment', icon: '💭', label: 'Sentiment' },
          { id: 'report', icon: '📋', label: 'AI Report' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => { 
              setActiveAnalyticsSection(tab.id); 
              document.getElementById(`sec-${tab.id}`)?.scrollIntoView({behavior: 'smooth', block: 'start'}) 
            }} 
            className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition ${activeAnalyticsSection === tab.id ? 'bg-[#FF9933] text-white shadow-md' : 'bg-white text-[#5D4037] border border-[#E8DCC8] hover:bg-[#FDF6E3]'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* SECTION 1 - PRIORITIES */}
      <section id="sec-priorities" className="scroll-mt-32">
        <div className="mb-6 flex items-end justify-between border-b-2 border-[#FF9933] pb-2">
          <div>
            <h2 className="text-2xl font-black text-[#1A237E]">{t("Priority Actions")}</h2>
            <p className="text-sm text-[#5D4037] mt-1">{String(t("AI-ranked actions based on requests, district data and seasonal risk"))}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {priorityData && <span className="text-xs text-slate-500 font-bold">{String(t("Last updated:"))} {new Date(priorityData.generated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
            <button onClick={generatePriorities} disabled={isGeneratingPriorities} className="flex items-center gap-1 text-sm font-bold text-[#FF9933] hover:text-orange-600 transition disabled:opacity-50">
              <RefreshCcw className="w-4 h-4" />{String(t(" Refresh "))}</button>
          </div>
        </div>

        {isGeneratingPriorities ? (
          <div className="bg-[#FFFEF7] p-10 rounded-2xl border border-[#E8DCC8] shadow-sm text-center">
            <div className="w-12 h-12 border-4 border-[#FF9933] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="font-black text-xl text-[#1A237E] mb-2">{String(t("🤖 AI is analyzing requests..."))}</h3>
            <div className="text-[#5D4037] text-sm space-y-2 mb-4">
              <p>{String(t("✓ Loading request themes"))}</p>
              <p>{String(t("✓ Loading district data"))}</p>
              <p>{String(t("⟳ Calculating seasonal risk factors..."))}</p>
              <p>{String(t("⟳ Ranking priorities..."))}</p>
            </div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{String(t("This takes 15-30 seconds"))}</p>
          </div>
        ) : !priorityData ? (
          <div className="bg-[#FFFEF7] p-12 rounded-2xl border border-[#E8DCC8] shadow-sm text-center">
            <div className="text-6xl mb-4">{String(t("🎯"))}</div>
            <h3 className="font-black text-xl text-[#1A237E] mb-2">{String(t("No priorities generated yet"))}</h3>
            <p className="text-[#5D4037] mb-6 max-w-md mx-auto">{String(t("Jan Awaaz needs at least one theme analysis before generating priorities."))}</p>
            <div className="text-sm text-slate-600 mb-6 space-y-1 font-medium">
              <p>{String(t("Step 1: Go to Themes section"))}</p>
              <p>{String(t("Step 2: Click Analyze Themes"))}</p>
              <p>{String(t("Step 3: Return here for Priority Plan"))}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {priorityData.seasonal_alert && (
              <div className={`p-4 rounded-xl font-bold text-center border shadow-sm ${
                priorityData.season === 'monsoon' ? 'bg-[#E3F2FD] text-blue-900 border-blue-200' :
                priorityData.season === 'pre_monsoon' ? 'bg-[#FFF8E1] text-amber-900 border-amber-200' :
                priorityData.season === 'winter' ? 'bg-[#F3E5F5] text-purple-900 border-purple-200' :
                'bg-[#E8F5E9] text-green-900 border-green-200'
              }`}>
                {priorityData.season === 'monsoon' ? '🌊 MONSOON ALERT: ' :
                 priorityData.season === 'pre_monsoon' ? '⚠️ PRE-MONSOON: ' :
                 priorityData.season === 'winter' ? '🌨️ WINTER ADVISORY: ' :
                 '🍃 POST-MONSOON: '
                }
                {priorityData.seasonal_alert}
              </div>
            )}

            <div className="bg-[#E8F4FD] p-6 rounded-2xl border border-blue-200 border-l-4 border-l-[#1A237E] shadow-sm">
              <h3 className="font-black text-lg text-[#1A237E] mb-3">{String(t("📋 This Week's Overview"))}</h3>
              <p className="text-[#5D4037] font-medium leading-relaxed mb-4">{priorityData.executive_summary}</p>
              <div className="text-xs font-bold text-slate-500">
                {priorityData.total_complaints_analyzed} requests → {priorityData.total_themes_analyzed} themes | {priorityData.priority_actions.filter((a:any)=>a.urgency==='Critical').length} Critical | Generated: {new Date(priorityData.generated_at).toLocaleString()}
              </div>
            </div>

            <div className="space-y-6">
              {priorityData.priority_actions.map((action: any, index: number) => {
                const isExpanded = expandedPriorities.has(action.action_id);
                const urgencyColor = URGENCY_COLORS[action.urgency] || URGENCY_COLORS['Medium'];
                const isRank1Critical = action.rank === 1 && action.urgency === 'Critical';

                return (
                  <div key={action.action_id} className="relative">
                    <div className="bg-[#FFFEF7] border border-[#E8DCC8] rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row relative z-10" style={{ borderLeftWidth: '6px', borderLeftColor: urgencyColor }}>
                      
                      <div className="p-5 md:p-6 flex-1">
                        <div className="flex items-start gap-4 mb-3">
                          <div className="hidden md:flex w-12 h-12 rounded-full items-center justify-center text-white font-black text-xl flex-shrink-0 shadow-sm" style={{ backgroundColor: urgencyColor }}>
                            {action.rank}
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <div className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm shadow-sm" style={{ backgroundColor: urgencyColor }}>
                                {action.rank}
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: urgencyColor }}>{action.urgency.toUpperCase()}</span>
                              {action.seasonal_factor && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">{String(t("MONSOON 🌊"))}</span>}
                              {action.data_validated && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-50 text-green-800 border border-green-200">{String(t("✓ DATA VALIDATED"))}</span>}
                              {isRank1Critical && action.evidence_points?.some((e:string) => e.toLowerCase().includes('safety')) && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200">{String(t("SAFETY 🚨"))}</span>}
                              
                              <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded text-white ${
                                action.timeline.includes('24 hours') ? 'bg-red-600' :
                                action.timeline.includes('48 hours') ? 'bg-orange-500' :
                                action.timeline.includes('week') ? 'bg-[#1A237E]' :
                                'bg-green-700'
                              }`}>
                                {action.timeline}
                              </span>
                            </div>
                            
                            <DynamicText as="h3" className="font-black text-[16px] text-[#1A237E] leading-tight mb-3 block" originalText={action.action_title} />

                            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 mb-4">
                              <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-slate-400" /> {action.districts_affected?.join(" • ")}</span>
                              <span className="flex items-center gap-1"><Users className="w-4 h-4 text-slate-400" /> ~{action.estimated_affected_population?.toLocaleString()} {String(t("citizens affected"))}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden mb-4">
                          <button 
                            onClick={() => {
                              const next = new Set(expandedPriorities);
                              if (isExpanded) next.delete(action.action_id);
                              else next.add(action.action_id);
                              setExpandedPriorities(next);
                            }}
                            className="w-full flex items-center justify-between p-3 font-bold text-sm text-[#3E2723] hover:bg-slate-100 transition"
                          >
                            <span className="flex items-center gap-2"><BarChart className="w-4 h-4 text-slate-500" /> Why Priority #{action.rank}</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                          </button>
                          
                          {isExpanded && (
                            <div className="p-4 pt-0 border-t border-slate-100 text-sm">
                              <ul className="space-y-2 mt-3">
                                {action.evidence_points?.map((ep: string, i: number) => {
                                  const text = ep.toLowerCase();
                                  let icon = "•";
                                  if (text.includes("complaint") || text.includes("request")) icon = "💬";
                                  else if (text.includes("data") || text.includes("nfhs")) icon = "📊";
                                  else if (text.includes("season") || text.includes("monsoon") || text.includes("flood")) icon = "🌊";
                                  else if (text.includes("photo") || text.includes("ai")) icon = "📸";
                                  else if (text.includes("safety") || text.includes("risk")) icon = "🚨";
                                  return (
                                    <li key={i} className="flex items-start gap-2 text-slate-700">
                                      <span>{icon}</span> <span>{ep}</span>
                                    </li>
                                  )
                                })}
                              </ul>
                              {action.data_validated && (
                                <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded text-xs font-bold text-blue-800">
                                  ✓ {action.data_validation_note}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-[#FFEBEE] border-l-4 border-l-[#C62828] p-3 rounded-r-xl">
                            <p className="text-xs font-bold text-[#C62828] mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/>{String(t(" Risk if delayed:"))}</p>
                            <p className="text-sm font-medium text-[#8E0000]">{action.risk_if_delayed}</p>
                          </div>
                          <div className="bg-[#E8F5E9] border-l-4 border-l-[#2E7D32] p-3 rounded-r-xl">
                            <p className="text-xs font-bold text-[#2E7D32] mb-1 flex items-center gap-1"><CheckCircle className="w-3 h-3"/>{String(t(" Recommended Steps:"))}</p>
                            <ol className="text-sm font-medium text-[#1B5E20] list-decimal list-inside space-y-1">
                              {action.recommended_actions?.map((step: string, i: number) => (
                                <li key={i}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                          <div>
                            <p className="text-sm font-bold text-[#1A237E] flex items-center gap-1"><span className="text-lg">{String(t("🏛️"))}</span> {action.primary_department}</p>
                          </div>
                          
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button 
                              onClick={() => { setThemeFilter(action.theme_id); setActiveTab('live'); }}
                              className="flex-1 sm:flex-none bg-slate-100 hover:bg-slate-200 text-[#1A237E] px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap"
                            >
                              📋 {String(t("View"))} {action.complaint_count} {String(t("requests"))}
                            </button>
                            <button 
                              onClick={() => {
                                const text = `JAN AWAAZ — Priority Alert\n━━━━━━━━━━━━━━━━━━━━\nPriority #${action.rank}: ${action.action_title}\nUrgency: ${action.urgency} | ${action.timeline}\nDistricts: ${action.districts_affected?.join(', ')}\n~${action.estimated_affected_population?.toLocaleString()} citizens affected\n\nEvidence:\n${action.evidence_points?.slice(0, 2).map((e:string) => `• ${e}`).join('\n')}\n\nSteps:\n${action.recommended_actions?.slice(0, 2).map((a:string, i:number) => `${i+1}. ${a}`).join('\n')}\n\nDept: ${action.primary_department}\n━━━━━━━━━━━━━━━━━━━━\nJan Awaaz AI | ${new Date().toLocaleDateString()}`;
                                navigator.clipboard.writeText(text);
                                alert("✓ Copied! Share via WhatsApp with your team.");
                              }}
                              className="flex-1 sm:flex-none bg-[#25D366] hover:bg-[#128C7E] text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 whitespace-nowrap"
                            >
                              <Share2 className="w-4 h-4 md:hidden" />
                              <span className="hidden md:inline flex items-center gap-1"><Share className="w-3 h-3" />{String(t(" Share"))}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2 - THEMES */}
      <section id="sec-themes" className="scroll-mt-32">
        <div className="mb-6 flex items-end justify-between border-b-2 border-[#FF9933] pb-2">
          <div>
            <h2 className="text-2xl font-black text-[#1A237E]">{t("Recurring Themes")}</h2>
            <p className="text-sm text-[#5D4037] mt-1">{String(t("AI-grouped work requests across languages and districts"))}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {themesData && <span className="text-xs text-slate-500 font-bold">{String(t("Last analyzed:"))} {new Date(themesData.generated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
            <button onClick={generateThemes} disabled={isGeneratingThemes} className="flex items-center gap-1 text-sm font-bold text-[#FF9933] hover:text-orange-600 transition disabled:opacity-50">
              <RefreshCcw className="w-4 h-4" />{String(t(" Analyze Themes "))}</button>
          </div>
        </div>

        {isGeneratingThemes ? (
          <div className="bg-[#FFFEF7] p-10 rounded-2xl border border-[#E8DCC8] shadow-sm text-center">
            <div className="w-12 h-12 border-4 border-[#FF9933] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="font-black text-xl text-[#1A237E] mb-2">{String(t("🤖 AI is analyzing themes..."))}</h3>
          </div>
        ) : !themesData ? (
          <div className="bg-[#FFFEF7] p-12 rounded-2xl border border-[#E8DCC8] shadow-sm text-center">
            <div className="text-6xl mb-4">{String(t("🔍"))}</div>
            <h3 className="font-black text-xl text-[#1A237E] mb-2">{String(t("No themes yet"))}</h3>
            <p className="text-[#5D4037] mb-6 max-w-md mx-auto">{String(t("Click Analyze Themes to group work requests by recurring patterns."))}</p>
            <button onClick={generateThemes} className="bg-[#FF9933] text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-500 transition">{String(t("Analyze Now"))}</button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-[#E8F4FD] p-6 rounded-2xl border border-blue-200 border-l-4 border-l-[#1A237E] shadow-sm">
              <h3 className="font-black text-lg text-[#1A237E] mb-2">{themesData.complaints_analyzed} requests grouped into {themesData.themes.length} themes</h3>
              <p className="text-[#5D4037] font-medium leading-relaxed mb-4">{themesData.executive_summary}</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full border border-red-200">{themesData.themes.filter((t:any)=>t.urgency_level==='Critical').length} Critical</span>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full border border-orange-200">{themesData.themes.filter((t:any)=>t.trend==='growing').length} Growing 📈</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full border border-blue-200">{themesData.themes.filter((t:any)=>t.flood_related).length} Flood related 🌊</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {themesData.themes.sort((a:any, b:any) => b.complaint_count - a.complaint_count).map((theme: any) => {
                const uColor = URGENCY_COLORS[theme.urgency_level] || URGENCY_COLORS['Medium'];
                return (
                  <div key={theme.theme_id} className="bg-[#FFFEF7] border border-[#E8DCC8] rounded-xl shadow-sm overflow-hidden flex flex-col" style={{ borderLeftWidth: '4px', borderLeftColor: uColor }}>
                    <div className="p-4 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: uColor }}>{theme.urgency_level.toUpperCase()}</span>
                        {theme.trend === 'growing' && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200">{String(t("GROWING 📈"))}</span>}
                        {theme.flood_related && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">{String(t("FLOOD 🌊"))}</span>}
                        {theme.safety_concerns && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200">{String(t("SAFETY 🚨"))}</span>}
                        <span className="ml-auto text-xs font-bold text-slate-500">{theme.complaint_count} requests</span>
                      </div>
                      <h3 className="font-black text-[15px] text-[#1A237E] leading-snug mb-1">{theme.theme_name}</h3>
                      <p className="text-[11px] text-[#5D4037]">{theme.theme_name_assamese} • {theme.theme_name_hindi}</p>
                      <p className="text-[11px] font-bold text-slate-500 mt-2 flex items-center gap-1"><MapPin className="w-3 h-3"/> {theme.districts_affected?.join(", ")}</p>
                      
                      <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <DynamicText as="p" className="text-xs italic text-slate-600 mb-1" originalText={`"${theme.representative_complaint || theme.representative_request}"`} />
                        <p className="text-[10px] text-slate-400 font-bold">{String(t("— Representative request"))}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-bold text-slate-500">
                        <span className="bg-slate-100 p-1.5 rounded">🕐 {String(t("Peak:"))} {theme.peak_submission_time}</span>
                        <span className="bg-slate-100 p-1.5 rounded">👥 ~{theme.estimated_affected_population?.toLocaleString()}</span>
                        <span className="bg-slate-100 p-1.5 rounded">📈 {String(t(theme.trend || ""))}</span>
                        <span className="bg-slate-100 p-1.5 rounded">🎯 {String(t(theme.data_confidence || ""))} {String(t("confidence"))}</span>
                      </div>
                      <DynamicText as="p" className="text-[10px] text-slate-500 mt-3 block w-full" originalText={theme.urgency_reasoning} buttonClassName="mt-1" />
                      
                      <div className="mt-4 bg-[#E8F5E9] border-l-2 border-l-[#2E7D32] p-2 rounded text-[11px] font-medium text-[#1B5E20]">
                        💡 {theme.mp_action_suggested}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-1">
                        {theme.common_keywords?.map((kw:string, i:number) => (
                           <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] uppercase font-bold">{kw}</span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2 border-t border-slate-100">
                      <button onClick={() => { setThemeFilter(theme.theme_id); setActiveTab('live'); }} className="w-full bg-white hover:bg-slate-100 text-[#1A237E] border border-slate-200 py-1.5 rounded text-[11px] font-bold transition">
                        📋 View {theme.complaint_count} requests
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-[#FFFEF7] p-6 rounded-2xl border border-[#E8DCC8] shadow-sm">
              <h3 className="font-bold text-[#1A237E] mb-4">{String(t("Theme Distribution"))}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart layout="vertical" data={themesData.themes.sort((a:any,b:any)=>b.complaint_count - a.complaint_count).slice(0,8)}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="theme_name" type="category" width={150} tick={{ fontSize: 11, fill: '#5D4037' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#FDF6E3'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="complaint_count" radius={[0,4,4,0]}>
                      {themesData.themes.map((entry:any, index:number) => (
                        <Cell key={`cell-${index}`} fill={URGENCY_COLORS[entry.urgency_level] || '#FF9933'} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 3 - SENTIMENT */}
      <section id="sec-sentiment" className="scroll-mt-32">
        <div className="mb-6 flex items-end justify-between border-b-2 border-[#FF9933] pb-2">
          <div>
            <h2 className="text-2xl font-black text-[#1A237E]">{t("Citizen Sentiment")}</h2>
            <p className="text-sm text-[#5D4037] mt-1">{String(t("Emotional tone and urgency patterns in citizen requests"))}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#FFFEF7] p-5 rounded-2xl border border-[#E8DCC8] shadow-sm text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{String(t("Overall Mood"))}</p>
            <p className={`text-xl font-black ${sentimentStats.mood.color}`}>{sentimentStats.mood.label}</p>
            <p className="text-xs text-slate-400 mt-1">{String(t("Based on urgency"))}</p>
          </div>
          <div className="bg-[#FFFEF7] p-5 rounded-2xl border border-[#E8DCC8] shadow-sm text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{String(t("Most Urgent Category"))}</p>
            <p className="text-lg font-black text-[#1A237E] leading-tight truncate">{sentimentStats.mostEmotionalCat || '-'}</p>
            <p className="text-xs text-slate-400 mt-1">{sentimentStats.highestCatPct.toFixed(0)}% {String(t("high urgency"))}</p>
          </div>
          <div className="bg-[#FFFEF7] p-5 rounded-2xl border border-[#E8DCC8] shadow-sm text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{String(t("Submission Pattern"))}</p>
            <p className="text-lg font-black text-[#3E2723]">Peak time: {sentimentStats.peakHourStr}</p>
            <p className="text-[10px] text-slate-500 mt-1 leading-tight">{String(t("Citizens report issues after"))} {String(t(sentimentStats.timeOfDay === 'morning' ? 'waking up' : sentimentStats.timeOfDay === 'afternoon' ? 'morning work' : 'evening rest'))}</p>
          </div>
          <div className="bg-[#FFFEF7] p-5 rounded-2xl border border-[#E8DCC8] shadow-sm text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{String(t("Weekly Trend"))}</p>
            <p className={`text-xl font-black ${sentimentStats.trend.color}`}>{sentimentStats.trend.label}</p>
            <p className="text-xs text-slate-400 mt-1">{String(t("Vs. last week"))}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-[#FFFEF7] p-5 rounded-2xl border border-[#E8DCC8] shadow-sm md:col-span-1">
            <h3 className="font-bold text-[#1A237E] text-sm mb-4">{String(t("Urgency Distribution"))}</h3>
            <div className="h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sentimentStats.urgencyDist} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                    {sentimentStats.urgencyDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={URGENCY_COLORS[entry.name] || '#ccc'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-[#1A237E]">{submissions.length}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{String(t("Total"))}</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
               {sentimentStats.urgencyDist.map(u => (
                 <div key={u.name} className="flex items-center gap-1 text-[10px] font-bold"><div className="w-2 h-2 rounded-full" style={{backgroundColor: URGENCY_COLORS[u.name]}}></div>{u.name}</div>
               ))}
            </div>
          </div>
          
          <div className="bg-[#FFFEF7] p-5 rounded-2xl border border-[#E8DCC8] shadow-sm md:col-span-2 overflow-x-auto">
            <h3 className="font-bold text-[#1A237E] text-sm mb-4">{String(t("Category Sentiment"))}</h3>
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-[#E8DCC8] text-[10px] uppercase font-bold text-slate-400">
                  <th className="pb-2 pl-2">{String(t("Category"))}</th>
                  <th className="pb-2 text-center">{String(t("Requests"))}</th>
                  <th className="pb-2 text-center">{String(t("Critical"))}</th>
                  <th className="pb-2 text-center">{String(t("High"))}</th>
                  <th className="pb-2 text-center">{String(t("Medium"))}</th>
                  <th className="pb-2 text-center">{String(t("Low"))}</th>
                  <th className="pb-2 text-center">{String(t("Mood"))}</th>
                </tr>
              </thead>
              <tbody>
                {sentimentStats.categoryList.map((c, i) => (
                  <tr key={c.category} className={`border-b border-slate-100 text-sm font-medium ${i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}`}>
                    <td className="py-2 pl-2 text-[#3E2723]">{c.category}</td>
                    <td className="py-2 text-center font-bold">{c.total}</td>
                    <td className="py-2 text-center text-[#C62828]">{c.critPct}%</td>
                    <td className="py-2 text-center text-[#E65100]">{c.highPct}%</td>
                    <td className="py-2 text-center text-[#1A237E]">{c.medPct}%</td>
                    <td className="py-2 text-center text-[#2E7D32]">{c.lowPct}%</td>
                    <td className="py-2 text-center text-lg">{c.mood}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#FFFEF7] p-5 rounded-2xl border border-[#E8DCC8] shadow-sm">
            <h3 className="font-bold text-[#1A237E] text-sm mb-4">{String(t("Submission Time Heatmap"))}</h3>
            <div className="grid grid-cols-5 gap-1">
              <div className="col-span-1 flex flex-col justify-around text-[10px] font-bold text-slate-400 text-right pr-2">
                <span>{String(t("Sun"))}</span><span>{String(t("Mon"))}</span><span>{String(t("Tue"))}</span><span>{String(t("Wed"))}</span><span>{String(t("Thu"))}</span><span>{String(t("Fri"))}</span><span>{String(t("Sat"))}</span>
              </div>
              <div className="col-span-4 grid grid-rows-7 gap-1">
                 {sentimentStats.heatmapData.map((row, r) => (
                   <div key={r} className="grid grid-cols-4 gap-1">
                     {row.map((val, c) => {
                       let bg = 'bg-white border border-slate-100';
                       if (val >= 8) bg = 'bg-[#FF9933]';
                       else if (val >= 4) bg = 'bg-[#FFB347]';
                       else if (val >= 1) bg = 'bg-[#FFF3E0]';
                       return <div key={c} className={`h-6 rounded-sm ${bg} flex items-center justify-center text-[8px] font-bold text-black/30`} title={`${val} complaints`}>{val > 0 ? val : ''}</div>
                     })}
                   </div>
                 ))}
              </div>
              <div className="col-start-2 col-span-4 grid grid-cols-4 text-center text-[10px] font-bold text-slate-400 mt-1">
                <span>{String(t("Morning"))}</span><span>{String(t("Afternoon"))}</span><span>{String(t("Evening"))}</span><span>{String(t("Night"))}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-[#FFFEF7] p-5 rounded-2xl border border-[#E8DCC8] shadow-sm">
            <h3 className="font-bold text-[#1A237E] text-sm mb-4">{String(t("Voice by Language"))}</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={sentimentStats.langChart} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                  <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#FDF6E3'}} />
                  <Bar dataKey="count" fill="#1A237E" radius={[4,4,0,0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#FFFEF7] p-5 rounded-2xl border border-[#E8DCC8] shadow-sm">
            <h3 className="font-bold text-[#1A237E] text-sm mb-4">{String(t("Top Districts by Requests"))}</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart layout="vertical" data={sentimentStats.distChart} margin={{top: 0, right: 10, left: 10, bottom: 0}}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#FDF6E3'}} />
                  <Bar dataKey="count" fill="#FF9933" radius={[0,4,4,0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#FFFEF7] p-5 rounded-2xl border border-[#E8DCC8] shadow-sm">
            <h3 className="font-bold text-[#1A237E] text-sm mb-4">{String(t("Requests Last 7 Days"))}</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sentimentStats.dayChart} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                  <XAxis dataKey="date" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  <Line type="monotone" dataKey="count" stroke="#1A237E" strokeWidth={3} dot={{r: 4, fill: '#1A237E'}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 - REPORT */}
      <section id="sec-report" className="scroll-mt-32">
        <div className="mb-6 flex items-end justify-between border-b-2 border-[#FF9933] pb-2">
          <div>
            <h2 className="text-2xl font-black text-[#1A237E]">{t("Weekly AI Report")}</h2>
            <p className="text-sm text-[#5D4037] mt-1">{String(t("AI-generated constituency intelligence report"))}</p>
          </div>
        </div>

        <div className="bg-[#FDF6E3] p-8 rounded-2xl border border-[#E8DCC8] shadow-sm max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="font-black text-2xl text-[#3E2723] mb-2">{String(t("Weekly Constituency Report"))}</h3>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              {new Date(Date.now() - 7*86400000).toLocaleDateString()} — {new Date().toLocaleDateString()}
            </p>
            <p className="text-sm text-slate-500 mt-1">{submissions.filter((s:any) => new Date(s.timestamp) >= new Date(Date.now()-7*86400000)).length} {String(t("requests in range"))}</p>
            
            <button 
              onClick={generateAIReport}
              disabled={isGenerating}
              className="mt-6 bg-[#FF9933] text-white px-8 py-3 rounded-xl font-black text-lg hover:bg-orange-500 transition shadow-sm disabled:opacity-50"
            >
              {isGenerating ? t("Generating...") : t("Generate AI Report")}
            </button>
          </div>

          {aiReportText && (
            <div id="ai-report-content" className="bg-[#FFFEF7] p-8 sm:p-12 border border-[#E8DCC8] rounded-xl shadow-inner text-[#3E2723] font-serif leading-relaxed">
              {reportDate && (
                <div className="mb-6 pb-6 border-b border-dashed border-[#E8DCC8] text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">⚠️ {String(t("Report from"))} {reportDate} — {String(t("Click Generate for fresh report"))}</p>
                </div>
              )}
              
              <div className="space-y-6">
                {aiReportText.split('\n').map((line, i) => {
                  if (line.startsWith('WEEKLY CONSTITUENCY REPORT')) {
                     return <DynamicText key={i} as="h1" className="text-2xl font-black text-center mb-4 block" originalText={line} />;
                  }
                  if (line.startsWith('Member of Parliament') || line.startsWith('Period:')) {
                     return <DynamicText key={i} as="p" className="text-center font-bold text-sm block" originalText={line} />;
                  }
                  if (line.startsWith('━')) {
                     return <div key={i} className="h-px bg-[#1A237E] my-6"></div>;
                  }
                  if (/^\d+\.\s+[A-Z\s]+$/.test(line) || (/^[A-Z\s]+$/.test(line) && line.length > 5)) {
                    return <DynamicText key={i} as="h2" className="text-lg font-black text-[#FF9933] mt-8 mb-3 uppercase tracking-wider block" originalText={line} />;
                  }
                  if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
                    return <li key={i} className="ml-4 mb-2">{line.substring(1).trim()}</li>;
                  }
                  if (line.trim().length > 0) {
                    return <p key={i} className="mb-3">{line}</p>;
                  }
                  return null;
                })}
              </div>

              <div className="mt-12 pt-6 border-t border-[#E8DCC8] flex justify-between items-center text-xs font-bold text-slate-400">
                <span>{String(t("Generated by Jan Awaaz AI"))}</span>
                <span>{String(t("Powered by Google Gemini"))}</span>
              </div>
            </div>
          )}

          {aiReportText && (
            <div className="mt-6 flex justify-center gap-4">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(aiReportText);
                  alert("Copied to clipboard!");
                }}
                className="bg-white border border-[#E8DCC8] text-[#3E2723] px-6 py-2 rounded-lg font-bold hover:bg-slate-50 transition"
              >{String(t(" 📋 Copy Report "))}</button>
              <button 
                onClick={() => {
                  const printContent = document.getElementById('ai-report-content');
                  if (printContent) {
                    const originalContent = document.body.innerHTML;
                    document.body.innerHTML = printContent.innerHTML;
                    window.print();
                    document.body.innerHTML = originalContent;
                    window.location.reload();
                  }
                }}
                className="bg-white border border-[#E8DCC8] text-[#3E2723] px-6 py-2 rounded-lg font-bold hover:bg-slate-50 transition"
              >{String(t(" 🖨️ Print Report "))}</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
