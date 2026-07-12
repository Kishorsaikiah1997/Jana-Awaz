import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { db } from "./src/firebase.ts";
import { collection, addDoc, doc, getDoc, getDocs, query, orderBy, updateDoc, where } from "firebase/firestore";
import { v2 } from '@google-cloud/translate';
import leoProfanity from 'leo-profanity';
import cron from 'node-cron';

dotenv.config();

leoProfanity.loadDictionary(); // Loads english
leoProfanity.add(['chutiya', 'madarchod', 'bhenchod', 'harami', 'kutta', 'kaminey', 'saala', 'randi']);

const app = express();
const PORT = 3000;

// Increase body limit to support base64 photo uploads
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// Wrapper to handle 503 Service Unavailable errors from Gemini with exponential backoff
async function generateContentWithRetry(ai: GoogleGenAI, params: any, maxRetries = 5) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      const status = error?.status;
      let is503 = status === 503 || status === 'UNAVAILABLE' || status === 429 || status === 'RESOURCE_EXHAUSTED';
      if (!is503 && error?.message && (error.message.includes('503') || error.message.includes('UNAVAILABLE') || error.message.includes('Too Many Requests') || error.message.includes('quota') || error.message.includes('rate-limit'))) {
        is503 = true;
      }
      if (is503 && attempt < maxRetries - 1) {
        attempt++;
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, etc.
        console.log(`Gemini API overloaded/503. Retrying attempt ${attempt} in ${waitTime}ms...`);
        await new Promise(res => setTimeout(res, waitTime));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries reached");
}

async function runVisionAnalysis(photo_url: string, category: string): Promise<any> {
  const photoResponse = await fetch(photo_url);
  if (!photoResponse.ok) {
    throw new Error(`Failed to fetch photo from URL: ${photo_url}`);
  }
  const photoBuffer = await photoResponse.arrayBuffer();
  const photoBase64 = Buffer.from(photoBuffer).toString('base64');
  const mimeType = photoResponse.headers.get('content-type') || 'image/jpeg';

  const systemPrompt = "You are an AI assistant analyzing photos submitted by Indian citizens to their MP's grievance portal. Analyze objectively and practically.";
  const userPrompt = `Analyze this photo submitted as evidence for a citizen complaint in Assam, India.\nThe citizen selected category: ${category}\n\nReturn ONLY this JSON object, nothing else:\n{\n  "what_is_shown": "one sentence describing exactly what infrastructure or issue is visible in the photo",\n  "infrastructure_type": "Road/Bridge/Water Body/Building/Agricultural Land/Health Facility/School/Electrical Infrastructure/Other",\n  "damage_visible": true/false,\n  "damage_description": "specific description of damage if visible, else null",\n  "severity_from_photo": "Critical/High/Medium/Low",\n  "severity_reasoning": "one sentence explaining why this severity was assigned",\n  "safety_concern": true/false,\n  "safety_detail": "specific safety risk if any, else null",\n  "category_confirmed": true/false,\n  "category_suggested": "suggested category if citizen selected wrong one, else null",\n  "estimated_affected_area": "Local/Village/Block/District level",\n  "flood_related": true/false,\n  "actionable_insight": "one specific action an MP or government dept should take based on this photo",\n  "confidence": 0.0 to 1.0\n}`;

  const ai = getGemini();
  const result = await generateContentWithRetry(ai, {
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json"
    },
    contents: [
      {
        role: "user",
        parts: [
          { text: userPrompt },
          { inlineData: { data: photoBase64, mimeType } }
        ]
      }
    ]
  });

  const rawText = (result.text || "").replace(/```json/g, "").replace(/```/g, "");
  const photo_analysis_data = JSON.parse(rawText || "{}");
  photo_analysis_data.analyzed_at = new Date().toISOString();
  photo_analysis_data.analysis_failed = false;

  // Type conversions
  photo_analysis_data.damage_visible = photo_analysis_data.damage_visible === true || photo_analysis_data.damage_visible === "true";
  photo_analysis_data.safety_concern = photo_analysis_data.safety_concern === true || photo_analysis_data.safety_concern === "true";
  photo_analysis_data.category_confirmed = photo_analysis_data.category_confirmed === true || photo_analysis_data.category_confirmed === "true";
  photo_analysis_data.flood_related = photo_analysis_data.flood_related === true || photo_analysis_data.flood_related === "true";

  return photo_analysis_data;
}




