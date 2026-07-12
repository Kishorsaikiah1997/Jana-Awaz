const fs = require('fs');
let readme = fs.readFileSync('README.md', 'utf8');

// Replace AI Analysis sections
const oldAiSection = `**AI ANALYSIS PIPELINE — CALL 1**
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
- Development priority score: 1-10 score based on population affected, vulnerability, urgency and absence of existing infrastructure`;

const newAiSection = `**AI ANALYSIS PIPELINE**
- Text normalisation: fixes grammar and spelling while preserving citizen's voice
- Silent content moderation: checks for inappropriate language
- Smart tag generation: AI reads full context and generates descriptive tags capturing the need
- Submission type classification: DEVELOPMENT NEED / SERVICE FAILURE / EMERGENCY 
- Severity assessment: Critical / High / Medium / Low — based on human impact
- Development sector identification: AI identifies the relevant sector
- What is needed: AI summarizes the core need into a single sentence

**AI PHOTO INTELLIGENCE**
- Deep photo intelligence: Identifies infrastructure, assesses damage, and detects safety concerns
- Triggered automatically for Critical submissions, or on-demand via the dashboard`;

readme = readme.replace(oldAiSection, newAiSection);

// Replace Take Action System
const oldTakeAction = `**TAKE ACTION SYSTEM**
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
- Updates public accountability stats`;

const newTakeAction = `**TAKE ACTION SYSTEM**
On any submission MP can update status and action via dropdown:
- Select Action (Forwarded to Department, Raised in Parliament, Called District Collector, Sanctioned for MPLAD fund, Field visit scheduled, etc.)
- Specify custom action if needed
- Update Status (Pending, Resolved, Closed)
- AI auto-generates response text for the citizen based on the selected action
- Action logged in audit trail
- Updates citizen tracking`;

readme = readme.replace(oldTakeAction, newTakeAction);

// Remove specific bullet from AI Thematic Intelligence
readme = readme.replace('- "Act on all N submissions" button: One action applies to entire theme, All N citizens notified at once, Bulk governance at scale\n', '');

// Remove modules that do not exist
const oldModules = `**SCHEME OPPORTUNITIES**
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

`;
readme = readme.replace(oldModules, '');

const oldPublicAccountability = `**PUBLIC ACCOUNTABILITY PAGE**
- Public URL — no login required: jan-awaaz.in/mp/darrang-udalguri
- Shows publicly: Total citizen voices received, Actions taken by MP office, Average response time, Projects sanctioned, Parliament questions raised, Top development needs this month, Recent MP actions
- Creates public accountability. MP motivated to act. Citizens can verify impact. Media can report on it. Judges can see governance loop.

`;
readme = readme.replace(oldPublicAccountability, '');

fs.writeFileSync('README.md', readme);
console.log('Done!');
