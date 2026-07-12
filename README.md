# Jana Awaz - Citizen Grievance Portal

A full-stack citizen grievance portal and Member of Parliament (MP) dashboard, built to bridge the gap between citizens and their representatives.

## JAN AWAAZ — Complete Feature Documentation

### CITIZEN PORTAL FEATURES

**MULTILINGUAL SUBMISSION ENGINE**
- Accepts submissions in any language on earth — not just 10 predefined ones
- Real-time language detection using Unicode character range mapping for Indian scripts — zero API cost
- Languages specifically supported: Assamese, Bengali, Hindi, English, Tamil, Telugu, Kannada, Malayalam, Gujarati, Odia, Punjabi, Urdu, Bodo, Nepali, Santali and any other language
- Native script display in language badge e.g. "Bengali / বাংলা"
- Mixed language detection — identifies primary script in Hinglish or code-mixed submissions

**VOICE INPUT**
- Browser-based voice recording using Web Speech API
- Speaks in any Indian language transcribed directly to text
- Works on any Android browser without app installation
- Transcribed text editable before submission

**INTELLIGENT SUBMISSION FORM**
- Progressive disclosure design — shows only what is needed
- Citizen writes freely in natural spoken language — no formal application style required
- Warm instructional text: "Just tell your MP what is happening. Simple words. Your own language."
- No mandatory category selection — AI understands context automatically
- Three submission types auto-detected: DEVELOPMENT NEED / SERVICE FAILURE / EMERGENCY

**PHOTO SUBMISSION WITH GPS**
- Optional photo with Yes/No toggle
- Two options: Upload from gallery or capture directly with camera
- GPS coordinates automatically captured with camera photo
- GPS tags photo to exact location of the issue 
- Photo compressed client-side for low bandwidth networks

**AI ANALYSIS PIPELINE**
- Text normalisation: fixes grammar and spelling while preserving citizen's voice
- Silent content moderation: checks for inappropriate language
- Smart tag generation: AI reads full context and generates descriptive tags capturing the need
- Submission type classification: DEVELOPMENT NEED / SERVICE FAILURE / EMERGENCY 
- Severity assessment: Critical / High / Medium / Low — based on human impact
- Development sector identification: AI identifies the relevant sector
- What is needed: AI summarizes the core need into a single sentence

**AI PHOTO INTELLIGENCE**
- Deep photo intelligence: Identifies infrastructure, assesses damage, and detects safety concerns
- Triggered automatically for Critical submissions, or on-demand via the dashboard

**LOCATION INTELLIGENCE**
- Smart location detection: "Are you at this location?" Yes → GPS auto-capture, No → Manual entry for remote submissions
- Cascading location dropdowns: State → District → Lok Sabha Constituency (official ECI names)
- Free text fields: Village/Town, Gram Panchayat, Police Station (for MP emergency coordination), Assembly Constituency
- Submission type flagging: on_site: citizen physically present, remote: submitted on behalf, Tells MP evidence weight difference
- GPS coordinates stored: For map plotting, For emergency directions, For hotspot analysis

**OFFLINE RESILIENCE**
- Form works completely offline
- Submissions saved to localStorage queue when no internet
- Background sync every 30 seconds when connection restored
- "1 submission saved locally. Will send when internet is stable."
- Never loses a citizen submission
- Critical for char areas and remote tribal villages with intermittent connectivity

**GOVERNMENT STANDARD RECEIPT**
- A4 formatted acknowledgement opens in new browser tab
- Auto-triggers print dialog
- Save as PDF functionality
- Official receipt contains: Reference ID: JA-2026-XXXXXXXX, Date and time of submission, Complete location hierarchy, Citizen's original text exactly as submitted — zero modification, AI identified development sector, Submission type, Official acknowledgement paragraph, Citizen's contact details, Footer with portal information
- English only — no AI translation on official document
- "Computer-generated, no signature required" disclaimer
- Reprint from tracking page generates identical receipt

