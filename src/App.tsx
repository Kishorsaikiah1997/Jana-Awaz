import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { 
  Mic, 
  MicOff, 
  Image as ImageIcon, 
  Trash2, 
  Send, 
  CheckCircle2, 
  Globe, 
  Search, 
  Sparkles, 
  Clock, 
  AlertCircle, 
  User, 
  Sun, 
  Moon, 
  Copy, 
  Check, 
  FileText, 
  MapPin, 
  RotateCw, 
  Layers,
  ArrowRight,
  Camera,
  ClipboardList,
  LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { SUPPORTED_LANGUAGES, useDynamicT, T, getLabel } from "./i18n";
import { db } from "./firebase";
import { Urgency, Submission, OfflineQueueItem, LocalComplaint } from "./types";
import { mockComplaints } from "./mockData";
import Receipt from "./components/Receipt";
import { SearchableSelect } from "./components/SearchableSelect";
import { indiaData } from "./data/india_data";
import { LocationPicker } from "./components/LocationPicker";
import PublicBoard from "./components/PublicBoard";

// Indian states list with bilingual labels
const INDIAN_STATES = [
  { en: "Andhra Pradesh", hi: "आंध्र प्रदेश" },
  { en: "Arunachal Pradesh", hi: "अरुणाचल प्रदेश" },
  { en: "Assam", hi: "असम" },
  { en: "Bihar", hi: "बिहार" },
  { en: "Chhattisgarh", hi: "छत्तीसगढ़" },
  { en: "Delhi", hi: "दिल्ली" },
  { en: "Goa", hi: "गोवा" },
  { en: "Gujarat", hi: "गुजरात" },
  { en: "Haryana", hi: "हरियाणा" },
  { en: "Himachal Pradesh", hi: "हिमाचल प्रदेश" },
  { en: "Jammu & Kashmir", hi: "जम्मू और कश्मीर" },
  { en: "Jharkhand", hi: "झारखंड" },
  { en: "Karnataka", hi: "कर्नाटक" },
  { en: "Kerala", hi: "केरल" },
  { en: "Ladakh", hi: "लद्दाख" },
  { en: "Madhya Pradesh", hi: "मध्य प्रदेश" },
  { en: "Maharashtra", hi: "महाराष्ट्र" },
  { en: "Manipur", hi: "मणिपुर" },
  { en: "Meghalaya", hi: "मेघालय" },
  { en: "Mizoram", hi: "मिजोरम" },
  { en: "Nagaland", hi: "नागालैंड" },
  { en: "Odisha", hi: "ओडिशा" },
  { en: "Puducherry", hi: "पुडुचेरी" },
  { en: "Punjab", hi: "पंजाब" },
  { en: "Rajasthan", hi: "राजस्थान" },
  { en: "Sikkim", hi: "सिक्किम" },
  { en: "Tamil Nadu", hi: "तमिलनाडु" },
  { en: "Telangana", hi: "तेलंगाना" },
  { en: "Tripura", hi: "त्रिपुरा" },
  { en: "Uttar Pradesh", hi: "उत्तर प्रदेश" },
  { en: "Uttarakhand", hi: "उत्तराखंड" },
  { en: "West Bengal", hi: "पश्चिम बंगाल" }
];

// Complaint Categories with icons and bilingual labels
const CATEGORIES = [
  { id: "Roads", icon: "🛣️", labelKey: "cat_roads" },
  { id: "Water", icon: "💧", labelKey: "cat_water" },
  { id: "Healthcare", icon: "🏥", labelKey: "cat_healthcare" },
  { id: "Schools", icon: "🏫", labelKey: "cat_schools" },
  { id: "Electricity", icon: "⚡", labelKey: "cat_electricity" },
  { id: "Agriculture", icon: "🌾", labelKey: "cat_agriculture" },
  { id: "Sanitation", icon: "🚽", labelKey: "cat_sanitation" },
  { id: "Other", icon: "📦", labelKey: "cat_other" }
];

const getLocalComplaints = (): LocalComplaint[] => {
  try {
    const data = localStorage.getItem("janawaaz_complaints");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveComplaintToLocal = (data: any) => {
  try {
    const existing = getLocalComplaints();
    const newRecord: LocalComplaint = {
      formatted_id: data.formatted_tracking_id || data.id,
      firestore_id: data.id,
      category: data.category || "General",
      category_icon: getCategoryIcon(data.category),
      district: data.district || "Not Provided",
      state: data.state || "Not Provided",
      constituency: data.constituency || data.loksabha_constituency || "Not Provided",
      urgency: data.urgency || "Medium",
      issue_summary: (data.issue_summary || data.text_english || data.text_original || "").split(".")[0],
      submitted_at: data.timestamp || new Date().toISOString(),
      status: data.status || "pending",
      has_photo: !!(data.photo_url || (data.photos && data.photos.length > 0)),
      gps_tagged: !!data.location || !!(data.photos && data.photos.length > 0 && data.photos[0].location),
      language: data.language_detected || "English"
    };
    
    const updated = [newRecord, ...existing].slice(0, 20);
    localStorage.setItem("janawaaz_complaints", JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save to local storage", err);
  }
};

const updateLocalComplaintStatus = (id: string, status: string) => {
  try {
    const existing = getLocalComplaints();
    const updated = existing.map(c => c.firestore_id === id ? { ...c, status } : c);
    localStorage.setItem("janawaaz_complaints", JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to update local storage", err);
  }
};

const clearLocalComplaints = () => {
  localStorage.removeItem("janawaaz_complaints");
};

const removeLocalComplaint = (id: string) => {
  try {
    const existing = getLocalComplaints();
    const updated = existing.filter(c => c.firestore_id !== id);
    localStorage.setItem("janawaaz_complaints", JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to remove from local storage", err);
  }
};

const getCategoryIcon = (category: string) => {
  const c = (category || "").toLowerCase();
  if (c.includes("water")) return "💧";
  if (c.includes("road")) return "🛣️";
  if (c.includes("electricity") || c.includes("power")) return "⚡";
  if (c.includes("health")) return "🏥";
  if (c.includes("education") || c.includes("school")) return "🏫";
  if (c.includes("sanitation") || c.includes("garbage") || c.includes("waste")) return "🗑️";
  if (c.includes("agriculture") || c.includes("farm")) return "🌾";
  if (c.includes("transport")) return "🚌";
  if (c.includes("police") || c.includes("crime")) return "🚓";
  if (c.includes("corruption")) return "⚖️";
  return "📝";
};

export default function App() {
  const { t, i18n } = useTranslation();
  const dynT = useDynamicT();
  const [showLanguageSelector, setShowLanguageSelector] = useState(!localStorage.getItem('jan_awaaz_lang'));
  
  // Global Accessibility States
  const [fontSize, setFontSize] = useState<"normal" | "large" | "extra">("normal");
  const [highContrast, setHighContrast] = useState<boolean>(false); // Navigation / Mode state
  const [activeTab, setActiveTab] = useState<"submit" | "track" | "dashboard" | "public">("submit");
  const [showMap, setShowMap] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([26.2006, 92.9376]); // Default Assam
  const [selectedMapLocation, setSelectedMapLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const [isWhatsApp, setIsWhatsApp] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisTypeBadge, setAnalysisTypeBadge] = useState<"DEVELOPMENT NEED" | "SERVICE FAILURE" | "EMERGENCY">("DEVELOPMENT NEED");
  const [text, setText] = useState("");
  const [hasPhoto, setHasPhoto] = useState<boolean | null>(null);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [analyzedTags, setAnalyzedTags] = useState<string[]>([]);
  const [analyzedPriority, setAnalyzedPriority] = useState<"Critical" | "High" | "Medium" | "Low">("Low");
  const [photos, setPhotos] = useState<Array<{url: string, location?: {lat: number, lng: number, address?: string, timestamp?: string}}>>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [loksabha, setLoksabha] = useState("");
  const [assembly, setAssembly] = useState("");
  const [villageWard, setVillageWard] = useState("");
  const [policeStation, setPoliceStation] = useState("");
  const [gramPanchayat, setGramPanchayat] = useState("");
  const [pincode, setPincode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  // Statuses
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState({ lang: "English", native: "English", script: "Latin", mixed: false });
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const trackParam = searchParams.get('track');
    if (trackParam) {
      setActiveTab('track');
      setTrackId(trackParam);
      // Call tracking API directly
      const fetchTrack = async (id) => {
        setIsTrackSearching(true);
        try {
          const res = await fetch(`/api/submissions/${id}`);
          const data = await res.json();
          if (data.success) {
            setTrackedItem(data);
          } else {
            setTrackError(t("Submission not found. Please check the ID."));
          }
        } catch (err) {
          console.error(err);
          setTrackError(t("Failed to track submission."));
        } finally {
          setIsTrackSearching(false);
        }
      };
      fetchTrack(trackParam);
      
      // Clean up URL without reloading
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.pushState({path:newUrl},'',newUrl);
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setVoiceSupported(true);
    }
  }, []);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const [isTranscribingVoice, setIsTranscribingVoice] = useState(false);
  const isCancelledRef = useRef(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<any>(null);
  const textBeforeRecordingRef = useRef("");
  const [recordingLanguage, setRecordingLanguage] = useState<string>(() => `${i18n.language || 'hi'}-IN`); // Offline Resilience
  useEffect(() => {
    if (i18n.language) {
      setRecordingLanguage(`${i18n.language}-IN`);
    }
  }, [i18n.language]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false); // Submission results
  const [successData, setSuccessData] = useState<Submission | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [formError, setFormError] = useState(""); // Tracking State
  const [trackId, setTrackId] = useState("");
  const [trackedItem, setTrackedItem] = useState<Submission | null>(null);
  const [trackError, setTrackError] = useState("");
  const [followUpText, setFollowUpText] = useState("");
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);
  const [isTrackSearching, setIsTrackSearching] = useState(false); // My Complaints State
  const [isMyComplaintsOpen, setIsMyComplaintsOpen] = useState(false);
  const [myComplaints, setMyComplaints] = useState<LocalComplaint[]>([]);
  const [localTrackResult, setLocalTrackResult] = useState<Record<string, any>>({});
  
  useEffect(() => {
    if (isMyComplaintsOpen) {
      setMyComplaints(getLocalComplaints());
    }
  }, [isMyComplaintsOpen, successData]);

  // Dashboard State
  const [dashboardSubmissions, setDashboardSubmissions] = useState<Submission[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [mpLanguage, setMpLanguage] = useState<string>(() => {
    return localStorage.getItem("mp_preferred_language") || "English";
  });
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});
  const [translatedUrgencies, setTranslatedUrgencies] = useState<Record<string, string>>({});
  const [translatedCategories, setTranslatedCategories] = useState<Record<string, string>>({});
  const [showOriginals, setShowOriginals] = useState<Record<string, boolean>>({});
  const [dashboardFilter, setDashboardFilter] = useState<"all" | "sanitized">("all"); // Speech Recognition Ref
  const langDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Sync state on mount and monitor connection
  useEffect(() => {
    // Monitor internet state
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineNotice(true);
      setTimeout(() => setShowOfflineNotice(false), 5000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineNotice(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load offline queue
    const savedQueue = localStorage.getItem("janawaaz_offline_queue");
    if (savedQueue) {
      try {
        setOfflineQueue(JSON.parse(savedQueue));
      } catch (err) {
        console.error("Failed to parse offline queue", err);
      }
    }

    // Run interval to auto-sync every 30 seconds
    const syncInterval = setInterval(() => {
      syncOfflineSubmissions();
    }, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(syncInterval);
    };
  }, []);

  // Sync offline queue when online status becomes true
  useEffect(() => {
    if (isOnline) {
      syncOfflineSubmissions();
    }
  }, [isOnline]);

  // Real-time language detection with debouncing
  const [lastDetectedText, setLastDetectedText] = useState("");

  useEffect(() => {
    if (text.trim().length < 4) {
      setDetectedLanguage({ lang: "English", native: "English", script: "Latin", mixed: false });
      return;
    }

    // Only re-run if text length changed by 10 or more characters compared to last detection
    if (Math.abs(text.length - lastDetectedText.length) < 10 && lastDetectedText !== "") {
      return;
    }

    if (langDetectionTimeoutRef.current) {
      clearTimeout(langDetectionTimeoutRef.current);
    }

    setIsDetectingLanguage(true);
    langDetectionTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/detect-language", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });
        const data = await res.json();
        if (data.success) {
          setDetectedLanguage({ 
            lang: data.language_detected, 
            native: data.language_native,
            script: data.language_script,
            mixed: data.mixed_language
          });
          setLastDetectedText(text);
        }
      } catch (err) {
        console.error("Language detection fetch failed", err);
      } finally {
        setIsDetectingLanguage(false);
      }
    }, 1500);

    return () => {
      if (langDetectionTimeoutRef.current) {
        clearTimeout(langDetectionTimeoutRef.current);
      }
    };
  }, [text, lastDetectedText]);

  // Voice recording actions
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    isCancelledRef.current = false;
    setInterimText("");
    textBeforeRecordingRef.current = text;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setRecordingStream(stream);

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const useNative = !!SpeechRecognition && !recordingLanguage.startsWith('as');

      const startMediaRecorder = (activeStream: MediaStream) => {
        console.log(`Using server-side Gemini transcription API for: ${recordingLanguage}`);
        const mediaRecorder = new MediaRecorder(activeStream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          if (isCancelledRef.current) {
            setRecordingStream(null);
            return;
          }

          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            setIsTranscribingVoice(true);
            try {
              const res = await fetch("/api/process-audio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                  audioBase64: base64Audio, 
                  mimeType: 'audio/webm',
                  language: recordingLanguage 
                })
              });
              const data = await res.json();
              if (data.success) {
                setText((prev) => prev ? `${prev} ${data.text_original}` : data.text_original);
              }
            } catch (err) {
              console.error("Audio processing failed", err);
            } finally {
              setIsTranscribingVoice(false);
            }
          };
          setRecordingStream(null);
        };

        mediaRecorder.start();
        setIsRecording(true);
      };

      if (useNative) {
        console.log(`Starting native SpeechRecognition for language: ${recordingLanguage}`);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = recordingLanguage;

        let hasSwitchedToFallback = false;

        recognition.onresult = (event: any) => {
          if (hasSwitchedToFallback) return;
          let finalTranscript = '';
          let currentInterim = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              currentInterim += transcript;
            }
          }

          if (currentInterim) {
            setInterimText(currentInterim);
          } else {
            setInterimText("");
          }

          if (finalTranscript) {
            const newFinal = finalTranscript.trim();
            setText(() => {
              const prefix = textBeforeRecordingRef.current;
              return prefix ? `${prefix} ${newFinal}` : newFinal;
            });
            textBeforeRecordingRef.current = textBeforeRecordingRef.current ? `${textBeforeRecordingRef.current} ${newFinal}` : newFinal;
          }
        };

        recognition.onerror = (err: any) => {
          console.error("Speech recognition error:", err);
          if (!hasSwitchedToFallback && err.error !== 'no-speech') {
            hasSwitchedToFallback = true;
            console.log("Switching to server-side voice recording fallback due to error:", err.error);
            try {
              recognition.abort();
            } catch (e) {
              console.warn(e);
            }
            recognitionRef.current = null;
            startMediaRecorder(stream);
          }
        };

        recognition.onend = () => {
          console.log("Native speech recognition session ended.");
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
      } else {
        startMediaRecorder(stream);
      }
    } catch (err) {
      console.error("Error accessing microphone", err);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
    }

    if (recordingStream) {
      recordingStream.getTracks().forEach(track => track.stop());
    }

    setRecordingStream(null);
    setIsRecording(false);
    setInterimText("");
  };

  const cancelRecording = () => {
    isCancelledRef.current = true;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.warn(e);
      }
      recognitionRef.current = null;
    }

    setText(textBeforeRecordingRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
    }

    if (recordingStream) {
      recordingStream.getTracks().forEach(track => track.stop());
    }

    setRecordingStream(null);
    setIsRecording(false);
    setInterimText("");
  };

  // Image resizing & base64 compression helper (safeguard for low bandwidth & localStorage limit)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let photoLoc: { lat: number; lng: number; address?: string; timestamp?: string } | undefined = undefined;

    const processImage = (fileToProcess: File, loc: typeof photoLoc) => {
      const reader = new FileReader();
      reader.readAsDataURL(fileToProcess);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400; // Optimal small size for low internet
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Highly compressed JPEG
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          setPhotos(prev => [...prev, { url: compressedBase64, location: loc }]);
        };
      };
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const timestamp = new Date(position.timestamp).toLocaleString();
        
        let address = undefined;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          if (res.ok) {
            const data = await res.json();
            address = data.display_name;
          }
        } catch (e) {
          console.error("Reverse geocoding error", e);
        }

        photoLoc = { lat, lng, address, timestamp };
        setGpsError(null);
        processImage(file, photoLoc);
      }, (err) => {
        console.error("GPS Error", err);
        setGpsError(t("Could not get location. Ensure GPS is enabled"));
        processImage(file, undefined);
      });
    } else {
      setGpsError(t("Geolocation not supported by browser"));
      processImage(file, undefined);
    }
  };

  // Offline submission persistence
  const saveToOfflineQueue = (formData: any) => {
    const newItem: OfflineQueueItem = {
      id: "OFFLINE_" + Math.random().toString(36).substr(2, 9),
      text: formData.text,
      district: formData.district,
      state: formData.state,
      loksabha_constituency: formData.loksabha_constituency,
      assembly_constituency: formData.assembly_constituency,
      village_ward: formData.village_ward,
      police_station: formData.police_station,
      gram_panchayat_municipality: formData.gram_panchayat_municipality,
      pincode: formData.pincode,
      phone_number: formData.phone_number,
      category: formData.category,
      name: formData.name,
      anonymous: formData.anonymous,
      photo_url: formData.photo_url || "",
      photos: formData.photos || [],
      location: formData.location || undefined,
      timestamp: new Date().toISOString()
    };

    const updatedQueue = [...offlineQueue, newItem];
    setOfflineQueue(updatedQueue);
    localStorage.setItem("janawaaz_offline_queue", JSON.stringify(updatedQueue));
  };

  // Dashboard data loading
  const fetchDashboardSubmissions = async () => {
    setIsLoadingDashboard(true);
    try {
      const res = await fetch("/api/submissions");
      const data = await res.json();
      if (data.success) {
        // Merge with mockComplaints to ensure we always have the 50 realistic complaints
        const dbMockIds = new Set((data.submissions || []).filter((s: any) => s.is_mock).map((s: any) => s.formatted_tracking_id));
        const filteredMocks = mockComplaints.filter(m => !dbMockIds.has(m.formatted_tracking_id));
        const merged = [...(data.submissions || []).filter((s: any) => !s.is_mock), ...filteredMocks];
        
        // Sort by timestamp desc
        merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setDashboardSubmissions(merged);
      }
    } catch (err) {
      console.error("Failed to load dashboard submissions", err);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchDashboardSubmissions();
    }
  }, [activeTab]);

  // Synchronize offline storage items
  const syncOfflineSubmissions = async () => {
    if (!navigator.onLine || offlineQueue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    const queueCopy = [...offlineQueue];
    const successes: string[] = [];

    for (const item of queueCopy) {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: item.text,
            district: item.district,
            state: item.state,
            loksabha_constituency: item.loksabha_constituency,
            assembly_constituency: item.assembly_constituency,
            village_ward: item.village_ward,
            police_station: item.police_station,
            gram_panchayat_municipality: item.gram_panchayat_municipality,
            pincode: item.pincode,
            phone_number: item.phone_number,
            category: item.category,
            name: item.name,
            anonymous: item.anonymous,
            photo_url: item.photo_url,
            photos: item.photos,
            location: item.location
          })
        });

        if (res.ok) {
          successes.push(item.id);
        }
      } catch (err) {
        console.error("Sync failed for item:", item.id, err);
        // Break queue sync loop if network drops again
        break;
      }
    }

    if (successes.length > 0) {
      const remainingQueue = offlineQueue.filter(item => !successes.includes(item.id));
      setOfflineQueue(remainingQueue);
      localStorage.setItem("janawaaz_offline_queue", JSON.stringify(remainingQueue));
    }
    setIsSyncing(false);
  };

  // Submit Feedback Form
  const handleAnalysis = async () => {
    if (!text.trim() || !state || !district.trim() || !loksabha.trim() || (hasPhoto === true && photos.length === 0)) return;
    
    setIsAnalyzing(true);
    setAnalysisStep(0);
    setFormError("");
    
    try {
      const payload = {
        text,
        photoBase64: photos.length > 0 ? photos[0].url : null,
      };

      const response = await fetch('/api/preview-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const {
          normalised_text,
          tags,
          priority_category,
          department_category,
          severity,
          photo_remove,
          photo_removal_reason,
        } = result.data;

        if (photo_remove) {
           setFormError(`Photo rejected: ${photo_removal_reason || "Inappropriate content"}. Please remove the photo to continue.`);
           setIsAnalyzing(false);
           return;
        }

        if (normalised_text) setText(normalised_text);
        if (tags) setAnalyzedTags(tags);
        if (severity) setAnalyzedPriority(severity as any);
        if (department_category) {
          setCategory(department_category);
        } else {
          setCategory("Other");
        }
        
        // Map priority_category to our category enum roughly if possible, otherwise just use other
        const catUpper = (priority_category || "").toUpperCase();
        if (catUpper === "EMERGENCY") {
          setAnalysisTypeBadge("EMERGENCY");
        } else if (catUpper === "SERVICE_FAILURE") {
          setAnalysisTypeBadge("SERVICE FAILURE");
        } else {
          setAnalysisTypeBadge("DEVELOPMENT NEED");
        }

        setIsAnalyzed(true);
      } else {
        setFormError(result.error || "Failed to analyze request.");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setFormError("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!isAnalyzing) return;
    const interval = setInterval(() => {
      setAnalysisStep((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, [isAnalyzing]);



  const handleSubmit = async (e: React.FormEvent, isAnonymousOverride?: boolean) => {
    if (e?.preventDefault) e.preventDefault();
    setFormError("");

    if (!text.trim()) {
      setFormError(t("Please explain your feedback or request."));
      return;
    }
    if (!loksabha.trim()) {
      setFormError(t("Please select your Lok Sabha Constituency"));
      return;
    }

    
    const selectedStateObj = indiaData?.states?.find(s => s.id === state);
    const selectedDistrictObj = selectedStateObj?.districts?.find(d => d.id === district);
    const selectedLokSabhaObj = selectedStateObj?.lok_sabha?.find(l => l.id === loksabha);

    const lok_sabha_en = selectedLokSabhaObj?.name_en || loksabha;

    const finalAnonymous = isAnonymousOverride !== undefined ? isAnonymousOverride : anonymous;

    const state_en = selectedStateObj?.name_en || state;
    const state_hi = selectedStateObj?.name_hi || state;
    const district_en = selectedDistrictObj?.name_en || district;
    const district_hi = selectedDistrictObj?.name_hi || district;

    const payload: any = {
      text,
      state_id: state,
      state_en,
      state_hi,
      district_id: district,
      district_en,
      district_hi,
      lok_sabha_id: loksabha,
      lok_sabha_en,
      lok_sabha_hi: lok_sabha_en,
      district: district_en, // legacy fallback for frontend views
      state: state_en, // legacy fallback for frontend views
      loksabha_constituency: lok_sabha_en, // legacy fallback for frontend views
      constituency: lok_sabha_en,
      village_ward: villageWard,
      police_station: policeStation,
      gram_panchayat_municipality: gramPanchayat,
      pincode,
      phone_number: phoneNumber,
      category,
      submission_type: analysisTypeBadge,
      name: finalAnonymous ? "" : name,
      anonymous: finalAnonymous,
      photos
    };

    if (selectedMapLocation) {
      payload.latitude = selectedMapLocation.lat;
      payload.longitude = selectedMapLocation.lng;
      payload.location = {
        lat: selectedMapLocation.lat,
        lng: selectedMapLocation.lng,
        address: `${villageWard ? villageWard + ", " : ""}${lok_sabha_en}, India`
      };
    }

    setIsSubmitting(true);

    // Handle offline submission immediately if browser is offline
    if (!navigator.onLine) {
      try {
        saveToOfflineQueue(payload);
        // Create simulated success feedback for offline citizen
        const offlineId = "OFFLINE-" + Math.floor(100000 + Math.random() * 900000);
        const simOfflineSubmission: Submission = {
          id: offlineId,
          text_original: text,
          text_english: "[Saved Offline] " + text,
          language_detected: detectedLanguage.lang,
          language_native: detectedLanguage.native,
          district: district_en,
          state: state_en,
          loksabha_constituency: lok_sabha_en,
          category: category,
          submission_type: analysisTypeBadge,
          urgency: "Medium (Pending Sync)",
          issue_summary: "Your feedback is stored locally and will be uploaded automatically when internet is active.",
          photos,
          timestamp: new Date().toISOString(),
          anonymous
        };
        setSuccessData(simOfflineSubmission);
        resetForm();
      } catch (err: any) {
        setFormError("Failed to store locally: " + err.message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Standard online submission
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Submission failed");
      }

      const data = await res.json();
      saveComplaintToLocal(data);
      setSuccessData(data);
      resetForm();
    } catch (err: any) {
      console.error("Submission error:", err);
      // Fail gracefully: offer to save offline
      saveToOfflineQueue(payload);
      const offlineId = "OFFLINE-" + Math.floor(100000 + Math.random() * 900000);
      setSuccessData({
        id: offlineId,
        text_original: text,
        text_english: "[Saved Offline] " + text,
        language_detected: detectedLanguage.lang,
        language_native: detectedLanguage.native,
        district: district,
        state: state,
        loksabha_constituency: loksabha || "",
        category: category,
        submission_type: analysisTypeBadge,
        urgency: "Pending",
        issue_summary: t("Submission failed due to unstable network. Saved locally and will sync in background!"),
        photos,
        timestamp: new Date().toISOString(),
        anonymous
      });
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setText("");
    setPhotos([]);
    setGpsError(null);
    setCategory("");
    setState("");
    setDistrict("");
    setLoksabha("");
    setAssembly("");
    setVillageWard("");
    setPoliceStation("");
    setGramPanchayat("");
    setPincode("");
    setPhoneNumber("");
    setShowMoreInfo(false);
    setName("");
    setAnonymous(false);
  };

  // Track existing Complaint
  const handleTrackSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError("");
    setTrackedItem(null);

    if (!trackId.trim()) {
      setTrackError(t("Please enter a valid Complaint ID."));
      return;
    }

    setIsTrackSearching(true);

    try {
      const res = await fetch(`/api/submissions/${trackId.trim()}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Complaint not found");
      }
      const data = await res.json();
      setTrackedItem(data);
    } catch (err: any) {
      setTrackError(err.message || "Invalid Submission ID or network failure.");
    } finally {
      setIsTrackSearching(false);
    }
  };

  // Copy ID utility
  const copyToClipboard = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 3000);
  };

  // Font size utilities
  const getFontSizeClass = (type: "body" | "caption" | "sub" | "heading" | "button" | "badge") => {
    if (fontSize === "normal") {
      switch (type) {
        case "body": return "text-base";
        case "caption": return "text-sm text-slate-500";
        case "sub": return "text-lg";
        case "heading": return "text-2xl font-bold font-display";
        case "button": return "text-base font-semibold";
        case "badge": return "text-xs px-2.5 py-1 font-semibold";
      }
    } else if (fontSize === "large") {
      switch (type) {
        case "body": return "text-lg";
        case "caption": return "text-base text-slate-500";
        case "sub": return "text-xl";
        case "heading": return "text-3xl font-bold font-display";
        case "button": return "text-lg font-bold";
        case "badge": return "text-sm px-3.5 py-1.5 font-bold";
      }
    } else { // extra
      switch (type) {
        case "body": return "text-xl";
        case "caption": return "text-lg text-slate-500";
        case "sub": return "text-2xl";
        case "heading": return "text-4xl font-extrabold font-display";
        case "button": return "text-xl font-black";
        case "badge": return "text-base px-4 py-2 font-black";
      }
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      highContrast 
        ? "bg-black text-yellow-400 font-mono selection:bg-yellow-400 selection:text-black" 
        : "bg-parchment-pattern text-[#3E2723] font-sans selection:bg-[#FFB347] selection:text-[#1A237E]"
    }`}>

      {/* 🗣️ INITIAL LANGUAGE SELECTOR MODAL */}
      <AnimatePresence>
        {showLanguageSelector && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowLanguageSelector(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition text-slate-400 hover:text-slate-600 z-10"
                aria-label="Close"
              >
                ✕
              </button>
              <div className="text-center mb-6 shrink-0">
                <Globe className="w-12 h-12 text-[#1A237E] mx-auto mb-3 opacity-90" />
                <h2 className="text-2xl font-black text-[#1A237E] tracking-tight mb-1">{t('choose_language')}</h2>
                <p className="text-sm font-medium text-gray-500">{t('select_language')}</p>
              </div>
              
              <div className="overflow-y-auto pr-2 grid grid-cols-2 gap-3 custom-scrollbar flex-1 pb-4">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      i18n.changeLanguage(lang.code);
                      localStorage.setItem('jan_awaaz_lang', lang.code);
                      setShowLanguageSelector(false);
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                      i18n.language === lang.code 
                        ? "border-[#1A237E] bg-[#F8FAFC]" 
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <span className="text-xl font-black text-[#1A237E] mb-1">{lang.nativeName}</span>
                    <span className="text-xs font-semibold text-gray-500">{lang.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🟢 OFFLINE / ONLINE SYNC NOTICES */}
      <AnimatePresence>
        {showOfflineNotice && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-4 right-4 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 ${
              isOnline 
                ? "bg-emerald-500 text-white border-emerald-400" 
                : "bg-amber-600 text-white border-amber-500"
            }`}
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">
                {isOnline 
                  ? t("Internet Restored") 
                  : t("You are offline")}
              </p>
              <p className="text-xs opacity-90">
                {isOnline 
                  ? "Back online. Syncing any offline feedback in background..." 
                  : "Your submissions will be saved locally and sent when internet returns."}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🌐 TOP BAR ACCESSIBILITY CONTROL PANEL */}
      <header 
        className={`relative overflow-hidden transition-all duration-300 ${
          highContrast ? "border-b border-yellow-400 bg-black text-yellow-400" : "bg-[#FFFEF7] border-b border-[#E8DCC8] shadow-sm"
        }`}
      >
        {!highContrast && (
          <div 
            className="absolute -inset-4 bg-cover bg-center bg-no-repeat opacity-[0.65] pointer-events-none"
            style={{ backgroundImage: "url('/header-bg.webp?v=2')" }}
          />
        )}

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-24 relative z-20 flex flex-col md:flex-row justify-between items-stretch gap-6">
          
          {/* Brand & Tagline Column */}
          <div className="flex-1 flex flex-col justify-between gap-4">
            
            {/* Logo and Titles */}
            <div className="flex items-center gap-4">
              {/* Concentric Split Ring Logo */}
              <div className="shrink-0">
                {highContrast ? (
                  <div className="w-16 h-16 rounded-full border-4 border-yellow-400 flex items-center justify-center bg-black text-yellow-400">
                    <Globe className="w-8 h-8" />
                  </div>
                ) : (
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
                )}
              </div>

              <div className="text-left">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex flex-wrap items-baseline gap-1.5 leading-none">
                  {i18n.language === 'en' ? (
                    <>
                      <span className={highContrast ? "text-yellow-400" : "text-[#FFB347] font-extrabold"}>Jan</span>
                      <span className={highContrast ? "text-yellow-400" : "text-[#2E7D32] font-black"}>Awaaz</span>
                    </>
                  ) : (
                    <span className={highContrast ? "text-yellow-400" : "text-[#2E7D32] font-black"}>{t('app_title')}</span>
                  )}
                </h1>
                <div className={`text-sm font-bold mt-1.5 flex flex-col gap-0.5 ${highContrast ? "text-yellow-400/80" : "text-[#1A237E]"}`}>
                  <span>{t('app_subtitle')}</span>
                </div>
              </div>
            </div>

            {/* Check Shield Trust Banner Tagline */}
            <div className={`flex items-start sm:items-center gap-2.5 py-1 px-1 text-xs font-semibold ${
              highContrast ? "text-yellow-400" : "text-[#3E2723]"
            }`}>
              <svg className={`w-4 h-4 shrink-0 mt-0.5 sm:mt-0 ${highContrast ? "text-yellow-400" : "text-[#2E7D32]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div className="flex flex-wrap items-center gap-x-1.5 leading-relaxed">
                <span>{t('tagline')}</span>
              </div>
            </div>

          </div>

          {/* Right Side Column (Controls & Scenic Illustration absolute bg) */}
          <div className="flex flex-col justify-between items-end gap-6 relative md:min-w-[280px]">
            
            {/* Accessibility / Controls Row */}
            <div className="flex flex-wrap items-center justify-end gap-3 w-full relative z-30">
              
              
              {/* My Complaints Button */}
              {myComplaints.length > 0 && (
                <button
                  onClick={() => setIsMyComplaintsOpen(true)}
                  className={`px-3 py-1.5 rounded-xl border-2 font-bold text-xs flex items-center gap-1.5 transition relative ${
                    highContrast
                      ? "bg-black border-yellow-400 text-yellow-400"
                      : "bg-[#FFFEF7] border-[#1A237E] text-[#1A237E] hover:bg-[#FDF6E3] shadow-sm"
                  }`}
                >
                  📋 <span className="hidden sm:inline">{t('My Complaints')}</span>
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-[#FFFEF7] shadow-sm">
                    {myComplaints.length}
                  </span>
                </button>
              )}

              

              {/* Language Selection Stamp */}
              <div className="relative">
                <button 
                  onClick={() => setShowLanguageSelector(true)}
                  className={`px-3 py-1.5 rounded-xl border-2 font-bold text-xs flex items-center gap-1.5 transition ${
                    highContrast 
                      ? "bg-black border-yellow-400 text-yellow-400" 
                      : "bg-[#FFFEF7] border-[#C8B99A] text-[#1A237E] hover:bg-[#FDF6E3] shadow-sm"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{SUPPORTED_LANGUAGES.find(l => l.code === i18n.language)?.nativeName || 'English'}</span>
                </button>
              </div>

              {/* Font Size Selector Styled as Ink Stamps */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setFontSize("normal")} 
                  title="Normal text"
                  className={`w-8 h-8 border-2 rounded-lg flex items-center justify-center font-black text-xs transition ${
                    fontSize === "normal" 
                      ? (highContrast ? "bg-yellow-400 text-black border-yellow-400" : "bg-[#1A237E] text-[#FFFEF7] border-[#1A237E]") 
                      : (highContrast ? "text-yellow-400 border-yellow-400 bg-black hover:bg-yellow-400/10" : "bg-[#FFFEF7] text-[#1A237E] border-[#E8DCC8] hover:bg-[#FDF6E3]")
                  }`}
                >
                  A
                </button>
                <button 
                  onClick={() => setFontSize("large")} 
                  title="Large text"
                  className={`w-8 h-8 border-2 rounded-lg flex items-center justify-center font-black text-sm transition ${
                    fontSize === "large" 
                      ? (highContrast ? "bg-yellow-400 text-black border-yellow-400" : "bg-[#1A237E] text-[#FFFEF7] border-[#1A237E]") 
                      : (highContrast ? "text-yellow-400 border-yellow-400 bg-black hover:bg-yellow-400/10" : "bg-[#FFFEF7] text-[#1A237E] border-[#E8DCC8] hover:bg-[#FDF6E3]")
                  }`}
                >
                  A+
                </button>
                <button 
                  onClick={() => setFontSize("extra")} 
                  title="Very Large text"
                  className={`w-8 h-8 border-2 rounded-lg flex items-center justify-center font-black text-base transition ${
                    fontSize === "extra" 
                      ? (highContrast ? "bg-yellow-400 text-black border-yellow-400" : "bg-[#1A237E] text-[#FFFEF7] border-[#1A237E]") 
                      : (highContrast ? "text-yellow-400 border-yellow-400 bg-black hover:bg-yellow-400/10" : "bg-[#FFFEF7] text-[#1A237E] border-[#E8DCC8] hover:bg-[#FDF6E3]")
                  }`}
                >
                  A++
                </button>
              </div>

              {/* High Contrast Toggle Button */}
              <button
                onClick={() => setHighContrast(!highContrast)}
                className={`px-3 py-1.5 rounded-xl border-2 font-bold text-xs flex items-center gap-1.5 transition ${
                  highContrast 
                    ? "border-yellow-400 bg-yellow-400 text-black hover:bg-yellow-300" 
                    : "border-[#C8B99A] bg-[#FFFEF7] text-[#1A237E] hover:bg-[#FDF6E3] shadow-sm"
                }`}
              >
                {highContrast ? (
                  <>
                    <Sun className="w-3.5 h-3.5" />
                    <span>{t('light')}</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5" />
                    <span>{t('dark')}</span>
                  </>
                )}
              </button>
              
              {/* Logout Button */}
              <button
                onClick={() => { localStorage.removeItem('jan_awaaz_user'); window.location.href = '/login'; }}
                className={`px-3 py-1.5 rounded-xl border-2 font-bold text-xs flex items-center gap-1.5 transition ${
                  highContrast 
                    ? "border-yellow-400 text-yellow-400 hover:bg-yellow-400/10" 
                    : "border-red-600 bg-[#FFFEF7] text-red-600 hover:bg-red-50 shadow-sm"
                }`}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{String(t("Logout"))}</span>
              </button>
              
              

            </div>

          </div>
        </div>

      </header>

      {/* Main Body Background Wrapper */}
      <div className="flex-1 w-full flex flex-col relative overflow-hidden">
        {!highContrast && (
          <div 
            className="absolute -inset-4 bg-center bg-no-repeat opacity-40 pointer-events-none z-0"
            style={{ backgroundImage: "url('/background.png')", backgroundSize: "100% auto" }}
          />
        )}
        <div className="relative z-10 flex-1 flex flex-col w-full">

      {/* ⚠️ OFFLINE BACKGROUND SYNC STATUS BAR */}
      {offlineQueue.length > 0 && (
        <div className={`py-3 px-4 text-sm font-bold flex flex-col sm:flex-row items-center justify-between gap-3 transition ${
          highContrast ? "bg-yellow-400/20 border-b-2 border-yellow-400 text-yellow-400" : "bg-amber-50 text-amber-800 border-b border-amber-100"
        }`}>
          <div className="flex items-center gap-2 text-center sm:text-left">
            <Clock className="w-4 h-4 animate-spin shrink-0" />
            <span>
              {offlineQueue.length} unsent work request(s) saved locally. {isSyncing ? "Syncing now..." : "Will send when internet is stable."} 
              <br className="sm:hidden" />
              <span className="opacity-80"> | {offlineQueue.length} कार्य अनुरोध सुरक्षित हैं।</span>
            </span>
          </div>
          {!showCancelConfirm ? (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex shrink-0 items-center gap-1 ${
                highContrast ? "bg-black border border-yellow-400 text-yellow-400 hover:bg-yellow-400/10" : "bg-white border border-red-300 text-red-600 hover:bg-red-50"
              }`}
            >
              <Trash2 className="w-3 h-3" /> Cancel Unsent
            </button>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setOfflineQueue([]);
                  localStorage.removeItem("janawaaz_offline_queue");
                  setShowCancelConfirm(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  highContrast ? "bg-red-600 text-white border border-red-600" : "bg-red-600 text-white shadow-sm hover:bg-red-700"
                }`}
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  highContrast ? "bg-black text-yellow-400 border border-yellow-400 hover:bg-yellow-400/10" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Back
              </button>
              
              {/* Logout Button */}
              <button
                onClick={() => { localStorage.removeItem('jan_awaaz_user'); window.location.href = '/login'; }}
                className={`px-3 py-1.5 rounded-xl border-2 font-bold text-xs flex items-center gap-1.5 transition ${
                  highContrast 
                    ? "border-yellow-400 text-yellow-400 hover:bg-yellow-400/10" 
                    : "border-red-600 bg-[#FFFEF7] text-red-600 hover:bg-red-50 shadow-sm"
                }`}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{String(t("Logout"))}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 🎛️ PORTAL CHANNELS (TABS) */}
      <nav className={`py-2 px-4 flex justify-center border-b transition-colors ${
        highContrast ? "bg-black border-yellow-400" : "bg-[#FFFEF7] border-[#E8DCC8]"
      }`}>
        <div className="w-full max-w-3xl grid grid-cols-3 gap-2">
          <button
            onClick={() => { setActiveTab("submit"); setSuccessData(null); }}
            className={`py-2 px-2 sm:px-4 rounded-xl flex items-center justify-center gap-1 sm:gap-2 transition duration-200 ${
              activeTab === "submit"
                ? (highContrast ? "bg-yellow-400 text-black font-black border-2 border-yellow-400" : "bg-[#2E7D32] text-white shadow-md font-bold")
                : (highContrast ? "text-yellow-400 border border-yellow-400 hover:bg-yellow-400/10" : "bg-[#FFFEF7] text-black border border-[#E8DCC8] hover:bg-[#FDF6E3] font-medium")
            }`}
          >
            <Send className="w-4 h-4 hidden sm:block" />
            <span className={fontSize === "normal" ? "text-sm font-semibold" : fontSize === "large" ? "text-base font-bold" : "text-lg font-black"}>
              {t('submit_tab')}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab("track"); }}
            className={`py-2 px-2 sm:px-4 rounded-xl flex items-center justify-center gap-1 sm:gap-2 transition duration-200 ${
              activeTab === "track"
                ? (highContrast ? "bg-yellow-400 text-black font-black border-2 border-yellow-400" : "bg-[#E65100] text-white shadow-md font-bold")
                : (highContrast ? "text-yellow-400 border border-yellow-400 hover:bg-yellow-400/10" : "bg-[#FFFEF7] text-black border border-[#E8DCC8] hover:bg-[#FDF6E3] font-medium")
            }`}
          >
            <Search className="w-4 h-4 hidden sm:block" />
            <span className={fontSize === "normal" ? "text-sm font-semibold" : fontSize === "large" ? "text-base font-bold" : "text-lg font-black"}>
              {t('track_tab')}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab("public"); setSuccessData(null); }}
            className={`py-2 px-2 sm:px-4 rounded-xl flex items-center justify-center gap-1 sm:gap-2 transition duration-200 ${
              activeTab === "public"
                ? (highContrast ? "bg-yellow-400 text-black font-black border-2 border-yellow-400" : "bg-[#2E7D32] text-white shadow-md font-bold")
                : (highContrast ? "text-yellow-400 border border-yellow-400 hover:bg-yellow-400/10" : "bg-[#FFFEF7] text-black border border-[#E8DCC8] hover:bg-[#FDF6E3] font-medium")
            }`}
          >
            <Sparkles className="w-4 h-4 hidden sm:block" />
            <span className="text-[13px] sm:text-[15px] whitespace-nowrap">{highContrast ? "PUBLIC BOARD" : "Community"}</span>
          </button>
        </div>
      </nav>

      {/* 🏛️ MAIN APP STAGE */}
      <main className=")flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center items-center">
        
        <AnimatePresence mode="wait">
          
          {/* TAB 1: FORM OR SUCCESS VIEW */}
          {activeTab === "submit" && (
            <motion.div
              key="submit-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-2xl"
            >
              
              {!successData ? (
                /* SUBMISSION FORM */
                <form 
                  onSubmit={handleSubmit}
                  className={`rounded-3xl p-6 sm:p-8 shadow-md border transition duration-300 ${
                    highContrast ? "bg-black border-yellow-400 border-4" : "bg-[#FFFEF7] border-[#E8DCC8]"
                  }`}
                >
                  <div className="mb-6 border-b pb-4 border-dashed transition-colors border-[#E8DCC8]">
                    <h2 className={getFontSizeClass("heading")}>
                      {t('share_area_needs')}
                    </h2>
                    <p className={`${getFontSizeClass("caption")} mt-1 text-[#6B7280]`}>
                      {t('speak_freely')}
                    </p>
                  </div>

                  {formError && (
                    <div className=")mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 font-medium text-sm flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* SECTION 1 — YOUR MESSAGE */}
                  <div className="mb-6">
                    <p className="text-[13px] text-[#6B7280] mb-2 leading-tight">
                      {i18n.language === 'hi' ? 'अपनी भाषा में लिखें या बोलें।' : 
                       i18n.language === 'as' ? 'আপোনাৰ নিজৰ ভাষাত লিখক বা কওক।' :
                       i18n.language === 'bn' ? 'আপনার নিজের ভাষায় লিখুন বা বলুন।' :
                       i18n.language === 'gu' ? 'તમારી પોતાની ભાષામાં લખો અથવા બોલો।' :
                       i18n.language === 'kn' ? 'ನಿಮ್ಮ ಸ್ವಂತ ಭಾಷೆಯಲ್ಲಿ ಬರೆಯಿರಿ ಅಥವಾ ಮಾತನಾಡಿ।' :
                       i18n.language === 'ml' ? 'നിങ്ങളുടെ സ്വന്തം ഭാഷയിൽ എഴുതുകയോ സംസാരിക്കുകയോ ചെയ്യുക।' :
                       i18n.language === 'mr' ? 'तुमच्या स्वतःच्या भाषेत लिहा किंवा बोला।' :
                       i18n.language === 'or' ? 'ଆପଣଙ୍କ ନିଜ ଭାଷାରେ ଲେଖନ୍ତୁ କିମ୍ବା କୁହନ୍ତୁ।' :
                       i18n.language === 'pa' ? 'ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਲਿਖੋ ਜਾਂ ਬੋਲੋ।' :
                       i18n.language === 'ta' ? 'உங்கள் சொந்த மொழியில் எழுதுங்கள் அல்லது பேசுங்கள்।' :
                       i18n.language === 'te' ? 'మీ స్వంత భాషలో రాయండి లేదా మాట్లాడండి।' :
                       i18n.language === 'ur' ? 'اپنی زبان میں لکھیں یا بولیں۔' :
                       'Write or speak in your own language.'}
                    </p>
                    <div className="relative">
                      <textarea
                        value={isRecording && interimText ? `${text} ${interimText}`.trim() : text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={String(t("What does your area need most? What would change your life?"))}
                        className={`w-full min-h-[140px] rounded-2xl p-4 pb-12 text-base focus:outline-none transition resize-none ${
                          highContrast 
                            ? "bg-black border-yellow-400 border-2 text-yellow-400 placeholder:text-yellow-400/50" 
                            : "bg-[#FFFEF7] border border-[#C8B99A] focus:bg-white focus:border-[#FFB347] focus:ring-2 focus:ring-[#FFB347]/30 text-[#3E2723] placeholder-[#C8B99A]/80"
                        }`}
                      />
                      
                      {/* Embedded Voice Controls inside Textarea */}
                      {voiceSupported && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                          {isRecording ? (
                            <div className={`flex items-center gap-2 rounded-full py-1.5 px-3 shadow-sm border animate-in fade-in zoom-in-95 duration-200 ${
                              highContrast ? "bg-black border-red-500 text-red-500" : "bg-red-50 border-red-100 text-red-600"
                            }`}>
                              <div className="relative flex h-2.5 w-2.5 mr-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                              </div>
                              <span className="text-[11px] font-bold uppercase tracking-wider animate-pulse">
                                {recordingLanguage.startsWith('hi') ? "सुन रहा है..." : "Listening..."}
                              </span>
                              <div className="flex items-center gap-1 ml-1 border-l border-red-200 pl-2">
                                <button type="button" onClick={cancelRecording} className="p-1 hover:bg-red-100 rounded-full transition-colors" title="Cancel">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={stopRecording} className="p-1 hover:bg-red-100 rounded-full transition-colors" title="Done">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : isTranscribingVoice ? (
                            <div className={`flex items-center gap-2 rounded-full py-1.5 px-3 shadow-sm border ${
                              highContrast ? "bg-black border-indigo-500 text-indigo-400" : "bg-indigo-50 border-indigo-100 text-indigo-600"
                            }`}>
                              <div className="animate-spin rounded-full h-3 w-3 border-[2px] border-current border-t-transparent"></div>
                              <span className="text-[11px] font-bold uppercase tracking-wider">
                                {recordingLanguage.startsWith('hi') ? "प्रक्रिया..." : "Processing..."}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <select 
                                value={recordingLanguage}
                                onChange={(e) => setRecordingLanguage(e.target.value)}
                                className={`text-[11px] font-medium rounded-full px-2 py-1.5 outline-none cursor-pointer border ${
                                  highContrast ? "bg-black text-yellow-400 border-yellow-400" : "bg-white/80 text-[#6B7280] border-[#E8DCC8] hover:bg-white"
                                }`}
                                title="Voice typing language"
                              >
                                <option value="hi-IN">Hindi (हिंदी)</option>
                                <option value="en-IN">English</option>
                                <option value="bn-IN">Bengali (বাংলা)</option>
                                <option value="te-IN">Telugu (తెలుగు)</option>
                                <option value="mr-IN">Marathi (मराठी)</option>
                                <option value="ta-IN">Tamil (தமிழ்)</option>
                                <option value="ur-IN">Urdu (اردو)</option>
                                <option value="gu-IN">Gujarati (ગુજરાતી)</option>
                                <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
                                <option value="ml-IN">Malayalam (മലയാളം)</option>
                                <option value="pa-IN">Punjabi (ਪੰਜਾਬੀ)</option>
                                <option value="as-IN">Assamese (অসমীয়া)</option>
                                <option value="or-IN">Odia (ଓଡ଼ିଆ)</option>
                              </select>
                              <button
                                type="button"
                                onClick={startRecording}
                                className={`p-2 rounded-full transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 ${
                                  highContrast
                                    ? "bg-yellow-400 text-black border-yellow-400"
                                    : "bg-gradient-to-r from-[#1A237E] to-[#283593] text-white"
                                }`}
                                title={String(t("voice_typing"))}
                              >
                                <Mic className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <p className="text-sm font-bold text-[#3E2723]">{String(t("share_photo_msg"))}</p>
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => setHasPhoto(true)}
                          className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 transition ${
                            hasPhoto === true 
                              ? "border-[#FF9933] bg-[#FFF8E1] text-[#1A237E]" 
                              : "border-[#E8DCC8] bg-white text-[#3E2723]"
                          }`}
                        >
                          {String(t("yes"))}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setHasPhoto(false)}
                          className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 transition ${
                            hasPhoto === false 
                              ? "border-[#FF9933] bg-[#FFF8E1] text-[#1A237E]" 
                              : "border-[#E8DCC8] bg-white text-[#3E2723]"
                          }`}
                        >
                          {String(t("no"))}
                        </button>
                      </div>
                    </div>

                    {hasPhoto === true && (
                      <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" id="photo-file" />
                        <label htmlFor="photo-file" className={`py-3 px-5 rounded-2xl flex items-center gap-2 border-2 border-dashed font-bold text-sm cursor-pointer transition ${
                          highContrast ? "border-yellow-400 bg-black text-yellow-400" : "border-[#C8B99A] bg-[#FFFEF7] text-[#3E2723] hover:border-[#FFB347]"
                        }`}>
                          <ImageIcon className="w-5 h-5" />
                          <span>{photos.length > 0 ? "Add More" : "📷 Upload Photo"}</span>
                        </label>
                        
                        <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" id="camera-file" />
                        <label htmlFor="camera-file" className={`py-3 px-5 rounded-2xl flex items-center gap-2 border-2 border-dashed font-bold text-sm cursor-pointer transition ${
                          highContrast ? "border-yellow-400 bg-black text-yellow-400" : "border-[#C8B99A] bg-[#FFFEF7] text-[#3E2723] hover:border-[#FFB347]"
                        }`}>
                          <Camera className="w-5 h-5" />
                          <span>{photos.length > 0 ? "Capture More" : "📸 Take Photo with GPS"}</span>
                        </label>
                      </div>
                    )}
                    {photos.length > 0 && (
                      <div className="flex flex-col gap-3 mt-4 w-full">
                        {photos.map((photo, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="relative group rounded-xl overflow-hidden border border-[#E8DCC8] h-20 w-32 shrink-0">
                              <img src={photo.url} alt={`Attachment ${index + 1}`} className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setPhotos(prev => prev.filter((_, i) => i !== index))}
                                className="absolute inset-0 bg-black/40 sm:opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white cursor-pointer"
                              >
                                <div className="bg-red-500/80 p-1.5 rounded-full"><Trash2 className="w-4 h-4 text-white" /></div>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SECTION 2 — LOCATION */}
                  <div className="mb-8">
                    <label className="block mb-4 text-[13px] uppercase font-bold text-[#6B7280]">{String(t("where_is_need"))}</label>

                    <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                      <p className="text-sm text-blue-900 flex items-start gap-2">
                        <span className="text-lg">📍</span> 
                        <span><strong>{t('important')}:</strong> {t('provide_exact_location')}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <SearchableSelect
                            options={indiaData?.states || []}
                            value={state}
                            onChange={(val) => { setState(val); setDistrict(""); setLoksabha(""); }}
                            placeholder={String(t("State"))}
                            highContrast={highContrast}
                          />
                        </div>
                        <div>
                          <SearchableSelect
                            options={state ? indiaData?.states?.find(s => s.id === state)?.districts || [] : []}
                            value={district}
                            onChange={(val) => { setDistrict(val); setLoksabha(""); }}
                            placeholder={String(t("District"))}
                            disabled={!state}
                            highContrast={highContrast}
                          />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                          <SearchableSelect
                            options={state ? indiaData?.states?.find(s => s.id === state)?.lok_sabha || [] : []}
                            value={loksabha}
                            onChange={(val) => setLoksabha(val)}
                            placeholder={String(t("Lok Sabha Constituency"))}
                            disabled={!state}
                            highContrast={highContrast}
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={villageWard}
                            onChange={(e) => setVillageWard(e.target.value)}
                            placeholder={String(t("Village or Town name"))}
                            className={`w-full rounded-xl p-3 h-[42px] focus:outline-none border text-sm ${highContrast ? "bg-black border-yellow-400 text-yellow-400" : "bg-[#FFFEF7] border-[#C8B99A] text-[#3E2723]"}`}
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={gramPanchayat}
                            onChange={(e) => setGramPanchayat(e.target.value)}
                            placeholder={String(t("Gram Panchayat name"))}
                            className={`w-full rounded-xl p-3 h-[42px] focus:outline-none border text-sm ${highContrast ? "bg-black border-yellow-400 text-yellow-400" : "bg-[#FFFEF7] border-[#C8B99A] text-[#3E2723]"}`}
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={policeStation}
                            onChange={(e) => setPoliceStation(e.target.value)}
                            placeholder={String(t("Nearest Police Station"))}
                            className={`w-full rounded-xl p-3 h-[42px] focus:outline-none border text-sm ${highContrast ? "bg-black border-yellow-400 text-yellow-400" : "bg-[#FFFEF7] border-[#C8B99A] text-[#3E2723]"}`}
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        {!showMap ? (
                          <button
                            type="button"
                            onClick={async (e) => {
                              const btn = e.currentTarget;
                              const originalText = btn.innerHTML;
                              btn.innerHTML = t("⏳ Loading Map...");
                              btn.disabled = true;
                              
                              const stateObj = indiaData?.states?.find(s => s.id === state);
                              const distObj = stateObj?.districts?.find(d => d.id === district);
                              const lsObj = stateObj?.lok_sabha?.find(l => l.id === loksabha);
                              
                              let stateQuery = "India";
                              if (stateObj) stateQuery = `${stateObj.name_en}, India`;
                              let districtQuery = distObj ? `${distObj.name_en}, ${stateQuery}` : stateQuery;
                              let lsQuery = lsObj ? `${lsObj.name_en}, ${stateQuery}` : districtQuery;
                              
                              let query = villageWard ? `${villageWard}, ${lsQuery}` : lsQuery;

                              
                              try {
                                let found = false;
                                // Try village level
                                if (villageWard) {
                                  const res = await fetch(`/api/geocode?address=${encodeURIComponent(query)}`);
                                  const data = await res.json();
                                  if (data.lat && data.lng) {
                                    setMapCenter([data.lat, data.lng]);
                                    found = true;
                                  }
                                }
                                
                                // Fallback to district level
                                if (!found && distObj) {
                                  const res = await fetch(`/api/geocode?address=${encodeURIComponent(districtQuery)}`);
                                  const data = await res.json();
                                  if (data.lat && data.lng) {
                                    setMapCenter([data.lat, data.lng]);
                                    found = true;
                                  }
                                }

                                // Fallback to state level
                                if (!found) {
                                  const res = await fetch(`/api/geocode?address=${encodeURIComponent(stateQuery)}`);
                                  const data = await res.json();
                                  if (data.lat && data.lng) {
                                    setMapCenter([data.lat, data.lng]);
                                  }
                                }
                              } catch (e) {
                                console.error(e);
                              }
                              setShowMap(true);
                              btn.innerHTML = originalText;
                              btn.disabled = false;
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition bg-white text-[#1A237E] border-[#1A237E] hover:bg-[#1A237E] hover:text-white disabled:opacity-50 disabled:cursor-wait`}
                          >{String(t("📍 Pinpoint exact location on Map"))}</button>
                        ) : (
                          <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
                            <p className="text-sm font-bold text-[#3E2723]">{String(t("Select exact location"))}</p>
                            <LocationPicker 
                              initialCenter={mapCenter} 
                              onLocationSelect={(lat, lng) => setSelectedMapLocation({lat, lng})}
                              highContrast={highContrast}
                              searchContext={{
                                state: "India",
                                district: indiaData?.states?.find(s => s.id === state)?.lok_sabha?.find(l => l.id === loksabha)?.name_en || ""
                              }}
                            />
                          </div>
                        )}
                      </div>
                  </div>

                  {/* SECTION 3 & 4 & 5 & 6 */}
                  {!isAnalyzed ? (
                    isAnalyzing ? (
                      <div className="w-full text-center space-y-3 mt-6">
                        <p className="text-[#1A237E] font-bold text-lg h-6">
                          {analysisStep === 0 && t("Reading your message...")}
                          {analysisStep === 1 && t("Understanding your need...")}
                          {analysisStep === 2 && t("Checking your photo...")}
                          {analysisStep === 3 && t("Almost ready...")}
                        </p>
                        <div className="w-full h-2 bg-[#E8DCC8] rounded-full overflow-hidden">
                          <div className="h-full bg-[#FF9933] w-1/2 rounded-full" style={{
                            animation: "loading 2s ease-in-out infinite",
                            background: "linear-gradient(90deg, transparent, #FF9933, transparent)",
                            backgroundSize: "200% 100%"
                          }} />
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAnalysis}
                        disabled={!text.trim() || hasPhoto === null || (hasPhoto && photos.length === 0) || !state || !district || !loksabha}
                        className="w-full py-[16px] px-6 rounded-[8px] bg-[#1A237E] text-white font-bold text-[16px] flex items-center justify-center gap-2 transition disabled:bg-[#9E9E9E] disabled:cursor-not-allowed"
                      >{String(t("🔍 Submit for Analysis"))}</button>
                    )
                  ) : (
                    <div className="space-y-6">
                      <div className="mt-4 p-4 bg-[#E8F4FD] border-l-4 border-l-[#1A237E] rounded-xl shadow-sm">
                        <p className="text-[11px] font-bold text-[#6B7280] mb-2 uppercase">{String(t("AI IDENTIFIED"))}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {analyzedTags.map((tag, idx) => {
                            let formattedTag = tag.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                            if (formattedTag.toLowerCase().includes("womens burden") || formattedTag.toLowerCase().includes("women burden")) {
                                formattedTag = "Women & Water Access";
                            }
                            return (
                              <span key={idx} className="px-[14px] py-[6px] text-[13px] font-medium text-[#1A237E] border border-[#FF9933] rounded-full bg-[#FFF3E0]">
                                {formattedTag}
                              </span>
                            );
                          })}
                        </div>
                        <div className="flex">
                          <span className={`inline-block px-4 py-1.5 rounded-full text-[12px] whitespace-nowrap uppercase font-bold text-white tracking-wider ${
                            analysisTypeBadge === 'EMERGENCY' ? 'bg-[#C62828]' :
                            analysisTypeBadge === 'SERVICE FAILURE' ? 'bg-[#EF6C00]' :
                            'bg-[#1A237E]'
                          }`}>
                            {analysisTypeBadge}
                          </span>
                        </div>
                      </div>
                      
                      {analysisTypeBadge === 'EMERGENCY' && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 font-bold flex gap-3 shadow-sm">
                          <span className="text-xl shrink-0">🚨</span>
                          <p className="text-sm">This has been marked as an emergency and will be immediately flagged for your MP's attention.</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            setAnonymous(true);
                            handleSubmit(e as any, true);
                          }}
                          className="py-[16px] px-4 rounded-[8px] border-2 border-[#1A237E] text-[#1A237E] bg-white font-bold hover:bg-[#F5F5F5] transition text-sm text-center"
                        >
                          {t('submit_as_community', { lng: 'en' })} <br/> <span className="font-normal opacity-80 text-xs">{t('submit_as_community')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowMoreInfo(true)}
                          className="py-[16px] px-4 rounded-[8px] bg-[#FF9933] text-white font-bold hover:bg-[#F57C00] transition text-sm text-center"
                        >
                          {t('add_my_details', { lng: 'en' })} <br/> <span className="font-normal opacity-80 text-xs">{t('add_my_details')}</span>
                        </button>
                      </div>

                      {showMoreInfo && (
                        <div className="mt-6 border-t border-[#E8DCC8] pt-6 animate-in slide-in-from-top-4 duration-300">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div>
                              <label className="block mb-1 text-sm font-bold text-[#3E2723]">{String(t("Full Name"))}</label>
                              <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Optional"
                                className={`w-full rounded-xl p-3 focus:outline-none border ${highContrast ? "bg-black border-yellow-400 text-yellow-400" : "bg-[#FFFEF7] border-[#C8B99A] text-[#3E2723]"}`}
                              />
                            </div>
                            <div>
                              <label className="block mb-1 text-sm font-bold text-[#3E2723]">{String(t("Phone Number (Get Updates via SMS)"))}</label>
                              <input
                                type="text"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="Enter 10-digit number for SMS alerts"
                                className={`w-full rounded-xl p-3 focus:outline-none border ${highContrast ? "bg-black border-yellow-400 text-yellow-400" : "bg-[#FFFEF7] border-[#C8B99A] text-[#3E2723]"}`}
                              />
                              <p className="text-[11px] text-[#2E7D32] font-semibold mt-1 flex items-center gap-1">
                                🔔 Enter your number to receive tracking ID & live MP updates instantly via SMS!
                              </p>
                              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                                <input type="checkbox" checked={isWhatsApp} onChange={(e) => setIsWhatsApp(e.target.checked)} className="rounded" /><span className="text-xs text-[#6B7280]">{String(t("Send updates on WhatsApp too"))}</span>
                              </label>
                            </div>
                            
                            <div>
                              <label className="block mb-1 text-sm font-bold text-[#3E2723]">{String(t("Pincode"))}</label>
                              <input
                                type="number"
                                value={pincode}
                                onChange={(e) => setPincode(e.target.value)}
                                placeholder="Optional"
                                className={`w-full rounded-xl p-3 focus:outline-none border ${highContrast ? "bg-black border-yellow-400 text-yellow-400" : "bg-[#FFFEF7] border-[#C8B99A] text-[#3E2723]"}`}
                              />
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              setAnonymous(false);
                              handleSubmit(e as any, false);
                            }}
                            className="w-full py-[16px] px-6 rounded-[8px] bg-[#138808] text-white font-bold text-[16px] transition hover:bg-[#0E6606]"
                          >{String(t("✓ Submit to MP"))}</button>
                        </div>
                      )}
                    </div>
                  )}
                </form>) : ( /* 🏆 SUCCESS SCREEN */ <motion.div
                  id="success-receipt"
                  ref={receiptRef}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`rounded-3xl p-6 sm:p-10 text-center transition ${
                    highContrast ? "bg-black border-yellow-400 border-4" : "bg-transparent"
                  }`}
                >
                  <div className="mx-auto flex items-center justify-center mb-4">
                    <span className="text-[#138808] text-[60px] leading-none">✓</span>
                  </div>

                  <h2 className={`font-bold text-[#1A237E] mb-6 leading-tight ${
                    fontSize === "normal" ? "text-[20px]" : fontSize === "large" ? "text-[24px]" : "text-[28px]"
                  }`}>
                    Your voice has been heard. / आपकी आवाज सुनी गई है।
                  </h2>

                  {/* SUBMISSION ID BLOCK */}
                  <div className={`mx-auto max-w-sm mb-6 p-5 text-left border-l-4 ${
                    highContrast ? "border-yellow-400 bg-gray-900" : "border-l-[#FF9933] bg-[#FDF6E3] border border-[#E8DCC8] rounded-r-xl"
                  }`}>
                    <span className={`block text-[13px] text-[#6B7280] mb-2`}>
                      Your Reference ID:
                    </span>
                    <span className="block text-xl font-mono font-black text-[#1A237E] select-all bg-white px-3 py-1.5 rounded border border-slate-200/60 shadow-sm text-center">
                      {successData.formatted_tracking_id || successData.id}
                    </span>
                    <p className="text-[11px] text-[#FF9933] font-bold mt-2 text-center">
                      ⚠️ Save this Reference ID to track updates in the "Track" tab!
                    </p>
                  </div>

                  {/* SMS CONFIRMATION CARD */}
                  {(successData.phone || successData.phone_number) && (
                    <div className={`mx-auto max-w-sm mb-6 p-4 rounded-xl border text-left flex items-start gap-3 ${
                      highContrast 
                        ? "border-yellow-400 bg-black text-yellow-400" 
                        : "border-[#4CAF72] bg-[#E8F5E9] text-[#2E7D32]"
                    }`}>
                      <div className="text-xl shrink-0 mt-0.5">📲</div>
                      <div className="space-y-1.5 flex-1">
                        <span className="block font-black text-xs uppercase tracking-wider">SMS Confirmation Sent!</span>
                        <p className="text-xs leading-relaxed text-slate-700 font-medium">
                          We've dispatched an SMS tracking alert to <strong className="font-extrabold">{successData.phone || successData.phone_number}</strong>. You'll receive real-time SMS alerts automatically on subsequent actions taken by your MP or department!
                        </p>
                        {/* Interactive cell-phone simulated SMS view */}
                        <div className="mt-2.5 p-3 bg-white rounded-lg border border-slate-200/80 shadow-sm max-w-xs font-mono text-[10px] text-slate-600 leading-normal">
                          <div className="flex justify-between border-b pb-1 mb-1 text-[8px] font-black text-slate-400">
                            <span>💬 JAN AWAAZ SMS ALERT</span>
                            <span>JUST NOW</span>
                          </div>
                          <span className="font-bold text-slate-800">"Your concern #{successData.formatted_tracking_id || successData.id || "JA-..."} is submitted. We will send you SMS updates here on every action by MP."</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-6 flex justify-center">
                    <span className={`inline-block px-4 py-1.5 rounded-full text-[12px] whitespace-nowrap uppercase font-bold text-white tracking-wider ${
                      (successData.submission_type || 'DEVELOPMENT NEED') === 'EMERGENCY' ? 'bg-[#C62828]' :
                      (successData.submission_type || 'DEVELOPMENT NEED') === 'SERVICE FAILURE' ? 'bg-[#EF6C00]' :
                      'bg-[#1A237E]'
                    }`}>
                      {successData.submission_type || 'DEVELOPMENT NEED'}
                    </span>
                  </div>

                  <p className="text-[13px] text-[#6B7280] mb-8 leading-relaxed">
                    Your MP has been notified.
                  </p>

                  
                </motion.div>
              )}
            </motion.div>
          )}

          {/* TAB 2: COMPLAINT TRACKING */}
          {activeTab === "track" && (
            <motion.div
              key="track-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-2xl"
            >
              <div className={`rounded-3xl p-6 sm:p-8 shadow-md border transition duration-300 ${
                highContrast ? "bg-black border-yellow-400 border-4" : "bg-[#FFFEF7] border-[#E8DCC8]"
              }`}>
                
                <div className="mb-6 border-b pb-4 border-dashed transition-colors border-[#E8DCC8]">
                  <h2 className={getFontSizeClass("heading")}>
                    {String(t("Check Your Submission Status"))}
                  </h2>
                  <p className={`${getFontSizeClass("caption")} mt-1 text-[#3E2723]`}>
                    {String(t("Enter your Reference ID to check the status of your submission."))}
                    
                  </p>
                </div>

                <form onSubmit={handleTrackSearch} className=")mb-6 flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={trackId}
                    onChange={(e) => setTrackId(e.target.value)}
                    placeholder={t("e.g. jB9vDk19S") as string}
                    className={`flex-1 rounded-2xl p-3.5 text-base font-mono focus:outline-none transition ${
                      highContrast 
                        ? "bg-black border-yellow-400 border-2 text-yellow-400 placeholder:text-yellow-400/50" 
                        : "bg-[#FFFEF7] border border-[#C8B99A] focus:bg-white focus:border-[#FFB347] focus:ring-2 focus:ring-[#FFB347]/30 text-[#3E2723] placeholder-[#C8B99A]/80"
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isTrackSearching}
                    className={`py-3.5 px-6 rounded-2xl font-bold text-sm cursor-pointer shadow flex items-center justify-center shrink-0 gap-2 transition ${
                      isTrackSearching
                        ? "opacity-90 cursor-not-allowed bg-slate-800 text-white"
                        : (highContrast
                            ? "bg-yellow-400 text-black border-2 border-yellow-400 hover:bg-yellow-300"
                            : "bg-[#1A237E] text-white hover:bg-[#1A237E]/90")
                    }`}
                  >
                    {isTrackSearching ? (
                      <RotateCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        <span>{String(t("Track"))}</span>
                      </>
                    )}
                  </button>
                </form>

                {trackError && (
                  <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 font-medium text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{trackError}</span>
                  </div>
                )}

                {/* TRACKED COMPLAINT CARD */}
                {trackedItem && (
                  <motion.div
                    id="track-receipt"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-5 rounded-2xl border text-left ${
                      highContrast ? "border-yellow-400 bg-black" : "bg-[#FDF6E3] border-[#E8DCC8]"
                    }`}
                  >
                    {/* Header Info */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-dashed pb-4 border-[#E8DCC8] mb-4">
                      <div>
                        <span className="text-xs uppercase font-bold tracking-wider opacity-75 text-[#5D4037]">ID: {trackedItem.formatted_tracking_id || trackedItem.id}</span>
                        <h3 className={`font-black tracking-tight text-[#1A237E] mt-1 ${getFontSizeClass("sub")}`}>
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] uppercase font-bold tracking-wider text-white mr-2 ${
                            trackedItem.submission_type === 'EMERGENCY' ? 'bg-[#C62828]' :
                            trackedItem.submission_type === 'SERVICE FAILURE' ? 'bg-[#EF6C00]' :
                            'bg-[#1A237E]'
                          }`}>
                            {trackedItem.submission_type === 'EMERGENCY' ? 'URGENT' :
                             trackedItem.submission_type === 'SERVICE FAILURE' ? 'SERVICE ISSUE' :
                             'DEVELOPMENT NEED'}
                          </span>
                        </h3>
                        <p className="text-xs text-[#5D4037] flex items-center gap-1 mt-1.5">
                          <MapPin className="w-3 h-3" />
                          <span>{trackedItem.district}, {trackedItem.state}</span>
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {trackedItem.submission_type !== 'DEVELOPMENT NEED' && (
                          <span className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold ${
                            trackedItem.urgency === "Critical" ? "bg-[#B71C1C] text-white" :
                            trackedItem.urgency === "High" ? "bg-[#E65100] text-white" :
                            trackedItem.urgency === "Medium" ? "bg-[#1A237E] text-white" :
                            "bg-[#2E7D32] text-white"
                          }`}>
                            Urgency: {trackedItem.urgency}
                          </span>
                        )}
                        <button
                          onClick={() => window.open(`/receipt?id=${encodeURIComponent(trackedItem.formatted_tracking_id || trackedItem.id)}&reprint=true`, '_blank')}
                          className={`hide-on-print flex items-center gap-1 text-xs font-bold px-2 py-1 rounded transition ${
                            highContrast ? "bg-yellow-400 text-black hover:bg-yellow-500" : "bg-[#1A237E] text-white hover:bg-[#283593]"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-printer"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                          🖨️ Reprint Receipt
                        </button>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-75 block mb-1 text-[#5D4037]">Original message:</span>
                        <p className={`text-sm p-3 bg-[#FFFEF7] rounded-xl border border-[#E8DCC8] text-[#3E2723] leading-relaxed`}>
                          "{trackedItem.text_original}"
                        </p>
                      </div>

                      {trackedItem.normalised_text && trackedItem.normalised_text !== trackedItem.text_original && (
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider opacity-75 block mb-1 text-[#5D4037]">Understood as:</span>
                          <p className={`text-sm p-3 bg-[#FFFEF7] rounded-xl border border-[#E8DCC8] italic text-[#3E2723] leading-relaxed`}>
                            "{trackedItem.normalised_text}"
                          </p>
                        </div>
                      )}

                      {trackedItem.tags && trackedItem.tags.length > 0 && (
                        <div className="mt-4 space-y-3">
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider block mb-2 text-[#6B7280]">{String(t("AI IDENTIFIED"))}</span>
                            <div className="flex flex-wrap gap-2">
                              {trackedItem.tags.map((t: string) => (
                                <span key={t} className="bg-[#FFF3E0] border border-[#FF9933] text-[#1A237E] rounded-[20px] px-[12px] py-[4px] text-[13px] whitespace-nowrap font-medium">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                          {trackedItem.development_sector && (
                            <p className="text-[13px] text-[#6B7280]">Development Sector: {trackedItem.development_sector}</p>
                          )}
                          {trackedItem.what_is_needed && (
                            <p className="text-[13px] italic text-[#1A1A2E]">Need Identified: {trackedItem.what_is_needed}</p>
                          )}
                        </div>
                      )}

                      {trackedItem.photos && trackedItem.photos.length > 0 && (
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider opacity-75 block mb-2 text-[#5D4037]">{String(t("Attached Photos"))}</span>
                          <div className="flex flex-col gap-3">
                            {trackedItem.photos.map((photo: any, index: number) => (
                              <div key={index} className="flex items-center gap-3">
                                <div className="max-w-[180px] rounded-xl overflow-hidden border border-[#E8DCC8] shrink-0">
                                  <img src={photo.url} alt={`Uploaded attachment ${index + 1}`} className="w-full h-auto" />
                                </div>
                                {photo.location && (
                                  <div className={`flex flex-col gap-1 text-xs py-1.5 px-3 rounded-lg border max-w-[200px] ${
                                    highContrast 
                                      ? "border-yellow-400/30 text-yellow-400 bg-yellow-400/10" 
                                      : "border-[#4CAF72]/30 text-[#1B5E20] bg-[#4CAF72]/10"
                                  }`}>
                                    <div className="flex items-center gap-1 font-bold">
                                      <MapPin className="w-3.5 h-3.5" />
                                      <span>{t('gps_location')}</span>
                                    </div>
                                    <span className="opacity-80 text-[10px] font-mono">
                                      {photo.location.lat.toFixed(4)}, {photo.location.lng.toFixed(4)}
                                    </span>
                                    {photo.location.address && (
                                      <span className="opacity-80 text-[10px] leading-tight line-clamp-2" title={photo.location.address}>
                                        {photo.location.address}
                                      </span>
                                    )}
                                    {photo.location.timestamp && (
                                      <span className="opacity-70 text-[9px] mt-0.5">
                                        {photo.location.timestamp}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* WORKFLOW PROGRESS STEPS timeline */}
                      <div className="pt-4 border-t border-dashed border-[#E8DCC8]">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-75 block mb-3 text-[#5D4037]">{String(t("Live Office Processing Status"))}</span>
                        
                        <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-[#2E7D32] before:via-[#FFB347] before:to-[#C8B99A]">
                          {/* Step 1: Submitted */}
                          <div className="flex gap-4 items-start relative">
                            <div className="w-6 h-6 rounded-full bg-[#2E7D32] text-white flex items-center justify-center text-[10px] font-bold shrink-0 z-10 border-2 border-[#FFFEF7] shadow-sm">✓</div>
                            <div>
                              <p className="text-sm font-bold text-[#1A237E]">{String(t("Submission Received"))}</p>
                              <p className="text-xs text-[#5D4037]">{new Date(trackedItem.timestamp).toLocaleString()}</p>
                            </div>
                          </div>

                          {/* Step 2: AI Processed */}
                          <div className="flex gap-4 items-start relative">
                            <div className="w-6 h-6 rounded-full bg-[#2E7D32] text-white flex items-center justify-center text-[10px] font-bold shrink-0 z-10 border-2 border-[#FFFEF7] shadow-sm">✓</div>
                            <div>
                              <p className="text-sm font-bold text-[#1A237E]">{String(t("Message Understood"))}</p>
                              <p className="text-xs text-[#5D4037] flex items-center gap-1">Language detected: 
                                <span dir={(trackedItem.language_detected || "").toLowerCase() === "urdu" ? "rtl" : "ltr"}>
                                  {(!trackedItem.language_native || trackedItem.language_native.toLowerCase() === (trackedItem.language_detected || "").toLowerCase()) 
                                    ? (trackedItem.language_detected || "English")
                                    : `${trackedItem.language_detected || "English"} / ${trackedItem.language_native}`}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Step 3: MP Review queue */}
                          <div className="flex gap-4 items-start relative">
                            <div className="w-6 h-6 rounded-full bg-[#FFB347] text-[#1A237E] flex items-center justify-center text-[11px] font-bold shrink-0 z-10 border-2 border-[#FFFEF7] shadow-sm relative">
                              <span className="absolute inset-0 rounded-full bg-[#FFB347] animate-ping opacity-75 pointer-events-none" style={{ animationDuration: '2s' }} />
                              <span>3</span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#1A237E]">{String(t("Shared with MP's Office"))}</p>
                              <p className="text-xs text-[#5D4037]">Your development request has been shared with your MP's office</p>
                            </div>
                          </div>

                          {/* Dynamic MP Actions */}
                          {trackedItem.mp_actions && trackedItem.mp_actions.length > 0 ? (
                            trackedItem.mp_actions.map((action: any, idx: number) => (
                              <div key={idx} className="flex gap-4 items-start relative">
                                {action.actor === 'CITIZEN' ? (
                                  <>
                                    <div className="w-6 h-6 rounded-full bg-slate-200 text-[#1A237E] flex items-center justify-center text-[10px] font-bold shrink-0 z-10 border-2 border-[#FFFEF7] shadow-sm">
                                      <User className="w-3 h-3" />
                                    </div>
                                    <div className="w-full">
                                      <p className="text-sm font-bold text-slate-700">{String(t("Citizen Follow Up"))}</p>
                                      <p className="text-[11px] text-slate-500 font-bold mb-1">
                                        {new Date(action.action_date).toLocaleString()}
                                      </p>
                                      <div className="bg-slate-100 border border-slate-200 p-2 rounded-lg text-xs italic text-slate-700 mt-1">
                                        "{action.citizen_visible_note}"
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-6 h-6 rounded-full bg-[#E65100] text-white flex items-center justify-center text-[10px] font-bold shrink-0 z-10 border-2 border-[#FFFEF7] shadow-sm relative">
                                      {idx === trackedItem.mp_actions.length - 1 && <span className="absolute inset-0 rounded-full bg-[#E65100] animate-ping opacity-75 pointer-events-none" style={{ animationDuration: '2s' }} />}
                                      <ClipboardList className="w-3 h-3" />
                                    </div>
                                    <div className="w-full">
                                      <p className="text-sm font-bold text-[#1A237E]">{action.action_type}</p>
                                      <p className="text-[11px] text-[#FF9933] font-bold mb-1">
                                        Action by: {action.mp_name} | {new Date(action.action_date).toLocaleString()}
                                      </p>
                                      {action.department && (
                                        <p className="text-xs text-[#5D4037] mb-1"><strong>Department:</strong> {action.department}</p>
                                      )}
                                      {action.citizen_visible_note && (
                                        <div className="bg-[#FFF3E0] border border-[#FFE0B2] p-2 rounded-lg text-xs italic text-[#E65100] mt-1">
                                          "{action.citizen_visible_note}"
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="flex gap-4 items-start relative opacity-60">
                              <div className="w-6 h-6 rounded-full bg-transparent border-2 border-[#C8B99A] text-[#C8B99A] flex items-center justify-center text-[11px] font-bold shrink-0 z-10 shadow-sm" />
                              <div>
                                <p className="text-sm font-bold text-[#3E2723]">{String(t("Under Review"))}</p>
                                <p className="text-xs text-[#5D4037]">{t('your_voice_contributes')}</p>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* DISPATCHED SMS ALERTS LOG */}
                      {trackedItem.sms_logs && trackedItem.sms_logs.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-dashed border-[#E8DCC8]">
                          <span className="text-xs font-bold uppercase tracking-wider opacity-75 block mb-3 text-[#5D4037] flex items-center gap-1.5">
                            <span className="text-base">📲</span> Dispatched SMS Alert History
                          </span>
                          <div className="space-y-2.5">
                            {trackedItem.sms_logs.map((log: any, idx: number) => (
                              <div key={log.id || idx} className="bg-[#FFFDF9] border border-[#F3E5D8] rounded-xl p-3 text-xs text-[#5D4037] shadow-xs flex items-start gap-2">
                                <div className="text-lg shrink-0 mt-0.5">💬</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-center gap-2 mb-1">
                                    <span className="font-bold text-[#2E7D32] flex items-center gap-1">
                                      {log.type === 'citizen_receipt' ? 'Receipt Alert' : 'Status Update'} &bull; Delivered
                                    </span>
                                    <span className="opacity-70 text-[9px]">
                                      {new Date(log.timestamp).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="font-mono text-[11px] leading-relaxed bg-[#FFFDF5] p-2 rounded-lg border border-[#F9EFE6] select-all">
                                    {log.message}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>

                  </motion.div>
                )}

              </div>
            </motion.div>
          )}

          {/* TAB 3: PUBLIC BOARD */}
          {activeTab === "public" && (
            <motion.div
              key="public-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full"
            >
              <PublicBoard highContrast={highContrast} />
            </motion.div>
          )}
        </AnimatePresence>

      </main>
      </div>
      </div>

      {/* 🏛️ APP FOOTER */}
      <footer className={`relative transition-colors mt-12 overflow-hidden ${
        highContrast 
          ? "border-t-4 border-yellow-400 bg-black text-yellow-400 py-8 px-4 text-center" 
          : "bg-[#3E2723] text-[#FDF6E3]"
      }`}>
        
        {/* UPPER BANNER (Scenic watercolor-style landscape with Logo & Slogan) */}
        {!highContrast && (
          <div 
            className="bg-[#FFFEF7] border-t border-[#E8DCC8] pt-10 pb-12 md:pt-16 md:pb-20 px-4 relative overflow-hidden text-[#3E2723]"
          >
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
                {i18n.language === 'en' ? (
                  <>
                    <span className="text-[#FFB347]">Jan</span>
                    <span className="text-[#2E7D32]">Awaaz</span>
                  </>
                ) : (
                  <span className="text-[#2E7D32]">{t('app_title')}</span>
                )}
              </h3>

              <div className="flex items-center gap-2 mt-3 text-[11px] font-bold text-[#3E2723]">
                <svg className="w-3.5 h-3.5 text-[#2E7D32]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div className="flex flex-wrap justify-center items-center gap-x-1">
                  <span>{t('footer_tagline_your')}</span>
                  <span className="text-[#FFD700] font-black">{t('footer_tagline_voice')}</span>
                  <span>{t('footer_tagline_our')}</span>
                  <span className="text-[#FFD700] font-black">{t('footer_tagline_priority')}</span>
                  <span>{t('footer_tagline_stronger')}</span>
                  <span className="text-[#FFD700] font-black">{t('footer_tagline_constituencies')}</span>
                </div>
              </div>

            </div>


          </div>
        )}

        {/* LOWER DEEP BROWN BAND */}
        <div className="py-2.5 px-4 max-w-4xl mx-auto text-center relative z-30">
          
          <h4 className="font-bold text-xs sm:text-sm tracking-tight text-white">
            {String(t("footer_title", "Jan Awaaz Multilingual Portal"))}
          </h4>
          <p className="mt-1 text-[11px] opacity-85 max-w-xl mx-auto leading-normal text-[#F5F2EB]">
            {String(t("footer_description", "Empowering grassroots democracy through artificial intelligence. Offline safe."))}
            <span className="mx-1 opacity-50">|</span>
            
          </p>

          {/* Heart icon separator */}
          <div className="flex items-center justify-center my-1.5 max-w-4xl mx-auto gap-3 opacity-40">
            <div className="flex-1 h-[1px] bg-white/10" />
            <span className="text-[#FFB347] text-xs">🧡</span>
            <div className="flex-1 h-[1px] bg-white/10" />
          </div>

          {/* Feature Badges / Cards Row */}
          {!highContrast && (
            <div className="flex flex-row items-center justify-between overflow-x-auto py-1 mt-1 mb-2 text-left gap-x-2 md:gap-x-3 max-w-5xl mx-auto scrollbar-none pb-1">
              
              {/* Item 1 */}
              <div className="flex items-center gap-2 shrink-0 px-3 py-1 rounded-xl border border-white/10 bg-[#4E342E]/30 hover:bg-[#4E342E]/50 transition duration-300">
                <div className="shrink-0 w-7 h-7 border border-white/20 rounded-lg flex items-center justify-center bg-[#3E2723] shadow-inner">
                  <svg className="w-3.5 h-3.5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[10px] sm:text-xs text-[#FFFEF7] tracking-tight leading-none">{t('voice_or_text')}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="w-[1px] bg-white/10 h-6 self-center shrink-0" />

              {/* Item 2 */}
              <div className="flex items-center gap-2 shrink-0 px-3 py-1 rounded-xl border border-white/10 bg-[#4E342E]/30 hover:bg-[#4E342E]/50 transition duration-300">
                <div className="shrink-0 w-7 h-7 border border-white/20 rounded-lg flex items-center justify-center bg-[#3E2723] shadow-inner">
                  <svg className="w-3.5 h-3.5 text-[#81C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[10px] sm:text-xs text-[#FFFEF7] tracking-tight leading-none">{t('share_photo')}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="w-[1px] bg-white/10 h-6 self-center shrink-0" />

              {/* Item 3 */}
              <div className="flex items-center gap-2 shrink-0 px-3 py-1 rounded-xl border border-white/10 bg-[#4E342E]/30 hover:bg-[#4E342E]/50 transition duration-300">
                <div className="shrink-0 w-7 h-7 border border-white/20 rounded-lg flex items-center justify-center bg-[#3E2723] shadow-inner">
                  <svg className="w-3.5 h-3.5 text-[#FFB74D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[10px] sm:text-xs text-[#FFFEF7] tracking-tight leading-none">{t('local_issues')}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="w-[1px] bg-white/10 h-6 self-center shrink-0" />

              {/* Item 4 */}
              <div className="flex items-center gap-2 shrink-0 px-3 py-1 rounded-xl border border-white/10 bg-[#4E342E]/30 hover:bg-[#4E342E]/50 transition duration-300">
                <div className="shrink-0 w-7 h-7 border border-white/20 rounded-lg flex items-center justify-center bg-[#3E2723] shadow-inner">
                  <svg className="w-3.5 h-3.5 text-[#29B6F6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[10px] sm:text-xs text-[#FFFEF7] tracking-tight leading-none">{t('ai_analysis')}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="w-[1px] bg-white/10 h-6 self-center shrink-0" />

              {/* Item 5 */}
              <div className="flex items-center gap-2 shrink-0 px-3 py-1 rounded-xl border border-white/10 bg-[#4E342E]/30 hover:bg-[#4E342E]/50 transition duration-300">
                <div className="shrink-0 w-7 h-7 border border-white/20 rounded-lg flex items-center justify-center bg-[#3E2723] shadow-inner">
                  <svg className="w-3.5 h-3.5 text-[#81C784]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[10px] sm:text-xs text-[#FFFEF7] tracking-tight leading-none">{t('better_dev')}</span>
                </div>
              </div>

            </div>
          )}

          {/* Bottom Trust Banner with Green Sprout Growing on Bottom-Right */}
          <div className="pt-1.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[10px] font-semibold relative">
            
            {/* Left side Trust Badge */}
            <div className={`flex items-center gap-2 ${highContrast ? "text-yellow-400" : "text-[#A1887F]"}`}>
              <svg className={`w-4 h-4 shrink-0 ${highContrast ? "text-yellow-400" : "text-[#4CAF50]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-left leading-normal text-[10px] sm:text-xs">
                {String(t('Your identity is safe. Your voice brings change.'))}
              </p>
            </div>

            <div className="text-[#FDF6E3] text-[11px] font-medium opacity-90 mt-2 sm:mt-0 text-right sm:text-left">
              Powered by Gemini AI ✨
            </div>

          </div>

        </div>

      </footer>



      {/* MY COMPLAINTS SLIDE-UP PANEL */}
      <AnimatePresence>
        {isMyComplaintsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMyComplaintsOpen(false)}
              className="fixed inset-0 bg-black/60 z-40"
            /><motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 h-[80vh] bg-[#FFFEF7] rounded-t-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Handle Bar */}
              <div className="w-full pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
              </div>

              {/* Panel Header */}
              <div className="px-6 pb-4 pt-2 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-[#1A237E]">{String(t("My Complaints"))}</h2>
                  <p className="text-xs text-slate-500 mt-1">{String(t("Saved on this device only. Clearing browser data will remove this list."))}</p>
                </div>
                <button 
                  onClick={() => setIsMyComplaintsOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-100 transition"
                >
                  ✕
                </button>
              </div>

              {/* Tricolor Stripe */}
              <div className="w-full flex">
                <div className="h-[2px] flex-1 bg-[#FF9933]"></div>
                <div className="h-[2px] flex-1 bg-white"></div>
                <div className="h-[2px] flex-1 bg-[#138808]"></div>
              </div>

              {/* Privacy Banner */}
              <div className="bg-[#E3F2FD] border border-[#90CAF9] p-3 m-4 rounded-lg flex items-start gap-3">
                <span className="text-lg">🔒</span>
                <p className="text-xs text-[#0D47A1] leading-tight flex-1">
                  Your identity is never stored. Only request IDs are saved locally on your device.
                </p>
              </div>

              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto px-4 pb-20">
                {myComplaints.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-6">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-bold text-[#1A237E] mb-2">{String(t("No complaints yet"))}</h3>
                    <p className="text-sm text-slate-500 mb-6">{String(t("Complaints you submit will appear here automatically."))}</p>
                    <button 
                      onClick={() => {
                        setIsMyComplaintsOpen(false);
                        setActiveTab("submit");
                        window.scrollTo(0, 0);
                      }}
                      className="bg-[#1A237E] text-white px-6 py-3 rounded-xl font-bold transition hover:bg-[#283593]"
                    >{String(t("Submit a Complaint"))}</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myComplaints.map((complaint) => (
                      <div 
                        key={complaint.firestore_id} 
                        className={`bg-white rounded-xl shadow-sm border p-4 flex flex-col gap-2 relative overflow-hidden ${
                          complaint.urgency === "Critical" ? "border-l-4 border-l-[#C62828] border-y-[#E8DCC8] border-r-[#E8DCC8]" :
                          complaint.urgency === "High" ? "border-l-4 border-l-[#E65100] border-y-[#E8DCC8] border-r-[#E8DCC8]" :
                          complaint.urgency === "Medium" ? "border-l-4 border-l-[#1A237E] border-y-[#E8DCC8] border-r-[#E8DCC8]" :
                          "border-l-4 border-l-[#2E7D32] border-y-[#E8DCC8] border-r-[#E8DCC8]"
                        }`}
                      >
                        {/* Top Row */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2 font-bold text-[#1A237E]">
                            <span>{complaint.category_icon}</span>
                            <span>{complaint.category}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                            complaint.urgency === "Critical" ? "bg-[#C62828]" :
                            complaint.urgency === "High" ? "bg-[#E65100]" :
                            complaint.urgency === "Medium" ? "bg-[#1A237E]" :
                            "bg-[#2E7D32]"
                          }`}>
                            {complaint.urgency}
                          </span>
                        </div>

                        {/* Location */}
                        <div className="text-xs text-slate-600 flex items-center gap-1">
                          📍 {complaint.district}, {complaint.state}
                        </div>

                        {/* Time */}
                        <div className="text-xs text-slate-500">
                          🕐 Submitted: {new Date(complaint.submitted_at).toLocaleDateString()}
                        </div>

                        {/* ID */}
                        <div className="font-mono text-[10px] bg-slate-100 p-1 rounded w-fit my-1">
                          ID: {complaint.formatted_id}
                        </div>

                        {/* Summary */}
                        <div className="text-xs text-slate-500 italic line-clamp-2">
                          "{complaint.issue_summary}"
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 mt-2 pt-3 border-t border-slate-100">
                          <button 
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/submissions/${complaint.firestore_id}`);
                                const data = await res.json();
                                if (data.success) {
                                  setLocalTrackResult(prev => ({ ...prev, [complaint.firestore_id]: data }));
                                  if (data.status) updateLocalComplaintStatus(complaint.firestore_id, data.status);
                                } else {
                                  setLocalTrackResult(prev => ({ ...prev, [complaint.firestore_id]: { error: "Request not found. It may have been removed." } }));
                                }
                              } catch (e) {
                                setLocalTrackResult(prev => ({ ...prev, [complaint.firestore_id]: { error: "Network error fetching status." } }));
                              }
                            }}
                            className="bg-slate-100 text-[#1A237E] font-bold text-xs px-3 py-1.5 rounded hover:bg-slate-200 transition"
                          >
                            🔍 Track Status
                          </button>
                          
                          <button 
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/submissions/${complaint.firestore_id}`);
                                const data = await res.json();
                                if (data.success) {
                                  setTrackedItem(data);
                                } else {
                                  setTrackedItem(complaint as any);
                                }
                                setTimeout(() => window.print(), 100);
                              } catch (e) {
                                setTrackedItem(complaint as any);
                                setTimeout(() => window.print(), 100);
                              }
                            }}
                            className="bg-slate-100 text-[#1A237E] font-bold text-xs px-3 py-1.5 rounded hover:bg-slate-200 transition"
                          >
                            🖨️ Reprint Receipt
                          </button>

                          <button 
                            onClick={() => {
                              if(window.confirm("Remove this request from your device?")) {
                                removeLocalComplaint(complaint.firestore_id);
                                setMyComplaints(getLocalComplaints());
                                if (getLocalComplaints().length === 0) setIsMyComplaintsOpen(false);
                              }
                            }}
                            className="ml-auto text-red-600 hover:bg-red-50 font-bold text-xs px-2 py-1.5 rounded transition"
                          >
                            🗑️ Remove
                          </button>
                        </div>

                        {/* Inline Status Expansion */}
                        {localTrackResult[complaint.firestore_id] && (
                          <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg shadow-inner">
                            {localTrackResult[complaint.firestore_id].error ? (
                              <p className="text-xs text-red-600">{localTrackResult[complaint.firestore_id].error}</p>
                            ) : (
                              <div className="flex flex-col">
                                <div className="text-sm font-bold flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                                  <span className="text-slate-500">Current Status:</span>
                                  {localTrackResult[complaint.firestore_id].status === "resolved" || localTrackResult[complaint.firestore_id].status === "closed" ? "✅ Resolved" :
                                   localTrackResult[complaint.firestore_id].status === "escalated" ? "🔺 Escalated" :
                                   localTrackResult[complaint.firestore_id].status === "noted" ? "📝 Noted" :
                                   "🕐 Under Review"}
                                </div>
                                
                                {/* TIMELINE */}
                                <div className="relative pl-3 border-l-2 border-slate-200 space-y-4 mb-3">
                                  <div className="relative">
                                    <div className="absolute -left-[17px] top-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                    <div className="text-xs font-bold text-slate-700">Request Submitted</div>
                                    <div className="text-[10px] text-slate-400">{new Date(complaint.submitted_at).toLocaleString()}</div>
                                  </div>
                                  
                                  {localTrackResult[complaint.firestore_id].mp_actions && localTrackResult[complaint.firestore_id].mp_actions.length > 0 ? (
                                    localTrackResult[complaint.firestore_id].mp_actions.slice().reverse().map((action: any) => (
                                      <div key={action.id} className="relative">
                                        <div className={`absolute -left-[17px] top-1 w-3 h-3 rounded-full border-2 border-white ${action.actor === 'citizen' ? 'bg-blue-500' : 'bg-[#1A237E]'}`}></div>
                                        <div className="text-xs font-bold text-slate-700">
                                          {action.actor === 'citizen' ? "Citizen Feedback" : `MP Action: ${action.action_type || 'Update'}`}
                                        </div>
                                        <div className="text-[10px] text-slate-400">{new Date(action.action_date).toLocaleString()}</div>
                                        {action.citizen_visible_note && (
                                          <div className={`mt-1 p-2 text-xs rounded border ${action.actor === 'citizen' ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                                            {action.citizen_visible_note}
                                          </div>
                                        )}
                                      </div>
                                    ))
                                  ) : null}
                                </div>
                                
                                {/* FEEDBACK FORM */}
                                {localTrackResult[complaint.firestore_id].status !== "closed" && (
                                  <div className="mt-2 pt-3 border-t border-slate-100">
                                    <p className="text-[11px] font-bold text-slate-600 mb-2">Send Follow-up / Feedback:</p>
                                    <div className="flex gap-2">
                                      <input 
                                        type="text" 
                                        id={`feedback-input-${complaint.firestore_id}`}
                                        placeholder="Type your message..." 
                                        className="flex-1 text-xs px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-[#1A237E]"
                                      />
                                      <button 
                                        onClick={async () => {
                                          const inputEl = document.getElementById(`feedback-input-${complaint.firestore_id}`) as HTMLInputElement;
                                          if (!inputEl || !inputEl.value.trim()) return;
                                          try {
                                            const { addDoc, collection } = await import('firebase/firestore');
                                            const { db } = await import('./firebase');
                                            await addDoc(collection(db, "mp_actions"), {
                                              submission_id: complaint.firestore_id,
                                              action_type: "Feedback",
                                              action_date: new Date().toISOString(),
                                              citizen_visible_note: inputEl.value.trim(),
                                              actor: "citizen",
                                              mp_name: "Citizen"
                                            });
                                            inputEl.value = "";
                                            // Refresh tracking status
                                            const res = await fetch(`/api/submissions/${complaint.firestore_id}`);
                                            const data = await res.json();
                                            if (data.success) {
                                              setLocalTrackResult(prev => ({ ...prev, [complaint.firestore_id]: data }));
                                            }
                                          } catch (e) {
                                            alert("Failed to send feedback.");
                                          }
                                        }}
                                        className="bg-[#1A237E] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-[#121858] transition"
                                      >
                                        Send
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Clear All */}
                    <div className="text-center mt-6 mb-4">
                      <button 
                        onClick={() => {
                          if(window.confirm(t("This will remove all complaint records from this device. Your complaints are still registered with Jan Awaaz and can be tracked using your Complaint IDs. Are you sure?"))) {
                            clearLocalComplaints();
                            setMyComplaints([]);
                            setIsMyComplaintsOpen(false);
                          }
                        }}
                        className="text-xs text-slate-400 hover:text-red-500 transition underline decoration-dotted"
                      >{t("Clear all from this device") as string}</button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Receipt data={successData || trackedItem} />
    </div>
  );
}