// API: Generate Themes (Clustering)
app.post("/api/generate-themes", async (req, res) => {
  const { complaints } = req.body;
  
  if (!complaints || !Array.isArray(complaints)) {
    return res.status(400).json({ success: false, error: "Missing complaints data" });
  }

  try {
    const ai = getGemini();
    
    const complaintsInput = complaints.map(c => ({
      id: c.id,
      category: c.category,
      text: c.text_english,
      district: c.district_en || c.district,
      urgency: c.urgency,
      has_photo: !!c.photo_url,
      flood_related: c.photo_analysis?.flood_related || false,
      submitted_at: c.timestamp
    }));

    const prompt = `You are an AI analyst for a Member of Parliament in Assam, India. You are analyzing citizen complaints to find recurring themes and surface actionable insights.

Here are ${complaintsInput.length} citizen complaints from the last 7 days:
${JSON.stringify(complaintsInput, null, 2)}

Your task: Group these complaints into THEMES — where multiple complaints describe the same underlying problem even if worded differently, in different languages, or from different villages.

IMPORTANT RULES:
1. Merge complaints that describe the SAME infrastructure or issue even if category differs slightly
2. Geographic proximity matters — complaints from neighboring districts about the same issue = one theme
3. Minimum 2 complaints to form a theme
4. Complaints that don't fit any theme go into themes of their own with count: 1
5. Assam context: watch for flood/embankment/Brahmaputra patterns — these are high priority

For each theme return this exact JSON:
{
  "theme_id": "unique_snake_case_id",
  "theme_name": "Short descriptive name e.g. Brahmaputra Embankment Failure — Darrang",
  "theme_name_hindi": "Hindi translation of theme name",
  "theme_name_assamese": "Assamese translation of theme name",
  "category": "primary category",
  "complaint_ids": ["id1","id2"],
  "complaint_count": number,
  "districts_affected": ["Darrang", "Barpeta"],
  "urgency_level": "Critical/High/Medium/Low",
  "urgency_reasoning": "one sentence why this urgency was assigned to the theme",
  "peak_time": "Morning/Afternoon/Evening based on submission timestamps",
  "flood_related": true/false,
  "safety_concerns": true/false,
  "representative_complaint": "best single English complaint text that captures the theme",
  "common_keywords": ["keyword1","keyword2","keyword3"],
  "trend": "new/growing/stable/declining",
  "trend_reasoning": "one sentence",
  "mp_action_suggested": "specific actionable recommendation for the MP — include which government department to contact",
  "estimated_affected_population": number,
  "data_confidence": "High/Medium/Low"
}

Return a JSON object ONLY:
{
  "themes": [array of theme objects sorted by complaint_count descending],
  "analysis_summary": "one paragraph overall summary of the 7-day complaint landscape in the constituency",
  "total_complaints_analyzed": number,
  "total_themes_found": number,
  "most_urgent_theme_id": "theme_id",
  "generated_at": "${new Date().toISOString()}"
}`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const rawText = response.text || "{}";
    const resultJson = JSON.parse(rawText);

    res.json({
      success: true,
      data: resultJson
    });

  } catch (error) {
    console.error("Gemini Themes API error", error);
    res.status(500).json({ success: false, error: "Failed to generate themes" });
  }
});


// API: Generate Weekly AI Report for MP Dashboard
app.post("/api/generate-ai-report", async (req, res) => {
  const { complaints, language = "English", priority_actions = [] } = req.body;
  if (!complaints || !Array.isArray(complaints)) {
    return res.status(400).json({ success: false, error: "Missing complaints data" });
  }

  try {
    const ai = getGemini();
    const complaintsText = complaints.map(c => 
      `[Category: ${c.category}, Urgency: ${c.urgency}, Location: ${c.district}] Summary: ${c.issue_summary || c.text_english}`
    ).join("\n");

    const prompt = `You are an AI assistant for a Member of Parliament in India. Analyze these citizen complaints and generate a structured report:
EXECUTIVE SUMMARY
TOP 3 CRITICAL ISSUES (with complaint count and affected areas and recommended action)
EMERGING TRENDS
GEOGRAPHIC HOTSPOTS
LANGUAGE INSIGHTS
RECOMMENDED PRIORITY ACTIONS

Be formal, concise and actionable. Address it to Honorable Member of Parliament.
Write the ENTIRE report in ${language}.

CURRENT PRIORITY RANKINGS:
${JSON.stringify(priority_actions, null, 2)}

Reference these priorities in your report.
The RECOMMENDED ACTIONS section of your report must align with these ranked priorities — do not contradict them.

Complaints Data:
${complaintsText}
`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({ success: true, report: response.text });
  } catch (error: any) {
    console.error("AI Report generation error:", error);
    res.status(500).json({ success: false, error: "Failed to generate report" });
  }
});