**SUBMISSION TRACKING**
- Citizen enters JA-2026-XXXXXXXX
- Live status from Firestore: ✓ Submission Received, ✓ Message Understood, ✓ Shared with MP's Office, ⟳ Action Taken (updates live), ✓ Resolved
- Shows AI identified tags
- Shows development sector
- Shows what AI understood
- Shows MP action when taken in citizen-friendly language

**MY SUBMISSIONS (localStorage)**
- Device-only history
- No server-side identity storage
- Shows all submissions from device
- Each shows: category, location, urgency, status, time
- Track Status: fetches live from Firestore using stored ID
- Reprint Receipt: regenerates identical government receipt
- Remove individual submissions
- Clear all with confirmation
- Privacy notice: "Saved on this device only. Clearing browser data removes list."
- Whistleblower protection: Server cannot link submissions to identity

**ACCESSIBILITY FEATURES**
- Font size toggle: A / A+ / A++
- High contrast dark mode
- Large touch targets for elderly
- Voice input for non-readers
- Warm conversational language — never bureaucratic or cold
- Works on basic Android phones
- No app installation required
- Loads on 2G connection

### MP DASHBOARD FEATURES

**CONSTITUENCY-BASED FILTERING**
- MP selects constituency on login
- All data filters to that constituency automatically
- Covers entire dashboard: Today tab, Insights tab, Map tab
- Stored in localStorage
- Change constituency anytime
- All Assam overview option
- All India overview option
- Header always shows current constituency name

**HOME / SCAN VIEW**
Designed for 30-second morning review:
- Personalised greeting with date
- New submissions count
- Emergency count with status
- Top AI priority for today
- Pending actions count
- Quick numbers: Total, Emergencies, Development Needs, Service Issues
- Everything above the fold
- No scrolling needed for daily scan

**EMERGENCY ALERT SYSTEM**
- Full-width red pulsing banner above ALL other content
- Shows for any EMERGENCY submission
- Displays citizen's exact words
- Location with GPS directions link
- Police station contact — one tap to call directly from dashboard
- Citizen phone if shared — one tap
- "Get Directions" opens Google Maps
- Multiple emergencies stack as separate red banners
- Cannot be dismissed until resolved
- AI detected — not self-reported by citizen — no gaming possible

**LIVE FEED**
- Real-time Firestore updates
- Status tabs: Pending / Resolved / Closed
- Each submission card shows: Submission type badge, Development sector, AI generated tags as pills, Citizen's original language text, English translation, MP language translation if set, Full location hierarchy, Photo thumbnail if exists, GPS badge if coordinates present, Time submitted (relative), Action history if any, MP note if added
- Filters: By submission type, By development sector, By date range, By status, Has note toggle
- Search across text_english
- Sort: newest / urgency / location

**TAKE ACTION SYSTEM**
On any submission MP can update status and action via dropdown:
- Select Action (Forwarded to Department, Raised in Parliament, Called District Collector, Sanctioned for MPLAD fund, Field visit scheduled, etc.)
- Specify custom action if needed
- Update Status (Pending, Resolved, Closed)
- AI auto-generates response text for the citizen based on the selected action
- Action logged in audit trail
- Updates citizen tracking

**AI THEMATIC INTELLIGENCE**
- Gemini reads ALL submissions simultaneously across all languages
- Groups by genuine similarity — not keyword matching
- Identifies themes humans would miss across language barriers
- Each theme shows: Theme name (AI generated), Submission count, Districts affected, Estimated population affected, Evidence strength: Strong/Moderate/Weak, Representative citizen voice, Relevant government scheme, Department to contact
- Refresh Intelligence button: Re-runs Gemini analysis, Picks up new submissions, Updates theme groupings

