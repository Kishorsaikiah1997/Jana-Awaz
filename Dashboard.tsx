import DynamicText from './components/DynamicText';

import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useMemo } from 'react';
import { indiaData } from "./data/india_data";
import { db } from './firebase';
import { collection, query, orderBy, onSnapshot, where, doc, getDoc, setDoc, addDoc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Calendar, Building2, Map as MapIcon, Plus, Phone, Navigation, AlertTriangle, MapPin, Search, RefreshCw, ClipboardList, Globe, LogOut, Languages, BrainCircuit} from 'lucide-react';
import { Link } from 'react-router-dom';
import MapTab from './MapTab';
import AiInsightsTab from './components/AiInsightsTab';
import { SUPPORTED_LANGUAGES, T, useDynamicT } from "./i18n";

const URGENCY_COLORS: Record<string, string> = {
  'Critical': '#C62828',
  'High': '#E65100',
  'Medium': '#1A237E',
  'Low': '#2E7D32'
};

const STANDARD_DEPARTMENTS = [
  "PWD (Roads & Bridges)",
  "PHE (Water Supply & Sanitation)",
  "Irrigation & Embankments",
  "Disaster Relief & Floods",
  "District Collector Admin",
  "Health & Medical Dept",
  "Education & Schools",
  "Agriculture & Farmers Welfare",
  "Social Welfare",
  "APDCL (Power & Electricity)"
];