// API: Generate Priority Ranking
app.post("/api/generate-priorities", async (req, res) => {
  const { themes, districtData = {}, safetyCount = 0, growingThemes = [] } = req.body;

  if (!themes || !Array.isArray(themes)) {
    return res.status(400).json({ success: false, error: "Missing themes data" });
  }

  try {
    const ai = getGemini();
    const month = new Date().getMonth() + 1;
    const seasons: Record<string, number[]> = {
      monsoon: [6,7,8,9],
      post_monsoon: [10,11],
      winter: [12,1,2],
      pre_monsoon: [3,4,5]
    };
    const current_season = Object.entries(seasons).find(([s,months]) => months.includes(month))?.[0] || 'monsoon';
    
    const assam_seasonal_risks: Record<string, any> = {
      monsoon: { risk: 'CRITICAL FLOOD SEASON', watch: ['embankment','flood','drainage','river','erosion','Brahmaputra'], boost_urgency: true },
      post_monsoon: { risk: 'Post-flood recovery period', watch: ['damage','repair','compensation','crop loss','rebuilding'], boost_urgency: false },
      winter: { risk: 'Fog and cold wave risk', watch: ['health','hospital','cold','blanket','shelter'], boost_urgency: false },
      pre_monsoon: { risk: 'Pre-monsoon preparation critical', watch: ['embankment','drain','desilting','preparation','repair'], boost_urgency: true }
    };

    const prompt = `
You are an AI governance advisor to a Member of Parliament representing a constituency in Assam, India.

Your job is to generate a PRIORITY ACTION PLAN — a ranked list of exactly what the MP should do THIS WEEK based on citizen complaints, district vulnerability data, and current seasonal context.

═══ INPUT DATA ═══

COMPLAINT THEMES (last 7 days):
${JSON.stringify(themes, null, 2)}

DISTRICT VULNERABILITY DATA:
${JSON.stringify(districtData, null, 2)}

SEASONAL CONTEXT:
Current season: ${current_season}
Seasonal risk level: ${assam_seasonal_risks[current_season].risk}
Priority watch terms: ${assam_seasonal_risks[current_season].watch.join(', ')}
Urgency boost active: ${assam_seasonal_risks[current_season].boost_urgency}

SAFETY FLAGS:
${safetyCount} complaints flagged with immediate safety concerns by AI photo analysis.

GROWING ISSUES:
${growingThemes.map((t:any) => t.theme_name).join(', ')}

═══ YOUR TASK ═══

Generate a PRIORITY ACTION PLAN with maximum 7 items ranked 1 to 7.

Ranking criteria (in order of importance):
1. Safety concern flagged by photo AI = always rank highest
2. Critical urgency + monsoon season + flood related = highest priority
3. High complaint count + district vulnerability data confirms the issue
4. Growing trend = higher rank than stable with same complaint count
5. Estimated affected population size

For each priority action return:
{
  "rank": number 1-7,
  "action_id": "unique_snake_case",
  "action_title": "Short action title max 8 words",
  "action_title_hindi": "Hindi translation",
  "action_title_assamese": "Assamese translation",
  "theme_id": "linked theme_id",
  "theme_name": "linked theme name",
  "urgency": "Critical/High/Medium/Low",
  "timeline": "Within 24 hours/Within 48 hours/This week/This month",
  "evidence_points": [
    "Evidence point 1 e.g. 67 citizen complaints in last 7 days",
    "Evidence point 2 e.g. NFHS data confirms vulnerability",
    "Evidence point 3 e.g. Seasonal risk active"
  ],
  "estimated_affected_population": number,
  "primary_department": "Exact Assam govt department name",
  "secondary_departments": ["dept2","dept3"],
  "recommended_actions": [
    "Specific action step 1",
    "Specific action step 2",
    "Specific action step 3"
  ],
  "districts_affected": ["district1","district2"],
  "complaint_count": number,
  "seasonal_factor": true/false,
  "data_validated": true/false,
  "data_validation_note": "How district data confirms this priority, else null",
  "risk_if_delayed": "What happens if MP does not act this week",
  "success_metric": "How MP will know this issue is resolved"
}

Return this exact JSON:
{
  "priority_actions": [array of actions sorted rank 1 to 7],
  "executive_summary": "Two sentences. What is the overall situation in the constituency this week and what is the single most important thing the MP must do.",
  "total_themes_analyzed": number,
  "total_complaints_analyzed": number,
  "seasonal_alert": "One sentence seasonal warning relevant to Assam right now",
  "generated_at": "${new Date().toISOString()}",
  "next_update": "Tomorrow at 11 PM IST"
}
`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const rawText = response.text || "{}";
    const resultJson = JSON.parse(rawText);

    res.json({
      success: true,
      data: {
        ...resultJson,
        season: current_season
      }
    });
  } catch (error: any) {
    console.error("Priority API error:", error);
    res.status(500).json({ success: false, error: "Failed to generate priorities" });
  }
});

// API: Generate Constituency Intelligence (Development Needs)
app.post("/api/generate-constituency-intelligence", async (req, res) => {
  const { submissions: allSubmissions } = req.body;
  if (!allSubmissions || !Array.isArray(allSubmissions)) {
    return res.status(400).json({ success: false, error: "Missing submissions data" });
  }
  const submissions = allSubmissions.slice(0, 50);

  try {
    const ai = getGemini();
    const prompt = `You are analyzing development need submissions from citizens of an Assam constituency in India.

Here are ${submissions.length} submissions:
${JSON.stringify(submissions.map(s => ({
  id: s.id,
  normalised_text: s.text_english || s.text_original,
  tags: s.tags || [],
  category: s.category,
  village: s.village_ward,
  district: s.district_en,
})), null, 2)}

Group these into themes where multiple submissions express the same underlying development need even if worded differently or from different villages.

For each group return:
{
  "group_name": "short descriptive name (e.g. River Crossing Infrastructure, Secondary Education Access, Primary Healthcare Facilities)",
  "submission_count": number,
  "submission_ids": ["id1", "id2"], // MUST include exactly the IDs of all submissions that make up this group. Length must match submission_count.
  "villages_affected": ["village1", "village2"],
  "districts_affected": ["district1"],
  "estimated_population": number (integer estimate based on villages),
  "evidence_strength": "Strong" | "Moderate" | "Weak",
  "representative_voice": "one citizen submission that best captures the group need in their own words",
  "relevant_scheme": "most relevant Indian government scheme that could address this (e.g. PMGSY, Jal Jeevan Mission, Samagra Shiksha, PMAY, Ayushman Bharat, MGNREGA, or Assam state scheme if relevant)",
  "scheme_department": "which Assam government department handles this scheme"
}

Return JSON array sorted by submission_count descending.
Return JSON ONLY, like this:
[
  {
    "group_name": "...",
    ...
  }
]`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const rawText = (response.text || "[]").replace(/```json/g, "").replace(/```/g, "");
    let groups = [];
    try {
      groups = JSON.parse(rawText);
    } catch (e) {
      console.error("Failed to parse constituency intelligence JSON", e);
    }

    res.json({ success: true, data: groups });
  } catch (error) {
    console.error("Constituency Intelligence API error:", error);
    res.status(500).json({ success: false, error: "Failed to generate constituency intelligence" });
  }
});