**CONSTITUENCY MAP**
- Google Maps Platform API integration
- Centered on Darrang-Udalguri
- Two views: Individual submissions as markers, AI themes as sized circles
- Marker colors by type: Development Need: navy, Service Failure: orange, Emergency: red pulsing
- Theme circles sized by submission count — bigger = more voices on that theme
- Flood zone overlays: Brahmaputra floodplain, Bornadi river zone, Char areas Mangaldoi, Toggle on/off
- Click any marker: Popup with submission summary, Type, sector, location, what is needed, timestamp
- Stats below map: X submissions mapped, Y themes plotted, Z in flood zones
- Filter by type and urgency

**WEEKLY AI REPORT**
- Manual trigger — MP decides when
- Collects last 7 days submissions from memory — no extra API call
- Single Gemini call generates: Executive Summary (2 sentences), Top 3 issues with evidence, Urgent attention items, Weekly trend analysis, District highlights, 5 recommended actions, Looking ahead
- Report under 400 words
- Formal tone, addressed to Honorable Member of Parliament
- Copy to clipboard
- Print report option
- Stored in Firestore with timestamp
- Shows last generated report automatically

**MP LANGUAGE PREFERENCE**
- Dropdown: English, Hindi, Assamese and all major Indian languages
- Saves to localStorage
- Dashboard displays submissions in MP's preferred language
- Full translation for English/Hindi stored at submission time
- Zero API cost on dashboard

### SYSTEM ARCHITECTURE FEATURES

**ZERO-COST DASHBOARD**
- All filtering: in-memory JavaScript
- All charts: computed from loaded data
- All map markers: from stored GPS
- Zero Gemini calls on dashboard except manual report button
- Single Firestore onSnapshot loads everything once
- Cost: near zero for MP usage regardless of scale

**COST ARCHITECTURE**
- Per submission cost:
  - Language detection: ₹0 (Unicode)
  - Translation: Google Translate (Free Tier / No Cost Implementation)
  - Urgency scoring: ₹0 (keywords)
  - AI Analysis Gemini: ~₹0.02
  - AI Photo Vision: ~₹0.03
  - Total per submission: ~₹0.05
- At 10,000 submissions/month:
  - AI cost: ~₹500/month
  - Dashboard cost: ~₹0
  - Hosting: Google Cloud free tier
  - Total: ~₹500/month for entire constituency deployment

**DATA INTEGRITY**
- Every submission immutable once saved
- Action trail permanent and immutable
- Original citizen text preserved exactly as typed — forever
- Normalised text stored separately
- AI analysis stored separately
- Multiple versions coexist
- Audit trail for every action
- Deletion not possible — only status archiving

**SCALABILITY DESIGN**
- Constituency-agnostic architecture
- Adding new constituency: Select from dropdown — done
- Adding new MP account: Firebase Auth + constituency assignment — done
- Scaling to all 543 constituencies: Configuration change only, No code change needed
- Firestore scales automatically
- Cloud Run auto-scales to load
- No server management needed

**PRIVACY BY DESIGN**
- No mandatory login for citizens
- Anonymous submission always available
- Server cannot link submissions to identity without citizen consent
- localStorage history on device only
- GPS only captured with explicit citizen consent
- Whistleblower protection built in
- Police station field serves emergency coordination — not surveillance
- Data belongs to constituency not to platform


## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, React Router, Recharts, @vis.gl/react-google-maps
- **Backend**: Node.js, Express, Google Gen AI SDK
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase Project
- Google Gemini API Key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and fill in your API keys.
   ```bash
   cp .env.example .env
   ```

### Development

Run the development server (starts both Vite frontend and Express backend):
```bash
npm run dev
```

### Production Build

Build the full-stack application:
```bash
npm run build
```

Start the production server:
```bash
npm run start
```

## Environment Variables

- `GEMINI_API_KEY`: Required for AI categorization and photo analysis.
- `VITE_FIREBASE_*`: Your Firebase configuration keys.
- `GOOGLE_MAPS_PLATFORM_KEY`: (Optional) for Maps integrations.

## License

This project is open-source and available under the MIT License.
# Jana-Awaz