export default function Dashboard() {
  const { t } = useTranslation();
  const dynT = useDynamicT();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'constituency' | 'map' | 'review'>('today');
  const [activeFeedFilter, setActiveFeedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviewPeriod, setReviewPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'closed'>('all');
  const [constituencyTab, setConstituencyTab] = useState<'needs' | 'patterns' | 'schemes'>('needs');
  const [mpLanguage, setMpLanguage] = useState(() => localStorage.getItem("mp_dashboard_language") || "en");
  const [constituencySearch, setConstituencySearch] = useState('');
  const [showFabModal, setShowFabModal] = useState(false);
  const [actionFormData, setActionFormData] = useState({ actionType: '', statusUpdate: 'pending', closeReason: '', customCloseReason: '', evidence: '', department: '', note: '', publishToPublic: false });
  const [customActionType, setCustomActionType] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [isAnalyzingAction, setIsAnalyzingAction] = useState(false);
  const [aiSuggestedDepts, setAiSuggestedDepts] = useState<string[]>([]);
  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(null);
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [developmentGroups, setDevelopmentGroups] = useState<any[]>([]);
  const [isRefreshingIntel, setIsRefreshingIntel] = useState(false);
  const [proposedProjects, setProposedProjects] = useState<any[]>([]);
  const [projectForm, setProjectForm] = useState({ name: '', location: '', cost: '', status: 'Proposed', notes: '' });
  const [mpActions, setMpActions] = useState<any[]>([]);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [notificationStep, setNotificationStep] = useState(0);

  const [selectedConstituency, setSelectedConstituency] = useState(() => localStorage.getItem('selected_constituency') || 'Darrang-Udalguri');
  const [showConstituencyModal, setShowConstituencyModal] = useState(() => !localStorage.getItem('selected_constituency') && false);

  useEffect(() => {
    localStorage.setItem("mp_dashboard_language", mpLanguage);
  }, [mpLanguage]);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "mp_actions")), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(docSnap => data.push({ id: docSnap.id, ...docSnap.data() }));
      setMpActions(data);
    });
    return () => unsub();
  }, []);


  useEffect(() => {
    if (!selectedConstituency) {
      setLoading(false);
      return;
    }
    
    // Immediate clear to prevent old map data from remaining on screen during loading or if query fails
    setSubmissions([]);
    setLoading(true);

    let q = query(collection(db, "submissions"));
    if (selectedConstituency !== '— All Assam (Overview) —' && selectedConstituency !== '— All India (Overview) —') {
      q = query(collection(db, "submissions"), where("lok_sabha_en", "==", selectedConstituency));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(docSnap => {
        data.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort manually to avoid need for composite index when using where()
      data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setSubmissions(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching submissions:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedConstituency]);

  useEffect(() => {
    setDevelopmentGroups([]);
    if (!selectedConstituency) return;

    const fetchIntel = async () => {
      try {
        const safeId = selectedConstituency.replace(/[^a-zA-Z0-9]/g, '_');
        const docRef = doc(db, 'constituency_intelligence', `dev_groups_${safeId}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDevelopmentGroups(docSnap.data().groups || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchIntel();
  }, [selectedConstituency]);

  useEffect(() => {
    if (!selectedConstituency) return;
    
    setProposedProjects([]); // Clear old projects

    let q = query(collection(db, "development_projects"));
    if (selectedConstituency !== '— All Assam (Overview) —' && selectedConstituency !== '— All India (Overview) —') {
      q = query(collection(db, "development_projects"), where("lok_sabha_en", "==", selectedConstituency));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(docSnap => {
        data.push({ id: docSnap.id, ...docSnap.data() });
      });
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setProposedProjects(data);
    });
    return () => unsubscribe();
  }, [selectedConstituency]);

  const refreshIntelligence = async () => {
    setIsRefreshingIntel(true);
    try {
      const devSubmissions = submissions.filter(s => s.submission_type === 'DEVELOPMENT_NEED' || s.submission_type === 'DEVELOPMENT NEED').slice(0, 50);
      const response = await fetch('/api/generate-constituency-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissions: devSubmissions })
      });
      const result = await response.json();
      if (result.success && result.data) {
        setDevelopmentGroups(result.data);
        const safeId = selectedConstituency.replace(/[^a-zA-Z0-9]/g, '_');
        await setDoc(doc(db, 'constituency_intelligence', `dev_groups_${safeId}`), { groups: result.data, updated_at: new Date().toISOString() });
      }
    } catch (error) {
      console.error("Failed to refresh intelligence", error);
    } finally {
      setIsRefreshingIntel(false);
    }
  };

  const [isRefreshingInsights, setIsRefreshingInsights] = useState(false);
  const [analyzingPhotoId, setAnalyzingPhotoId] = useState<string | null>(null);

  const triggerRefreshInsights = async () => {
    setIsRefreshingInsights(true);
    try {
      const response = await fetch('/api/refresh-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      if (result.success) {
        alert(t('Insights and Priorities refreshed successfully!'));
      } else {
        alert(`Failed to refresh: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Failed to refresh insights:", error);
      alert('Failed to refresh insights. Please try again.');
    } finally {
      setIsRefreshingInsights(false);
    }
  };

  const handleRequestDetailCheck = async (id: string) => {
    setAnalyzingPhotoId(id);
    try {
      const response = await fetch(`/api/submissions/${id}/analyze-vision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      if (result.success) {
        alert(t('Photo analyzed successfully!'));
      } else {
        alert(`Analysis failed: ${result.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to request detail check. Please try again.');
    } finally {
      setAnalyzingPhotoId(null);
    }
  };

  const [actionModalSubmissions, setActionModalSubmissions] = useState<string[]>([]);

  const suggestActionWithAi = async (ids: string[], actionType: string, currentDepts?: string[]) => {
    if (!ids || ids.length === 0) return;
    setIsAnalyzingAction(true);
    try {
      const response = await fetch('/api/suggest-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_ids: ids,
          action_type: actionType || 'Forwarded to Department',
          selected_departments: currentDepts
        })
      });
      const result = await response.json();
      if (result.success && result.data) {
        const { suggested_departments, drafted_note } = result.data;
        
        // If currentDepts is not specified, use suggested departments
        const deptsToSelect = currentDepts && currentDepts.length > 0 
          ? currentDepts 
          : (suggested_departments || []);
          
        setSelectedDepartments(deptsToSelect);
        setAiSuggestedDepts(suggested_departments || []);
        
        setActionFormData(prev => ({
          ...prev,
          note: drafted_note || prev.note,
          department: deptsToSelect.join(', ')
        }));
      }
    } catch (e) {
      console.error("Failed to fetch AI suggestions:", e);
    } finally {
      setIsAnalyzingAction(false);
    }
  };

  useEffect(() => {
    if (actionModalSubmissions.length > 0) {
      const defaultActionType = actionFormData.actionType || 'Forwarded to Department';
      suggestActionWithAi(actionModalSubmissions, defaultActionType);
    } else {
      setSelectedDepartments([]);
      setAiSuggestedDepts([]);
    }
  }, [actionModalSubmissions]);

  useEffect(() => {
    setActionFormData(prev => ({ ...prev, department: selectedDepartments.join(', ') }));
  }, [selectedDepartments]);

  const takeAction = async () => {
    const finalActionType = actionFormData.actionType === 'Others' ? customActionType : actionFormData.actionType;
    let finalEvidence = actionFormData.evidence;
    if (actionFormData.statusUpdate === 'resolved' || actionFormData.statusUpdate === 'closed') {
      finalEvidence = actionFormData.closeReason === 'Others' ? actionFormData.customCloseReason : actionFormData.closeReason;
      if (actionFormData.evidence) {
        finalEvidence += " - " + actionFormData.evidence;
      }
    }

    if (!finalActionType || actionModalSubmissions.length === 0) return;

    try {
      setIsSubmittingAction(true);
      setNotificationStep(1); // Step 1: Recording to db

      for (const id of actionModalSubmissions) {
        // 1. Add official action record
        await addDoc(collection(db, "mp_actions"), {
          submission_id: id,
          action_type: finalActionType,
          status_update: actionFormData.statusUpdate,
          evidence: finalEvidence,
          department: actionFormData.department,
          action_date: new Date().toISOString(),
          citizen_visible_note: actionFormData.note,
          expected_resolution_date: '',
          mp_name: 'MP Office'
        });
        
        // 2. Always update the core submission record status, last action metadata, and public notes
        const subRef = doc(db, 'submissions', id);
        await updateDoc(subRef, { 
          status: actionFormData.statusUpdate, 
          evidence: finalEvidence || '', 
          published_to_public: actionFormData.publishToPublic, 
          public_note: actionFormData.note,
          last_action_taken: finalActionType,
          last_action_date: new Date().toISOString(),
          last_action_note: actionFormData.note,
          department: actionFormData.department || ''
        });
      }

      // Step 2: Pre-compiling SMS & App alerts
      setNotificationStep(2);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Dispatching Notifications to citizens
      setNotificationStep(3);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Dispatch Complete
      setNotificationStep(4);
      await new Promise(resolve => setTimeout(resolve, 800));

      setActionModalSubmissions([]);
      setActionFormData({ actionType: '', statusUpdate: 'pending', closeReason: '', customCloseReason: '', evidence: '', department: '', note: '', publishToPublic: false });
      setCustomActionType('');
      setIsSubmittingAction(false);
      setNotificationStep(0);
    } catch (error) {
      console.error("Failed to take action", error);
      alert("Failed to record action. Please try again.");
      setIsSubmittingAction(false);
      setNotificationStep(0);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `Just now`;
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const getSeverityWeight = (severity: string) => {
    if (severity === 'Critical') return 4;
    if (severity === 'High') return 3;
    if (severity === 'Medium') return 2;
    if (severity === 'Low') return 1;
    return 0;
  };

  const emergencies = useMemo(() => {
    return submissions.filter(s => 
      s.submission_type === 'EMERGENCY' && s.status !== 'resolved'
    );
  }, [submissions]);

  const serviceFailures = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return submissions.filter(s => 
      (s.submission_type === 'SERVICE_FAILURE' || s.submission_type === 'SERVICE FAILURE') && 
      new Date(s.timestamp) >= sevenDaysAgo
    ).sort((a, b) => {
      const weightA = getSeverityWeight(a.urgency);
      const weightB = getSeverityWeight(b.urgency);
      if (weightA !== weightB) return weightB - weightA;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [submissions]);

  // Unified Feed Logic
  const feedSubmissions = useMemo(() => {
    let baseList = [];
    if (activeFeedFilter === 'all') baseList = submissions;
    else if (activeFeedFilter === 'emergencies') baseList = emergencies;
    else if (activeFeedFilter === 'service') baseList = serviceFailures;
    else {
      // Cross-filtering by theme
      const group = developmentGroups.find(g => g.group_name === activeFeedFilter);
      if (!group) {
        baseList = [];
      } else {
        if (group.submission_ids && Array.isArray(group.submission_ids)) {
          baseList = submissions.filter(s => group.submission_ids.includes(s.id));
        } else {
          const groupNameLower = group.group_name.toLowerCase();
          const keywords = groupNameLower.split(' ').filter((w: string) => w.length > 3);
          baseList = submissions.filter(s => {
            if (s.submission_type !== 'DEVELOPMENT_NEED' && s.submission_type !== 'DEVELOPMENT NEED') return false;
            const textLower = (s.text_english || s.text_original || '').toLowerCase();
            const matchesText = keywords.some((w: string) => textLower.includes(w));
            const matchesTags = s.tags && s.tags.some((t: string) => t.toLowerCase().includes(keywords[0] || ''));
            const matchesVillage = group.villages_affected?.includes(s.village_ward);
            return matchesText || matchesTags || matchesVillage;
          });
        }
      }
    }
    
    // Apply search query filter if searchQuery is provided
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      baseList = baseList.filter(s => 
        (s.id || '').toLowerCase().includes(q) ||
        (s.text_english || s.text_original || '').toLowerCase().includes(q) ||
        (s.name || '').toLowerCase().includes(q) ||
        (s.phone || s.phone_number || '').toLowerCase().includes(q) ||
        (s.village_ward || '').toLowerCase().includes(q)
      );
    }

    let filteredList = [];
    if (statusFilter === 'all') {
      // Keep actioned ones accessible at the bottom rather than filtering them out entirely!
      filteredList = baseList;
    } else {
      filteredList = baseList.filter(s => (s.status || 'pending') === statusFilter);
    }

    // Sort: Pending/Unacted first, then Resolved, then Closed
    return [...filteredList].sort((a, b) => {
      const statusOrder = (status: string) => {
        const s = status || 'pending';
        if (s === 'pending') return 0;
        if (s === 'resolved') return 1;
        if (s === 'closed') return 2;
        return 3;
      };

      const orderA = statusOrder(a.status);
      const orderB = statusOrder(b.status);

      if (orderA !== orderB) {
        return orderA - orderB; // Pending (0) comes before Resolved (1) and Closed (2)
      }

      // Within same status, sort by date newest first
      return new Date(b.timestamp || Date.now()).getTime() - new Date(a.timestamp || Date.now()).getTime();
    });
  }, [submissions, emergencies, serviceFailures, developmentGroups, activeFeedFilter, statusFilter, searchQuery]);

  // MP Audit Review & Report calculations
  const reviewStats = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();
    if (reviewPeriod === 'weekly') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (reviewPeriod === 'monthly') {
      cutoffDate.setDate(now.getDate() - 30);
    } else {
      cutoffDate.setDate(now.getDate() - 365);
    }

    const filtered = submissions.filter(s => new Date(s.timestamp || Date.now()) >= cutoffDate);
    const total = filtered.length;
    const pending = filtered.filter(s => (s.status || 'pending') === 'pending').length;
    const resolved = filtered.filter(s => s.status === 'resolved').length;
    const closed = filtered.filter(s => s.status === 'closed').length;
    const resolutionRate = total > 0 ? Math.round(((resolved + closed) / total) * 100) : 0;

    // Distribution by Type
    const typeDistribution: Record<string, number> = {};
    filtered.forEach(s => {
      const type = s.submission_type || 'REQUEST';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    return {
      total,
      pending,
      resolved,
      closed,
      resolutionRate,
      typeDistribution,
      filteredSubmissions: filtered
    };
  }, [submissions, reviewPeriod]);

  const schemeOpportunities = useMemo(() => {
    const counts: Record<string, { count: number, department: string, districts: Set<string> }> = {};
    developmentGroups.forEach(g => {
      if (g.relevant_scheme) {
        const scheme = g.relevant_scheme;
        if (!counts[scheme]) {
          counts[scheme] = { count: 0, department: g.scheme_department || 'Unknown', districts: new Set() };
        }
        counts[scheme].count += (g.submission_count || 1);
        if (g.districts_affected) {
          g.districts_affected.forEach((d: string) => counts[scheme].districts.add(d));
        }
      }
    });
    return Object.entries(counts).map(([scheme, data]) => ({
      scheme,
      count: data.count,
      department: data.department,
      districts: Array.from(data.districts)
    })).sort((a, b) => b.count - a.count);
  }, [developmentGroups]);

  const servicePatterns = useMemo(() => {
    const serviceSubs = submissions.filter(s => s.submission_type === 'SERVICE_FAILURE' || s.submission_type === 'SERVICE FAILURE');
    const counts: Record<string, { count: number, villages: Set<string>, recent: string }> = {};
    serviceSubs.forEach(s => {
      const cat = s.category || 'Other';
      if (!counts[cat]) {
        counts[cat] = { count: 0, villages: new Set(), recent: s.timestamp };
      }
      counts[cat].count++;
      if (s.village_ward) counts[cat].villages.add(s.village_ward);
      if (new Date(s.timestamp) > new Date(counts[cat].recent)) {
        counts[cat].recent = s.timestamp;
      }
    });
    return Object.entries(counts).map(([sector, data]) => ({
      sector,
      count: data.count,
      villages: Array.from(data.villages),
      recent: data.recent
    })).sort((a, b) => b.count - a.count);
  }, [submissions]);

  const quickStats = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    let thisWeek = 0;
    let totalEmergencies = 0;
    let totalDevelopment = 0;
    let totalServiceFailures = 0;

    submissions.forEach(s => {
      const d = new Date(s.timestamp);
      if (d >= sevenDaysAgo) {
        thisWeek++;
      }
      if (s.submission_type === 'EMERGENCY') totalEmergencies++;
      if (s.submission_type === 'DEVELOPMENT_NEED' || s.submission_type === 'DEVELOPMENT NEED') totalDevelopment++;
      if (s.submission_type === 'SERVICE_FAILURE' || s.submission_type === 'SERVICE FAILURE') totalServiceFailures++;
    });

    return { thisWeek, totalEmergencies, totalDevelopment, totalServiceFailures };
  }, [submissions]);


  const saveProject = () => {
    if (!projectForm.name) return;
    const newProject = {
      ...projectForm,
      id: "PROJ-" + Math.random().toString(36).substr(2, 6).toUpperCase(),
      created_at: new Date().toISOString()
    };
    setProposedProjects([newProject, ...proposedProjects]);
    setProjectForm({ name: '', location: '', cost: '', status: 'Proposed', notes: '' });
    setShowFabModal(false);
  };
  const handleDirections = (s: any) => {
    if (s.location && s.location.lat && s.location.lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${s.location.lat},${s.location.lng}`, '_blank');
    } else {
      const query = [s.village_ward, s.district_en, "Assam"].filter(Boolean).join(" ");
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
    }
  };

  const getProjectSupport = (project: any) => {
    let count = 0;
    developmentGroups.forEach(g => {
      const projectNameWords = project.name.toLowerCase().split(' ').filter((w: string) => w.length > 3);
      const groupNameLower = g.group_name.toLowerCase();
      if (projectNameWords.some((w: string) => groupNameLower.includes(w))) {
        count += (g.submission_count || 1);
      }
    });
    
    // Fallback simple keyword match with raw submissions if no groups match
    if (count === 0) {
      const devSubs = submissions.filter(s => s.submission_type === 'DEVELOPMENT_NEED' || s.submission_type === 'DEVELOPMENT NEED');
      const projectNameWords = project.name.toLowerCase().split(' ').filter((w: string) => w.length > 3);
      devSubs.forEach(s => {
        const textLower = (s.text_english || s.text_original || '').toLowerCase();
        if (projectNameWords.some((w: string) => textLower.includes(w))) {
          count++;
        }
      });
    }

    const strength = count >= 5 ? 'Strong' : count >= 2 ? 'Moderate' : 'Weak';
    const color = count >= 5 ? 'bg-[#2E7D32]' : count >= 2 ? 'bg-[#FF9933]' : 'bg-[#9E9E9E]';
    return { count, strength, color };
  };

  const LANGUAGE_NAME_TO_CODE: Record<string, string> = {
    'English': 'en',
    'Hindi': 'hi',
    'Assamese': 'as',
    'Bengali': 'bn',
    'Tamil': 'ta',
    'Telugu': 'te',
    'Kannada': 'kn',
    'Malayalam': 'ml',
    'Gujarati': 'gu',
    'Odia': 'or',
    'Punjabi': 'pa',
    'Urdu': 'ur'
  };

  const ExpandableText = ({ text, originalText, submissionLanguage = "English", lines = 3 }: { text: string, originalText?: string, submissionLanguage?: string, lines?: number }) => {
    const [expanded, setExpanded] = useState(false);
    const [translatedText, setTranslatedText] = useState("");
    const [showTranslation, setShowTranslation] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
      // Clear translation state if mpLanguage changes so they get a fresh translation on demand
      setTranslatedText("");
      setShowTranslation(false);
    }, [mpLanguage]);

    const handleTranslate = async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (showTranslation) {
        setShowTranslation(false);
        return;
      }
      
      if (translatedText) {
        setShowTranslation(true);
        return;
      }

      setIsTranslating(true);
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: [text], targetLanguage: mpLanguage })
        });
        const data = await response.json();
        if (data.success && data.translations && data.translations.length > 0) {
          setTranslatedText(data.translations[0]);
          setShowTranslation(true);
        }
      } catch (e) {
        console.error("Translation failed", e);
      } finally {
        setIsTranslating(false);
      }
    };

    const displayText = showTranslation && translatedText ? translatedText : (originalText || text);

    return (
      <div className="relative group">
        <p className={`text-[14px] text-[#1A1A2E] italic ${!expanded ? 'line-clamp-3' : ''}`}>
          "{displayText}"
        </p>
        
        <div className="flex items-center gap-3 mt-1.5">
          {displayText && displayText.length > 100 && (
            <button 
              onClick={() => setExpanded(!expanded)} 
              className="text-[11px] text-[#FF9933] font-bold uppercase tracking-wider"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
          
          <button 
            onClick={handleTranslate}
            disabled={isTranslating}
            className="inline-flex items-center gap-1.5 text-[11px] text-[#1A237E] bg-[#E8EAF6] hover:bg-[#C5CAE9] px-2 py-1 rounded font-bold transition disabled:opacity-50"
          >
            {isTranslating ? (
              <><RefreshCw className="w-3 h-3 animate-spin" /> Translating...</>
            ) : (
              <><Languages className="w-3.5 h-3.5" /> {showTranslation ? "Show Original" : `Translate to ${mpLanguage.toUpperCase()}`}</>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F5F0] font-sans flex flex-col w-full relative">
      {/* 🌐 TOP BAR ACCESSIBILITY CONTROL PANEL */}
      <header className="relative overflow-hidden transition-all duration-300 bg-[#FFFEF7] border-b border-[#E8DCC8] shadow-sm shrink-0">
        <div className="absolute -inset-4 bg-cover bg-center bg-no-repeat opacity-[0.65] pointer-events-none" style={{ backgroundImage: "url('/header-bg.webp?v=2')" }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 relative z-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Brand & Tagline Column */}
          <div className="flex-1 flex flex-col justify-between gap-4">
            {/* Logo and Titles */}
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <svg className="w-16 h-16 shrink-0 filter drop-shadow-md" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Concentric split-color rings */}
                  <circle cx="50" cy="50" r="46" stroke="#4CAF72" strokeWidth="4" />
                  <circle cx="50" cy="50" r="40" stroke="#FFB347" strokeWidth="4" />
                  <circle cx="50" cy="50" r="37" fill="#1B5E20" />
                  
                  {/* Speech bubble */}
                  <path d="M 50,24 C 41,24 34,29 34,35 C 34,39 37,42 42,44 L 40,51 L 48,47 C 49,47 49.5,47 50,47 C 59,47 66,42 66,35 C 66,29 59,24 50,24 Z" fill="#FFFEF7" />
                  <circle cx="44" cy="34" r="2" fill="#1B5E20" />
                  <circle cx="50" cy="34" r="2" fill="#1B5E20" />
                  <circle cx="56" cy="34" r="2" fill="#1B5E20" />
                  
                  {/* Citizens silhouettes */}
                  <circle cx="50" cy="55" r="7" fill="#FFFEF7" />
                  <path d="M 38,76 C 38,65 44,63 50,63 C 56,63 62,65 62,76" fill="#FFFEF7" />
                  <circle cx="39" cy="61" r="5" fill="#FFE0B2" />
                  <path d="M 29,76 C 29,68 34,67 39,67 C 44,67 46,68 46,76" fill="#FFE0B2" />
                  <circle cx="61" cy="61" r="5" fill="#FFE0B2" />
                  <path d="M 54,76 C 54,68 56,67 61,67 C 66,67 71,68 71,76" fill="#FFE0B2" />
                </svg>
              </div>
              <div className="text-left flex flex-col gap-0.5">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight flex flex-wrap items-baseline gap-1.5 leading-none mb-1">
                  <span className="text-[#FFB347] font-extrabold">Jan</span>
                  <span className="text-[#2E7D32] font-black">Awaaz</span>
                </h1>
                <div className="text-[13px] md:text-[14px] font-bold flex items-center gap-2 text-[#1A237E]">
                  <div className="w-2 h-2 rounded-full bg-[#FF9933] animate-pulse"></div>
                  <span>{String(t("MP Command Center"))}</span>
                </div>
              </div>
            </div>
            {/* Tagline */}
            <div className="flex items-start sm:items-center gap-2.5 py-1 px-1 text-xs md:text-[13px] font-semibold text-[#3E2723] max-w-md">
              <svg className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0 text-[#2E7D32]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div className="flex flex-wrap items-center gap-x-1.5 leading-relaxed">
                <span>{String(t("Track, analyze, and manage citizen submissions in real-time"))}</span>
              </div>
            </div>
          </div>

          {/* Right Side Column (Controls) */}
          <div className="flex flex-col justify-end items-end gap-4 relative min-w-[280px]">
            <div className="flex flex-wrap items-center justify-end gap-3 w-full relative z-30">
               
               <select
                 value={mpLanguage}
                 onChange={(e) => setMpLanguage(e.target.value)}
                 className="px-3 py-1.5 rounded-xl border-2 border-[#C8B99A] text-[#1A237E] font-bold text-xs flex items-center gap-1.5 bg-[#FFFEF7] hover:bg-[#FDF6E3] shadow-sm transition outline-none cursor-pointer appearance-none"
                 style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231A237E%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.8em top 50%', backgroundSize: '0.65em auto', paddingRight: '2.5em' }}
               >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code} className="text-slate-800">{lang.nativeName}</option>
                ))}
              </select>

               

              <Link to="/" className="px-3 py-1.5 rounded-xl border-2 border-[#1A237E] text-[#1A237E] font-bold text-xs flex items-center gap-1.5 bg-[#FFFEF7] hover:bg-[#FDF6E3] shadow-sm transition">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{String(t("Citizen Portal"))}</span>
              </Link>
              <button 
                onClick={() => { localStorage.removeItem('jan_awaaz_user'); window.location.href = '/login'; }}
                className="px-3 py-1.5 rounded-xl border-2 border-red-600 text-red-600 font-bold text-xs flex items-center gap-1.5 bg-[#FFFEF7] hover:bg-red-50 shadow-sm transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{String(t("Logout"))}</span>
              </button>
            </div>
            
            <div className="flex w-full mt-2">
               {selectedConstituency && (
                 <button 
                   onClick={() => setShowConstituencyModal(true)}
                   className="w-full bg-gradient-to-r from-[#FF9933] to-[#E65100] rounded-xl p-3 md:p-4 flex items-center justify-between shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition group border border-[#FFB347]/50"
                   title="Change Constituency"
                 >
                   <div className="flex items-center gap-3">
                     <div className="bg-white/20 p-2.5 rounded-lg shadow-sm border border-white/20">
                       <MapPin className="w-5 h-5 text-white" />
                     </div>
                     <div className="text-left flex flex-col">
                       <span className="text-white/90 text-[10px] font-black uppercase tracking-widest mb-0.5">Constituency</span>
                       <span className="text-white text-[15px] font-black truncate max-w-[180px] drop-shadow-sm">
                         {selectedConstituency === '— All Assam (Overview) —' ? 'All Assam Overview' : 
                          selectedConstituency === '— All India (Overview) —' ? 'All India Overview' : 
                          selectedConstituency}
                       </span>
                     </div>
                   </div>
                   <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition shrink-0 shadow-sm border border-white/10">
                     <RefreshCw className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-300" />
                   </div>
                 </button>
               )}
            </div>
          </div>
        </div>
      </header>

      {/* HORIZONTAL TAB NAVIGATION */}
      <div className="bg-[#FFFEF7] border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2.5">
            <button 
              onClick={() => setActiveTab('today')} 
              className={`whitespace-nowrap flex items-center gap-2 px-5 py-3 rounded-2xl transition-all duration-200 ${
                activeTab === 'today' 
                  ? 'bg-[#1A237E] text-white shadow-md font-black scale-102' 
                  : 'text-[#4A5568] hover:bg-slate-100 font-bold hover:text-[#1A237E]'
              }`}
            >
              <Calendar className="w-4 h-4 text-[#FF9933]" />
              <span className="text-[14px]">Live Feed</span>
              <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${
                activeTab === 'today' ? 'bg-white text-[#1A237E]' : 'bg-slate-200 text-[#4A5568]'
              }`}>
                {submissions.length}
              </span>
            </button>
            
            <button 
              onClick={() => setActiveTab('review')} 
              className={`whitespace-nowrap flex items-center gap-2 px-5 py-3 rounded-2xl transition-all duration-200 ${
                activeTab === 'review' 
                  ? 'bg-[#1A237E] text-white shadow-md font-black scale-102' 
                  : 'text-[#4A5568] hover:bg-slate-100 font-bold hover:text-[#1A237E]'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-[#FF9933]" />
              <span className="text-[14px]">MP Review & Analytics</span>
              <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${
                activeTab === 'review' ? 'bg-white text-[#1A237E]' : 'bg-slate-200 text-[#4A5568]'
              }`}>
                {submissions.length}
              </span>
            </button>

            <button 
              onClick={() => setActiveTab('constituency')} 
              className={`whitespace-nowrap flex items-center gap-2 px-5 py-3 rounded-2xl transition-all duration-200 ${
                activeTab === 'constituency' 
                  ? 'bg-[#1A237E] text-white shadow-md font-black scale-102' 
                  : 'text-[#4A5568] hover:bg-slate-100 font-bold hover:text-[#1A237E]'
              }`}
            >
              <BrainCircuit className="w-4 h-4 text-[#FF9933]" />
              <span className="text-[14px]">Quick AI Insights</span>
              <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${
                activeTab === 'constituency' ? 'bg-white text-[#1A237E]' : 'bg-slate-200 text-[#4A5568]'
              }`}>
                {developmentGroups.length}
              </span>
            </button>
            
            <button 
              onClick={() => setActiveTab('map')} 
              className={`whitespace-nowrap flex items-center gap-2 px-5 py-3 rounded-2xl transition-all duration-200 ${
                activeTab === 'map' 
                  ? 'bg-[#1A237E] text-white shadow-md font-black scale-102' 
                  : 'text-[#4A5568] hover:bg-slate-100 font-bold hover:text-[#1A237E]'
              }`}
            >
              <MapIcon className="w-4 h-4 text-[#FF9933]" />
              <span className="text-[14px]">Demands Hotspots</span>
              <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${
                activeTab === 'map' ? 'bg-white text-[#1A237E]' : 'bg-slate-200 text-[#4A5568]'
              }`}>
                {submissions.filter(s => s.location?.lat).length}
              </span>
            </button>


            <div className="flex-1" />
            <button 
              onClick={triggerRefreshInsights}
              disabled={isRefreshingInsights}
              className="whitespace-nowrap bg-slate-100 hover:bg-slate-200 text-[#1A237E] border border-slate-200 rounded-full px-4 py-2 font-bold text-xs md:text-sm transition flex items-center justify-center gap-2 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isRefreshingInsights ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Insights</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONSTITUENCY SELECTOR MODAL */}
      {showConstituencyModal && (
        <div className="fixed inset-0 bg-[#1A237E]/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="p-6 md:p-8 bg-gradient-to-br from-[#1A237E] to-[#121858] text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <MapIcon className="w-24 h-24 transform translate-x-4 -translate-y-4" />
              </div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <h2 className="text-[20px] md:text-[24px] font-black tracking-tight mb-1">{String(t("Select Constituency"))}</h2>
                  <p className="text-blue-200 text-[13px] md:text-[14px] font-medium">{String(t("Choose a constituency to view localized data."))}</p>
                </div>
                <button 
                  onClick={() => setShowConstituencyModal(false)}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 md:p-6 max-h-[60vh] overflow-y-auto bg-slate-50/50">
              <div className="mb-4 sticky top-0 z-10">
                <input
                  type="text"
                  placeholder="Search constituency..."
                  value={constituencySearch}
                  onChange={(e) => setConstituencySearch(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-[#1A237E] outline-none text-[14px]"
                />
              </div>
              <div className="space-y-2">
                {Array.from(new Set(["— All India (Overview) —"].concat(indiaData.states.flatMap(s => s.lok_sabha.map(l => l.name_en)).sort())))
                  .filter(c => c.toLowerCase().includes(constituencySearch.toLowerCase()))
                  .map((c, idx) => (
                  <button
                    key={`${c}-${idx}`}
                    onClick={() => {
                      setSelectedConstituency(c);
                      localStorage.setItem('selected_constituency', c);
                      setShowConstituencyModal(false);
                    }}
                    className={`w-full text-left px-5 py-4 rounded-2xl transition-all border-2 flex items-center justify-between group ${
                      c === selectedConstituency 
                        ? 'bg-[#E8EAF6] border-[#1A237E] text-[#1A237E] shadow-sm' 
                        : 'bg-white border-slate-100 hover:border-[#1A237E]/30 text-slate-700 hover:shadow-sm'
                    }`}
                  >
                    <span className="font-bold text-[14px] md:text-[15px]">{c}</span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      c === selectedConstituency
                        ? 'border-[#1A237E] bg-[#1A237E]'
                        : 'border-slate-300 group-hover:border-[#1A237E]/50'
                    }`}>
                      {c === selectedConstituency && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 pb-[60px] md:pb-0 relative flex flex-col w-full">
        
        {loading || !selectedConstituency ? (
          <div className="p-4 space-y-4">
            <div className="h-[120px] bg-slate-200 rounded-xl animate-pulse"></div>
            <div className="h-[120px] bg-slate-200 rounded-xl animate-pulse"></div>
            <div className="h-[120px] bg-slate-200 rounded-xl animate-pulse"></div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-4 text-center">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8DCC8] max-w-sm">
              <span className="text-4xl mb-4 block">{String(t("🏛️"))}</span>
              <h2 className="text-[#1A237E] font-bold text-[16px] mb-2">{String(t("No submissions yet"))}</h2>
              <p className="text-[#6B7280] text-[13px] mb-6">
                No submissions yet{selectedConstituency ? ` from ${selectedConstituency === '— All Assam (Overview) —' ? 'Assam' : selectedConstituency === '— All India (Overview) —' ? 'India' : selectedConstituency}` : ''}. Share the Jan Awaaz portal link with your constituents to start receiving their voices.
              </p>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin);
                  alert('Link copied!');
                }}
                className="w-full border-2 border-[#1A237E] text-[#1A237E] rounded-xl py-3 font-bold text-[14px] hover:bg-[#1A237E] hover:text-white transition"
              >
                {t("Copy Portal Link")}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 🚨 CRITICAL EMERGENCY HIGHLIGHT BANNER (CORRECTED POSITION: BELOW HEADER/NAVIGATION) */}
            {activeTab === 'today' && emergencies.length > 0 && (
              <div className="bg-gradient-to-r from-red-50 via-red-100/40 to-red-50 border-b-2 border-red-200 px-4 py-5 md:py-6 shadow-inner">
                <div className="max-w-7xl mx-auto space-y-4">
                  <div className="flex items-center gap-2 border-b border-red-200 pb-2">
                    <span className="bg-red-600 text-white animate-pulse text-[10px] font-black px-2.5 py-0.5 rounded-md tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      ACTIVE LIFE-RISK EMERGENCIES ({emergencies.length})
                    </span>
                    <p className="text-xs text-red-700 font-extrabold hidden md:inline">
                      &bull; Action portal: Connect to nearby authorities, view directions, or call the citizen directly.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {emergencies.map((e) => {
                      // Determine emergency contacts based on category / keywords
                      let contactInfo = {
                        authority: 'National Emergency Helpline',
                        phone: '112',
                        responsible: 'Emergency Response Center'
                      };
                      const catLower = (e.category || '').toLowerCase();
                      const textLower = (e.text_english || e.text_original || '').toLowerCase();
                      
                      if (catLower.includes('flood') || catLower.includes('disaster') || textLower.includes('flood') || textLower.includes('landslide')) {
                        contactInfo = {
                          authority: 'Disaster Response (SDRF)',
                          phone: '1077',
                          responsible: 'State Disaster Management Control Room'
                        };
                      } else if (catLower.includes('medical') || catLower.includes('accident') || textLower.includes('accident') || textLower.includes('injury') || textLower.includes('hospital')) {
                        contactInfo = {
                          authority: 'Ambulance Support',
                          phone: '108',
                          responsible: 'Emergency Medical Dispatch Unit'
                        };
                      } else if (catLower.includes('fire') || textLower.includes('fire') || textLower.includes('smoke')) {
                        contactInfo = {
                          authority: 'Fire Department',
                          phone: '101',
                          responsible: 'District Fire Station Dispatcher'
                        };
                      } else if (catLower.includes('crime') || catLower.includes('safety') || textLower.includes('police') || textLower.includes('theft')) {
                        contactInfo = {
                          authority: 'Assam Police Control Room',
                          phone: '100',
                          responsible: e.police_station ? `PS ${e.police_station}` : 'Local Police Authority'
                        };
                      } else {
                        contactInfo = {
                          authority: 'District Administration',
                          phone: '112',
                          responsible: e.police_station ? `PS ${e.police_station}` : 'Local Police HQ'
                        };
                      }

                      return (
                        <div key={e.id} className="bg-white rounded-2xl border border-red-200 p-4 md:p-5 shadow-sm hover:shadow-md transition flex flex-col xl:flex-row justify-between gap-5 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
                          
                          {/* LEFT COLUMN: CRISIS BRIEF & REPORT DETAIL */}
                          <div className="flex-1 space-y-3 text-left">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="bg-red-100 text-red-700 text-[9px] font-black px-2 py-0.5 rounded border border-red-200">
                                CRITICAL REPORT
                              </span>
                              <span className="bg-slate-100 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                ID: #{e.id?.slice(0, 8)}
                              </span>
                              <span className="bg-red-50 text-red-600 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                                {e.village_ward ? `${e.village_ward}, ${e.district}` : 'Location Unspecified'}
                              </span>
                              <span className="text-slate-400 font-mono text-xs font-semibold ml-auto md:ml-0">
                                {formatTimeAgo(e.timestamp)}
                              </span>
                            </div>
                            
                            <p className="font-extrabold text-base text-slate-900 leading-relaxed italic pr-2">
                              "{e.text_english || e.text_original}"
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-medium text-slate-600">
                              <div>
                                <span className="text-[9px] uppercase font-bold text-slate-400 block">Reporter</span>
                                <span className="font-extrabold text-slate-800">{e.name || 'Anonymous Citizen'}</span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase font-bold text-slate-400 block">Reported Category</span>
                                <span className="font-extrabold text-red-600 uppercase text-[10px]">{e.category || 'Other'}</span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase font-bold text-slate-400 block">Assigned / Police Station</span>
                                <span className="font-extrabold text-slate-800">{e.police_station ? `PS ${e.police_station}` : 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          {/* MIDDLE COLUMN: CITIZEN DIRECT REACH & SPATIAL DIRECTIONS */}
                          <div className="w-full xl:w-64 shrink-0 bg-red-50/30 border border-red-100 p-3 rounded-xl space-y-2.5 flex flex-col justify-center text-left">
                            <h4 className="text-[11px] font-black text-red-800 uppercase tracking-wider flex items-center gap-1">
                              <Navigation className="w-3 h-3" /> Emergency Outreach Options
                            </h4>
                            
                            <div className="space-y-2">
                              {/* CALL CITIZEN */}
                              {e.phone_number ? (
                                <a 
                                  href={`tel:${e.phone_number}`}
                                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3 py-2 rounded-lg transition flex items-center justify-center gap-2 shadow-sm border border-emerald-700 hover:scale-[1.01] active:scale-95"
                                >
                                  <Phone className="w-3 h-3 animate-pulse" />
                                  Call Citizen: {e.phone_number}
                                </a>
                              ) : (
                                <div className="w-full bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs px-3 py-2 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed">
                                  <Phone className="w-3 h-3" />
                                  Phone Not Shared
                                </div>
                              )}
                              
                              {/* GET DIRECTIONS */}
                              {e.location?.lat && e.location?.lng ? (
                                <a 
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${e.location.lat},${e.location.lng}`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-3 py-2 rounded-lg transition flex items-center justify-center gap-2 shadow-sm border border-blue-700 hover:scale-[1.01] active:scale-95"
                                >
                                  <MapPin className="w-3 h-3" />
                                  Get Directions
                                </a>
                              ) : (
                                <div className="w-full bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs px-3 py-2 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed">
                                  <MapPin className="w-3 h-3" />
                                  No GPS Location Details
                                </div>
                              )}
                            </div>
                          </div>

                          {/* RIGHT COLUMN: CONTACT NEAREST AUTHORITIES */}
                          <div className="w-full xl:w-64 shrink-0 bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col justify-between text-left gap-3">
                            <div>
                              <h4 className="text-[11px] font-black text-[#1A237E] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-red-600" /> Nearby Authority Contacts
                              </h4>
                              <div className="space-y-1 text-xs">
                                <div>
                                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Authority Unit</span>
                                  <span className="font-extrabold text-[#1A237E] block truncate">{contactInfo.authority}</span>
                                </div>
                                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 mt-1">
                                  <span className="text-[9px] text-slate-400 uppercase font-bold">Helpline</span>
                                  <a 
                                    href={`tel:${contactInfo.phone}`}
                                    className="bg-[#1A237E] hover:bg-[#121858] text-white px-1.5 py-0.5 rounded text-[10px] font-black flex items-center gap-1 shadow-sm"
                                  >
                                    <Phone className="w-2.5 h-2.5" /> Call {contactInfo.phone}
                                  </a>
                                </div>
                              </div>
                            </div>
                            
                            <button 
                              onClick={() => {
                                setActionModalSubmissions([e.id]);
                              }}
                              className="w-full bg-[#FF9933] hover:bg-[#E65100] text-white font-extrabold text-xs py-2 rounded-lg transition flex items-center justify-center gap-1 shadow-sm hover:scale-[1.01] active:scale-95"
                            >
                              <ClipboardList className="w-3 h-3" />
                              Log Action / Mark Solved
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TODAY TAB */}
            {activeTab === 'today' && (
              <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
                
                
                  <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={() => { setActiveFeedFilter('all'); setActiveTab('today'); }} className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex justify-between items-center hover:border-[#1A237E] transition shadow-sm">
                       <span className="font-bold text-[#1A237E]">All Submissions</span>
                       <span className="bg-[#1A237E] text-white px-2 py-1 rounded-full text-xs">{submissions.length}</span>
                    </button>
                    <button onClick={() => { setActiveFeedFilter('emergencies'); setActiveTab('today'); }} className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex justify-between items-center hover:border-[#C62828] transition shadow-sm">
                       <span className="font-bold text-[#C62828] flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Emergencies</span>
                       <span className="bg-[#C62828] text-white px-2 py-1 rounded-full text-xs">{emergencies.length}</span>
                    </button>
                    <button onClick={() => { setActiveFeedFilter('service'); setActiveTab('today'); }} className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex justify-between items-center hover:border-[#E65100] transition shadow-sm">
                       <span className="font-bold text-[#E65100] flex items-center gap-2"><RefreshCw className="w-4 h-4"/> Service Issues</span>
                       <span className="bg-[#E65100] text-white px-2 py-1 rounded-full text-xs">{serviceFailures.length}</span>
                    </button>
                  </div>

                
                {/* AI THEMATIC GROUPS */}
                <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                    <div>
                      <h3 className="text-[#1A237E] font-black tracking-tight text-[18px] uppercase">{String(t("AI Thematic Groups"))}</h3>
                      <p className="text-[13px] font-medium text-[#6B7280]">
                        {String(t("AI grouped from"))} {submissions.filter(s => s.submission_type === 'DEVELOPMENT_NEED' || s.submission_type === 'DEVELOPMENT NEED').length} {String(t("submissions"))}
                      </p>
                    </div>
                    <button 
                      onClick={refreshIntelligence} 
                      disabled={isRefreshingIntel} 
                      className="text-[#FF9933] hover:text-[#E65100] text-[13px] font-bold flex items-center gap-1.5 transition bg-[#FFF8F0] px-3 py-1.5 rounded-lg border border-[#FFE0B2]"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingIntel ? 'animate-spin' : ''}`} /> 
                      {isRefreshingIntel ? String(t('Analyzing...')) : String(t('Refresh AI'))}
                    </button>
                  </div>
                  
                  {developmentGroups.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-[#6B7280] text-[14px] mb-4 font-medium">{String(t("AI Intelligence is ready to analyze citizen development requests."))}</p>
                      <button 
                        onClick={refreshIntelligence}
                        disabled={isRefreshingIntel}
                        className="bg-[#1A237E] text-white rounded-xl px-5 py-2.5 font-bold text-[13px] hover:bg-[#121858] shadow-md transition disabled:opacity-50 flex items-center justify-center mx-auto gap-2"
                      >
                        <RefreshCw className={`w-4 h-4 ${isRefreshingIntel ? 'animate-spin' : ''}`} />
                        {isRefreshingIntel ? String(t('AI is analyzing...')) : String(t('Analyze Now'))}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2.5">
                      {developmentGroups.map((group, idx) => {
                        let ids: string[] = [];
                        if (group.submission_ids && Array.isArray(group.submission_ids)) {
                          ids = group.submission_ids;
                        } else {
                          const groupNameLower = group.group_name.toLowerCase();
                          const keywords = groupNameLower.split(' ').filter((w: string) => w.length > 3);
                          ids = submissions.filter(s => {
                            if (s.submission_type !== 'DEVELOPMENT_NEED' && s.submission_type !== 'DEVELOPMENT NEED') return false;
                            const textLower = (s.text_english || s.text_original || '').toLowerCase();
                            return keywords.some((w: string) => textLower.includes(w));
                          }).map(s => s.id);
                        }

                        const groupSubs = submissions.filter(s => ids.includes(s.id));
                        const firstLoc = groupSubs[0]?.village_ward;
                        const sharesLocation = groupSubs.length > 1 && firstLoc && firstLoc !== 'Unknown' && groupSubs.every(s => s.village_ward === firstLoc);

                        return (
                          <div 
                            key={idx}
                            className={`p-1.5 pl-3 pr-2 rounded-xl border-2 transition-all flex flex-wrap items-center gap-2.5 ${
                              activeFeedFilter === group.group_name
                                ? 'bg-blue-50/50 border-[#1A237E] text-[#1A237E]'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <button 
                              onClick={() => {
                                setActiveFeedFilter(activeFeedFilter === group.group_name ? 'all' : group.group_name);
                              }} 
                              className="flex items-center gap-2 text-[13px] font-black tracking-tight transition"
                            >
                              <span>{group.group_name}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
                                activeFeedFilter === group.group_name
                                  ? 'bg-[#1A237E] text-white'
                                  : 'bg-slate-200 text-[#1A237E]'
                              }`}>{group.submission_count}</span>
                            </button>
                            
                            {sharesLocation ? (
                              <button
                                onClick={() => {
                                  if (ids.length > 0) {
                                    setActionModalSubmissions(ids);
                                  } else {
                                    alert("No submissions found belonging to this AI Theme to act on.");
                                  }
                                }}
                                title={`Group action is enabled because these complaints are clustered in ${firstLoc}`}
                                className="bg-[#FF9933] hover:bg-[#E65100] text-white text-[11px] font-black px-2.5 py-1 rounded-lg transition shrink-0 shadow-sm hover:scale-103"
                              >
                                Group Action ({firstLoc})
                              </button>
                            ) : (
                              <span 
                                title="Individual actions required as complaints are from multiple locations"
                                className="text-[10px] text-slate-500 bg-slate-200/50 px-2 py-1 rounded-lg font-bold select-none cursor-help shrink-0"
                              >
                                Filter to Resolve Individually
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ACTIVE FILTER INDICATOR BANNER */}
                {activeFeedFilter !== 'all' && (
                  <div className="mb-6 bg-blue-50 border-2 border-blue-100 text-blue-950 px-4 py-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-inner">
                    <div className="flex items-center gap-2">
                      <div className="bg-[#1A237E] text-white p-1.5 rounded-lg">
                        <Search className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold">
                        Filtering Feed by AI Theme: <strong className="text-[#1A237E] font-black">{activeFeedFilter === 'emergencies' ? 'Emergencies' : activeFeedFilter === 'service' ? 'Service Issues' : activeFeedFilter}</strong>
                      </span>
                    </div>
                    <button 
                      onClick={() => setActiveFeedFilter('all')}
                      className="bg-[#1A237E] hover:bg-[#121858] text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition shadow-sm hover:shadow-md"
                    >
                      Clear Filter &bull; Show All
                    </button>
                  </div>
                )}
                {/* SEARCH AND FILTERS */}
                <div className="mb-6 flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-3 border-2 border-slate-200 rounded-xl bg-white placeholder-slate-400 focus:outline-none focus:border-[#1A237E] transition shadow-sm font-medium"
                      placeholder="Search by Track ID, Keyword, Name or Phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <select
                    className="block w-full md:w-48 pl-3 pr-10 py-3 border-2 border-slate-200 rounded-xl text-slate-700 bg-white focus:outline-none focus:border-[#1A237E] font-bold shadow-sm transition"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Recent Submissions</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed / Archived</option>
                  </select>
                </div>

                {/* LIVE FEED SUBMISSIONS */}
                <div className="space-y-4">
                  {feedSubmissions.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
                      <p className="text-slate-500 font-medium">No citizen concerns found matching your criteria.</p>
                    </div>
                  ) : (
                    feedSubmissions.map(s => (
                      <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold font-mono border border-slate-200">ID: {s.id.slice(0, 8)}</span>
                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold">{s.submission_type || 'REQUEST'}</span>
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                              s.status === 'resolved' ? 'bg-green-100 text-green-700' :
                              s.status === 'closed' ? 'bg-slate-200 text-slate-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {s.status || 'pending'}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-slate-500">
                            {new Date(s.timestamp || Date.now()).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-[#1A237E] font-medium text-lg leading-relaxed">
                            {s.text_english || s.text_original}
                          </p>
                        </div>

                        {expandedDetailsId === s.id && (
                          <div className="mb-4 p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-6">
                            
                            {/* TWO-COLUMN GRID: CITIZEN DOSSIER & AI INTEL SUITE */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              
                              {/* COLUMN 1: CITIZEN DOSSIER & TIMELINE */}
                              <div className="space-y-4">
                                <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm space-y-3">
                                  <h4 className="text-xs font-black text-[#1A237E] uppercase tracking-wider border-b pb-2">
                                    Citizen Request Profile
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                    <div>
                                      <span className="text-slate-500 font-bold block text-[11px] uppercase">Reporter Name</span>
                                      <span className="font-extrabold text-slate-800">{s.name || 'Anonymous citizen'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 font-bold block text-[11px] uppercase">Contact Number</span>
                                      <span className="font-extrabold text-slate-800">{s.phone || s.phone_number || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 font-bold block text-[11px] uppercase">Village / Ward</span>
                                      <span className="font-extrabold text-slate-800">{s.village_ward || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 font-bold block text-[11px] uppercase">Constituency</span>
                                      <span className="font-extrabold text-[#1A237E]">
                                        {s.assembly_constituency ? `${s.assembly_constituency} (MLA), ` : ''}{s.loksabha_constituency || s.district} (MP)
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 font-bold block text-[11px] uppercase">Detected language</span>
                                      <span className="font-extrabold text-slate-800 uppercase tracking-wider text-xs">
                                        {s.language_detected || 'Unknown'} {s.language_native ? `(${s.language_native})` : ''}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 font-bold block text-[11px] uppercase">Submission Timestamp</span>
                                      <span className="font-extrabold text-slate-800 text-xs">
                                        {new Date(s.timestamp || Date.now()).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {s.location?.lat && (
                                    <div className="pt-2 border-t text-xs">
                                      <span className="text-slate-500 font-bold block uppercase text-[10px] mb-1">GPS Coordinates</span>
                                      <span className="font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded">
                                        Lat: {s.location.lat.toFixed(6)}, Lng: {s.location.lng.toFixed(6)}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* ACTION TIMELINE */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                                  <h4 className="text-xs font-black text-[#1A237E] uppercase tracking-wider border-b pb-2 mb-3">
                                    Action & Update History
                                  </h4>
                                  <div className="relative pl-3 border-l-2 border-slate-200 space-y-4">
                                    <div className="relative">
                                      <div className="absolute -left-[17px] top-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                      <div className="text-sm font-bold text-slate-700">Request Submitted</div>
                                      <div className="text-xs text-slate-400">{new Date(s.timestamp || Date.now()).toLocaleString()}</div>
                                    </div>
                                    
                                    {mpActions.filter(a => a.submission_id === s.id).sort((a,b) => new Date(a.action_date).getTime() - new Date(b.action_date).getTime()).map(action => (
                                      <div key={action.id} className="relative">
                                        <div className={`absolute -left-[17px] top-1 w-3 h-3 rounded-full border-2 border-white ${action.actor === 'citizen' ? 'bg-blue-500' : 'bg-[#1A237E]'}`}></div>
                                        <div className="text-sm font-bold text-slate-700">
                                          {action.actor === 'citizen' ? "Citizen Feedback" : `MP Action: ${action.action_type || 'Update'}`}
                                        </div>
                                        <div className="text-xs text-slate-400">{new Date(action.action_date).toLocaleString()}</div>
                                        {action.citizen_visible_note && (
                                          <div className={`mt-1.5 p-2.5 text-xs rounded border ${action.actor === 'citizen' ? 'bg-blue-50 border-blue-100 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                                            {action.citizen_visible_note}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>

                                  {/* QUICK REPLY DIRECTLY FROM TIMELINE */}
                                  <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                                    <input 
                                      type="text" 
                                      id={`mp-reply-input-${s.id}`}
                                      placeholder="Quick reply to citizen..." 
                                      className="flex-1 text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1A237E]"
                                    />
                                    <button 
                                      onClick={async () => {
                                        const inputEl = document.getElementById(`mp-reply-input-${s.id}`) as HTMLInputElement;
                                        if (!inputEl || !inputEl.value.trim()) return;
                                        try {
                                          const { addDoc, collection } = await import('firebase/firestore');
                                          await addDoc(collection(db, "mp_actions"), {
                                            submission_id: s.id,
                                            action_type: "Reply",
                                            action_date: new Date().toISOString(),
                                            citizen_visible_note: inputEl.value.trim(),
                                            actor: "MP",
                                            mp_name: "MP Office"
                                          });
                                          inputEl.value = "";
                                        } catch (e) {
                                          alert("Failed to send reply.");
                                        }
                                      }}
                                      className="bg-[#1A237E] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#121858] transition"
                                    >
                                      Reply
                                    </button>
                                  </div>
                                </div>
                              </div>
                              
                              {/* COLUMN 2: ✨ AI INTELLIGENCE SUITE (GEMINI) */}
                              <div className="space-y-4">
                                <div className="bg-gradient-to-br from-[#1A237E] to-[#121858] text-white p-5 rounded-xl shadow-lg relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                    <Globe className="w-24 h-24" />
                                  </div>
                                  <div className="flex items-center gap-2 mb-4 border-b border-white/20 pb-3">
                                    <span className="bg-white/20 text-[#FF9933] text-[10px] font-black px-2.5 py-1 rounded-md tracking-wider uppercase">
                                      Gemini AI Core
                                    </span>
                                    <h4 className="font-extrabold text-[15px] tracking-tight">AI Insights & Classification</h4>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div className="bg-white/10 p-3 rounded-lg border border-white/5">
                                      <span className="text-slate-300 font-extrabold block text-[10px] uppercase mb-1">AI Urgency Rating</span>
                                      <span className="font-black text-sm uppercase flex items-center gap-1">
                                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: URGENCY_COLORS[s.urgency] || '#FFFFFF' }}></span>
                                        {s.urgency || 'Medium'}
                                      </span>
                                      <span className="text-[10px] text-slate-300 block mt-1">Source: {s.urgency_source || 'AI Classifier'}</span>
                                    </div>
                                    
                                    <div className="bg-white/10 p-3 rounded-lg border border-white/5">
                                      <span className="text-slate-300 font-extrabold block text-[10px] uppercase mb-1">Theme Categorization</span>
                                      <span className="font-black text-sm text-[#FF9933] block truncate">
                                        {s.category || 'Other'}
                                      </span>
                                      {s.category_auto_corrected && (
                                        <span className="text-[9px] bg-red-800 text-white px-1.5 py-0.5 rounded inline-block mt-1 uppercase font-bold">
                                          Auto-Corrected
                                        </span>
                                      )}
                                    </div>

                                    <div className="bg-white/10 p-3 rounded-lg border border-white/5">
                                      <span className="text-slate-300 font-extrabold block text-[10px] uppercase mb-1">AI Thematic Group</span>
                                      <span className="font-black text-sm text-white block truncate">
                                        {s.theme_name || 'Pattern Grouping...'}
                                      </span>
                                      <span className="text-[10px] text-slate-300 block mt-1">Theme Urgency: {s.theme_urgency || 'High'}</span>
                                    </div>

                                    <div className="bg-white/10 p-3 rounded-lg border border-white/5">
                                      <span className="text-slate-300 font-extrabold block text-[10px] uppercase mb-1">AI Moderation Audit</span>
                                      <span className="font-black text-sm block">
                                        {s.moderation_log?.sanitized ? '🛡️ Sanitized' : '✅ Passed'}
                                      </span>
                                      <span className="text-[10px] text-slate-300 block mt-1">
                                        Text Audit: {s.moderation_log?.text_passed !== false ? 'Approved' : 'Flagged'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                                    <span className="text-slate-300 font-extrabold block text-[10px] uppercase mb-1">AI Semantic Synthesis</span>
                                    <p className="text-sm font-medium leading-relaxed italic text-slate-100">
                                      "{s.issue_summary || s.text_english || s.text_original}"
                                    </p>
                                  </div>
                                </div>

                                {/* AI PHOTO / VISION ANALYSIS */}
                                {s.photo_url && (
                                  <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                                    <h4 className="text-xs font-black text-[#1A237E] uppercase tracking-wider border-b pb-2 mb-3 flex items-center justify-between">
                                      <span>Gemini Vision Intel</span>
                                      <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded border">
                                        Active
                                      </span>
                                    </h4>
                                    
                                    <div className="flex flex-col sm:flex-row gap-4">
                                      <div className="w-full sm:w-1/3 shrink-0 rounded-lg overflow-hidden border bg-slate-100">
                                        <img src={s.photo_url} alt="Submission asset" className="w-full h-32 object-cover" referrerPolicy="no-referrer" />
                                      </div>
                                      
                                      <div className="flex-1 space-y-2">
                                        {s.photo_analysis ? (
                                          <div className="text-xs space-y-1.5">
                                            <div>
                                              <span className="text-slate-500 font-bold uppercase block text-[9px]">Asset Scanned</span>
                                              <p className="font-bold text-slate-800">{s.photo_analysis.what_is_shown}</p>
                                            </div>
                                            <div>
                                              <span className="text-slate-500 font-bold uppercase block text-[9px]">Infrastructure Type</span>
                                              <p className="font-bold text-slate-800">{s.photo_analysis.infrastructure_type || 'N/A'}</p>
                                            </div>
                                            <div>
                                              <span className="text-slate-500 font-bold uppercase block text-[9px]">Damage Audit</span>
                                              <p className={`font-bold ${s.photo_analysis.damage_visible ? 'text-red-600' : 'text-slate-700'}`}>
                                                {s.photo_analysis.damage_visible ? `${s.photo_analysis.severity_from_photo}: ${s.photo_analysis.damage_description}` : 'No damage detected'}
                                              </p>
                                            </div>
                                            <div>
                                              <span className="text-slate-500 font-bold uppercase block text-[9px]">Safety Concern</span>
                                              <p className="font-bold text-slate-800">{s.photo_analysis.safety_concern ? s.photo_analysis.safety_detail : 'Safe structure verified'}</p>
                                            </div>
                                            <div className="pt-1.5 border-t mt-1 flex justify-between items-center text-[10px]">
                                              <span className="text-slate-500 font-bold">Confidence Score</span>
                                              <span className="font-black bg-blue-100 text-[#1A237E] px-1.5 py-0.5 rounded">
                                                {((s.photo_analysis.confidence || 0.95) * 100).toFixed(0)}% Match
                                              </span>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="h-full flex flex-col justify-center items-center py-4 text-center">
                                            <p className="text-xs text-slate-500 mb-3 font-medium">
                                              Photo not yet scanned for deep structural damage.
                                            </p>
                                            <button 
                                              onClick={() => handleRequestDetailCheck(s.id)}
                                              disabled={analyzingPhotoId === s.id}
                                              className="bg-[#1A237E] hover:bg-[#121858] disabled:bg-slate-300 text-white font-black text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                                            >
                                              {analyzingPhotoId === s.id ? (
                                                <>
                                                  <RefreshCw className="w-3 h-3 animate-spin" /> Analyzing Image...
                                                </>
                                              ) : (
                                                <>
                                                  Scan with Gemini Vision ✨
                                                </>
                                              )}
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100">
                          <button 
                            onClick={() => setExpandedDetailsId(expandedDetailsId === s.id ? null : s.id)}
                            className="px-4 py-2 text-sm font-bold text-[#1A237E] bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
                          >
                            {expandedDetailsId === s.id ? 'Hide Details' : 'View Full Details'}
                          </button>
                          
                          <button 
                            onClick={() => {
                              if (actionModalSubmissions.includes(s.id)) {
                                setActionModalSubmissions(actionModalSubmissions.filter(id => id !== s.id));
                              } else {
                                setActionModalSubmissions([...actionModalSubmissions, s.id]);
                              }
                            }}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition border ${
                              actionModalSubmissions.includes(s.id) 
                              ? 'bg-green-500 text-white border-green-600' 
                              : 'bg-[#1A237E] text-white border-[#1A237E] hover:bg-[#121858]'
                            }`}
                          >
                            {actionModalSubmissions.includes(s.id) ? 'Selected for Action' : 'Take Action'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            
            
            {/* AI INSIGHTS TAB */}
            {activeTab === 'constituency' && (
              <AiInsightsTab 
                submissions={submissions}
                developmentGroups={developmentGroups}
                onThemeSelect={(theme) => {
                  setActiveFeedFilter(theme);
                  setActiveTab('today');
                }}
                onActOnTheme={(theme, ids) => {
                  let targetIds = ids;
                  if (!targetIds || targetIds.length === 0) {
                    const group = developmentGroups.find(g => g.group_name === theme);
                    if (group && group.submission_ids && Array.isArray(group.submission_ids)) {
                      targetIds = group.submission_ids;
                    } else {
                      const groupNameLower = theme.toLowerCase();
                      const keywords = groupNameLower.split(' ').filter((w: string) => w.length > 3);
                      targetIds = submissions.filter(s => {
                        if (s.submission_type !== 'DEVELOPMENT_NEED' && s.submission_type !== 'DEVELOPMENT NEED') return false;
                        const textLower = (s.text_english || s.text_original || '').toLowerCase();
                        return keywords.some((w: string) => textLower.includes(w));
                      }).map(s => s.id);
                    }
                  }
                  
                  if (targetIds && targetIds.length > 0) {
                    setActionModalSubmissions(targetIds);
                  } else {
                    alert("No submissions found in this AI Theme to act on.");
                  }
                }}
                isRefreshingIntel={isRefreshingIntel}
                refreshIntelligence={refreshIntelligence}
              />
            )}
            
{/* MAP TAB */}
            {activeTab === 'map' && (
              <MapTab submissions={submissions} themesData={{ groups: developmentGroups }} selectedConstituency={selectedConstituency} />
            )}


            {/* MP REVIEW & PERFORMANCE AUDIT TAB */}
            {activeTab === 'review' && (
              <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-[#1A237E] to-[#121858] rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                    <ClipboardList className="w-32 h-32 transform translate-x-4 -translate-y-4" />
                  </div>
                  <div className="relative z-10 space-y-2">
                    <span className="bg-[#FF9933] text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                      Executive MP Audit Command
                    </span>
                    <h2 className="text-[24px] md:text-[28px] font-black tracking-tight">MP Constituency Action & Review Center</h2>
                    <p className="text-blue-100 text-sm md:text-base max-w-2xl font-medium">
                      Audit complaint resolution timelines, performance indices, and dispatch actions for weekly, monthly, and yearly intervals.
                    </p>
                  </div>
                </div>

                {/* Audit Period Selector & Summary */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Select Audit Interval:</span>
                  </div>
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
                    {(['weekly', 'monthly', 'yearly'] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setReviewPeriod(period)}
                        className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-xs capitalize transition ${
                          reviewPeriod === period
                            ? 'bg-[#1A237E] text-white shadow'
                            : 'text-[#4A5568] hover:text-[#1A237E]'
                        }`}
                      >
                        {period} Review
                      </button>
                    ))}
                  </div>
                </div>

                {/* KPI Metrics Dashboard Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Card 1: Total Submissions */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Received Reports</span>
                        <span className="bg-blue-50 text-[#1A237E] p-1.5 rounded-lg">
                          <Calendar className="w-4 h-4" />
                        </span>
                      </div>
                      <p className="text-2xl font-black text-slate-800">{reviewStats.total}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-3 border-t pt-2">
                      Total filings in current interval.
                    </p>
                  </div>

                  {/* Card 2: Pending Actions */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">Actions Pending</span>
                        <span className="bg-amber-50 text-amber-600 p-1.5 rounded-lg">
                          <AlertTriangle className="w-4 h-4 animate-pulse" />
                        </span>
                      </div>
                      <p className="text-2xl font-black text-amber-600">{reviewStats.pending}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-3 border-t pt-2">
                      Awaiting official intervention.
                    </p>
                  </div>

                  {/* Card 3: Actions Resolved */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Actions Resolved</span>
                        <span className="bg-green-50 text-green-600 p-1.5 rounded-lg">
                          <RefreshCw className="w-4 h-4" />
                        </span>
                      </div>
                      <p className="text-2xl font-black text-green-600">{reviewStats.resolved}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-3 border-t pt-2">
                      Successfully resolved and notified.
                    </p>
                  </div>

                  {/* Card 4: Actions Closed */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Archived / Closed</span>
                        <span className="bg-slate-50 text-slate-600 p-1.5 rounded-lg">
                          <Building2 className="w-4 h-4" />
                        </span>
                      </div>
                      <p className="text-2xl font-black text-slate-600">{reviewStats.closed}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-3 border-t pt-2">
                      Officially closed by administrator.
                    </p>
                  </div>

                  {/* Card 5: Resolution Efficiency */}
                  <div className="bg-[#FFFDF4] p-5 rounded-2xl border border-[#FFE0B2] shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-orange-800 uppercase tracking-wider">Resolution Rate</span>
                        <span className="bg-[#FFF3E0] text-[#FF9933] p-1.5 rounded-lg">
                          <Globe className="w-4 h-4" />
                        </span>
                      </div>
                      <p className="text-2xl font-black text-[#E65100]">{reviewStats.resolutionRate}%</p>
                    </div>
                    <p className="text-[11px] text-orange-900 font-semibold mt-3 border-t border-[#FFE0B2] pt-2">
                      Active work request closure rate.
                    </p>
                  </div>
                </div>

                {/* Categories & Urgent Metrics distribution panel */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-[#1A237E] font-black tracking-tight text-base uppercase">Report Type Distribution ({reviewPeriod})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['EMERGENCY', 'SERVICE_FAILURE', 'DEVELOPMENT_NEED'].map((type) => {
                      const count = reviewStats.typeDistribution[type] || reviewStats.typeDistribution[type.replace('_', ' ')] || 0;
                      const percentage = reviewStats.total > 0 ? Math.round((count / reviewStats.total) * 100) : 0;
                      
                      let colorClass = 'bg-[#1A237E]';
                      let textLabel = 'Development Needs';
                      if (type === 'EMERGENCY') {
                        colorClass = 'bg-red-600';
                        textLabel = 'Emergencies';
                      } else if (type === 'SERVICE_FAILURE') {
                        colorClass = 'bg-orange-500';
                        textLabel = 'Service Failures';
                      }

                      return (
                        <div key={type} className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-center text-xs font-black">
                            <span className="text-slate-700">{textLabel}</span>
                            <span className="text-slate-900">{count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                            <div className={`${colorClass} h-full rounded-full`} style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Complaint & MP Action Ledger section */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-[#1A237E] font-black tracking-tight text-[18px] uppercase">Constituency Action & Audit Ledger</h3>
                      <p className="text-xs text-slate-500 font-semibold">
                        Filter and search through the total {reviewStats.filteredSubmissions.length} complaints submitted during this {reviewPeriod}.
                      </p>
                    </div>
                  </div>

                  {/* Ledger Search & Filters */}
                  <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2.5 border-2 border-slate-200 rounded-xl bg-white placeholder-slate-400 focus:outline-none focus:border-[#1A237E] transition text-sm"
                        placeholder="Search ledger by Reference ID, Keyword, Reporter, or Phone..."
                        value={reviewSearchQuery}
                        onChange={(e) => setReviewSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                      {(['all', 'pending', 'resolved', 'closed'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setReviewStatusFilter(filter)}
                          className={`px-4 py-2 rounded-xl text-xs font-black capitalize border-2 whitespace-nowrap transition ${
                            reviewStatusFilter === filter
                              ? 'bg-[#1A237E] border-[#1A237E] text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ledger Data List */}
                  <div className="space-y-4">
                    {(() => {
                      let baseLedgerList = reviewStats.filteredSubmissions;
                      
                      // Filter by search query
                      if (reviewSearchQuery.trim()) {
                        const q = reviewSearchQuery.toLowerCase().trim();
                        baseLedgerList = baseLedgerList.filter(s => 
                          (s.id || '').toLowerCase().includes(q) ||
                          (s.text_english || s.text_original || '').toLowerCase().includes(q) ||
                          (s.name || '').toLowerCase().includes(q) ||
                          (s.phone || s.phone_number || '').toLowerCase().includes(q) ||
                          (s.village_ward || '').toLowerCase().includes(q)
                        );
                      }

                      // Filter by status
                      if (reviewStatusFilter !== 'all') {
                        baseLedgerList = baseLedgerList.filter(s => (s.status || 'pending') === reviewStatusFilter);
                      }

                      // Sort ledger: pending first, then resolved, then closed
                      const sortedLedger = [...baseLedgerList].sort((a, b) => {
                        const statusOrder = (st: string) => {
                          const s = st || 'pending';
                          if (s === 'pending') return 0;
                          if (s === 'resolved') return 1;
                          if (s === 'closed') return 2;
                          return 3;
                        };
                        const orderA = statusOrder(a.status);
                        const orderB = statusOrder(b.status);
                        if (orderA !== orderB) return orderA - orderB;
                        return new Date(b.timestamp || Date.now()).getTime() - new Date(a.timestamp || Date.now()).getTime();
                      });

                      if (sortedLedger.length === 0) {
                        return (
                          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
                            <p className="text-slate-500 font-bold">No complaints or actions match the filters in this {reviewPeriod}.</p>
                          </div>
                        );
                      }

                      return sortedLedger.map(s => (
                        <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                          
                          {/* Top Row header */}
                          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-3 pb-3 border-b border-slate-100">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[11px] font-bold font-mono border border-slate-200">ID: {s.id.slice(0, 8)}</span>
                              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-[11px] font-bold uppercase">{s.submission_type || 'REQUEST'}</span>
                              <span className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase ${
                                s.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                s.status === 'closed' ? 'bg-slate-200 text-slate-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {s.status || 'pending'}
                              </span>
                            </div>
                            <div className="text-xs font-bold text-slate-400">
                              Filed On: {new Date(s.timestamp || Date.now()).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}
                            </div>
                          </div>

                          {/* Complaint body */}
                          <div className="mb-4">
                            <p className="text-[#1A237E] font-medium text-base leading-relaxed">
                              {s.text_english || s.text_original}
                            </p>
                          </div>

                          {/* MP Actions Section */}
                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 mb-4 space-y-3">
                            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-500">
                              <span>🏛️ MP Office Action Status</span>
                              {s.last_action_date ? (
                                <span className="text-green-600 font-black">✓ ACTION RECORDED</span>
                              ) : (
                                <span className="text-amber-600 font-black animate-pulse">⚠️ ACTION REQUIRED</span>
                              )}
                            </div>

                            {s.last_action_taken ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div className="space-y-1.5">
                                  <div>
                                    <span className="text-slate-400 font-bold block uppercase text-[9px]">Last Action Executed</span>
                                    <span className="font-extrabold text-slate-800">{s.last_action_taken}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 font-bold block uppercase text-[9px]">Assigned Department</span>
                                    <span className="font-extrabold text-[#1A237E]">{s.department || 'N/A'}</span>
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <div>
                                    <span className="text-slate-400 font-bold block uppercase text-[9px]">Official Dispatch Notes</span>
                                    <span className="text-slate-700 font-medium italic leading-relaxed block bg-white p-2 border border-slate-100 rounded-lg">
                                      "{s.last_action_note || s.public_note || 'No custom action notes logged.'}"
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 font-bold block uppercase text-[9px]">Action Date</span>
                                    <span className="font-extrabold text-slate-800">
                                      {new Date(s.last_action_date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                                <div className="text-[#E65100] font-bold">
                                  No action has been dispatched yet for this complaint. Please log an official response.
                                </div>
                                <button 
                                  onClick={() => setActionModalSubmissions([s.id])}
                                  className="bg-[#E65100] hover:bg-[#BF360C] text-white px-4 py-2 rounded-xl font-black transition text-xs shrink-0"
                                >
                                  Act Now
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Expanded Ledger Details */}
                          {expandedDetailsId === s.id && (
                            <div className="mb-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-200 space-y-6">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm space-y-3">
                                    <h4 className="text-xs font-black text-[#1A237E] uppercase tracking-wider border-b pb-2">
                                      Citizen Profile & Location
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                      <div>
                                        <span className="text-slate-500 font-bold block text-[11px] uppercase">Reporter Name</span>
                                        <span className="font-extrabold text-slate-800">{s.name || 'Anonymous citizen'}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 font-bold block text-[11px] uppercase">Contact Number</span>
                                        <span className="font-extrabold text-slate-800">{s.phone || s.phone_number || 'N/A'}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 font-bold block text-[11px] uppercase">Village / Ward</span>
                                        <span className="font-extrabold text-slate-800">{s.village_ward || 'N/A'}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 font-bold block text-[11px] uppercase">Constituency</span>
                                        <span className="font-extrabold text-[#1A237E]">
                                          {s.assembly_constituency ? `${s.assembly_constituency} (MLA), ` : ''}{s.loksabha_constituency || s.district} (MP)
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 font-bold block text-[11px] uppercase">Detected Language</span>
                                        <span className="font-extrabold text-slate-800 uppercase tracking-wider text-xs">
                                          {s.language_detected || 'Unknown'} {s.language_native ? `(${s.language_native})` : ''}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 font-bold block text-[11px] uppercase">Submission Timestamp</span>
                                        <span className="font-extrabold text-slate-800 text-xs">
                                          {new Date(s.timestamp || Date.now()).toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                    {s.location?.lat && (
                                      <div className="pt-2 border-t text-xs">
                                        <span className="text-slate-500 font-bold block uppercase text-[10px] mb-1">GPS Coordinates</span>
                                        <span className="font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded">
                                          Lat: {s.location.lat.toFixed(6)}, Lng: {s.location.lng.toFixed(6)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  {/* photo scans if any */}
                                  {s.photo_url && (
                                    <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                                      <h4 className="text-xs font-black text-[#1A237E] uppercase tracking-wider border-b pb-2 mb-3">Gemini Vision Asset Scan</h4>
                                      <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="w-full sm:w-1/3 shrink-0 rounded-lg overflow-hidden border bg-slate-100">
                                          <img src={s.photo_url} alt="Submission asset" className="w-full h-24 object-cover" referrerPolicy="no-referrer" />
                                        </div>
                                        <div className="flex-1 text-xs space-y-1">
                                          {s.photo_analysis ? (
                                            <>
                                              <p><strong>Shown:</strong> {s.photo_analysis.what_is_shown}</p>
                                              <p><strong>Damage:</strong> {s.photo_analysis.damage_visible ? `${s.photo_analysis.severity_from_photo}: ${s.photo_analysis.damage_description}` : 'None'}</p>
                                              <p><strong>Concern:</strong> {s.photo_analysis.safety_concern ? s.photo_analysis.safety_detail : 'Safe structure verified'}</p>
                                            </>
                                          ) : (
                                            <p className="text-slate-400 italic">No vision scan run yet.</p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Bottom controls */}
                          <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100 justify-end">
                            <button 
                              onClick={() => setExpandedDetailsId(expandedDetailsId === s.id ? null : s.id)}
                              className="px-4 py-2 text-xs font-bold text-[#1A237E] bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
                            >
                              {expandedDetailsId === s.id ? 'Hide Audit Dossier' : 'View Audit Dossier'}
                            </button>
                            
                            <button 
                              onClick={() => setActionModalSubmissions([s.id])}
                              className="px-4 py-2 text-xs font-bold text-white bg-[#1A237E] hover:bg-[#121858] rounded-lg transition"
                            >
                              {s.last_action_taken ? 'Modify Action Log' : 'Take Action'}
                            </button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

              </div>
            )}
          </>
        )}

        {/* 🏛️ APP FOOTER */}
        <footer className="relative transition-colors mt-auto overflow-hidden bg-[#3E2723] text-[#FDF6E3]">
          
          {/* UPPER BANNER (Scenic watercolor-style landscape with Logo & Slogan) */}
          <div className="bg-[#FFFEF7] border-t border-[#E8DCC8] pt-10 pb-12 md:pt-16 md:pb-20 px-4 relative overflow-hidden text-[#3E2723]">
            <div 
              className="absolute -inset-4 bg-cover bg-center bg-no-repeat opacity-80 pointer-events-none z-0"
              style={{ backgroundImage: "url('/footer-bg.webp')" }}
            />
            <div className="max-w-xl mx-auto text-center relative z-20 flex flex-col items-center">
              {/* Circular Brand Logo */}
              <div className="filter drop-shadow-md mb-3">
                <svg className="w-14 h-14" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="46" stroke="#4CAF72" strokeWidth="4" />
                  <circle cx="50" cy="50" r="40" stroke="#FFB347" strokeWidth="4" />
                  <circle cx="50" cy="50" r="37" fill="#1B5E20" />
                  <path d="M 50,24 C 41,24 34,29 34,35 C 34,39 37,42 42,44 L 40,51 L 48,47 C 49,47 49.5,47 50,47 C 59,47 66,42 66,35 C 66,29 59,24 50,24 Z" fill="#FFFEF7" />
                  <circle cx="44" cy="34" r="2" fill="#1B5E20" />
                  <circle cx="50" cy="34" r="2" fill="#1B5E20" />
                  <circle cx="56" cy="34" r="2" fill="#1B5E20" />
                  <circle cx="50" cy="55" r="7" fill="#FFFEF7" />
                  <path d="M 38,76 C 38,65 44,63 50,63 C 56,63 62,65 62,76" fill="#FFFEF7" />
                  <circle cx="39" cy="61" r="5" fill="#FFE0B2" />
                  <path d="M 29,76 C 29,68 34,67 39,67 C 44,67 46,68 46,76" fill="#FFE0B2" />
                  <circle cx="61" cy="61" r="5" fill="#FFE0B2" />
                  <path d="M 54,76 C 54,68 56,67 61,67 C 66,67 71,68 71,76" fill="#FFE0B2" />
                </svg>
              </div>
              <h3 className="text-xl font-black tracking-tight leading-none">
                <span className="text-[#FFB347]">Jan</span>
                <span className="text-[#2E7D32]">Awaaz</span>
              </h3>
              <div className="flex items-center gap-2 mt-3 text-[11px] font-bold text-[#3E2723]">
                <svg className="w-3.5 h-3.5 text-[#2E7D32]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div className="flex flex-wrap justify-center items-center gap-x-1">
                  <span>{String(t('MP Command Center'))}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* LOWER DEEP BROWN BAND */}
          <div className="py-4 px-4 max-w-4xl mx-auto text-center relative z-30 pb-[80px] md:pb-4">
            <h4 className="font-bold text-xs sm:text-sm tracking-tight text-white">
              {String(t("Jan Awaaz MP Command Center"))}
            </h4>
            <p className="mt-1 text-[11px] opacity-85 max-w-xl mx-auto leading-normal text-[#F5F2EB]">
              {String(t("Empowering grassroots democracy through artificial intelligence."))}
              <span className="mx-1 opacity-50">|</span> 
            </p>

            {/* Heart icon separator */}
            <div className="flex items-center justify-center my-3 max-w-4xl mx-auto gap-3 opacity-40">
              <div className="flex-1 h-[1px] bg-white/10" />
              <span className="text-[#FFB347] text-xs">🧡</span>
              <div className="flex-1 h-[1px] bg-white/10" />
            </div>

            {/* Bottom Trust Banner with Green Sprout Growing on Bottom-Right */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[10px] font-semibold relative">
              
              {/* Left side Trust Badge */}
              <div className="flex items-center gap-2 text-[#A1887F]">
                <svg className="w-4 h-4 shrink-0 text-[#4CAF50]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-left leading-normal text-[10px] sm:text-xs">
                  {String(t('Transforming Voices into Action.'))}
                </p>
              </div>
              <div className="text-[#FDF6E3] text-[11px] font-medium opacity-90 mt-2 sm:mt-0 text-right sm:text-left">
                Powered by Gemini AI ✨
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* FLOATING ACTION BUTTON */}
      <button 
        onClick={() => setShowFabModal(true)}
        className="fixed bottom-[84px] right-6 md:bottom-8 md:right-8 w-[56px] h-[56px] bg-[#FF9933] text-white rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:bg-[#F57C00] transition hover:scale-105 active:scale-95 z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* BOTTOM TAB NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#FFFFFF] border-t border-[#F0EDE8] h-[60px] flex items-center z-50 px-2 sm:px-6">
        <button 
          onClick={() => setActiveTab('today')}
          className={`flex-1 flex flex-col items-center justify-center h-full transition ${activeTab === 'today' ? 'text-[#FF9933]' : 'text-[#9E9E9E]'}`}
        >
          <Calendar className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-bold">{String(t("Live Feed"))}</span>
        </button>

        <button 
          onClick={() => setActiveTab('review')}
          className={`flex-1 flex flex-col items-center justify-center h-full transition ${activeTab === 'review' ? 'text-[#FF9933]' : 'text-[#9E9E9E]'}`}
        >
          <ClipboardList className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-bold">Review</span>
        </button>

        <button 
          onClick={() => setActiveTab('constituency')}
          className={`flex-1 flex flex-col items-center justify-center h-full transition ${activeTab === 'constituency' ? 'text-[#FF9933]' : 'text-[#9E9E9E]'}`}
        >
          <BrainCircuit className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-bold">AI Insights</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('map')}
          className={`flex-1 flex flex-col items-center justify-center h-full transition ${activeTab === 'map' ? 'text-[#FF9933]' : 'text-[#9E9E9E]'}`}
        >
          <MapIcon className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-bold">Hotspots</span>
        </button>
      </nav>

      {/* FAB MODAL */}
      {showFabModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowFabModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-left shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-[16px] text-[#1A237E]">{String(t("Add Proposed Project"))}</h3>
                <p className="text-[12px] text-[#6B7280]">{String(t("प्रस्तावित परियोजना जोड़ें"))}</p>
              </div>
              <button onClick={() => setShowFabModal(false)} className="text-[#6B7280] hover:text-[#1A1A2E] bg-slate-100 p-2 rounded-full">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#1A237E] mb-1">{dynT('project_name')}</label>
                <input 
                  type="text" 
                  value={projectForm.name}
                  onChange={e => setProjectForm({...projectForm, name: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-[14px] focus:outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-[#FF9933]"
                  placeholder="e.g. New PHC in Sonapur"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#1A237E] mb-1">{dynT('location')}</label>
                <select 
                  value={projectForm.location}
                  onChange={e => setProjectForm({...projectForm, location: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-[14px] focus:outline-none focus:border-[#FF9933] bg-white"
                >
                  <option value="">{String(t("Select District..."))}</option>
                  <option value="Darrang">{String(t("Darrang"))}</option>
                  <option value="Barpeta">{String(t("Barpeta"))}</option>
                  <option value="Kamrup">{String(t("Kamrup"))}</option>
                  <option value="Kamrup Metropolitan">{String(t("Kamrup Metropolitan"))}</option>
                  <option value="Nagaon">{String(t("Nagaon"))}</option>
                  <option value="Sonitpur">{String(t("Sonitpur"))}</option>
                  <option value="Cachar">{String(t("Cachar"))}</option>
                  <option value="Dibrugarh">{String(t("Dibrugarh"))}</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#1A237E] mb-1">{dynT('estimated_cost')}</label>
                <input 
                  type="text" 
                  value={projectForm.cost}
                  onChange={e => setProjectForm({...projectForm, cost: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-[14px] focus:outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-[#FF9933]"
                  placeholder="e.g. ₹50 Lakhs"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#1A237E] mb-1">{dynT('status')}</label>
                <select 
                  value={projectForm.status}
                  onChange={e => setProjectForm({...projectForm, status: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-[14px] focus:outline-none focus:border-[#FF9933] bg-white"
                >
                  <option value="Proposed">{String(t("Proposed"))}</option>
                  <option value="Under Review">{String(t("Under Review"))}</option>
                  <option value="Funded">{String(t("Funded"))}</option>
                  <option value="Ongoing">{String(t("Ongoing"))}</option>
                  <option value="Completed">{String(t("Completed"))}</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#1A237E] mb-1">{String(t("Notes (Optional)"))}</label>
                <textarea 
                  value={projectForm.notes}
                  onChange={e => setProjectForm({...projectForm, notes: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-[14px] focus:outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-[#FF9933] resize-none h-20"
                  placeholder="Additional details..."
                />
              </div>
            </div>

            <button 
              onClick={saveProject}
              disabled={!projectForm.name}
              className="mt-6 w-full bg-[#1A237E] hover:bg-[#121858] disabled:opacity-50 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
            >{dynT('save_project')}</button>
          </div>
        </div>
      )}

      {/* ACTION MODAL */}
      {actionModalSubmissions.length > 0 && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 overflow-y-auto" onClick={() => {
          if (!isSubmittingAction) setActionModalSubmissions([]);
        }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl text-left shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
            
            {/* INTERACTIVE PROGRESS OVERLAY */}
            {isSubmittingAction && (
              <div className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm animate-fade-in overflow-y-auto">
                <div className="relative mb-4 shrink-0">
                  <div className="w-14 h-14 rounded-full border-4 border-slate-100 border-t-[#FF9933] animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-[#1A237E]">
                    {notificationStep < 4 ? `${notificationStep * 25}%` : '100%'}
                  </div>
                </div>
                
                <h3 className="font-extrabold text-lg text-[#1A237E] mb-1">Dispatching App Alerts</h3>
                <p className="text-xs text-slate-500 max-w-sm mb-4">
                  The MP Command Center is logging this action and sending secure real-time alerts to affected complainants.
                </p>

                <div className="w-full max-w-xs space-y-2.5 text-left text-xs font-medium pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${notificationStep >= 1 ? 'bg-[#1A237E] text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {notificationStep > 1 ? '✓' : '1'}
                    </span>
                    <span className={notificationStep >= 1 ? 'text-slate-800 font-bold' : 'text-slate-400'}>
                      Recording action to legislative registry
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${notificationStep >= 2 ? 'bg-[#1A237E] text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {notificationStep > 2 ? '✓' : '2'}
                    </span>
                    <span className={notificationStep >= 2 ? 'text-slate-800 font-bold' : 'text-slate-400'}>
                      Compiling app notification text
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${notificationStep >= 3 ? 'bg-[#1A237E] text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {notificationStep > 3 ? '✓' : '3'}
                    </span>
                    <span className={notificationStep >= 3 ? 'text-slate-800 font-bold' : 'text-slate-400'}>
                      Broadcasting secure alert to Citizen App
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${notificationStep >= 4 ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {notificationStep >= 4 ? '✓' : '4'}
                    </span>
                    <span className={notificationStep >= 4 ? 'text-green-600 font-extrabold' : 'text-slate-400'}>
                      App push notification sent!
                    </span>
                  </div>
                </div>

              </div>
            )}

            <div className="flex items-start justify-between mb-5 border-b pb-4">
              <div>
                <span className="bg-amber-100 text-[#E65100] text-[10px] font-black px-2.5 py-1 rounded-md tracking-wider uppercase mb-1.5 inline-block">
                  MP ACTION CENTER
                </span>
                <h3 className="font-black text-xl text-[#1A237E]">Take Executive Action</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {actionModalSubmissions.length > 1 
                    ? `Executing bulk response for ${actionModalSubmissions.length} active submissions` 
                    : 'Configure action dispatch and direct citizen updates'}
                </p>
              </div>
              <button 
                onClick={() => setActionModalSubmissions([])} 
                className="text-slate-400 hover:text-slate-700 bg-slate-100 p-2.5 rounded-full transition"
              >
                ✕
              </button>
            </div>

            {/* SCROLLABLE FORM BODY */}
            <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
              
              {/* SELECTED SUBMISSIONS SUMMARY */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
                  Target Requests ({actionModalSubmissions.length})
                </span>
                <div className="space-y-2 max-h-24 overflow-y-auto">
                  {actionModalSubmissions.map(id => {
                    const found = submissions.find(sub => sub.id === id);
                    return (
                      <div key={id} className="text-xs flex justify-between bg-white px-2.5 py-2 rounded border border-slate-100 gap-4">
                        <span className="font-mono text-slate-500 shrink-0">#{id.slice(0, 8)}</span>
                        <span className="text-slate-700 font-bold truncate flex-1">{found ? (found.text_english || found.text_original) : 'Request'}</span>
                        <span className="text-slate-400 italic font-medium shrink-0">{found?.village_ward || found?.district || 'Location'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ACTION TYPE & STATUS UPDATES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#1A237E] uppercase tracking-wider mb-1.5">Action Taken</label>
                  <select 
                    value={actionFormData.actionType}
                    onChange={e => {
                      const newType = e.target.value;
                      setActionFormData(prev => ({ ...prev, actionType: newType }));
                      if (actionModalSubmissions.length > 0) {
                        suggestActionWithAi(actionModalSubmissions, newType, selectedDepartments);
                      }
                    }}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-[#FF9933] bg-white font-semibold"
                  >
                    <option value="">Select Action...</option>
                    <option value="Forwarded to Department">Forwarded to Department</option>
                    <option value="Raised in Parliament">Raised in Parliament</option>
                    <option value="Called District Collector">Called District Collector</option>
                    <option value="Sanctioned for MPLAD fund">Sanctioned for MPLAD fund</option>
                    <option value="Field visit scheduled">Field visit scheduled</option>
                    <option value="Under government review">Under government review</option>
                    <option value="Others">Others (Specify below)</option>
                  </select>
                  {actionFormData.actionType === 'Others' && (
                    <input
                      type="text"
                      value={customActionType}
                      onChange={e => setCustomActionType(e.target.value)}
                      placeholder="Enter custom action..."
                      className="w-full border border-slate-300 rounded-xl p-3 text-sm mt-2 focus:outline-none focus:border-[#FF9933] font-semibold"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black text-[#1A237E] uppercase tracking-wider mb-1.5">Update Status</label>
                  <select 
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-[#FF9933] bg-white font-semibold"
                    value={actionFormData.statusUpdate}
                    onChange={e => setActionFormData({...actionFormData, statusUpdate: e.target.value})}
                  >
                    <option value="pending">Keep Pending / Follow-up</option>
                    <option value="review">Mark Under Departmental Review</option>
                    <option value="initiated">Mark Action Initiated</option>
                    <option value="resolved">Mark as Solved / Resolved</option>
                    <option value="closed">Close Request / Archive</option>
                  </select>
                </div>
              </div>

              {/* RESOLUTION / REASON */}
              {(actionFormData.statusUpdate === 'resolved' || actionFormData.statusUpdate === 'closed') && (
                <div className="space-y-4 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1">Reason for Closing</label>
                      <select 
                        value={actionFormData.closeReason}
                        onChange={e => setActionFormData({...actionFormData, closeReason: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#FF9933] bg-white font-medium"
                      >
                        <option value="">Select Reason...</option>
                        {actionFormData.statusUpdate === 'resolved' ? (
                          <>
                            <option value="Issue successfully resolved on ground">Issue successfully resolved on ground</option>
                            <option value="Addressed through official channel">Addressed through official channel</option>
                          </>
                        ) : (
                          <>
                            <option value="Duplicate request">Duplicate request</option>
                            <option value="Not feasible / Lack of funds">Not feasible / Lack of funds</option>
                            <option value="Out of MP jurisdiction">Out of MP jurisdiction</option>
                            <option value="Forwarded and closed from MP side">Forwarded and closed from MP side</option>
                          </>
                        )}
                        <option value="Others">Others (Please specify)</option>
                      </select>
                      {actionFormData.closeReason === 'Others' && (
                        <input 
                          type="text"
                          value={actionFormData.customCloseReason}
                          onChange={e => setActionFormData({...actionFormData, customCloseReason: e.target.value})}
                          placeholder="Enter custom reason..."
                          className="w-full border border-slate-300 rounded-lg p-2.5 text-xs mt-2 focus:outline-none focus:border-[#FF9933]"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1">Additional Evidence</label>
                      <input 
                        type="text"
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#FF9933]"
                        placeholder="e.g. Document #, Photo link..."
                        value={actionFormData.evidence}
                        onChange={e => setActionFormData({...actionFormData, evidence: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* DEPARTMENT SELECTION WITH CLICKABLE BADGES */}
              <div>
                <label className="block text-xs font-black text-[#1A237E] uppercase tracking-wider mb-1.5 flex justify-between items-center">
                  <span>Cooperating Departments (Select One or More)</span>
                  {isAnalyzingAction ? (
                    <span className="text-[10px] text-[#FF9933] font-bold animate-pulse">✨ AI Analyzing Complaints...</span>
                  ) : (
                    <span className="text-[10px] text-slate-400 normal-case font-medium">✨ AI suggests departments based on complaints</span>
                  )}
                </label>
                
                {/* CLICKABLE BADGES */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {STANDARD_DEPARTMENTS.map(dept => {
                    const isSelected = selectedDepartments.includes(dept);
                    const isAiSuggested = aiSuggestedDepts.includes(dept);
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => {
                          setSelectedDepartments(prev => {
                            const updated = prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept];
                            if (actionModalSubmissions.length > 0) {
                              suggestActionWithAi(actionModalSubmissions, actionFormData.actionType || 'Forwarded to Department', updated);
                            }
                            return updated;
                          });
                        }}
                        className={`text-[11px] px-3 py-1.5 rounded-full border transition font-bold flex items-center gap-1 ${
                          isSelected
                            ? 'bg-[#1A237E] text-white border-[#1A237E] shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isAiSuggested && <span className="text-[#FF9933] text-[12px] animate-pulse">✨</span>}
                        {dept}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={actionFormData.department}
                    onChange={e => setActionFormData({...actionFormData, department: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-[#FF9933] font-semibold"
                    placeholder="Selected departments (e.g. PHE, PWD...)"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (actionModalSubmissions.length > 0) {
                        suggestActionWithAi(actionModalSubmissions, actionFormData.actionType || 'Forwarded to Department', selectedDepartments);
                      }
                    }}
                    disabled={isAnalyzingAction || actionModalSubmissions.length === 0}
                    className="px-4 bg-[#1A237E] text-white hover:bg-[#283593] disabled:opacity-50 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzingAction ? 'animate-spin' : ''}`} />
                    <span>AI Draft</span>
                  </button>
                </div>
              </div>

              {/* PUBLIC NOTE TO CITIZEN */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-black text-[#1A237E] uppercase tracking-wider flex items-center gap-1.5">
                    <span>Public Note to Citizen</span>
                    {isAnalyzingAction && (
                      <span className="flex items-center gap-1 text-[11px] text-[#FF9933] font-bold animate-pulse normal-case">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        AI Drafting Note...
                      </span>
                    )}
                  </label>
                  <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded uppercase">
                    Dispatched as SMS & Push Alert
                  </span>
                </div>
                <div className="relative">
                  <textarea 
                    value={actionFormData.note}
                    onChange={e => setActionFormData({...actionFormData, note: e.target.value})}
                    className={`w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-[#FF9933] resize-none h-28 font-medium transition-all ${
                      isAnalyzingAction ? 'opacity-60 bg-slate-50/50' : 'bg-white'
                    }`}
                    placeholder="e.g. Contacted PHE Department. They will inspect the site in 2 weeks and begin work."
                  />
                  {isAnalyzingAction && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/40 rounded-xl">
                      <span className="text-xs font-bold text-slate-500 bg-white/95 border border-slate-200/50 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FF9933]" />
                        Updating draft...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="mt-6 pt-4 border-t flex gap-3">
              <button
                type="button"
                onClick={() => setActionModalSubmissions([])}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold py-3.5 rounded-xl text-sm transition"
              >
                Cancel
              </button>
              <button 
                onClick={takeAction}
                disabled={!actionFormData.actionType || (actionFormData.actionType === 'Others' && !customActionType)}
                className="flex-1 bg-[#FF9933] hover:bg-[#E65100] disabled:opacity-50 text-white font-extrabold py-3.5 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-md"
              >
                Submit Action & Notify Citizens
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  );
}