// API: Process Audio
app.post("/api/process-audio", async (req, res) => {
  try {
    const { audioBase64, mimeType, language } = req.body;
    if (!audioBase64 || !mimeType) {
        return res.status(400).json({ success: false, error: "Audio data required" });
    }

    const ai = getGemini();

    let langName = language;
    if (language && language.startsWith('as')) langName = 'Assamese';
    if (language && language.startsWith('hi')) langName = 'Hindi';
    if (language && language.startsWith('en')) langName = 'English';
    if (language && language.startsWith('gu')) langName = 'Gujarati';

    const prompt = `Transcribe this audio, which was submitted as a citizen complaint for an MP portal in India.
    The citizen is speaking in ${langName}.
    
    1. Transcribe the audio accurately into text in its original script (e.g. Assamese script if they speak Assamese).
    2. Analyze the intent of the complaint and classify it as "DEVELOPMENT_NEED" or "SERVICE_FAILURE" or "EMERGENCY".
    
    Return JSON ONLY:
    {
        "text_original": "transcribed text",
        "intent": "DEVELOPMENT_NEED | SERVICE_FAILURE | EMERGENCY"
    }`;

    // Use gemini-2.5-pro for better regional language audio transcription accuracy (especially Assamese)
    const result = await generateContentWithRetry(ai, {
        model: "gemini-2.5-pro",
        contents: [
            { role: "user", parts: [
                { text: prompt },
                { inlineData: { data: audioBase64, mimeType } }
            ]}
        ],
        config: { responseMimeType: "application/json" }
    });

    const rawText = (result.text || "{}").replace(/```json/g, "").replace(/```/g, "");
    const data = JSON.parse(rawText);
    
    res.json({ success: true, ...data });
  } catch (error) {
    console.error("Audio processing failed", error);
    res.status(500).json({ success: false, error: "Audio processing failed" });
  }
});

function detectLanguage(text: string) {
  const counts = {
    hindi: 0, bengali: 0, tamil: 0, telugu: 0,
    kannada: 0, malayalam: 0, gujarati: 0, odia: 0,
    punjabi: 0, urdu: 0, assamese: 0
  };
  let hasAssameseSpecific = false;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0x0900 && code <= 0x097F) counts.hindi++;
    if (code >= 0x0980 && code <= 0x09FF) {
      counts.bengali++;
      counts.assamese++;
      if (text[i] === 'ৰ' || text[i] === 'ৱ') {
        hasAssameseSpecific = true;
      }
    }
    if (code >= 0x0B80 && code <= 0x0BFF) counts.tamil++;
    if (code >= 0x0C00 && code <= 0x0C7F) counts.telugu++;
    if (code >= 0x0C80 && code <= 0x0CFF) counts.kannada++;
    if (code >= 0x0D00 && code <= 0x0D7F) counts.malayalam++;
    if (code >= 0x0A80 && code <= 0x0AFF) counts.gujarati++;
    if (code >= 0x0B00 && code <= 0x0B7F) counts.odia++;
    if (code >= 0x0A00 && code <= 0x0A7F) counts.punjabi++;
    if (code >= 0x0600 && code <= 0x06FF) counts.urdu++;
  }
  
  if (hasAssameseSpecific && counts.assamese > 0) {
    counts.assamese += 1000; // Force Assamese to win if specific chars found
  }

  const detected = Object.entries(counts).sort((a,b) => b[1]-a[1])[0] as [keyof typeof counts, number];
  if (detected[1] === 0) return { language: 'English', native_name: 'English', script: 'Latin' };
  
  const languageMap = {
    hindi: { language: 'Hindi', native_name: 'हिन्दी', script: 'Devanagari' },
    bengali: { language: 'Bengali', native_name: 'বাংলা', script: 'Bengali' },
    assamese: { language: 'Assamese', native_name: 'অসমীয়া', script: 'Bengali' },
    tamil: { language: 'Tamil', native_name: 'தமிழ்', script: 'Tamil' },
    telugu: { language: 'Telugu', native_name: 'తెలుగు', script: 'Telugu' },
    kannada: { language: 'Kannada', native_name: 'ಕನ್ನಡ', script: 'Kannada' },
    malayalam: { language: 'Malayalam', native_name: 'മലയാളം', script: 'Malayalam' },
    gujarati: { language: 'Gujarati', native_name: 'ગુજરાતી', script: 'Gujarati' },
    odia: { language: 'Odia', native_name: 'ଓଡ଼ିଆ', script: 'Odia' },
    punjabi: { language: 'Punjabi', native_name: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
    urdu: { language: 'Urdu', native_name: 'اردو', script: 'Arabic' }
  };
  return languageMap[detected[0]];
}

function scoreUrgency(text: string) {
  const lower = text.toLowerCase();
  const critical = [
    'death','died','dead','killed','fire','flood','collapse','emergency','bleeding',
    'accident','critical','dangerous','life','hospital','ambulance','trapped',
    'मृत्यु','मर गया','मरा','आग','बाढ़','गिर गया','खतरनाक','अस्पताल','खून',
    'মৃত্যু','মরে গেছে','আগুন','বন্যা','ভেঙে পড়েছে','বিপজ্জনক',
    'மரணம்','இறந்தார்','தீ','வெள்ளம்','ஆபத்தான',
    'మరణం','చనిపోయారు','వరద','ప్రమాదకరమైన',
    'ಮರಣ','ಸಾವು','ಬೆಂಕಿ','ಪ್ರವಾಹ','ಅಪಾಯಕಾರಿ',
    'മരണം','വെള്ളപ്പൊക്കം','അപകടകരമായ'
  ];
  const high = [
    'no water','no electricity','broken road','school closed','hospital closed',
    'months','weeks','children','sick','disease','contaminated','damaged',
    'पानी नहीं','बिजली नहीं','सड़क टूटी','स्कूल बंद','बीमार','महीनों','हफ्तों',
    'পানি নেই','বিদ্যুৎ নেই','রাস্তা ভাঙা','স্কুল বন্ধ','অসুস্থ',
    'தண்ணீர் இல்லை','மின்சாரம் இல்லை','சாலை உடைந்தது','பள்ளி மூடல்',
    'నీళ్ళు లేవు','కరెంట్ లేదు','రోడ్డు విరిగింది','స్కూల్ మూసివేత'
  ];
  for (const word of critical) {
    if (lower.includes(word)) return 'Critical';
  }
  for (const word of high) {
    if (lower.includes(word)) return 'High';
  }
  if (lower.includes('?') || lower.includes('suggest') || lower.includes('सुझाव') || lower.includes('request')) {
    return 'Low';
  }
  return 'Medium';
}

