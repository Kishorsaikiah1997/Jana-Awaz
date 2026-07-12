import React, { useState, useEffect } from 'react';
import DynamicText from './DynamicText';
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, increment, arrayUnion, arrayRemove, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Submission } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ThumbsUp, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  User, 
  Calendar, 
  FileText, 
  Pickaxe, 
  Lightbulb, 
  Search, 
  Filter, 
  X, 
  Share2, 
  TrendingUp, 
  Check, 
  Flame, 
  ChevronRight, 
  Info,
  Droplet,
  HeartPulse,
  GraduationCap,
  Zap,
  Sprout,
  Trash2,
  AlertCircle
} from 'lucide-react';

export default function PublicBoard({ highContrast }: { highContrast: boolean }) {
  const { t, i18n } = useTranslation();
  
  const [activeFilter, setActiveFilter] = useState<'all' | 'live' | 'resolved' | 'projects'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'time' | 'votes'>('time');
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // A simple mechanism for upvoting. In a real app we'd need auth. Here we use localStorage.
  const userId = localStorage.getItem('jan_awaaz_anon_id') || Math.random().toString(36).substring(7);
  useEffect(() => {
    if (!localStorage.getItem('jan_awaaz_anon_id')) {
      localStorage.setItem('jan_awaaz_anon_id', userId);
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let fetchedItems: any[] = [];
      
      // Fetch Live Complaints (pending, limit to 150 recent to filter client-side)
      const liveQ = query(collection(db, "submissions"), orderBy("timestamp", "desc"), limit(150));
      const liveSnap = await getDocs(liveQ);
      let liveCount = 0;
      liveSnap.forEach(doc => {
        const data = doc.data();
        if (data.status === "pending" && liveCount < 40) {
          fetchedItems.push({ ...data, id: doc.id, boardType: 'live' });
          liveCount++;
        }
      });
      
      // Fetch Resolved/Shared Complaints
      const resolvedQ = query(collection(db, "submissions"), where("published_to_public", "==", true));
      const resolvedSnap = await getDocs(resolvedQ);
      resolvedSnap.forEach(doc => {
        fetchedItems.push({ ...doc.data(), id: doc.id, boardType: 'resolved' });
      });
      
      // Fetch Proposed Projects
      const projectsQ = query(collection(db, "development_projects"), orderBy("status"));
      const projectsSnap = await getDocs(projectsQ);
      projectsSnap.forEach(doc => {
        fetchedItems.push({ ...doc.data(), id: doc.id, boardType: 'project', timestamp: new Date().toISOString() });
      });
      
      setItems(fetchedItems);
    } catch (err) {
      console.error("Error fetching board:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpvote = async (item: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // prevent opening details modal
    const isProject = item.boardType === 'project';
    const collectionName = isProject ? "development_projects" : "submissions";
    const docRef = doc(db, collectionName, item.id);
    
    const upvotedBy = item.upvoted_by || [];
    const hasVoted = upvotedBy.includes(userId);
    
    try {
      if (hasVoted) {
        await updateDoc(docRef, {
          upvotes: increment(-1),
          upvoted_by: arrayRemove(userId)
        });
        const updatedItems = items.map(i => i.id === item.id ? { ...i, upvotes: Math.max(0, (i.upvotes || 1) - 1), upvoted_by: upvotedBy.filter((id: string) => id !== userId) } : i);
        setItems(updatedItems);
        if (selectedItem && selectedItem.id === item.id) {
          setSelectedItem({ ...selectedItem, upvotes: Math.max(0, (selectedItem.upvotes || 1) - 1), upvoted_by: upvotedBy.filter((id: string) => id !== userId) });
        }
      } else {
        await updateDoc(docRef, {
          upvotes: increment(1),
          upvoted_by: arrayUnion(userId)
        });
        const updatedItems = items.map(i => i.id === item.id ? { ...i, upvotes: (i.upvotes || 0) + 1, upvoted_by: [...upvotedBy, userId] } : i);
        setItems(updatedItems);
        if (selectedItem && selectedItem.id === item.id) {
          setSelectedItem({ ...selectedItem, upvotes: (selectedItem.upvotes || 0) + 1, upvoted_by: [...upvotedBy, userId] });
        }
      }
    } catch (e) {
      console.error("Upvote failed", e);
    }
  };

  const handleShare = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.id);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter and Search logic
  let filteredItems = items;
  
  if (activeFilter !== 'all') {
    filteredItems = filteredItems.filter(i => i.boardType === activeFilter);
  }
  
  if (selectedCategory !== 'all') {
    filteredItems = filteredItems.filter(i => {
      if (i.boardType === 'project') return false;
      const c = (i.category || '').toLowerCase();
      const s = selectedCategory.toLowerCase();
      if (s === 'roads' && (c.includes('road') || c.includes('transport'))) return true;
      if (s === 'water supply' && (c.includes('water') || c.includes('jal'))) return true;
      if (s === 'healthcare' && (c.includes('health') || c.includes('medic'))) return true;
      if (s === 'education/schools' && (c.includes('education') || c.includes('school'))) return true;
      if (s === 'electricity' && (c.includes('electric') || c.includes('power'))) return true;
      if (s === 'agriculture' && (c.includes('agri') || c.includes('farm'))) return true;
      return c === s;
    });
  }

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().replace(/-/g, ' ');
    const searchTerms = q.split(/\s+/).filter(term => term.length > 0);
    
    filteredItems = filteredItems.filter(i => {
      const text = (i.text_english || i.text_original || '').toLowerCase();
      const name = (i.name || '').toLowerCase();
      const projName = (i.name || '').toLowerCase();
      const notes = (i.notes || '').toLowerCase();
      const summary = (i.issue_summary || '').toLowerCase();
      const state = (i.state || i.state_en || '').toLowerCase();
      const district = (i.district || i.district_en || '').toLowerCase();
      const l_constituency = (i.loksabha_constituency || i.lok_sabha_en || '').toLowerCase().replace(/-/g, ' ');
      const a_constituency = (i.assembly_constituency || '').toLowerCase();
      const category = (i.category || '').toLowerCase();
      const pincode = (i.pincode || '').toLowerCase();
      const id = (i.id || '').toLowerCase();

      return searchTerms.every(term => 
        text.includes(term) ||
        name.includes(term) ||
        projName.includes(term) ||
        notes.includes(term) ||
        summary.includes(term) ||
        state.includes(term) ||
        district.includes(term) ||
        l_constituency.includes(term) ||
        a_constituency.includes(term) ||
        category.includes(term) ||
        pincode.includes(term) ||
        id.includes(term)
      );
    });
  }
  
  // Sort logic
  if (sortOrder === 'time') {
    filteredItems.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
  } else {
    filteredItems.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
  }

  // Categories helper
  const categoriesList = [
    { id: 'all', label: 'All Categories', icon: Filter, color: 'bg-slate-100 text-slate-700' },
    { id: 'Roads', label: 'Roads', icon: Pickaxe, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { id: 'Water Supply', label: 'Water', icon: Droplet, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { id: 'Healthcare', label: 'Healthcare', icon: HeartPulse, color: 'bg-red-50 text-red-700 border-red-200' },
    { id: 'Education/Schools', label: 'Education', icon: GraduationCap, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { id: 'Electricity', label: 'Electricity', icon: Zap, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    { id: 'Agriculture', label: 'Agriculture', icon: Sprout, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ];

  const getUrgencyBadge = (u: string) => {
    const isHindi = i18n.language === 'hi';
    if (u === 'Critical') return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-red-700 bg-red-100 border border-red-200 animate-pulse">
        <Flame className="w-3 h-3 fill-current" />
        {isHindi ? "अति महत्वपूर्ण" : "Critical"}
      </span>
    );
    if (u === 'High') return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-orange-700 bg-orange-100 border border-orange-200">
        <AlertTriangle className="w-3 h-3" />
        {isHindi ? "उच्च" : "High"}
      </span>
    );
    if (u === 'Medium') return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200">
        <Info className="w-3 h-3" />
        {isHindi ? "मध्यम" : "Medium"}
      </span>
    );
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-blue-700 bg-blue-100 border border-blue-200">
        <Info className="w-3 h-3" />
        {isHindi ? "निम्न" : "Low"}
      </span>
    );
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'roads': return <Pickaxe className="w-4 h-4 text-amber-600" />;
      case 'water supply':
      case 'water': return <Droplet className="w-4 h-4 text-blue-600" />;
      case 'healthcare': return <HeartPulse className="w-4 h-4 text-red-600" />;
      case 'education/schools':
      case 'education': return <GraduationCap className="w-4 h-4 text-indigo-600" />;
      case 'electricity': return <Zap className="w-4 h-4 text-yellow-600" />;
      case 'agriculture': return <Sprout className="w-4 h-4 text-emerald-600" />;
      default: return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'roads': return 'bg-amber-50 border-amber-100';
      case 'water supply':
      case 'water': return 'bg-blue-50 border-blue-100';
      case 'healthcare': return 'bg-red-50 border-red-100';
      case 'education/schools':
      case 'education': return 'bg-indigo-50 border-indigo-100';
      case 'electricity': return 'bg-yellow-50 border-yellow-100';
      case 'agriculture': return 'bg-emerald-50 border-emerald-100';
      default: return 'bg-slate-50 border-slate-100';
    }
  };

  // Stats Counters
  const liveCount = items.filter(i => i.boardType === 'live').length;
  const resolvedCount = items.filter(i => i.boardType === 'resolved').length;
  const projectsCount = items.filter(i => i.boardType === 'project').length;
  const totalVotes = items.reduce((acc, curr) => acc + (curr.upvotes || 0), 0);

  return (
    <div className={`w-full max-w-4xl mx-auto rounded-3xl p-4 sm:p-8 shadow-xl border transition duration-300 ${highContrast ? "bg-black border-yellow-400 border-4 text-yellow-400" : "bg-gradient-to-br from-[#FFFEF7] to-[#FDFBF7] border-[#E8DCC8] text-[#3E2723]"}`}>
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b pb-6 border-dashed border-[#E8DCC8]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${highContrast ? 'border border-yellow-400 text-yellow-400' : 'bg-[#1A237E]/10 text-[#1A237E]'}`}>
              <TrendingUp className="w-3.5 h-3.5" />
              {i18n.language === 'hi' ? 'सामुदायिक डैशबोर्ड' : 'Community Hub'}
            </span>
          </div>
          <h2 className={`text-3xl sm:text-4xl font-extrabold font-display tracking-tight ${highContrast ? 'text-yellow-400' : 'text-[#1A237E]'}`}>
            {i18n.language === 'hi' ? 'सार्वजनिक नागरिक पटल' : 'Public Concerns Board'}
          </h2>
          <p className={`mt-2 font-medium text-sm sm:text-base ${highContrast ? 'text-yellow-400/80' : 'text-[#3E2723]/80'}`}>
            {i18n.language === 'hi' 
              ? 'लाइव मुद्दों, हल की गई समस्याओं और सांसद द्वारा प्रस्तावित विकास परियोजनाओं का अन्वेषण करें।'
              : 'Explore live issues, resolved problems, and official development projects in your area.'}
          </p>
        </div>
      </div>

      {/* STATS OVERVIEW BENTO GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {[
          { label: i18n.language === 'hi' ? 'सक्रिय अनुरोध' : 'Active Requests', count: liveCount, icon: AlertTriangle, color: 'border-orange-200 bg-orange-50/40 text-orange-800' },
          { label: i18n.language === 'hi' ? 'समाधान किए गए' : 'Resolved', count: resolvedCount, icon: CheckCircle2, color: 'border-green-200 bg-green-50/40 text-green-800' },
          { label: i18n.language === 'hi' ? 'प्रस्तावित परियोजनाएं' : 'Proposed Projects', count: projectsCount, icon: Lightbulb, color: 'border-purple-200 bg-purple-50/40 text-purple-800' },
          { label: i18n.language === 'hi' ? 'समर्थन मत' : 'Total Support', count: totalVotes, icon: ThumbsUp, color: 'border-blue-200 bg-blue-50/40 text-blue-800' }
        ].map((stat, idx) => (
          <div key={idx} className={`p-4 rounded-2xl border-2 flex flex-col justify-between transition hover:shadow-md ${highContrast ? 'border-yellow-400 bg-black' : stat.color}`}>
            <div className="flex justify-between items-start">
              <span className={`text-xs font-bold uppercase tracking-wider opacity-80 ${highContrast ? 'text-yellow-400' : 'text-slate-600'}`}>{stat.label}</span>
              <stat.icon className={`w-4 h-4 shrink-0 ${highContrast ? 'text-yellow-400' : ''}`} />
            </div>
            <span className={`text-2xl sm:text-3xl font-black mt-2 ${highContrast ? 'text-yellow-400' : 'text-[#1A237E]'}`}>
              {loading ? '...' : stat.count}
            </span>
          </div>
        ))}
      </div>

      {/* SEARCH AND MAIN FILTERS */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col md:flex-row gap-3">
          {/* SEARCH BAR */}
          <div className="relative flex-1">
            <Search className={`absolute left-4 top-3.5 w-5 h-5 ${highContrast ? 'text-yellow-400' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder={i18n.language === 'hi' ? "खोजें (स्थान, पिन कोड, विषय, शिकायत आईडी...)" : "Search updates (village, district, PIN, category, ID)..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-11 pr-10 py-3.5 rounded-2xl text-sm font-semibold transition focus:outline-none ${
                highContrast 
                  ? 'bg-black border-2 border-yellow-400 text-yellow-400 placeholder-yellow-400/50' 
                  : 'bg-white border border-[#E8DCC8] text-slate-800 placeholder-slate-400 shadow-sm focus:border-[#1A237E] focus:ring-1 focus:ring-[#1A237E]'
              }`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3.5 p-0.5 rounded-full hover:bg-slate-100 transition text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* SORT SWITCHER */}
          <div className={`flex p-1 rounded-xl shrink-0 self-end md:self-stretch ${highContrast ? 'border-2 border-yellow-400 bg-black' : 'bg-slate-100'}`}>
            <button 
              onClick={() => setSortOrder('time')} 
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                sortOrder === 'time' 
                  ? (highContrast ? 'bg-yellow-400 text-black' : 'bg-white shadow text-[#1A237E]') 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {i18n.language === 'hi' ? 'नवीनतम' : 'Latest'}
            </button>
            <button 
              onClick={() => setSortOrder('votes')} 
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                sortOrder === 'votes' 
                  ? (highContrast ? 'bg-yellow-400 text-black' : 'bg-white shadow text-[#1A237E]') 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              {i18n.language === 'hi' ? 'शीर्ष मतदान' : 'Top Voted'}
            </button>
          </div>
        </div>

        {/* FEED TYPE TABS */}
        <div className="flex flex-wrap gap-1.5 border-b pb-3 border-dashed border-[#E8DCC8]">
          {[
            { id: 'all', label: i18n.language === 'hi' ? 'सभी अपडेट' : 'All Updates' },
            { id: 'live', label: i18n.language === 'hi' ? 'लाइव कार्य अनुरोध' : 'Live Citizen Concerns' },
            { id: 'resolved', label: i18n.language === 'hi' ? 'हल किया हुआ (साझा)' : 'Resolved Concerns' },
            { id: 'projects', label: i18n.language === 'hi' ? 'सांसद परियोजनाएं' : 'Proposed Projects' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveFilter(tab.id as any);
                // Reset category if switching to projects
                if (tab.id === 'projects') setSelectedCategory('all');
              }}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                activeFilter === tab.id 
                  ? (highContrast ? 'bg-yellow-400 text-black font-black' : 'bg-[#1A237E] text-white shadow-sm') 
                  : (highContrast ? 'border border-yellow-400 text-yellow-400 hover:bg-yellow-400/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-600')
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CATEGORY SELECTOR (Only shown if projects tab is not active) */}
        {activeFilter !== 'projects' && (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 custom-scrollbar scroll-smooth">
            {categoriesList.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 border ${
                  selectedCategory === cat.id
                    ? (highContrast ? 'bg-yellow-400 border-yellow-400 text-black font-black' : 'bg-[#2E7D32] border-[#2E7D32] text-white shadow-sm')
                    : (highContrast ? 'border-yellow-400/40 text-yellow-400 hover:border-yellow-400' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')
                }`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {i18n.language === 'hi' && cat.id !== 'all' ? t(`cat_${cat.id.toLowerCase().replace('/schools', '').replace(' supply', '')}`) || cat.label : cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* BOARD CARDS LIST */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <div className={`w-10 h-10 rounded-full border-4 border-t-transparent animate-spin ${highContrast ? 'border-yellow-400' : 'border-[#1A237E]'}`} />
          <span className="font-bold text-slate-500 animate-pulse">{i18n.language === 'hi' ? 'सामुदायिक अपडेट लोड किए जा रहे हैं...' : 'Loading community updates...'}</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className={`py-16 text-center rounded-2xl border-2 border-dashed flex flex-col items-center p-6 ${highContrast ? 'border-yellow-400' : 'border-slate-200 bg-slate-50/50'}`}>
          <AlertCircle className={`w-12 h-12 mb-3 ${highContrast ? 'text-yellow-400' : 'text-slate-400'}`} />
          <h3 className={`text-lg font-bold mb-1 ${highContrast ? 'text-yellow-400' : 'text-slate-700'}`}>
            {i18n.language === 'hi' ? 'कोई अपडेट नहीं मिला' : 'No Updates Found'}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm">
            {i18n.language === 'hi'
              ? 'वर्तमान फ़िल्टर या खोज मानदंड से मेल खाने वाले कोई रिकॉर्ड नहीं हैं। कृपया अन्य फ़िल्टर आज़माएं।'
              : 'There are no active records matching the selected filters or search keywords. Try clearing filters.'}
          </p>
          {(searchQuery || selectedCategory !== 'all' || activeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setActiveFilter('all');
              }}
              className={`mt-4 px-4 py-2 rounded-xl text-xs font-bold transition ${highContrast ? 'bg-yellow-400 text-black' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {i18n.language === 'hi' ? 'फ़िल्टर साफ़ करें' : 'Reset Filters'}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredItems.map(item => {
            const isUpvoted = item.upvoted_by?.includes(userId);
            return (
              <motion.div
                layout
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`group p-5 rounded-2xl border-2 transition-all hover:shadow-xl hover:-translate-y-0.5 flex flex-col md:flex-row gap-5 cursor-pointer relative overflow-hidden ${
                  highContrast 
                    ? 'border-yellow-400 bg-black text-yellow-400' 
                    : 'border-[#E8DCC8] bg-white hover:border-[#1A237E]/40 shadow-sm'
                }`}
              >
                {/* UPVOTE COMPONENT */}
                <div className="flex md:flex-col items-center justify-center gap-2 shrink-0 md:border-r border-dashed border-[#E8DCC8] md:pr-5 min-w-[70px]">
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleUpvote(item, e)} 
                    className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
                      isUpvoted 
                        ? (highContrast ? 'bg-yellow-400 text-black' : 'bg-green-100 text-green-700 font-bold') 
                        : (highContrast ? 'border border-yellow-400 text-yellow-400' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600')
                    }`}
                  >
                    <ThumbsUp className={`w-5 h-5 ${isUpvoted ? 'fill-current' : ''}`} />
                  </motion.button>
                  <span className={`font-black text-base md:text-lg ${highContrast ? 'text-yellow-400' : 'text-[#1A237E]'}`}>
                    {item.upvotes || 0}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-black hidden md:block">
                    {i18n.language === 'hi' ? 'समर्थन' : 'Support'}
                  </span>
                </div>
                
                {/* MAIN CARD BODY */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {item.boardType === 'live' && (
                      <span className="bg-orange-50 border border-orange-200 text-orange-700 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-orange-600" />
                        {i18n.language === 'hi' ? 'लाइव आवश्यकता' : 'Live Need'}
                      </span>
                    )}
                    {item.boardType === 'resolved' && (
                      <span className="bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        {i18n.language === 'hi' ? 'समाधानित' : 'Resolved'}
                      </span>
                    )}
                    {item.boardType === 'project' && (
                      <span className="bg-purple-50 border border-purple-200 text-purple-700 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <Lightbulb className="w-3 h-3 text-purple-600" />
                        {i18n.language === 'hi' ? 'परियोजना' : 'Proposed Work'}
                      </span>
                    )}

                    {/* CATEGORY ICON & LABEL */}
                    {item.category && (
                      <span className={`px-2.5 py-1 border rounded-full text-xs font-bold flex items-center gap-1.5 ${highContrast ? 'border-yellow-400 text-yellow-400' : getCategoryColor(item.category)}`}>
                        {getCategoryIcon(item.category)}
                        {i18n.language === 'hi' ? t(`cat_${item.category.toLowerCase().replace('/schools', '').replace(' supply', '')}`) || item.category : item.category}
                      </span>
                    )}
                    
                    {item.urgency && getUrgencyBadge(item.urgency)}
                    
                    {item.timestamp && (
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3"/>
                        {formatDistanceToNow(new Date(item.timestamp), {addSuffix: true})}
                      </span>
                    )}
                  </div>

                  {/* TITLE */}
                  <DynamicText
                    as="h3"
                    className={`text-lg sm:text-xl font-bold mb-2 group-hover:text-[#1A237E] transition-colors leading-snug line-clamp-2 ${highContrast ? 'text-yellow-400' : 'text-slate-800'}`}
                    originalText={item.boardType === 'project' ? item.name : (item.text_original || item.text_english || '')}
                  />

                  {/* SHORT ISSUE SUMMARY FOR SUBMISSIONS */}
                  {item.issue_summary && item.issue_summary !== item.text_english && (
                    <p className="text-sm font-medium text-slate-500 mb-3 line-clamp-2 italic">
                      "{item.issue_summary}"
                    </p>
                  )}
                  
                  {item.boardType === 'project' && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2 leading-relaxed">{item.notes || 'A new development project proposed by your MP.'}</p>
                  )}

                  {/* RESOLVED PUBLIC NOTE QUICK BANNER */}
                  {item.boardType === 'resolved' && item.public_note && (
                    <div className="bg-blue-50/60 border-l-4 border-[#1A237E] p-3 mb-3 rounded-r-xl text-slate-700 text-sm">
                      <strong className="block text-xs uppercase text-[#1A237E] font-black mb-0.5">{i18n.language === 'hi' ? 'सांसद सार्वजनिक नोट:' : 'MP Resolution Note:'}</strong>
                      <p className="font-medium line-clamp-2">{item.public_note}</p>
                    </div>
                  )}
                  
                  {/* PHOTOS CAROUSEL COMPACT */}
                  {(item.photo_url || (item.photos && item.photos.length > 0)) && (
                    <div className="flex gap-2 mt-3 mb-4 overflow-hidden">
                      {item.photo_url && (
                        <div className="relative h-16 w-24 rounded-lg overflow-hidden border border-slate-200">
                          <img src={item.photo_url} alt="Evidence" className="h-full w-full object-cover" />
                        </div>
                      )}
                      {item.photos?.slice(0, 3).map((p: any, i: number) => (
                        <div key={i} className="relative h-16 w-24 rounded-lg overflow-hidden border border-slate-200">
                          <img src={p.url} alt="Evidence" className="h-full w-full object-cover" />
                        </div>
                      ))}
                      {item.photos && item.photos.length > 3 && (
                        <div className="h-16 w-16 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 text-xs font-bold text-slate-500">
                          +{item.photos.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* LOCATION & METADATA FOOTER */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-500 mt-2 pt-3 border-t border-dashed border-[#E8DCC8]">
                    <div className="flex items-center gap-1.5 max-w-[250px] truncate">
                      <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="truncate">
                        {(item.village_ward || item.district || item.location) 
                          ? `${item.village_ward || ''}${item.village_ward && item.district ? ', ' : ''}${item.district || ''}` 
                          : (i18n.language === 'hi' ? 'स्थान अनुपलब्ध' : 'Location not available')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.boardType !== 'project' && (
                        <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-md border">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.anonymous ? (i18n.language === 'hi' ? 'अनाम नागरिक' : 'Anonymous Citizen') : (item.name || (i18n.language === 'hi' ? 'नागरिक' : 'Citizen'))}</span>
                        </div>
                      )}
                      {item.boardType === 'project' && item.cost && (
                        <div className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md border border-purple-100">
                          <FileText className="w-3.5 h-3.5"/>
                          <span>{i18n.language === 'hi' ? `लागत: ₹${item.cost}` : `Cost: ₹${item.cost}`}</span>
                        </div>
                      )}
                      
                      <div className="text-xs text-[#1A237E] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>{i18n.language === 'hi' ? 'विवरण' : 'Details'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* DETAILED INFO DIALOG / MODAL */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className={`w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-left relative ${
                highContrast ? 'bg-black border-4 border-yellow-400 text-yellow-400' : 'bg-white text-slate-800'
              }`}
              onClick={(e) => e.stopPropagation()} // stop close on container click
            >
              {/* CLOSE BUTTON */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="overflow-y-auto pr-2 custom-scrollbar space-y-6">
                
                {/* HEADER MODAL */}
                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedItem.boardType === 'live' && (
                      <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3"/> {i18n.language === 'hi' ? 'लाइव कार्य अनुरोध' : 'Live Work Request'}
                      </span>
                    )}
                    {selectedItem.boardType === 'resolved' && (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3"/> {i18n.language === 'hi' ? 'समाधान किया गया' : 'Resolved Problem'}
                      </span>
                    )}
                    {selectedItem.boardType === 'project' && (
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <Lightbulb className="w-3 h-3"/> {i18n.language === 'hi' ? 'सांसद विकास योजना' : 'MP Proposed Work'}
                      </span>
                    )}
                    {selectedItem.category && (
                      <span className={`px-2.5 py-1 border rounded-full text-xs font-bold flex items-center gap-1.5 ${highContrast ? 'border-yellow-400' : getCategoryColor(selectedItem.category)}`}>
                        {getCategoryIcon(selectedItem.category)}
                        {i18n.language === 'hi' ? t(`cat_${selectedItem.category.toLowerCase().replace('/schools', '').replace(' supply', '')}`) || selectedItem.category : selectedItem.category}
                      </span>
                    )}
                    {selectedItem.urgency && getUrgencyBadge(selectedItem.urgency)}
                  </div>

                  <DynamicText
                    as="h2"
                    className={`text-2xl font-extrabold tracking-tight leading-snug ${highContrast ? 'text-yellow-400' : 'text-[#1A237E]'}`}
                    originalText={selectedItem.boardType === 'project' ? selectedItem.name : (selectedItem.text_original || selectedItem.text_english || '')}
                  />
                </div>

                {/* ORIGINAL TEXT (if translation occurred) */}
                {selectedItem.boardType !== 'project' && selectedItem.text_original && selectedItem.text_original !== selectedItem.text_english && (
                  <div className="p-4 rounded-xl border border-dashed bg-slate-50 text-sm">
                    <strong className="block text-xs uppercase text-slate-500 font-bold mb-1">
                      {i18n.language === 'hi' ? 'मूल विवरण (स्थानीय भाषा):' : 'Original Description (Native Language):'}
                    </strong>
                    <p className="text-slate-600 font-medium">"{selectedItem.text_original}"</p>
                  </div>
                )}

                {/* DETAILS / NOTES */}
                {selectedItem.boardType === 'project' ? (
                  <div className="space-y-4">
                    <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-100">
                      <strong className="block text-xs uppercase text-purple-800 font-bold mb-2">{i18n.language === 'hi' ? 'परियोजना नोट्स और विवरण:' : 'Project Notes & Scope:'}</strong>
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">{selectedItem.notes || 'No description provided.'}</p>
                    </div>
                    {selectedItem.cost && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl border">
                          <span className="text-xs font-bold text-slate-500 block">{i18n.language === 'hi' ? 'अनुमानित लागत:' : 'Estimated Cost:'}</span>
                          <span className="text-lg font-black text-[#1A237E]">₹{selectedItem.cost}</span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border">
                          <span className="text-xs font-bold text-slate-500 block">{i18n.language === 'hi' ? 'परियोजना की स्थिति:' : 'Project Status:'}</span>
                          <span className="text-lg font-black text-green-700">{selectedItem.status || 'Proposed'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // SUBMISSION ISSUE SUMMARY / AI ANALYSIS
                  <div className="space-y-4">
                    <div className="p-4 bg-orange-50/30 rounded-2xl border border-orange-100 text-sm">
                      <strong className="block text-xs uppercase text-orange-800 font-black mb-1">{i18n.language === 'hi' ? 'मुद्दे का सारांश:' : 'Issue Summary:'}</strong>
                      <p className="text-slate-700 font-medium">{selectedItem.issue_summary || 'An active civic concern reported by the citizen.'}</p>
                    </div>

                    {/* AI photo analysis results if present */}
                    {selectedItem.photo_analysis && !selectedItem.photo_analysis.analysis_failed && (
                      <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100 text-sm space-y-2">
                        <strong className="block text-xs uppercase text-[#1A237E] font-black">{i18n.language === 'hi' ? 'ऐआई (AI) फोटो सत्यापन रिपोर्ट:' : 'AI Photo Analysis Report:'}</strong>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 font-semibold pt-1">
                          <div>• {i18n.language === 'hi' ? 'संक्रमण प्रकार' : 'Damage Visible'}: <span className="text-slate-800 font-black">{selectedItem.photo_analysis.damage_visible ? 'Yes' : 'No'}</span></div>
                          <div>• {i18n.language === 'hi' ? 'अपेक्षित प्रभावित क्षेत्र' : 'Affected Area'}: <span className="text-slate-800 font-black">{selectedItem.photo_analysis.estimated_affected_area || 'Medium'}</span></div>
                          {selectedItem.photo_analysis.safety_concern && (
                            <div className="col-span-2 text-red-600 font-black flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 fill-current" />
                              {i18n.language === 'hi' ? 'सुरक्षा चिंता का पता चला' : 'Safety Concern Flagged'}
                            </div>
                          )}
                        </div>
                        {selectedItem.photo_analysis.actionable_insight && (
                          <p className="text-xs text-slate-500 italic mt-2 border-t pt-2 border-slate-200">
                            <strong>{i18n.language === 'hi' ? 'कार्रवाई योग्य अंतर्दृष्टि' : 'Actionable Insight'}:</strong> {selectedItem.photo_analysis.actionable_insight}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* MP RESOLUTION DETAIL BANNER */}
                {selectedItem.boardType === 'resolved' && (
                  <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-[#1A237E]/10 p-1.5 rounded-lg text-[#1A237E]">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <strong className="text-sm uppercase text-[#1A237E] font-black">{i18n.language === 'hi' ? 'सांसद कार्यालय आधिकारिक अद्यतन' : 'MP Office Action Report'}</strong>
                    </div>
                    {selectedItem.public_note ? (
                      <p className="text-slate-800 text-sm leading-relaxed font-semibold mb-3">{selectedItem.public_note}</p>
                    ) : (
                      <p className="text-slate-500 text-xs italic mb-3">This work request was resolved successfully on the ground.</p>
                    )}
                    {selectedItem.evidence && (
                      <div className="text-xs bg-white/80 p-2.5 rounded-lg border border-blue-100 inline-block font-bold text-slate-600">
                        🔗 {i18n.language === 'hi' ? 'समाधान का प्रमाण / आधिकारिक दस्तावेज' : 'Resolution Evidence/Doc'}: <span className="text-slate-900 font-black">{selectedItem.evidence}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* PHOTO CAROUSEL IN DETAILS */}
                {(selectedItem.photo_url || (selectedItem.photos && selectedItem.photos.length > 0)) && (
                  <div>
                    <strong className="block text-xs uppercase text-slate-500 font-bold mb-2">{i18n.language === 'hi' ? 'अपलोड की गई तस्वीरें:' : 'Submitted Media Evidence:'}</strong>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {selectedItem.photo_url && (
                        <a href={selectedItem.photo_url} target="_blank" rel="noopener noreferrer" className="relative shrink-0 block group">
                          <img src={selectedItem.photo_url} alt="Full scale" className="h-44 w-auto rounded-xl object-contain border border-slate-300 shadow-sm" />
                        </a>
                      )}
                      {selectedItem.photos?.map((p: any, i: number) => (
                        <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" className="relative shrink-0 block group">
                          <img src={p.url} alt="Full scale" className="h-44 w-auto rounded-xl object-contain border border-slate-300 shadow-sm" />
                        </a>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">*{i18n.language === 'hi' ? 'बड़ी तस्वीर देखने के लिए फोटो पर क्लिक करें' : 'Click photos to view full size'}</span>
                  </div>
                )}

                {/* TIMELINE / GEOGRAPHIC INFO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-dashed border-slate-200 text-xs font-bold text-slate-600">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase text-slate-400 block">{i18n.language === 'hi' ? 'भौगोलिक विवरण' : 'Location Details'}</span>
                    <div className="flex items-start gap-2 text-slate-800">
                      <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        {selectedItem.village_ward && <p className="font-extrabold">{selectedItem.village_ward}</p>}
                        {selectedItem.gram_panchayat_municipality && <p>{i18n.language === 'hi' ? 'ग्राम पंचायत' : 'Panchayat'}: {selectedItem.gram_panchayat_municipality}</p>}
                        <p>{selectedItem.district || selectedItem.district_en || ''}, {selectedItem.state || selectedItem.state_en || ''}</p>
                        {selectedItem.pincode && <p>{i18n.language === 'hi' ? 'पिनकोड' : 'Pincode'}: {selectedItem.pincode}</p>}
                        {selectedItem.loksabha_constituency && <p>{i18n.language === 'hi' ? 'लोकसभा निर्वाचन क्षेत्र' : 'Lok Sabha Constituency'}: <span className="text-[#1A237E] font-extrabold">{selectedItem.loksabha_constituency}</span></p>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] uppercase text-slate-400 block">{i18n.language === 'hi' ? 'विविध विवरण' : 'Submission Details'}</span>
                    <div className="space-y-1 text-slate-800">
                      <p>📋 {i18n.language === 'hi' ? 'संदर्भ आईडी' : 'Reference ID'}: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs select-all">{selectedItem.id}</span></p>
                      <p>👤 {i18n.language === 'hi' ? 'प्रस्तुतकर्ता' : 'Submitted By'}: {selectedItem.anonymous ? (i18n.language === 'hi' ? 'अनाम नागरिक' : 'Anonymous Citizen') : (selectedItem.name || (i18n.language === 'hi' ? 'नागरिक' : 'Citizen'))}</p>
                      {selectedItem.timestamp && (
                        <p>🕒 {i18n.language === 'hi' ? 'रिपोर्ट किया गया समय' : 'Reported'}: {new Date(selectedItem.timestamp).toLocaleString(i18n.language === 'hi' ? 'hi-IN' : 'en-US')}</p>
                      )}
                      {selectedItem.boardType !== 'project' && (
                        <p>🌐 {i18n.language === 'hi' ? 'पहचानी गई भाषा' : 'Detected Language'}: {selectedItem.language_detected || 'English'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* DIALOG ACTIONS (UPVOTE, COPY LINK, CLOSE) */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-dashed border-slate-200">
                  <button
                    onClick={(e) => handleUpvote(selectedItem)}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                      selectedItem.upvoted_by?.includes(userId)
                        ? (highContrast ? 'bg-yellow-400 text-black' : 'bg-green-600 text-white shadow')
                        : (highContrast ? 'border border-yellow-400 text-yellow-400' : 'bg-[#1A237E] hover:bg-[#111754] text-white shadow')
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {selectedItem.upvoted_by?.includes(userId) 
                      ? (i18n.language === 'hi' ? 'वोट वापस लें' : 'Upvoted / Support Registered') 
                      : (i18n.language === 'hi' ? `इस समस्या का समर्थन करें (${selectedItem.upvotes || 0})` : `Upvote / Support This Issue (${selectedItem.upvotes || 0})`)}
                  </button>

                  <button
                    onClick={(e) => handleShare(selectedItem, e)}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm text-slate-700 transition flex items-center justify-center gap-2"
                  >
                    {copiedId === selectedItem.id ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span>{i18n.language === 'hi' ? 'आईडी कॉपी की गई' : 'Copied ID!'}</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        <span>{i18n.language === 'hi' ? 'आईडी कॉपी करें' : 'Copy Ref ID'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedItem(null)}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm text-slate-700 transition block sm:hidden"
                  >
                    {i18n.language === 'hi' ? 'बंद करें' : 'Close'}
                  </button>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
