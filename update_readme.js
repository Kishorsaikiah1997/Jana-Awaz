const fs = require('fs');
let readme = fs.readFileSync('README.md', 'utf8');

const featuresSectionStart = readme.indexOf('## Features');
const techStackStart = readme.indexOf('## Tech Stack');

const newFeatures = `## JAN AWAAZ — Complete Feature Documentation

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
- Language toggle: Hindi / English with visual feedback
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
- GPS tags photo to exact location of the issue — not citizen's home
- Photo compressed client-side for low bandwidth networks
- "Are you at this location?" toggle for remote submissions on behalf of others

**AI ANALYSIS PIPELINE — CALL 1**
Runs at submission time, citizen waits:
- Text normalisation: fixes grammar and spelling while preserving citizen's voice completely
- Silent content moderation: removes foul language and replaces with appropriate words — submission never blocked for language alone
- Photo content moderation: detects nudity or inappropriate content before submission
- Smart tag generation: AI reads full context and generates 3-8 descriptive tags capturing every dimension of the need — no predefined tag list constraining AI understanding
- Submission type classification: DEVELOPMENT NEED / SERVICE FAILURE / EMERGENCY — based on genuine situational understanding
- Severity assessment: Critical / High / Medium / Low — based on real human impact not keywords
- Development sector identification: AI freely identifies the sector without predefined list
- What is needed: one honest sentence capturing the core need

**AI ANALYSIS PIPELINE — CALL 2**
Runs after submission in background, citizen never waits:
- Deep photo intelligence: What infrastructure is shown, Damage assessment, Safety concern detection, Evidence strength rating
- AI-generated image detection: Identifies Midjourney/DALL-E images, EXIF metadata verification, Visual authenticity check, Protects MP from fake evidence
- Text-photo consistency check: Cross-references citizen's words with photo content, Flags inconsistencies silently for MP awareness
- Translation pipeline: English translation stored, Hindi translation stored, All future display from storage, Zero re-translation cost
- Root cause analysis: Is this a one-off or systemic? How long has this been ongoing? What happens if unaddressed?
- Government scheme matching: Identifies relevant central/state schemes for the development need e.g. Jal Jeevan Mission for water, PMGSY for roads, Samagra Shiksha for education
- Population impact estimation: Based on location and nature of need, Cross-referenced with district data, Quantifies scale for MP planning
- Development priority score: 1-10 score based on population affected, vulnerability, urgency and absence of existing infrastructure

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
- Community voice indicator: "You are 1 of 23 people who raised this need in your area"
- Development meter visual: Submitted → Reviewed → Linked → Sanctioned → In Progress → Complete

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
- Bilingual labels throughout: English + Hindi on all elements
- Category icons for low literacy
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
- "Since you last visited: X hours ago"
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
On any submission MP can:

🏛️ Forward to Department:
- Assam department selector
- Optional note
- Citizen notified immediately
- Action logged in audit trail

📅 Schedule Field Visit:
- Date picker
- Team description
- Citizen notified with date

💰 Link to MPLAD Project:
- Connect to existing project
- Or create new project
- Citizen sees project linked

🏛️ Raise in Parliament:
- Question type selection
- Question number recorded
- Historic record created
- Citizen notified — unique feature, no other portal does this

✓ Mark Resolved:
- Resolution description
- Optional evidence photo
- Citizen notified
- Public stats updated

📝 Add Internal Note:
- MP office only — not visible to citizen
- Reminder and planning tool

Every action:
- Stored with timestamp
- Attributed to MP office
- Immutable audit trail
- Updates citizen tracking
- Updates public accountability stats

**AI THEMATIC INTELLIGENCE**
- Gemini reads ALL submissions simultaneously across all languages
- Groups by genuine similarity — not keyword matching
- Identifies themes humans would miss across language barriers
- Each theme shows: Theme name (AI generated), Submission count, Districts affected, Estimated population affected, Evidence strength: Strong/Moderate/Weak, Representative citizen voice, Relevant government scheme, Department to contact
- "Act on all N submissions" button: One action applies to entire theme, All N citizens notified at once, Bulk governance at scale
- Refresh Intelligence button: Re-runs Gemini analysis, Picks up new submissions, Updates theme groupings

**SCHEME OPPORTUNITIES**
- AI matches submission patterns to relevant government schemes
- Shows: scheme name, submission count, districts needing, department, application status
- Central schemes: Jal Jeevan Mission, PMGSY, Samagra Shiksha, PMAY, Ayushman Bharat, MGNREGA
- State schemes: Assam specific
- No AI recommendation — just evidence and scheme data, MP decides

**DEVELOPMENT PROJECTS MODULE**
- MP office adds proposed projects
- Each project shows: Name, location, cost, status, Citizen demand evidence count, Evidence strength badge, Relevant scheme if matched
- Cross-references submissions automatically
- Links citizen voices to planned development works
- Statuses: Proposed / Funded / Ongoing / Completed
- Objective evidence for MPLAD fund allocation decisions

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

**PUBLIC ACCOUNTABILITY PAGE**
- Public URL — no login required: jan-awaaz.in/mp/darrang-udalguri
- Shows publicly: Total citizen voices received, Actions taken by MP office, Average response time, Projects sanctioned, Parliament questions raised, Top development needs this month, Recent MP actions
- Creates public accountability. MP motivated to act. Citizens can verify impact. Media can report on it. Judges can see governance loop.

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
  - Call 1 Gemini: ~₹0.02
  - Call 2 Gemini: ~₹0.03
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

`;

const updatedReadme = readme.substring(0, featuresSectionStart) + newFeatures + "\n" + readme.substring(techStackStart);
fs.writeFileSync('README.md', updatedReadme);
console.log('README updated successfully!');