function extractSummary(text_english: string) {
  const sentences = text_english.match(/[^.!?]+[.!?]+/g) || [text_english];
  const first = sentences[0].trim();
  return first.length > 100 ? first.substring(0, 97) + '...' : first;
}

async function safeTranslate(text: string, target: string) {
  try {
     const ai = getGemini();
     const response = await generateContentWithRetry(ai, {
       model: "gemini-2.5-flash",
       contents: `Translate the following text to ${target}. Respond ONLY with the translated text, nothing else. Text: "${text}"`,
     });
     return response.text?.trim() || text;
  } catch (err) {
     return text;
  }
}

app.post("/api/detect-language", async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim().length < 4) {
    return res.json({ success: true, language_detected: "English", language_native: "English", language_script: "Latin", mixed_language: false });
  }

  const detected = detectLanguage(text);

  res.json({
    success: true,
    language_detected: detected.language,
    language_native: detected.native_name,
    language_script: detected.script,
    mixed_language: false
  });
});

app.post("/api/preview-analysis", async (req, res) => {
  const { text, photoBase64 } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, error: "Text is required" });
  }
  
  try {
    const ai = getGemini();
    const hasPhoto = !!(photoBase64 && typeof photoBase64 === 'string' && photoBase64.trim().length > 100);

    const prompt = `You are processing a citizen complaint
submitted to a Member of Parliament
in Assam, India.

TASK 1 — CLEAN THE TEXT:
Rewrite/clean the text in the exact same language and script used by the citizen.
DO NOT translate it to English or any other language under any circumstances.
Keep the original language, meaning, and voice exactly.
Fix spelling and grammar in that same native language/script only.
Remove any abusive or foul words and replace with appropriate polite words in the same language.
Do not add or remove any information.

TASK 2 — ANALYSE:
Classify this submission into exactly one of these three types:

DEVELOPMENT_NEED:
Citizen is asking for something that does not yet exist.
New infrastructure, new facility, new scheme, new service.
Something to be built or created.
Example: Need a bridge, need a school, need a health centre, need a road.

SERVICE_FAILURE:
Something that should be working is not working.
Existing service broken or absent.
Example: Doctor not coming to PHC, existing road broken, water scheme not supplying water, teacher absent, electricity connection cut.

EMERGENCY:
Immediate threat to human life, safety or survival.
Needs attention within hours.
Example: Family stranded in flood, child critically ill, no food for days, violence or threat.

Read the submission carefully. Understand the real situation. Do not guess. Choose accurately.
A request for a new bridge = DEVELOPMENT_NEED not SERVICE_FAILURE.
A broken existing bridge = SERVICE_FAILURE.
Someone trapped due to no bridge during flood = EMERGENCY.

Return this JSON only:
{
  "normalised_text": "cleaned version",
  "priority_category": "DEVELOPMENT_NEED or SERVICE_FAILURE or EMERGENCY",
  "department_category": "Classify exactly as one of: Roads, Water Supply, Healthcare, Education/Schools, Electricity, Agriculture, or Other",
  "severity": "Critical or High or Medium or Low",
  "tags": ["tag1", "tag2", "tag3"],
  "what_citizen_needs": "one honest sentence",
  "foul_language_removed": true/false${hasPhoto ? ',\n  "photo_remove": true/false,\n  "photo_removal_reason": "nudity/vulgar or null"' : ''}
}

Complaint text: ${text}`;

    let response;
    if (hasPhoto) {
      response = await generateContentWithRetry(ai, {
        model: "gemini-2.5-flash",
        config: {
          responseMimeType: "application/json",
        },
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { data: photoBase64.split(',')[1] || photoBase64, mimeType: "image/jpeg" } }
            ]
          }
        ]
      });
    } else {
      response = await generateContentWithRetry(ai, {
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
    }

    const rawText = (response.text || "{}").replace(/```json/g, "").replace(/```/g, "");
    const resultJson = JSON.parse(rawText);

    res.json({ success: true, data: resultJson });
  } catch (error) {
    console.error("Preview analysis error:", error);
    res.status(500).json({ success: false, error: "Analysis failed" });
  }
});

// API: Suggest departments and draft a note on behalf of the MP
app.post("/api/suggest-action", async (req, res) => {
  const { submission_ids, action_type, selected_departments } = req.body;
  if (!submission_ids || !Array.isArray(submission_ids) || submission_ids.length === 0) {
    return res.status(400).json({ success: false, error: "Missing submission_ids" });
  }

  try {
    const ai = getGemini();
    const complaints: any[] = [];
    
    for (const id of submission_ids) {
      const docRef = doc(db, "submissions", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const d = snap.data();
        complaints.push({
          id,
          text: d.text_english || d.text_original,
          category: d.category,
          village: d.village,
          district: d.district,
          urgency: d.urgency
        });
      }
    }

    if (complaints.length === 0) {
      return res.status(404).json({ success: false, error: "No complaints found" });
    }

    const standardDepartments = [
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

    const hasSpecificDepts = selected_departments && Array.isArray(selected_departments) && selected_departments.length > 0;

    const prompt = `You are an AI governance advisor to a Member of Parliament (MP) in Assam, India.
The MP is reviewing citizen complaints to initiate action.

Here are the complaint details:
${JSON.stringify(complaints, null, 2)}

The action type the MP is taking: "${action_type || 'Forwarded to Department'}"
${hasSpecificDepts ? `The MP has specifically selected the following department(s): ${JSON.stringify(selected_departments)}` : ""}

Your task is to:
1. ${hasSpecificDepts ? `Use the selected department(s) ${JSON.stringify(selected_departments)}` : `Suggest one or more departments from this standard list that need to cooperate to resolve this issue (or suggest any other highly relevant department if none fit):
Standard list: ${JSON.stringify(standardDepartments)}`}

2. Draft a highly professional, reassuring, and clear public note/update to the citizen(s) on behalf of the MP.
- The note must be written in simple English.
- It should explain that the MP has reviewed their complaint and is taking action (referencing the action type "${action_type || 'Forwarded to Department'}").
- It should mention the responsible department(s) ${hasSpecificDepts ? `specifically selected (${JSON.stringify(selected_departments)})` : 'suggested'}.
- It should sound empathetic, authoritative, and specify that the MP's office will track the progress.
- Keep it concise (max 3-4 sentences), suitable for an SMS or mobile alert.

Return a JSON object ONLY:
{
  "suggested_departments": ${hasSpecificDepts ? JSON.stringify(selected_departments) : `["Dept 1", "Dept 2"]`},
  "drafted_note": "Draft text..."
}`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const rawText = (response.text || "{}").replace(/```json/g, "").replace(/```/g, "");
    const resultJson = JSON.parse(rawText);

    res.json({
      success: true,
      data: resultJson
    });

  } catch (error: any) {
    console.error("Suggest action error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate AI suggestions" });
  }
});


// API: Submit and analyze feedback
app.post("/api/analyze", async (req, res) => {
  const { 
    text, district, state, loksabha_constituency, assembly_constituency, 
    village_ward, police_station, gram_panchayat_municipality, pincode, phone_number, category, name, anonymous, 
    photos, photo_url, location, state_id, state_en, state_hi, district_id, district_en, district_hi, lok_sabha_id, lok_sabha_en, lok_sabha_hi, submission_type 
  } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ success: false, error: "Submission text is required" });
  }

  try {
    let text_original = text;
    let moderation_flag = "clean";
    
    if (leoProfanity.check(text)) {
      const sanitized = leoProfanity.clean(text);
      if (sanitized !== text) {
         // Count bad words roughly
         const badWordCount = text.split(/\s+/).filter(w => leoProfanity.check(w)).length;
         if (badWordCount > 3) {
            return res.status(400).json({
               success: false,
               error: "Your message contains inappropriate language. Please rephrase. / आपका संदेश अनुचित भाषा के कारण स्वीकार नहीं किया जा सका।"
            });
         }
         text_original = sanitized;
         moderation_flag = "sanitized";
      }
    }

    const detected = detectLanguage(text_original);
    
    // On-Demand Translation: Store original text without pre-translating to both English and Hindi
    let text_english = text_original;
    let text_hindi = text_original;

    const urgency = scoreUrgency(text_original);
    const issue_summary = extractSummary(text_original);

    let final_photos = photos || [];
    if (final_photos.length === 0 && photo_url) {
      final_photos = [{ url: photo_url, location: location || undefined }];
    }

    let final_urgency = urgency;
    let category_final = category || "Other";
    let photo_analysis_data: any = null;
    let urgency_source = "keyword_matching";
    let safety_flagged = false;
    let category_original: string | null = null;
    let category_auto_corrected = false;

    // On-Demand Vision Analysis: Only automatically analyze if the complaint is flagged as "Critical"
    const hasPhotoUrl = !!(photo_url && typeof photo_url === 'string' && photo_url.trim().length > 0);
    if (hasPhotoUrl) {
      if (final_urgency === "Critical") {
        try {
          console.log(`Analyzing photo automatically at creation since complaint is Critical...`);
          photo_analysis_data = await runVisionAnalysis(photo_url, category_final);

          // Overrides (Since final_urgency is already Critical here, we only flag safety if concern is detected)
          if (photo_analysis_data.safety_concern) {
            urgency_source = "safety_concern";
            safety_flagged = true;
          }

          // Category override
          if (photo_analysis_data.category_confirmed === false && photo_analysis_data.category_suggested) {
            category_original = category_final;
            category_final = photo_analysis_data.category_suggested;
            category_auto_corrected = true;
          }
        } catch (error) {
          console.error("Automatic photo analysis failed, will retry on-demand", error);
          photo_analysis_data = { analysis_failed: true };
        }
      } else {
        console.log(`On-Demand Vision: Photo present but urgency is not Critical. Skipping initial auto-analysis.`);
      }
    }

    const timestamp = new Date().toISOString();
    const isAnonymous = anonymous === true || anonymous === "true";
    const displayName = isAnonymous ? "Anonymous / अज्ञात" : (name || "Anonymous / अज्ञात");

    const submissionData = {
      text_original: text_original,
      text_english: text_english,
      text_hindi: text_hindi,
      language_detected: detected.language,
      language_native: detected.native_name,
      language_script: detected.script,
      urgency: final_urgency,
      urgency_source: urgency_source,
      safety_flagged: safety_flagged,
      photo_analysis: photo_analysis_data,
      issue_summary: issue_summary,
      category: category_final,
      submission_type: submission_type || "DEVELOPMENT NEED",
      category_original: category_original,
      category_auto_corrected: category_auto_corrected,
      state_id: state_id || "",
      state_en: state_en || state || "Unknown",
      state_hi: state_hi || "",
      district_id: district_id || "",
      district_en: district_en || district || "Unknown",
      district_hi: district_hi || "",
      lok_sabha_id: lok_sabha_id || "",
      lok_sabha_en: lok_sabha_en || loksabha_constituency || "Unknown",
      lok_sabha_hi: lok_sabha_hi || "",
      state: state_en || state || "Unknown",
      district: district_en || district || "Unknown",
      constituency: lok_sabha_en || loksabha_constituency || "Unknown",
      assembly_constituency: assembly_constituency || null,
      village: village_ward || null,
      panchayat: gram_panchayat_municipality || null,
      police_station: police_station || null,
      pincode: pincode || null,
      phone: phone_number || null,
      anonymous: isAnonymous,
      name: displayName,
      photo_url: final_photos.length > 0 ? final_photos[0].url : null,
      latitude: final_photos.length > 0 && final_photos[0].location ? final_photos[0].location.lat : null,
      longitude: final_photos.length > 0 && final_photos[0].location ? final_photos[0].location.lng : null,
      gps_accuracy: null,
      timestamp: timestamp,
      status: "pending",
      moderation_flag: moderation_flag,
      mp_note: null,
      mp_note_timestamp: null,
      mp_note_by: null,
      tracking_id: Math.random().toString(36).substring(2, 10).toUpperCase()
    };

    const docRef = await addDoc(collection(db, "submissions"), submissionData);
    const formatted_tracking_id = `JA-${new Date().getFullYear()}-${docRef.id.substring(0, 8).toUpperCase()}`;
    await updateDoc(docRef, { formatted_tracking_id });


    res.json({
      success: true,
      id: docRef.id,
      formatted_tracking_id,
      ...submissionData
    });

  } catch (error: any) {
    console.error("Submission error:", error);
    res.status(500).json({ success: false, error: "Failed to process submission" });
  }
});

// API: Get submission details by ID for tracking

// API: Add citizen follow up
app.post("/api/submissions/:id/followup", async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  try {
    const { collection, addDoc } = await import("firebase/firestore");
    await addDoc(collection(db, "mp_actions"), {
      submission_id: id,
      action_type: "Citizen Follow Up",
      mp_name: "Citizen",
      department: "",
      action_date: new Date().toISOString(),
      citizen_visible_note: note,
      actor: "CITIZEN"
    });
    res.json({ success: true });
  } catch (error: any) {
    console.error("Follow up error:", error);
    res.status(500).json({ success: false, error: "Failed to add follow up" });
  }
});

app.get("/api/submissions/:id", async (req, res) => {
  const { id } = req.params;
  try {
    let docSnap: any = null;
    let foundId = id;
    
    // First try raw ID
    const docRefRaw = doc(db, "submissions", id);
    const rawSnap = await getDoc(docRefRaw);
    
    if (rawSnap.exists()) {
      docSnap = rawSnap;
    } else if (id.startsWith("JA-")) {
      // If not found and it's a formatted ID, query by formatted_tracking_id
      const q = query(collection(db, "submissions"));
      const querySnapshot = await getDocs(q);
      const matchedDoc = querySnapshot.docs.find(d => d.data().formatted_tracking_id === id);
      if (matchedDoc) {
        docSnap = matchedDoc;
        foundId = matchedDoc.id;
      }
    }

    if (docSnap && (docSnap.exists ? docSnap.exists() : docSnap.data)) {
      const data = docSnap.data();

      // Fetch related actions from MP
      const actionsQuery = query(collection(db, "mp_actions"), where("submission_id", "==", foundId));
      const actionsSnap = await getDocs(actionsQuery);
      const actions = actionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort actions by date
      actions.sort((a: any, b: any) => new Date(b.action_date).getTime() - new Date(a.action_date).getTime());

      // Fetch related SMS alerts
      let smsLogs: any[] = [];
      try {
        const smsQuery = query(collection(db, "sms_logs"), where("submission_id", "==", foundId));
        const smsSnap = await getDocs(smsQuery);
        smsLogs = smsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        smsLogs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      } catch (smsErr) {
        console.error("Failed to fetch sms logs for submission:", smsErr);
      }

      res.json({
        success: true,
        id: foundId,
        ...data,
        mp_actions: actions,
        sms_logs: smsLogs
      });
    } else {
      res.status(404).json({ success: false, error: "No complaint found with this ID / इस आईडी के साथ कोई शिकायत नहीं मिली" });
    }
  } catch (error: any) {
    console.error("Error retrieving submission:", error);
    res.status(500).json({ success: false, error: "Failed to fetch complaint details" });
  }
});

// API: Get all submissions for MP Dashboard
app.get("/api/submissions", async (req, res) => {
  try {
    const q = query(collection(db, "submissions"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    const submissions: any[] = [];
    querySnapshot.forEach((doc) => {
      submissions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.json({ success: true, submissions });
  } catch (error: any) {
    console.error("Error retrieving all submissions:", error);
    res.status(500).json({ success: false, error: "Failed to fetch complaints" });
  }
});

// API: Translate text to target language
app.post("/api/translate", async (req, res) => {
  const { texts, targetLanguage } = req.body;
  
  if (!texts || !Array.isArray(texts) || !targetLanguage) {
    return res.status(400).json({ success: false, error: "Missing texts array or targetLanguage" });
  }

  if (texts.length === 0) {
    return res.json({ success: true, translations: [] });
  }

  try {
    const ai = getGemini();
    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: `Translate the following JSON array of strings to the language code or name "${targetLanguage}". Return a valid JSON array of translated strings in the EXACT SAME ORDER. Do not wrap in markdown, return ONLY the raw JSON array. Array: ${JSON.stringify(texts)}`
    });
    
    let result = response.text?.trim() || "[]";
    if (result.startsWith("```json")) {
        result = result.substring(7);
    } else if (result.startsWith("```")) {
        result = result.substring(3);
    }
    if (result.endsWith("```")) {
        result = result.substring(0, result.length - 3);
    }
    const translations = JSON.parse(result.trim());

    res.json({ success: true, translations: Array.isArray(translations) ? translations : [translations] });
  } catch (error: any) {
    console.error("Translation error:", error);
    res.json({ success: false, translations: texts, error: error.message });
  }
});

// API: On-Demand Vision Analysis for a specific submission
app.post("/api/submissions/:id/analyze-vision", async (req, res) => {
  const { id } = req.params;
  try {
    const docRef = doc(db, "submissions", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return res.status(404).json({ success: false, error: "Complaint not found / शिकायत नहीं मिली" });
    }
    const data = docSnap.data();
    if (!data.photo_url) {
      return res.status(400).json({ success: false, error: "Complaint does not have an uploaded photo / शिकायत में कोई फोटो अपलोड नहीं है" });
    }

    console.log(`Starting on-demand vision analysis for submission ${id}...`);
    const photo_analysis_data = await runVisionAnalysis(data.photo_url, data.category);

    let final_urgency = data.urgency;
    let urgency_source = data.urgency_source || "keyword_matching";
    let safety_flagged = data.safety_flagged || false;
    let category_final = data.category;
    let category_original = data.category_original || null;
    let category_auto_corrected = data.category_auto_corrected || false;

    // Overrides
    if (photo_analysis_data.safety_concern) {
      final_urgency = "Critical";
      urgency_source = "safety_concern";
      safety_flagged = true;
    } else if (photo_analysis_data.severity_from_photo === "Critical" && (final_urgency === "Medium" || final_urgency === "Low")) {
      final_urgency = "High";
      urgency_source = "photo_analysis";
    }

    // Category override
    if (photo_analysis_data.category_confirmed === false && photo_analysis_data.category_suggested) {
      category_original = category_final;
      category_final = photo_analysis_data.category_suggested;
      category_auto_corrected = true;
    }

    const updates = {
      photo_analysis: photo_analysis_data,
      urgency: final_urgency,
      urgency_source,
      safety_flagged,
      category: category_final,
      category_original,
      category_auto_corrected
    };

    await updateDoc(docRef, updates);
    res.json({ success: true, updates });
  } catch (error: any) {
    console.error("On-demand vision analysis error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to analyze photo" });
  }
});

// API: On-Demand Manual Refresh of Themes and Priorities (formerly the scheduled Cron job)
app.post("/api/refresh-insights", async (req, res) => {
  console.log("Manual refresh insights triggered...");
  try {
    const { doc: fsDoc, setDoc } = await import("firebase/firestore");
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const q = query(collection(db, "submissions"));
    const snapshot = await getDocs(q);
    const complaints: any[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.moderation_flag !== 'blocked' && new Date(data.timestamp) >= sevenDaysAgo) {
        complaints.push({ id: doc.id, ...data });
      }
    });

    if (complaints.length >= 5) {
      const response = await fetch(`http://localhost:3000/api/generate-themes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaints })
      });
      const result = await response.json();
      
      if (result.success && result.data && result.data.themes) {
        const themeData = result.data;
        
        await addDoc(collection(db, "complaint_themes"), {
          ...themeData,
          generated_at: new Date().toISOString(),
          complaints_analyzed: complaints.length,
          constituency: 'assam_demo',
          generation_method: 'manual_refresh'
        });

        for (const theme of themeData.themes) {
          for (const complaintId of theme.complaint_ids) {
            await updateDoc(fsDoc(db, "submissions", complaintId), {
              theme_id: theme.theme_id,
              theme_name: theme.theme_name,
              theme_urgency: theme.urgency_level
            }).catch(e => console.error("Error updating complaint theme", e));
          }
        }
        
        // Chain generatePriorityRanking
        let safetyCount = 0;
        let growingThemes = [];
        for (const c of complaints) {
          if (c.safety_flagged && c.status !== 'resolved') safetyCount++;
        }
        for (const t of themeData.themes) {
          if (t.trend === 'growing') growingThemes.push(t);
        }

        const priorityResponse = await fetch(`http://localhost:3000/api/generate-priorities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            themes: themeData.themes, 
            districtData: {}, 
            safetyCount, 
            growingThemes 
          })
        });
        const priorityResult = await priorityResponse.json();

        if (priorityResult.success && priorityResult.data) {
          await addDoc(collection(db, "priority_rankings"), priorityResult.data);
          await setDoc(fsDoc(db, "priority_rankings", "latest"), priorityResult.data);
          return res.json({ success: true, message: "Insights refreshed successfully! / विश्लेषण और प्राथमिकताएं सफलतापूर्वक अपडेट की गईं!" });
        } else {
          return res.status(500).json({ success: false, error: priorityResult.error || "Priority ranking generation failed" });
        }
      } else {
        return res.status(500).json({ success: false, error: result.error || "Theme clustering failed" });
      }
    } else {
      return res.status(400).json({ success: false, error: "Not enough complaints (minimum 5 required) / विश्लेषण के लिए पर्याप्त शिकायतें नहीं हैं (कम से कम 5 आवश्यक हैं)" });
    }
  } catch (error: any) {
    console.error("Refresh insights failed:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to refresh insights" });
  }
});

// Serve static assets or mount Vite in development
// API: Geocode
app.get("/api/geocode", async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) return res.status(400).json({ error: "Address required" });
    
    const key = process.env.GOOGLE_MAPS_PLATFORM_KEY;
    if (!key) return res.status(500).json({ error: "Google Maps API key not configured on server" });

    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address as string)}&key=${key}`);
    const data = await response.json();
    
    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      res.json({ lat: location.lat, lng: location.lng });
    } else {
      res.status(404).json({ error: "Location not found" });
    }
  } catch (error) {
    console.error("Geocoding failed:", error);
    res.status(500).json({ error: "Failed to geocode address" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Automatic daily Cron job has been disabled by user request to manage API usage judiciously.
  // Insights and reports are now refreshed on-demand via the dashboard 'Refresh Insights' button.

  

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Jan Awaaz server is running on http://localhost:${PORT}`);
  });
}

startServer();
