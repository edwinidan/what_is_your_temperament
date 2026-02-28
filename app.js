/**
 * ============================================================================
 * DATA INVENTORY & PRIVACY
 * ============================================================================
 * This application is 100% client-side. No PII is collected or sent to a server.
 *
 * 1. LocalStorage Keys:
 *    - `temperamentInsight.progress.v1`: Stores the user's answers and current test state
 *       (e.g., target depth, completed questions). Cleared on test completion or reset.
 * 2. URL Hashes:
 *    - `#result=...`: A base64 encoded payload of the user's scores for sharing.
 *      Contains only numerical scores (e.g. [20, 15, 5, 0]), no personal data.
 * 3. Analytics (via Plausible):
 *    - Privacy-friendly, cookie-less event tracking.
 *    - Events: "assessment_started", "assessment_page_viewed", "assessment_completed",
 *      "assessment_abandoned", "detail_view_opened".
 * ============================================================================
 */
// ==========================================
// 1. CONSTANTS & CONFIGURATION
// ==========================================
const PAGE_SIZE = 5;
const STORAGE_KEY = "temperamentInsight.progress.v1";
const VALID_DEPTHS = [20, 40, 60];
const ANALYTICS_EVENTS = {
  assessmentStarted: "assessment_started",
  assessmentPageViewed: "assessment_page_viewed",
  assessmentCompleted: "assessment_completed",
  assessmentAbandoned: "assessment_abandoned",
  detailViewOpened: "detail_view_opened",
};
const ASSISTANT_MAX_MESSAGES = 10;
const ASSISTANT_RESPONSE_WORD_MIN = 100;
const ASSISTANT_RESPONSE_WORD_MAX = 180;
const ASSISTANT_REFLECT_ENDPOINT = "/api/reflect";
const ASSISTANT_CHAT_ENDPOINT = "/api/chat";
const PREMIUM_TOKEN_KEY = "temperamentInsight.premiumToken";
// Paywall defaults: 50 GHS in kobo/pesewas
const PAYWALL_AMOUNT_KOBO = 5000;
const PAYWALL_CURRENCY = "GHS";
const ASSISTANT_API_TIMEOUT_MS = 15_000;
const ASSISTANT_MODES = [
  "Result Summary",
  "Strengths in Action",
  "Communication Prep",
];


/** Starter prompts shown when a quick-start chip is clicked. */
const ASSISTANT_MODE_STARTERS = {
  "Result Summary": "Can you summarise what my temperament result means?",
  "Strengths in Action": "What are my key strengths and how can I use them?",
  "Communication Prep": "How does my temperament affect how I communicate with others?",
};

const TEMPERAMENTS = ["Sanguine", "Choleric", "Melancholic", "Phlegmatic"];
const TEMPERAMENT_COLORS = {
  Sanguine: "#D6A848",
  Choleric: "#BC5C41",
  Melancholic: "#3B4A54",
  Phlegmatic: "#468254",
};
const TEMPERAMENT_VISUALS = {
  Sanguine: {
    tagline: "The Expressive Spark",
    traits: "Warm · Social · Optimistic",
    image:
      "https://images.unsplash.com/photo-1625283518288-00362afc8663?w=900&auto=format&fit=crop",
  },
  Choleric: {
    tagline: "The Driven Builder",
    traits: "Decisive · Ambitious · Direct",
    image:
      "https://images.unsplash.com/photo-1758519291173-bb9fb3098e04?w=900&auto=format&fit=crop",
  },
  Melancholic: {
    tagline: "The Thoughtful Soul",
    traits: "Reflective · Precise · Deep",
    image:
      "https://images.unsplash.com/photo-1712229462114-dae7fa1d1bf1?w=900&auto=format&fit=crop",
  },
  Phlegmatic: {
    tagline: "The Steady Anchor",
    traits: "Calm · Reliable · Peaceful",
    image:
      "https://images.unsplash.com/photo-1557929878-b358f3bdbdd7?w=900&auto=format&fit=crop",
  },
};
const TEMPERAMENT_COMMS = {
  Sanguine: {
    preferred:
      "Energetic and collaborative conversations where ideas move quickly.",
    listener:
      "Encouraging and warm, often helping people feel accepted right away.",
    expression:
      "Expressive and spontaneous; stories and examples help you connect.",
    pressure:
      "Can move fast; clarity improves when you pause and confirm priorities.",
  },
  Choleric: {
    preferred:
      "Direct, goal-focused communication with clear decisions and ownership.",
    listener:
      "You listen for outcomes and next steps, especially under time pressure.",
    expression:
      "Concise and decisive; you prefer practical language over abstraction.",
    pressure:
      "May sound forceful; effectiveness rises when pace includes empathy.",
  },
  Melancholic: {
    preferred:
      "Thoughtful one-on-one exchanges with depth, context, and nuance.",
    listener: "Attentive and detail-sensitive, often hearing what others miss.",
    expression:
      "Carefully chosen words; you communicate with precision and meaning.",
    pressure:
      "Can withdraw to process; quality improves with space and structure.",
  },
  Phlegmatic: {
    preferred:
      "Calm, steady communication where people feel safe to share openly.",
    listener:
      "Patient and stabilizing, with strong focus on understanding both sides.",
    expression:
      "Measured and practical; you communicate with consistency over intensity.",
    pressure:
      "May avoid tension; momentum improves when needs are stated earlier.",
  },
};

const TEMPERAMENT_PROFILES = {
  Sanguine: {
    short:
      "Your responses suggest an outward-facing style that often gains energy from interaction, momentum, and variety.",
    strengths: [
      "You can quickly build rapport and make social spaces feel welcoming.",
      "You often adapt smoothly when circumstances shift.",
      "You tend to bring visible encouragement to group environments.",
    ],
    weaknesses: [
      "You may move into action before fully clarifying details.",
      "Sustained repetition can feel draining and reduce focus.",
      "High enthusiasm can occasionally overshadow quieter perspectives.",
    ],
    communication:
      "You often communicate with warmth, spontaneity, and visible emotion. Clarity improves when you pause to organize key points before responding.",
    strengthFocus: "additional decisiveness and forward movement",
    challengeFocus: "a tendency to move quickly past details",
  },
  Choleric: {
    short:
      "Your responses suggest a goal-directed style that prefers initiative, structure, and measurable progress.",
    strengths: [
      "You often provide direction when situations are unclear.",
      "You are comfortable making decisions and advancing priorities.",
      "You tend to stay focused on outcomes under pressure.",
    ],
    weaknesses: [
      "You may appear overly forceful when urgency is high.",
      "Patience can drop when processes feel slow.",
      "You may underemphasize emotional nuance during problem-solving.",
    ],
    communication:
      "You typically communicate directly and concisely with clear expectations. Relational trust strengthens when directness is paired with space for others to process.",
    strengthFocus: "greater social ease and expressive warmth",
    challengeFocus: "more impatience under slow decision cycles",
  },
  Melancholic: {
    short:
      "Your responses suggest a reflective style that values depth, quality, consistency, and careful evaluation.",
    strengths: [
      "You often notice important details that others overlook.",
      "You are motivated by accuracy and thoughtful preparation.",
      "You tend to show steady responsibility toward commitments.",
    ],
    weaknesses: [
      "You may remain on unresolved concerns for longer than needed.",
      "Ambiguous expectations can increase internal strain.",
      "Perfection pressure can delay completion or delegation.",
    ],
    communication:
      "You often communicate thoughtfully, with careful wording and context. Shared understanding improves when you signal priorities before diving into details.",
    strengthFocus: "added steadiness and interpersonal patience",
    challengeFocus: "more withdrawal when situations feel overstimulating",
  },
  Phlegmatic: {
    short:
      "Your responses suggest a steady style that values calm, harmony, and consistent pacing across relationships and tasks.",
    strengths: [
      "You often remain composed during interpersonal tension.",
      "You listen patiently and help stabilize group dynamics.",
      "You provide reliable follow-through in ongoing responsibilities.",
    ],
    weaknesses: [
      "You may delay difficult conversations to preserve harmony.",
      "Fast pivots can feel disruptive and reduce engagement.",
      "You may understate your needs in highly assertive environments.",
    ],
    communication:
      "You typically communicate in a calm, measured way and create space for others to speak. Momentum increases when you state your preferences earlier in discussions.",
    strengthFocus: "additional analytical depth and precision",
    challengeFocus: "more hesitation in highly competitive settings",
  },
};

// ==========================================
// 2. QUESTION BANK DATA
// ==========================================
const QUESTION_BANK_CSV = `
id,temperament,dimension,item_text,reverse_scored,scoring_rule
T001,Sanguine,Sociability,I easily strike up conversations with strangers.,false,Likert 1-5
T002,Sanguine,Sociability,I am usually the life of the party.,false,Likert 1-5
T003,Sanguine,Sociability,I thrive in environments with lots of people.,false,Likert 1-5
T004,Sanguine,Sociability,I feel energized after a large social gathering.,false,Likert 1-5
T005,Sanguine,Sociability,I love being the center of attention.,false,Likert 1-5
T006,Sanguine,Sociability,I quickly make new friends wherever I go.,false,Likert 1-5
T007,Sanguine,Sociability,I enjoy entertaining others with stories.,false,Likert 1-5
T008,Sanguine,Sociability,I actively seek out networking opportunities.,false,Likert 1-5
T009,Sanguine,Sociability,I prefer to spend my free time with a large group of friends.,false,Likert 1-5
T010,Sanguine,Sociability,I find it easy to mingle at social events.,false,Likert 1-5
T011,Sanguine,Sociability,I prefer to be left alone most of the time.,true,Likert 1-5
T012,Sanguine,Sociability,I feel exhausted by small talk.,true,Likert 1-5
T013,Sanguine,Sociability,I actively avoid crowded places.,true,Likert 1-5
T014,Sanguine,Sociability,I am hard to get to know.,true,Likert 1-5
T015,Sanguine,Sociability,I keep people at a distance until I know them well.,true,Likert 1-5
T016,Sanguine,Sociability,I dislike introducing myself to new people.,true,Likert 1-5
T017,Sanguine,Sociability,I prefer quiet nights at home over going out.,true,Likert 1-5
T018,Sanguine,Sociability,I find social gatherings highly draining.,true,Likert 1-5
T019,Sanguine,Sociability,I rarely start conversations voluntarily.,true,Likert 1-5
T020,Sanguine,Sociability,I feel uncomfortable when too many people are looking at me.,true,Likert 1-5
T021,Sanguine,Excitement-Seeking,I love trying thrilling new activities.,false,Likert 1-5
T022,Sanguine,Excitement-Seeking,I constantly look for new adventures.,false,Likert 1-5
T023,Sanguine,Excitement-Seeking,I enjoy taking spontaneous road trips.,false,Likert 1-5
T024,Sanguine,Excitement-Seeking,"I crave fast-paced, high-energy environments.",false,Likert 1-5
T025,Sanguine,Excitement-Seeking,I quickly get bored if things stay the same.,false,Likert 1-5
T026,Sanguine,Excitement-Seeking,I am drawn to bright lights and loud music.,false,Likert 1-5
T027,Sanguine,Excitement-Seeking,I enjoy doing things on the spur of the moment.,false,Likert 1-5
T028,Sanguine,Excitement-Seeking,I like taking risks for the fun of it.,false,Likert 1-5
T029,Sanguine,Excitement-Seeking,I am willing to try anything once.,false,Likert 1-5
T030,Sanguine,Excitement-Seeking,I love the rush of unpredictable situations.,false,Likert 1-5
T031,Sanguine,Excitement-Seeking,I avoid activities that involve physical risks.,true,Likert 1-5
T032,Sanguine,Excitement-Seeking,"I strongly prefer predictable, familiar routines.",true,Likert 1-5
T033,Sanguine,Excitement-Seeking,I dislike surprises of any kind.,true,Likert 1-5
T034,Sanguine,Excitement-Seeking,"I find loud, chaotic environments deeply unpleasant.",true,Likert 1-5
T035,Sanguine,Excitement-Seeking,I carefully plan everything to avoid unexpected events.,true,Likert 1-5
T036,Sanguine,Excitement-Seeking,I have no interest in extreme sports or thrills.,true,Likert 1-5
T037,Sanguine,Excitement-Seeking,"I prefer a slow, relaxed pace of life.",true,Likert 1-5
T038,Sanguine,Excitement-Seeking,I rarely act without thinking things through first.,true,Likert 1-5
T039,Sanguine,Excitement-Seeking,I stick to the hobbies and places I already know.,true,Likert 1-5
T040,Sanguine,Excitement-Seeking,I feel stressed when forced to make a spontaneous decision.,true,Likert 1-5
T041,Sanguine,Cheerfulness,I naturally look on the bright side of things.,false,Likert 1-5
T042,Sanguine,Cheerfulness,I am known for my contagious laughter.,false,Likert 1-5
T043,Sanguine,Cheerfulness,I bounce back quickly from minor disappointments.,false,Likert 1-5
T044,Sanguine,Cheerfulness,I love to joke around and make others smile.,false,Likert 1-5
T045,Sanguine,Cheerfulness,I wake up feeling energetic and joyful.,false,Likert 1-5
T046,Sanguine,Cheerfulness,I see the positive potential in almost any situation.,false,Likert 1-5
T047,Sanguine,Cheerfulness,I find it easy to celebrate the successes of others.,false,Likert 1-5
T048,Sanguine,Cheerfulness,I enthusiastically embrace new ideas.,false,Likert 1-5
T049,Sanguine,Cheerfulness,I am a generally lighthearted person.,false,Likert 1-5
T050,Sanguine,Cheerfulness,I use humor to defuse tense situations.,false,Likert 1-5
T051,Sanguine,Cheerfulness,I rarely feel cheerful or optimistic.,true,Likert 1-5
T052,Sanguine,Cheerfulness,I tend to expect the worst to happen.,true,Likert 1-5
T053,Sanguine,Cheerfulness,I am not easily amused by jokes.,true,Likert 1-5
T054,Sanguine,Cheerfulness,I find it hard to maintain a positive attitude.,true,Likert 1-5
T055,Sanguine,Cheerfulness,I am often told that I look serious or severe.,true,Likert 1-5
T056,Sanguine,Cheerfulness,I focus on the flaws rather than the positives.,true,Likert 1-5
T057,Sanguine,Cheerfulness,I rarely laugh out loud.,true,Likert 1-5
T058,Sanguine,Cheerfulness,I find overly enthusiastic people annoying.,true,Likert 1-5
T059,Sanguine,Cheerfulness,I dwell on past mistakes for a long time.,true,Likert 1-5
T060,Sanguine,Cheerfulness,I seldom express joy openly.,true,Likert 1-5
T061,Choleric,Assertiveness,I am naturally inclined to take charge of a group.,false,Likert 1-5
T062,Choleric,Assertiveness,I express my opinions firmly and confidently.,false,Likert 1-5
T063,Choleric,Assertiveness,I have no problem telling people exactly what I want.,false,Likert 1-5
T064,Choleric,Assertiveness,I easily take control in chaotic situations.,false,Likert 1-5
T065,Choleric,Assertiveness,I demand respect from my peers.,false,Likert 1-5
T066,Choleric,Assertiveness,I speak loud enough to ensure everyone hears my ideas.,false,Likert 1-5
T067,Choleric,Assertiveness,I actively step up when a leader is needed.,false,Likert 1-5
T068,Choleric,Assertiveness,I am comfortable giving orders to others.,false,Likert 1-5
T069,Choleric,Assertiveness,I push back when someone tries to override my decisions.,false,Likert 1-5
T070,Choleric,Assertiveness,I confront problems head-on without hesitation.,false,Likert 1-5
T071,Choleric,Assertiveness,I prefer to follow rather than lead.,true,Likert 1-5
T072,Choleric,Assertiveness,I often keep my opinions to myself to avoid arguments.,true,Likert 1-5
T073,Choleric,Assertiveness,I find it very difficult to give people instructions.,true,Likert 1-5
T074,Choleric,Assertiveness,I wait for someone else to make the final decision.,true,Likert 1-5
T075,Choleric,Assertiveness,I let others dominate the conversation.,true,Likert 1-5
T076,Choleric,Assertiveness,I hesitate to assert my authority.,true,Likert 1-5
T077,Choleric,Assertiveness,I back down quickly when challenged.,true,Likert 1-5
T078,Choleric,Assertiveness,I struggle to stand up for my own interests.,true,Likert 1-5
T079,Choleric,Assertiveness,I prefer to stay in the background during group work.,true,Likert 1-5
T080,Choleric,Assertiveness,I avoid confrontations at all costs.,true,Likert 1-5
T081,Choleric,Achievement,I set highly ambitious goals for my future.,false,Likert 1-5
T082,Choleric,Achievement,I work harder than most people to achieve success.,false,Likert 1-5
T083,Choleric,Achievement,I am deeply driven to rise to the top of my field.,false,Likert 1-5
T084,Choleric,Achievement,I measure my worth by the tangible results I produce.,false,Likert 1-5
T085,Choleric,Achievement,I thrive on competition and the desire to win.,false,Likert 1-5
T086,Choleric,Achievement,I push through obstacles no matter how difficult they are.,false,Likert 1-5
T087,Choleric,Achievement,I focus intensely on completing my objectives.,false,Likert 1-5
T088,Choleric,Achievement,I view failure merely as a stepping stone to success.,false,Likert 1-5
T089,Choleric,Achievement,I am constantly looking for ways to improve my efficiency.,false,Likert 1-5
T090,Choleric,Achievement,I feel restless if I am not actively accomplishing something.,false,Likert 1-5
T091,Choleric,Achievement,I am content with just getting by in life.,true,Likert 1-5
T092,Choleric,Achievement,I lack a strong sense of ambition.,true,Likert 1-5
T093,Choleric,Achievement,I easily give up when a task becomes too difficult.,true,Likert 1-5
T094,Choleric,Achievement,I have no desire to be in a position of power.,true,Likert 1-5
T095,Choleric,Achievement,I avoid competitive situations whenever possible.,true,Likert 1-5
T096,Choleric,Achievement,I rarely set long-term career goals.,true,Likert 1-5
T097,Choleric,Achievement,I prefer easy tasks that require little effort.,true,Likert 1-5
T098,Choleric,Achievement,I do not feel the need to prove my capabilities to others.,true,Likert 1-5
T099,Choleric,Achievement,I prioritize relaxation heavily over hard work.,true,Likert 1-5
T100,Choleric,Achievement,I am not motivated by external success or recognition.,true,Likert 1-5
T101,Choleric,Dominance,I believe my solutions are usually the most logical.,false,Likert 1-5
T102,Choleric,Dominance,I expect others to work at my fast pace.,false,Likert 1-5
T103,Choleric,Dominance,I have little patience for inefficiency.,false,Likert 1-5
T104,Choleric,Dominance,I will argue my point aggressively if I know I am right.,false,Likert 1-5
T105,Choleric,Dominance,"I focus entirely on the facts, even if it hurts someone's feelings.",false,Likert 1-5
T106,Choleric,Dominance,I view emotional decision-making as a weakness.,false,Likert 1-5
T107,Choleric,Dominance,I quickly dismiss ideas that are not practical.,false,Likert 1-5
T108,Choleric,Dominance,I am completely comfortable making unpopular decisions.,false,Likert 1-5
T109,Choleric,Dominance,I easily separate my emotions from my professional duties.,false,Likert 1-5
T110,Choleric,Dominance,I believe strong leadership requires being tough.,false,Likert 1-5
T111,Choleric,Dominance,I easily yield to the preferences of the group.,true,Likert 1-5
T112,Choleric,Dominance,I soften my words to avoid offending others.,true,Likert 1-5
T113,Choleric,Dominance,I let others set the pace of a project.,true,Likert 1-5
T114,Choleric,Dominance,I value group harmony more than getting the task done efficiently.,true,Likert 1-5
T115,Choleric,Dominance,I am very patient with people who learn slowly.,true,Likert 1-5
T116,Choleric,Dominance,I frequently second-guess my own logic.,true,Likert 1-5
T117,Choleric,Dominance,I avoid taking stances that might upset people.,true,Likert 1-5
T118,Choleric,Dominance,I find it difficult to fire or discipline someone.,true,Likert 1-5
T119,Choleric,Dominance,I let my emotions guide my important decisions.,true,Likert 1-5
T120,Choleric,Dominance,I am overly concerned with what others think of my choices.,true,Likert 1-5
T121,Melancholic,Orderliness,I keep my living space meticulously organized.,false,Likert 1-5
T122,Melancholic,Orderliness,I strictly follow schedules and to-do lists.,false,Likert 1-5
T123,Melancholic,Orderliness,I believe there is a proper place for everything.,false,Likert 1-5
T124,Melancholic,Orderliness,I prefer to plan my activities well in advance.,false,Likert 1-5
T125,Melancholic,Orderliness,I always read the instructions before starting a task.,false,Likert 1-5
T126,Melancholic,Orderliness,I double-check my work multiple times to ensure accuracy.,false,Likert 1-5
T127,Melancholic,Orderliness,I feel at peace when everything is neat and tidy.,false,Likert 1-5
T128,Melancholic,Orderliness,I excel at creating systems and structures.,false,Likert 1-5
T129,Melancholic,Orderliness,I demand high levels of precision in my work.,false,Likert 1-5
T130,Melancholic,Orderliness,I notice minor details that other people completely miss.,false,Likert 1-5
T131,Melancholic,Orderliness,I leave my belongings scattered around the house.,true,Likert 1-5
T132,Melancholic,Orderliness,I rarely use a calendar to plan my day.,true,Likert 1-5
T133,Melancholic,Orderliness,I am comfortable working in a cluttered environment.,true,Likert 1-5
T134,Melancholic,Orderliness,I easily lose track of my personal items.,true,Likert 1-5
T135,Melancholic,Orderliness,I start projects without a clear plan of action.,true,Likert 1-5
T136,Melancholic,Orderliness,I gloss over small errors if the main point is clear.,true,Likert 1-5
T137,Melancholic,Orderliness,I find strict rules and procedures highly restrictive.,true,Likert 1-5
T138,Melancholic,Orderliness,"I have a very flexible, unpredictable daily routine.",true,Likert 1-5
T139,Melancholic,Orderliness,I am satisfied with work that is just good enough.,true,Likert 1-5
T140,Melancholic,Orderliness,I hate dealing with precise details.,true,Likert 1-5
T141,Melancholic,Sensitivity,I tend to analyze situations deeply before speaking.,false,Likert 1-5
T142,Melancholic,Sensitivity,I hold myself to incredibly high standards.,false,Likert 1-5
T143,Melancholic,Sensitivity,I feel things much more deeply than most people.,false,Likert 1-5
T144,Melancholic,Sensitivity,I often reflect on the deeper meaning of life.,false,Likert 1-5
T145,Melancholic,Sensitivity,I take criticism very personally.,false,Likert 1-5
T146,Melancholic,Sensitivity,I am highly attuned to the aesthetic beauty of art and nature.,false,Likert 1-5
T147,Melancholic,Sensitivity,I spend a lot of time introspecting and understanding my emotions.,false,Likert 1-5
T148,Melancholic,Sensitivity,I am deeply moved by sad movies or music.,false,Likert 1-5
T149,Melancholic,Sensitivity,"I prefer deep, meaningful one-on-one conversations.",false,Likert 1-5
T150,Melancholic,Sensitivity,I hold grudges for a long time when I am betrayed.,false,Likert 1-5
T151,Melancholic,Sensitivity,I rarely think about my own internal motivations.,true,Likert 1-5
T152,Melancholic,Sensitivity,I easily shrug off insults or harsh criticism.,true,Likert 1-5
T153,Melancholic,Sensitivity,I am not easily moved to tears by art or tragedy.,true,Likert 1-5
T154,Melancholic,Sensitivity,I forgive and forget betrayals very quickly.,true,Likert 1-5
T155,Melancholic,Sensitivity,"I prefer light, superficial conversations over deep philosophy.",true,Likert 1-5
T156,Melancholic,Sensitivity,I do not care much about the aesthetic design of things.,true,Likert 1-5
T157,Melancholic,Sensitivity,I rarely experience deep emotional highs or lows.,true,Likert 1-5
T158,Melancholic,Sensitivity,I am completely comfortable with my own flaws.,true,Likert 1-5
T159,Melancholic,Sensitivity,I act without overthinking the emotional consequences.,true,Likert 1-5
T160,Melancholic,Sensitivity,I rarely reflect on past events.,true,Likert 1-5
T161,Melancholic,Cautiousness,I anticipate what could go wrong before I make a decision.,false,Likert 1-5
T162,Melancholic,Cautiousness,I worry about things outside of my control.,false,Likert 1-5
T163,Melancholic,Cautiousness,I am very cautious when trusting new people.,false,Likert 1-5
T164,Melancholic,Cautiousness,I mentally rehearse conversations before they happen.,false,Likert 1-5
T165,Melancholic,Cautiousness,I find unexpected changes to my plans highly stressful.,false,Likert 1-5
T166,Melancholic,Cautiousness,I calculate all potential risks before taking action.,false,Likert 1-5
T167,Melancholic,Cautiousness,I prefer to have a backup plan for every scenario.,false,Likert 1-5
T168,Melancholic,Cautiousness,I often fear that my work is not perfect yet.,false,Likert 1-5
T169,Melancholic,Cautiousness,I need to know all the facts before giving an answer.,false,Likert 1-5
T170,Melancholic,Cautiousness,I am highly loyal to a small circle of trusted friends.,false,Likert 1-5
T171,Melancholic,Cautiousness,I rarely worry about what might happen tomorrow.,true,Likert 1-5
T172,Melancholic,Cautiousness,I trust people almost immediately upon meeting them.,true,Likert 1-5
T173,Melancholic,Cautiousness,I jump into new projects without considering the risks.,true,Likert 1-5
T174,Melancholic,Cautiousness,I easily adapt when my plans are ruined.,true,Likert 1-5
T175,Melancholic,Cautiousness,I never feel the need to create a backup plan.,true,Likert 1-5
T176,Melancholic,Cautiousness,I make important decisions based on my gut feeling.,true,Likert 1-5
T177,Melancholic,Cautiousness,I am not anxious about making mistakes.,true,Likert 1-5
T178,Melancholic,Cautiousness,I gladly embrace completely unknown situations.,true,Likert 1-5
T179,Melancholic,Cautiousness,I speak my mind instantly without practicing it first.,true,Likert 1-5
T180,Melancholic,Cautiousness,I have many acquaintances but few deep loyalties.,true,Likert 1-5
T181,Phlegmatic,Calmness,I am generally relaxed and unbothered by daily stress.,false,Likert 1-5
T182,Phlegmatic,Calmness,"I rarely lose my temper, even when provoked.",false,Likert 1-5
T183,Phlegmatic,Calmness,I maintain a steady mood throughout the day.,false,Likert 1-5
T184,Phlegmatic,Calmness,"I approach crises with a cool, level head.",false,Likert 1-5
T185,Phlegmatic,Calmness,"I am content with a simple, unhurried life.",false,Likert 1-5
T186,Phlegmatic,Calmness,I can easily brush off minor annoyances.,false,Likert 1-5
T187,Phlegmatic,Calmness,"I speak in a calm, soothing tone of voice.",false,Likert 1-5
T188,Phlegmatic,Calmness,"I fall asleep easily, without my mind racing.",false,Likert 1-5
T189,Phlegmatic,Calmness,I am rarely overwhelmed by my emotions.,false,Likert 1-5
T190,Phlegmatic,Calmness,I project a sense of peace to the people around me.,false,Likert 1-5
T191,Phlegmatic,Calmness,I get stressed out extremely easily.,true,Likert 1-5
T192,Phlegmatic,Calmness,I have a very short fuse when I am frustrated.,true,Likert 1-5
T193,Phlegmatic,Calmness,My moods fluctuate wildly from hour to hour.,true,Likert 1-5
T194,Phlegmatic,Calmness,I panic when faced with an unexpected emergency.,true,Likert 1-5
T195,Phlegmatic,Calmness,I am constantly fidgeting or feeling restless.,true,Likert 1-5
T196,Phlegmatic,Calmness,I let small irritations ruin my entire day.,true,Likert 1-5
T197,Phlegmatic,Calmness,I frequently yell when I am upset.,true,Likert 1-5
T198,Phlegmatic,Calmness,I lie awake at night due to anxiety.,true,Likert 1-5
T199,Phlegmatic,Calmness,I easily succumb to feelings of overwhelm.,true,Likert 1-5
T200,Phlegmatic,Calmness,"I radiate intense, chaotic energy.",true,Likert 1-5
T201,Phlegmatic,Cooperation,I prioritize keeping the peace over winning an argument.,false,Likert 1-5
T202,Phlegmatic,Cooperation,I am willing to compromise to make others happy.,false,Likert 1-5
T203,Phlegmatic,Cooperation,I act as a mediator when my friends are fighting.,false,Likert 1-5
T204,Phlegmatic,Cooperation,I naturally look for common ground in disagreements.,false,Likert 1-5
T205,Phlegmatic,Cooperation,I prefer to work cooperatively rather than competitively.,false,Likert 1-5
T206,Phlegmatic,Cooperation,I often let others choose what we do for fun.,false,Likert 1-5
T207,Phlegmatic,Cooperation,I am highly accommodating to the needs of my coworkers.,false,Likert 1-5
T208,Phlegmatic,Cooperation,"I dislike offending anyone, so I choose my words carefully.",false,Likert 1-5
T209,Phlegmatic,Cooperation,I am a loyal follower who supports the group's decisions.,false,Likert 1-5
T210,Phlegmatic,Cooperation,I find it easy to agree with others just to move forward.,false,Likert 1-5
T211,Phlegmatic,Cooperation,I will argue fiercely until my point is accepted.,true,Likert 1-5
T212,Phlegmatic,Cooperation,I refuse to compromise on my core beliefs.,true,Likert 1-5
T213,Phlegmatic,Cooperation,I enjoy playing devil's advocate to stir up debate.,true,Likert 1-5
T214,Phlegmatic,Cooperation,I avoid mediating other people's problems.,true,Likert 1-5
T215,Phlegmatic,Cooperation,I strongly prefer to work independently.,true,Likert 1-5
T216,Phlegmatic,Cooperation,I insist on doing things my way.,true,Likert 1-5
T217,Phlegmatic,Cooperation,I rarely change my mind just to please someone else.,true,Likert 1-5
T218,Phlegmatic,Cooperation,"I speak bluntly, regardless of who gets offended.",true,Likert 1-5
T219,Phlegmatic,Cooperation,I frequently challenge the consensus of the group.,true,Likert 1-5
T220,Phlegmatic,Cooperation,I see teamwork as a hindrance to my personal success.,true,Likert 1-5
T221,Phlegmatic,Empathy,I am a patient and attentive listener.,false,Likert 1-5
T222,Phlegmatic,Empathy,I naturally sympathize with the struggles of others.,false,Likert 1-5
T223,Phlegmatic,Empathy,I give people the benefit of the doubt.,false,Likert 1-5
T224,Phlegmatic,Empathy,"I am perfectly fine doing repetitive, steady tasks.",false,Likert 1-5
T225,Phlegmatic,Empathy,I offer a comforting presence to those in distress.,false,Likert 1-5
T226,Phlegmatic,Empathy,I accept people exactly as they are without trying to change them.,false,Likert 1-5
T227,Phlegmatic,Empathy,I am highly reliable when someone needs a favor.,false,Likert 1-5
T228,Phlegmatic,Empathy,I wait my turn patiently without complaining.,false,Likert 1-5
T229,Phlegmatic,Empathy,I value stability and consistency above excitement.,false,Likert 1-5
T230,Phlegmatic,Empathy,I am slow to judge the mistakes of others.,false,Likert 1-5
T231,Phlegmatic,Empathy,I frequently interrupt people when they are talking.,true,Likert 1-5
T232,Phlegmatic,Empathy,I feel little sympathy for people who bring trouble upon themselves.,true,Likert 1-5
T233,Phlegmatic,Empathy,I am highly suspicious of people's motives.,true,Likert 1-5
T234,Phlegmatic,Empathy,I become deeply frustrated if I have to repeat a task.,true,Likert 1-5
T235,Phlegmatic,Empathy,I avoid comforting emotional people.,true,Likert 1-5
T236,Phlegmatic,Empathy,I constantly try to fix or change the people around me.,true,Likert 1-5
T237,Phlegmatic,Empathy,I often fail to follow through on favors I promised.,true,Likert 1-5
T238,Phlegmatic,Empathy,I hate waiting in lines and will leave if it takes too long.,true,Likert 1-5
T239,Phlegmatic,Empathy,"I despise living a predictable, stable lifestyle.",true,Likert 1-5
T240,Phlegmatic,Empathy,I am quick to harshly criticize people who make errors.,true,Likert 1-5
`.trim();

const QUESTION_BANK_ROWS = parseQuestionBankCsv(QUESTION_BANK_CSV).map(
  ({
    id,
    temperament,
    dimension,
    item_text,
    reverse_scored,
    scoring_rule,
  }) => ({
    id,
    temperament,
    dimension,
    text: item_text,
    reverseScored: reverse_scored === "true",
    scoringRule: scoring_rule,
  }),
);

const QUESTION_BY_ID = QUESTION_BANK_ROWS.reduce((acc, question) => {
  acc[question.id] = question;
  return acc;
}, {});

const QUESTION_BANK_BY_TEMPERAMENT = TEMPERAMENTS.reduce((acc, temperament) => {
  acc[temperament] = QUESTION_BANK_ROWS.filter(
    (question) => question.temperament === temperament,
  );
  return acc;
}, {});

const QUESTION_BANK_BY_TEMPERAMENT_DIMENSION = TEMPERAMENTS.reduce(
  (acc, temperament) => {
    const byDimension = QUESTION_BANK_BY_TEMPERAMENT[temperament].reduce(
      (dimensionAcc, question) => {
        if (!dimensionAcc[question.dimension]) {
          dimensionAcc[question.dimension] = [];
        }
        dimensionAcc[question.dimension].push(question);
        return dimensionAcc;
      },
      {},
    );
    acc[temperament] = byDimension;
    return acc;
  },
  {},
);

validateQuestionBank(QUESTION_BANK_ROWS);

// ==========================================
// 3. APPLICATION STATE & DOM ELEMENTS
// ==========================================
const state = {
  selectedDepth: 20,
  questions: [],
  responses: {},
  currentPage: 0,
  detailVisible: false,
  startedAt: null,
  completionTracked: false,
  abandonmentTracked: false,
  resultMeta: null,
  shareUrl: null,
  sharedView: false,
};
const premiumState = {
  token: null,
  expiresAt: null,
};
const assistantState = {
  assistantOpen: false,
  messagesUsed: 0,
  activeMode: null,
  loading: false,
  history: [],
  /** Multi-turn chat history: array of {role, content} objects sent to /api/chat */
  chatHistory: [],
};
let assistantContext = null;
let temperamentDonutChart = null;

const introPanel = document.getElementById("intro-panel");
const assessmentPanel = document.getElementById("assessment-panel");
const resultsPanel = document.getElementById("results-panel");
const startButton = document.getElementById("start-btn");
const prevButton = document.getElementById("prev-btn");
const simulateButton = document.getElementById("simulate-btn");
const nextButton = document.getElementById("next-btn");
const questionPage = document.getElementById("question-page");
const progressHeading = document.getElementById("progress-heading");
const progressMeta = document.getElementById("progress-meta");
const progressFill = document.getElementById("progress-fill");
const progressTrack = document.querySelector(".progress-track");
const pageWarning = document.getElementById("page-warning");
const resultTitle = document.getElementById("result-title");
const resultName = document.getElementById("result-name");
const resultTagline = document.getElementById("result-tagline");
const resultProfileImage = document.getElementById("result-profile-image");
const resultProfileName = document.getElementById("result-profile-name");
const resultProfileSummary = document.getElementById("result-profile-summary");
const resultGrowth = document.getElementById("result-growth");
const resultShort = document.getElementById("result-short");
const resultConfidence = document.getElementById("result-confidence");
const primaryPercentLabel = document.getElementById("primary-percent-label");
const temperamentLegend = document.getElementById("temperament-legend");
const secondaryName = document.getElementById("secondary-name");
const secondaryDesc = document.getElementById("secondary-desc");
const secondaryTraits = document.getElementById("secondary-traits");
const commsPreferred = document.getElementById("comms-preferred");
const commsListener = document.getElementById("comms-listener");
const commsExpression = document.getElementById("comms-expression");
const commsPressure = document.getElementById("comms-pressure");
const scenarioPanels = [
  {
    card: document.getElementById("scenario-card-1"),
    title: document.getElementById("scenario-title-1"),
    body: document.getElementById("scenario-body-1"),
  },
  {
    card: document.getElementById("scenario-card-2"),
    title: document.getElementById("scenario-title-2"),
    body: document.getElementById("scenario-body-2"),
  },
  {
    card: document.getElementById("scenario-card-3"),
    title: document.getElementById("scenario-title-3"),
    body: document.getElementById("scenario-body-3"),
  },
];
const confidenceTitle = document.getElementById("confidence-title");
const confidenceMessage = document.getElementById("confidence-message");
const confidencePercent = document.getElementById("confidence-percent");
const confidenceLabel = document.getElementById("confidence-label");
const confidenceRing = document.getElementById("confidence-ring");
const detailToggle = document.getElementById("detail-toggle");
const resultDetail = document.getElementById("result-detail");
const detailStrengths = document.getElementById("detail-strengths");
const detailWeaknesses = document.getElementById("detail-weaknesses");
const detailCommunication = document.getElementById("detail-communication");
const copySummaryBtn = document.getElementById("copy-summary-btn");
const copyLinkBtn = document.getElementById("copy-link-btn");
const shareCardBtn = document.getElementById("share-card-btn");
const shareCardPreview = document.getElementById("share-card-preview");
const shareCardCanvas = document.getElementById("share-card-canvas");
const downloadCardBtn = document.getElementById("download-card-btn");
const downloadCardPdfBtn = document.getElementById("download-card-pdf-btn");
const shareCardNativeBtn = document.getElementById("share-card-native-btn");
const assistantGuide = document.getElementById("assistant-guide");
const assistantOpenBtn = document.getElementById("assistant-open-btn");
const chatModal = document.getElementById("chat-modal");
const chatModalCloseBtn = document.getElementById("chat-modal-close");
const chatFab = document.getElementById("chat-fab");
const chatFabIconChat = chatFab ? chatFab.querySelector(".chat-fab-icon--chat") : null;
const chatFabIconClose = chatFab ? chatFab.querySelector(".chat-fab-icon--close") : null;
const assistantCounter = document.getElementById("assistant-counter");
const assistantStatus = document.getElementById("assistant-status");
const assistantError = document.getElementById("assistant-error");
const assistantModeGroup = document.getElementById("assistant-mode-group");
const assistantModeButtons = Array.from(
  document.querySelectorAll(".assistant-mode-btn"),
);
const assistantLimit = document.getElementById("assistant-limit");
const assistantHistory = document.getElementById("assistant-history");
const chatInput = document.getElementById("chat-input");
const chatSendBtn = document.getElementById("chat-send-btn");
const paywallOverlay = document.getElementById("paywall-overlay");
const paywallModal = document.getElementById("paywall-modal");
const paywallUnlockBtn = document.getElementById("paywall-unlock-btn");
const paywallCloseBtn = document.getElementById("paywall-close");
const paywallStatus = document.getElementById("paywall-status");
const paywallError = document.getElementById("paywall-error");
const paywallSpinner = document.getElementById("paywall-spinner");

// ==========================================
// 4. INITIALIZATION & EVENT LISTENERS
// ==========================================
startButton.addEventListener("click", startAssessment);
prevButton.addEventListener("click", goToPreviousPage);
if (simulateButton) {
  simulateButton.addEventListener("click", simulateAssessmentForResults);
}
nextButton.addEventListener("click", goToNextPage);
detailToggle.addEventListener("click", toggleDetailView);
if (copySummaryBtn) copySummaryBtn.addEventListener("click", copyResultSummary);
if (copyLinkBtn) copyLinkBtn.addEventListener("click", copyShareLink);
if (shareCardBtn) shareCardBtn.addEventListener("click", generateShareCard);
if (downloadCardBtn)
  downloadCardBtn.addEventListener("click", () =>
    downloadCanvasPNG(shareCardCanvas, "Temperament-Insight-Result.png"),
  );
if (downloadCardPdfBtn)
  downloadCardPdfBtn.addEventListener("click", openPrintableReport);
if (shareCardNativeBtn) {
  if (navigator.share) {
    shareCardNativeBtn.addEventListener("click", () =>
      shareCanvasImage(shareCardCanvas),
    );
  } else {
    shareCardNativeBtn.style.display = "none";
  }
}
loadPremiumTokenFromStorage();
initAssistantUI();
initChatFab();
initPaywallUI();
window.addEventListener("pagehide", handlePageHide);

// Entry point behavior
if (window.location.hash.startsWith("#result=")) {
  const token = window.location.hash.replace("#result=", "");
  const payload = decodeSharePayload(token);
  if (payload) {
    state.sharedView = true;
    renderSharedResults(payload);
  } else {
    // Fail silently on invalid/tampered token and fall back
    window.location.hash = "";
    restoreProgressIfAvailable();
  }
} else {
  restoreProgressIfAvailable();
}

// ==========================================
// 5. CORE ASSESSMENT FLOW & LOGIC
// ==========================================
function startAssessment() {
  const selectedDepthInput = document.querySelector(
    'input[name="depth"]:checked',
  );
  state.selectedDepth = Number(selectedDepthInput.value);
  state.questions = buildQuestionSet(state.selectedDepth);
  state.responses = {};
  state.currentPage = 0;
  state.detailVisible = false;
  state.startedAt = Date.now();
  state.completionTracked = false;
  state.abandonmentTracked = false;
  state.resultMeta = null;
  setAssistantContext(null);
  resetAssistantSession();

  clearProgress(); // Destroy timers, instances, and storage before restarting

  introPanel.classList.add("hidden");
  resultsPanel.classList.add("hidden");
  assessmentPanel.classList.remove("hidden");

  trackEvent(ANALYTICS_EVENTS.assessmentStarted, {
    depth: state.selectedDepth,
  });
  renderCurrentPage();
  saveProgress();
  scrollToPanel(assessmentPanel, "smooth");
}

function buildQuestionSet(depth, questionOrder) {
  if (isValidSavedQuestionOrder(questionOrder, depth)) {
    return questionOrder.map((questionId, index) => ({
      ...QUESTION_BY_ID[questionId],
      ordinal: index + 1,
    }));
  }

  const perTemperament = depth / TEMPERAMENTS.length;
  const selectedQuestions = TEMPERAMENTS.flatMap((temperament) =>
    sampleBalancedQuestions(temperament, perTemperament),
  );
  const arrangedQuestions = shuffleArray(selectedQuestions);

  return arrangedQuestions.map((question, index) => ({
    ...question,
    ordinal: index + 1,
  }));
}

function isValidSavedQuestionOrder(questionOrder, depth) {
  if (!Array.isArray(questionOrder) || questionOrder.length !== depth) {
    return false;
  }

  const seen = new Set();
  for (const questionId of questionOrder) {
    if (seen.has(questionId) || !QUESTION_BY_ID[questionId]) {
      return false;
    }
    seen.add(questionId);
  }
  return true;
}

function sampleBalancedQuestions(temperament, perTemperament) {
  const byDimension = QUESTION_BANK_BY_TEMPERAMENT_DIMENSION[temperament];
  const dimensions = shuffleArray(Object.keys(byDimension));
  const base = Math.floor(perTemperament / dimensions.length);
  const remainder = perTemperament % dimensions.length;
  const picks = [];

  dimensions.forEach((dimension, index) => {
    const required = base + (index < remainder ? 1 : 0);
    const pool = byDimension[dimension] || [];
    if (pool.length < required) {
      throw new Error(
        `Question bank underflow for ${temperament}/${dimension}: needed ${required}, found ${pool.length}.`,
      );
    }

    picks.push(...shuffleArray(pool).slice(0, required));
  });

  return picks;
}

function validateQuestionBank(questionBankRows) {
  if (questionBankRows.length !== 240) {
    throw new Error(
      `Question bank must contain exactly 240 items, found ${questionBankRows.length}.`,
    );
  }

  const seenIds = new Set();
  const temperamentCounts = TEMPERAMENTS.reduce((acc, temperament) => {
    acc[temperament] = 0;
    return acc;
  }, {});
  const dimensionCounts = TEMPERAMENTS.reduce((acc, temperament) => {
    acc[temperament] = {};
    return acc;
  }, {});

  questionBankRows.forEach((question) => {
    if (seenIds.has(question.id)) {
      throw new Error(`Duplicate question id detected: ${question.id}`);
    }
    seenIds.add(question.id);

    if (!TEMPERAMENTS.includes(question.temperament)) {
      throw new Error(
        `Invalid temperament '${question.temperament}' for question ${question.id}.`,
      );
    }
    if (typeof question.reverseScored !== "boolean") {
      throw new Error(
        `Invalid reverseScored value for question ${question.id}; expected boolean.`,
      );
    }
    if (question.scoringRule !== "Likert 1-5") {
      throw new Error(
        `Invalid scoring rule for question ${question.id}; expected 'Likert 1-5'.`,
      );
    }

    temperamentCounts[question.temperament] += 1;
    const tempDimensionCounts = dimensionCounts[question.temperament];
    tempDimensionCounts[question.dimension] =
      (tempDimensionCounts[question.dimension] || 0) + 1;
  });

  for (let i = 1; i <= 240; i += 1) {
    const expectedId = `T${String(i).padStart(3, "0")}`;
    if (!seenIds.has(expectedId)) {
      throw new Error(`Missing expected question id: ${expectedId}`);
    }
  }

  TEMPERAMENTS.forEach((temperament) => {
    if (temperamentCounts[temperament] !== 60) {
      throw new Error(
        `${temperament} must have exactly 60 items, found ${temperamentCounts[temperament]}.`,
      );
    }

    const temperamentDimensions = dimensionCounts[temperament];
    const dimensionNames = Object.keys(temperamentDimensions);
    if (dimensionNames.length !== 3) {
      throw new Error(
        `${temperament} must have exactly 3 dimensions, found ${dimensionNames.length}.`,
      );
    }

    dimensionNames.forEach((dimension) => {
      if (temperamentDimensions[dimension] !== 20) {
        throw new Error(
          `${temperament}/${dimension} must have 20 items, found ${temperamentDimensions[dimension]}.`,
        );
      }
    });
  });
}

function parseQuestionBankCsv(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  const expectedHeaders = [
    "id",
    "temperament",
    "dimension",
    "item_text",
    "reverse_scored",
    "scoring_rule",
  ];
  const hasExpectedHeaders =
    headers.length === expectedHeaders.length &&
    headers.every((header, index) => header === expectedHeaders[index]);
  if (!hasExpectedHeaders) {
    throw new Error("Question bank CSV headers are invalid.");
  }

  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    if (values.length !== headers.length) {
      throw new Error(
        `Invalid CSV row at line ${index + 2}: expected ${headers.length} fields, found ${values.length}.`,
      );
    }

    return headers.reduce((acc, header, fieldIndex) => {
      acc[header] = values[fieldIndex];
      return acc;
    }, {});
  });
}

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  fields.push(current);
  return fields;
}

function shuffleArray(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[randomIndex]] = [copy[randomIndex], copy[i]];
  }
  return copy;
}

function renderCurrentPage() {
  const total = state.questions.length;
  const pageCount = Math.ceil(total / PAGE_SIZE);
  const startIndex = state.currentPage * PAGE_SIZE;
  const pageQuestions = state.questions.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );
  const answered = Object.keys(state.responses).length;
  const percent = Math.round((answered / total) * 100);
  const pageStart = startIndex + 1;
  const pageEnd = Math.min(startIndex + PAGE_SIZE, total);

  progressHeading.textContent = `Questions ${pageStart}-${pageEnd} of ${total}`;
  progressMeta.textContent = `Answered ${answered} of ${total} | Page ${state.currentPage + 1
    } of ${pageCount}`;
  progressFill.style.width = `${percent}%`;
  progressTrack.setAttribute("aria-valuenow", `${percent}`);

  questionPage.innerHTML = pageQuestions
    .map((question) => {
      const labels = getScaleLabels(question.scoringRule);
      const currentValue = state.responses[question.id] || 3;
      const hasResponse = !!state.responses[question.id];
      const thumbScale = 1 + Math.abs(currentValue - 3) * 0.15;

      return `
        <article class="question-card">
          <div class="question-top">
            <span class="question-type">${question.dimension}</span>
            <span>Q${question.ordinal}</span>
          </div>
          <p class="question-text">${question.text}</p>
          
          <div class="slider-box">
             <div class="slider-label-display" id="label-val-${question.id}">
                ${hasResponse ? labels[currentValue - 1] : '<span class="prompt">Slide to select</span>'}
             </div>
             <input 
               type="range" 
               class="question-range" 
               name="${question.id}" 
               min="1" 
               max="5" 
               step="1" 
               value="${currentValue}"
               data-answered="${hasResponse}"
               style="--thumb-scale: ${thumbScale}"
             />
             <div class="slider-extremes">
               <span>${labels[0]}</span>
               <span>${labels[4]}</span>
             </div>
          </div>
        </article>
      `;
    })
    .join("");

  bindQuestionListeners();
  prevButton.disabled = state.currentPage === 0;
  nextButton.disabled = false;
  nextButton.textContent =
    state.currentPage === pageCount - 1 ? "View Results" : "Next";
  updateSimulationButtonState();
  pageWarning.classList.add("hidden");

  trackEvent(ANALYTICS_EVENTS.assessmentPageViewed, {
    depth: state.selectedDepth,
    page_index: state.currentPage + 1,
  });
}

function bindQuestionListeners() {
  questionPage.querySelectorAll(".question-range").forEach((input) => {
    const questionId = input.name;
    const question = state.questions.find((q) => q.id === questionId);
    const labels = getScaleLabels(question.scoringRule);
    const labelDisplay = document.getElementById(`label-val-${questionId}`);

    const updateValue = (val) => {
      let numVal = Number(val);
      if (Number.isNaN(numVal) || numVal < 1 || numVal > 5) {
        numVal = 3;
      }
      state.responses[questionId] = numVal;
      labelDisplay.textContent = labels[numVal - 1];
      input.setAttribute("data-answered", "true");
      input.value = numVal;
      const scale = 1 + Math.abs(numVal - 3) * 0.15;
      input.style.setProperty("--thumb-scale", scale);
      pageWarning.classList.add("hidden");
      syncProgressOnly();
      debounceSaveProgress();
    };

    input.addEventListener("input", (event) => {
      const val = event.target.value;
      labelDisplay.textContent = labels[val - 1];
      const scale = 1 + Math.abs(val - 3) * 0.15;
      input.style.setProperty("--thumb-scale", scale);
    });

    input.addEventListener("change", (event) => {
      updateValue(event.target.value);
    });

    // Handle clicks/touches that don't trigger "change" if the value stays the same but user intent was to select
    input.addEventListener("mousedown", () => {
      if (input.getAttribute("data-answered") === "false") {
        updateValue(input.value);
      }
    });
    input.addEventListener("touchstart", () => {
      if (input.getAttribute("data-answered") === "false") {
        updateValue(input.value);
      }
    });
  });
}

function syncProgressOnly() {
  const answered = Object.keys(state.responses).length;
  const total = state.questions.length;
  const percent = Math.round((answered / total) * 100);
  progressMeta.textContent = progressMeta.textContent.replace(
    /Answered \d+ of \d+/,
    `Answered ${answered} of ${total}`,
  );
  progressFill.style.width = `${percent}%`;
  progressTrack.setAttribute("aria-valuenow", `${percent}`);
}

function goToPreviousPage() {
  if (state.currentPage === 0) {
    return;
  }
  state.currentPage -= 1;
  saveProgress();
  renderCurrentPage();
  scrollToPanel(assessmentPanel, "smooth");
}

function simulateAssessmentForResults() {
  if (state.selectedDepth !== 20 || !state.questions.length) {
    return;
  }

  const dominant =
    TEMPERAMENTS[Math.floor(Math.random() * TEMPERAMENTS.length)];
  const secondaryPool = TEMPERAMENTS.filter(
    (temperament) => temperament !== dominant,
  );
  const secondary =
    secondaryPool[Math.floor(Math.random() * secondaryPool.length)];

  state.questions.forEach((question) => {
    state.responses[question.id] = getSimulatedResponseValue(
      question,
      dominant,
      secondary,
    );
  });

  saveProgress();
  syncProgressOnly();
  const outcome = scoreAssessment();
  renderResults(outcome);
}

function goToNextPage() {
  if (!isCurrentPageComplete()) {
    pageWarning.classList.remove("hidden");
    return;
  }

  const totalPages = Math.ceil(state.questions.length / PAGE_SIZE);
  if (state.currentPage < totalPages - 1) {
    state.currentPage += 1;
    saveProgress();
    renderCurrentPage();
    scrollToPanel(assessmentPanel, "smooth");
    return;
  }

  const outcome = scoreAssessment();
  renderResults(outcome);
}

function isCurrentPageComplete() {
  const startIndex = state.currentPage * PAGE_SIZE;
  const pageQuestions = state.questions.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );
  return pageQuestions.every((question) => state.responses[question.id]);
}

// ==========================================
// 6. SCORING & RESULTS RENDERING
// ==========================================
function scoreAssessment() {
  const scores = TEMPERAMENTS.reduce((acc, temperament) => {
    acc[temperament] = 0;
    return acc;
  }, {});
  const signal = TEMPERAMENTS.reduce((acc, temperament) => {
    acc[temperament] = 0;
    return acc;
  }, {});

  state.questions.forEach((question) => {
    const value = state.responses[question.id] || 3;
    const centered = toCenteredValue(value);
    const signed = question.reverseScored ? -centered : centered;
    scores[question.temperament] += signed;
    signal[question.temperament] += Math.abs(signed);
  });

  const ranked = TEMPERAMENTS.map((temperament) => ({
    temperament,
    score: scores[temperament],
    signal: signal[temperament],
  })).sort((a, b) => {
    if (b.score === a.score) {
      if (b.signal === a.signal) {
        return (
          TEMPERAMENTS.indexOf(a.temperament) -
          TEMPERAMENTS.indexOf(b.temperament)
        );
      }
      return b.signal - a.signal;
    }
    return b.score - a.score;
  });

  const topGap = ranked[0].score - ranked[1].score;
  const confidence = getConfidenceLevel(topGap, state.selectedDepth);

  return {
    primary: ranked[0].temperament,
    secondary: ranked[1].temperament,
    confidence,
    ranked,
  };
}

function renderResults({ primary, secondary, confidence, ranked }) {
  assessmentPanel.classList.add("hidden");
  resultsPanel.classList.remove("hidden");

  const primaryProfile = TEMPERAMENT_PROFILES[primary];
  const secondaryProfile = TEMPERAMENT_PROFILES[secondary];
  const primaryVisual = TEMPERAMENT_VISUALS[primary];
  const secondaryVisual = TEMPERAMENT_VISUALS[secondary];
  const communicationProfile = TEMPERAMENT_COMMS[primary];
  const mixPercentages = buildTemperamentMixPercentages(ranked);
  const confidenceLevel = normalizeConfidenceLevel(confidence.level);
  const confidencePercentValue = getConfidencePercent(confidenceLevel);
  const durationSeconds = getDurationSeconds(state.startedAt);

  state.resultMeta = {
    primary,
    secondary,
    confidenceLevel,
  };
  state.completionTracked = true;
  state.abandonmentTracked = false;

  const sharePayload = {
    v: 1,
    p: primary,
    s: secondary,
    c: confidence.level.toLowerCase(),
    mix: {
      sanguine: mixPercentages["Sanguine"],
      choleric: mixPercentages["Choleric"],
      melancholic: mixPercentages["Melancholic"],
      phlegmatic: mixPercentages["Phlegmatic"],
    },
  };
  state.shareUrl = encodeSharePayload(sharePayload);

  resultName.textContent = primary;
  resultTagline.textContent = primaryVisual.tagline;
  resultTitle.textContent = `${primary} is your primary temperament, with ${secondary} as secondary influence.`;
  resultShort.textContent = `${primaryProfile.short} A secondary ${secondary.toLowerCase()} influence may add ${secondaryProfile.strengthFocus}.`;
  resultConfidence.textContent = `${confidence.level} confidence result`;

  resultProfileImage.src = primaryVisual.image;
  resultProfileImage.alt = `${primary} profile`;
  resultProfileName.textContent = primary;
  resultProfileSummary.textContent = primaryProfile.short;
  resultGrowth.textContent = `Practice focus: ${primaryProfile.challengeFocus}. Secondary ${secondary.toLowerCase()} influence may add ${secondaryProfile.strengthFocus}.`;

  const strengths = [...primaryProfile.strengths];
  strengths.push(`Secondary influence: ${secondaryProfile.strengthFocus}.`);

  const weaknesses = [...primaryProfile.weaknesses];
  weaknesses.push(`Possible watch-out: ${secondaryProfile.challengeFocus}.`);

  detailStrengths.innerHTML = strengths
    .map((item) => `<li>${item}</li>`)
    .join("");
  detailWeaknesses.innerHTML = weaknesses
    .map((item) => `<li>${item}</li>`)
    .join("");
  detailCommunication.textContent = `${primaryProfile.communication} Secondary ${secondary.toLowerCase()} influence may also shape tone and pace in conversations.`;
  secondaryName.textContent = secondary;
  secondaryDesc.textContent = secondaryProfile.short;
  secondaryTraits.textContent = secondaryVisual.traits;

  commsPreferred.textContent = communicationProfile.preferred;
  commsListener.textContent = communicationProfile.listener;
  commsExpression.textContent = communicationProfile.expression;
  commsPressure.textContent = communicationProfile.pressure;

  confidenceTitle.textContent = `${confidence.level} Confidence`;
  confidenceMessage.textContent = confidence.message;
  confidencePercent.textContent = `${confidencePercentValue}%`;
  confidenceLabel.textContent = confidenceLevel;
  confidenceRing.style.setProperty("--confidence-fill", confidencePercentValue);
  primaryPercentLabel.textContent = `${mixPercentages[primary]}%`;
  const mixDisplayOrder = getTemperamentDisplayOrder(mixPercentages, ranked);
  renderTemperamentLegend(mixPercentages, mixDisplayOrder);
  renderTemperamentDonut(mixPercentages, mixDisplayOrder);
  renderScoreBars(mixPercentages, ranked);
  renderScenarioPanels(primary, secondary);
  setAssistantContext({
    primary,
    secondary,
    confidence: confidenceLevel,
    mix: {
      sanguine: mixPercentages.Sanguine,
      choleric: mixPercentages.Choleric,
      melancholic: mixPercentages.Melancholic,
      phlegmatic: mixPercentages.Phlegmatic,
    },
  });
  resetAssistantSession();

  state.detailVisible = false;
  resultDetail.classList.add("hidden");
  detailToggle.textContent = "Show Detailed Explanation";

  trackEvent(ANALYTICS_EVENTS.assessmentCompleted, {
    depth: state.selectedDepth,
    duration_seconds: durationSeconds,
    confidence_level: confidenceLevel,
    time_to_complete: durationSeconds,
  });
  clearProgress();
  scrollToPanel(resultsPanel, "smooth");

  let confidenceTooltipTracked = false;
  const trackConfidenceInteraction = () => {
    if (!confidenceTooltipTracked) {
      trackEvent("confidence_tooltip_viewed");
      confidenceTooltipTracked = true;
    }
  };
  confidenceRing.addEventListener("mouseenter", trackConfidenceInteraction);
  confidenceRing.addEventListener("click", trackConfidenceInteraction);
}

function toggleDetailView() {
  state.detailVisible = !state.detailVisible;
  resultDetail.classList.toggle("hidden", !state.detailVisible);
  detailToggle.textContent = state.detailVisible
    ? "Hide Detailed Explanation"
    : "Show Detailed Explanation";

  if (state.detailVisible && state.resultMeta?.primary) {
    trackEvent(ANALYTICS_EVENTS.detailViewOpened, {
      primary_temperament: state.resultMeta.primary,
    });
  }
}

function initPaywallUI() {
  if (paywallUnlockBtn) {
    paywallUnlockBtn.addEventListener("click", startPaystackCheckout);
  }
  if (paywallCloseBtn) {
    paywallCloseBtn.addEventListener("click", closePaywallModal);
  }
  if (paywallOverlay) {
    paywallOverlay.addEventListener("click", (event) => {
      if (event.target === paywallOverlay) {
        closePaywallModal();
      }
    });
  }
}

function initAssistantUI() {
  if (!chatModal) {
    return;
  }

  // Inline CTA "Open Chat" button in results section
  if (assistantOpenBtn) {
    assistantOpenBtn.addEventListener("click", openChatModal);
  }

  // Modal close button (✕ in header)
  if (chatModalCloseBtn) {
    chatModalCloseBtn.addEventListener("click", closeChatModal);
  }

  assistantModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.mode || "";
      if (mode) {
        trackEvent("ai_prompt_sent", { type: "quick_start", mode: mode });
        prefillChatFromMode(mode);
      }
    });
  });

  if (chatSendBtn) {
    chatSendBtn.addEventListener("click", () => {
      const text = chatInput ? chatInput.value.trim() : "";
      if (text) handleChatSubmit(text);
    });
  }

  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (text) handleChatSubmit(text);
      }
    });
  }

  resetAssistantSession();
}

function setAssistantContext(context) {
  if (!context) {
    assistantContext = null;
    return;
  }

  assistantContext = {
    primary: context.primary,
    secondary: context.secondary,
    confidence: context.confidence,
    mix: {
      sanguine: Number(context.mix.sanguine),
      choleric: Number(context.mix.choleric),
      melancholic: Number(context.mix.melancholic),
      phlegmatic: Number(context.mix.phlegmatic),
    },
  };
}

function resetAssistantSession() {
  assistantState.assistantOpen = false;
  assistantState.messagesUsed = 0;
  assistantState.activeMode = null;
  assistantState.loading = false;
  assistantState.history = [];
  assistantState.chatHistory = [];

  if (assistantHistory) {
    assistantHistory.innerHTML = "";
  }
  if (chatInput) {
    chatInput.value = "";
  }
  clearAssistantStatus();
  clearAssistantError();
  renderAssistantShell();
}

function openAssistant() {
  assistantState.assistantOpen = true;
  renderAssistantShell();
}

function openPaywallModal() {
  if (paywallOverlay) {
    paywallOverlay.classList.remove("hidden");
  }
  if (paywallModal) {
    paywallModal.classList.remove("hidden");
  }
  setPaywallStatus("");
  clearPaywallError();
  setPaywallLoading(false);
  trackEvent("paywall_viewed");
}

function closePaywallModal() {
  if (paywallModal) paywallModal.classList.add("hidden");
  if (paywallOverlay) paywallOverlay.classList.add("hidden");
}

function setPaywallStatus(message, isLoading = false) {
  if (!paywallStatus) return;
  if (message) {
    paywallStatus.textContent = message;
    paywallStatus.classList.remove("hidden");
  } else {
    paywallStatus.textContent = "";
    paywallStatus.classList.add("hidden");
  }
  setPaywallLoading(isLoading);
}

function setPaywallLoading(isLoading) {
  if (paywallSpinner) {
    paywallSpinner.classList.toggle("hidden", !isLoading);
  }
  if (paywallUnlockBtn) {
    paywallUnlockBtn.disabled = isLoading;
    paywallUnlockBtn.textContent = isLoading ? "Processing…" : "Unlock now";
  }
}

function showPaywallError(message) {
  if (!paywallError) return;
  paywallError.textContent = message;
  paywallError.classList.remove("hidden");
}

function clearPaywallError() {
  if (!paywallError) return;
  paywallError.textContent = "";
  paywallError.classList.add("hidden");
}

async function startPaystackCheckout() {
  clearPaywallError();
  setPaywallStatus("Preparing secure checkout…", true);

  let config;
  try {
    const response = await fetch("/api/paywall-config");
    const json = await response.json();
    if (!response.ok || json?.ok !== true) {
      throw new Error("config");
    }
    config = json.data;
  } catch (_error) {
    setPaywallStatus("", false);
    showPaywallError("Could not load payment config. Please try again.");
    return;
  }

  if (typeof window === "undefined" || !window.PaystackPop) {
    setPaywallStatus("", false);
    showPaywallError("Paystack script not loaded. Check your connection and retry.");
    return;
  }

  setPaywallStatus("", false);
  trackEvent("checkout_started");

  const email = state.resultMeta?.email || "guest@temperament.app";
  const paystack = new window.PaystackPop();
  paystack.newTransaction({
    key: config.publicKey,
    email,
    amount: config.amount || PAYWALL_AMOUNT_KOBO,
    currency: config.currency || PAYWALL_CURRENCY,
    metadata: {
      session_id: cryptoRandom(),
    },
    onSuccess: (res) => {
      verifyPaymentReference(res.reference);
    },
    onCancel: () => {
      setPaywallStatus("", false);
      showPaywallError("Payment was cancelled. You can try again anytime.");
    },
  });
}

async function verifyPaymentReference(reference) {
  setPaywallStatus("Verifying payment…", true);
  clearPaywallError();
  try {
    const response = await fetch("/api/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    });
    const json = await safeReadJson(response);
    if (json?.ok === true && typeof json.token === "string") {
      savePremiumToken(json.token, json.expires_at);
      setPaywallStatus("Payment confirmed! Unlocking chat…", false);
      trackEvent("payment_successful");
      closePaywallModal();
      openChatModalUnlocked();
      return;
    }
    const message =
      (json && json.error && json.error.message) ||
      "We could not verify this payment. Please try again.";
    showPaywallError(message);
  } catch (_error) {
    showPaywallError("Network error verifying payment. Please retry.");
  } finally {
    setPaywallLoading(false);
  }
}

function cryptoRandom() {
  try {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    if (window.crypto && window.crypto.getRandomValues) {
      const buf = new Uint32Array(4);
      window.crypto.getRandomValues(buf);
      return Array.from(buf).map((b) => b.toString(16)).join("-");
    }
  } catch (_error) {
    // ignore
  }
  return String(Date.now());
}

function openChatModal() {
  if (!hasPremiumAccess()) {
    openPaywallModal();
    return;
  }
  openChatModalUnlocked();
}

function openChatModalUnlocked() {
  assistantState.assistantOpen = true;
  if (chatModal) chatModal.classList.remove("hidden");
  if (chatFab) chatFab.classList.add("chat-fab--open");
  if (chatFabIconChat) chatFabIconChat.classList.add("hidden");
  if (chatFabIconClose) chatFabIconClose.classList.remove("hidden");
  renderAssistantShell();
  trackEvent("ai_chat_opened");
  // Focus the input for immediate typing
  if (chatInput) setTimeout(() => chatInput.focus(), 100);
}

function closeChatModal() {
  if (chatModal) chatModal.classList.add("hidden");
  if (chatFab) chatFab.classList.remove("chat-fab--open");
  if (chatFabIconChat) chatFabIconChat.classList.remove("hidden");
  if (chatFabIconClose) chatFabIconClose.classList.add("hidden");
}

function renderAssistantShell() {
  if (!chatModal) {
    return;
  }

  renderAssistantCounter();
  renderLimitState();
  renderAssistantHistory();
  setAssistantButtonsDisabled(
    assistantState.loading || assistantState.messagesUsed >= ASSISTANT_MAX_MESSAGES,
  );
}

/**
 * Pre-fills the chat textarea with a mode-specific starter prompt.
 * The user can edit it before sending.
 */
function prefillChatFromMode(mode) {
  if (!chatInput) return;
  const starter = ASSISTANT_MODE_STARTERS[mode] || mode;
  chatInput.value = starter;
  chatInput.focus();
}

/**
 * Main chat submit handler — called when the user presses Send or Enter.
 */
async function handleChatSubmit(text) {
  if (!text || assistantState.loading || assistantState.messagesUsed >= ASSISTANT_MAX_MESSAGES) {
    return;
  }

  if (!hasPremiumAccess()) {
    openPaywallModal();
    return;
  }

  if (!assistantContext) {
    showAssistantError("unexpected");
    return;
  }

  clearAssistantError();

  // Clear the input immediately
  if (chatInput) chatInput.value = "";

  // Append the user turn to chatHistory and render it
  assistantState.chatHistory.push({ role: "user", content: text });
  renderChatHistory();
  scrollChatToBottom();

  trackEvent("ai_prompt_sent", { type: "free_text" });

  setAssistantLoading(true, "Thinking…");

  try {
    const result = await postChatMessage(assistantContext, assistantState.chatHistory);

    if (result.ok) {
      const aiContent = result.data.body;
      assistantState.chatHistory.push({ role: "assistant", content: aiContent });
      assistantState.messagesUsed += 1;
      renderChatHistory();
      scrollChatToBottom();
      renderAssistantCounter();
      renderLimitState();
      return;
    }

    // On API error, roll back the user turn so history stays in sync
    assistantState.chatHistory.pop();
    renderChatHistory();
    showAssistantError(mapAssistantErrorType(result.error.code));
  } catch (_error) {
    assistantState.chatHistory.pop();
    renderChatHistory();
    showAssistantError("network");
  } finally {
    setAssistantLoading(false);
  }
}

/**
 * Legacy mode-selection handler kept for any residual callers.
 * Redirects to prefill for consistency.
 */
function handleModeSelection(mode) {
  prefillChatFromMode(mode);
}

function setAssistantLoading(isLoading, message = "Thinking thoughtfully...") {
  assistantState.loading = isLoading;

  if (isLoading) {
    if (assistantStatus) {
      assistantStatus.textContent = message;
      assistantStatus.dataset.loading = "true";
      assistantStatus.classList.remove("hidden");
    }
    setAssistantButtonsDisabled(true);
    return;
  }

  clearAssistantStatus();
  setAssistantButtonsDisabled(assistantState.messagesUsed >= ASSISTANT_MAX_MESSAGES);
}

function setAssistantButtonsDisabled(disabled) {
  assistantModeButtons.forEach((button) => {
    button.disabled = disabled;
  });
  if (chatSendBtn) chatSendBtn.disabled = disabled;
  if (chatInput) chatInput.disabled = disabled;
}

async function postAssistantReflection(mode, context) {
  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), ASSISTANT_API_TIMEOUT_MS)
    : null;

  try {
    const response = await fetch(ASSISTANT_REFLECT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(premiumState.token ? { Authorization: `Bearer ${premiumState.token}` } : {}),
      },
      body: JSON.stringify({ mode, context }),
      signal: controller ? controller.signal : undefined,
    });

    const payload = await safeReadJson(response);
    if (payload?.ok === true) {
      const normalized = normalizeAssistantSuccess(mode, payload.data);
      if (normalized) {
        return { ok: true, data: normalized };
      }
      return {
        ok: false,
        error: {
          code: "UPSTREAM_ERROR",
          message: "The reflection response was not in the expected format.",
        },
      };
    }

    return {
      ok: false,
      error: normalizeAssistantError(response.status, payload),
    };
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * POST the full conversation history to /api/chat and return the AI reply.
 */
async function postChatMessage(context, chatHistory) {
  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), ASSISTANT_API_TIMEOUT_MS)
    : null;

  try {
    const response = await fetch(ASSISTANT_CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(premiumState.token ? { Authorization: `Bearer ${premiumState.token}` } : {}),
      },
      body: JSON.stringify({ context, history: chatHistory }),
      signal: controller ? controller.signal : undefined,
    });

    const payload = await safeReadJson(response);

    if (payload?.ok === true && typeof payload.data?.body === "string") {
      return { ok: true, data: { body: normalizeSpaces(payload.data.body) } };
    }

    return {
      ok: false,
      error: normalizeAssistantError(response.status, payload),
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function safeReadJson(response) {
  try {
    return await response.json();
  } catch (_error) {
    return null;
  }
}

function normalizeAssistantSuccess(mode, data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  const rawBody = data.body;
  if (typeof rawBody !== "string") {
    return null;
  }
  const body = normalizeSpaces(rawBody);
  if (!body) {
    return null;
  }

  const rawTitle = data.title;
  const title =
    typeof rawTitle === "string" && rawTitle.trim()
      ? normalizeSpaces(rawTitle)
      : mode;

  const suggested =
    Array.isArray(data.suggested_next) && data.suggested_next.length
      ? data.suggested_next
        .filter((item) => typeof item === "string")
        .map((item) => normalizeSpaces(item))
        .filter(Boolean)
        .slice(0, 3)
      : [];

  return {
    mode,
    title,
    body,
    suggested_next: suggested.length ? suggested : undefined,
  };
}

function normalizeAssistantError(status, payload) {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const error = payload.error;
    if (
      payload.ok === false &&
      error &&
      typeof error === "object" &&
      !Array.isArray(error)
    ) {
      const code = normalizeAssistantErrorCode(error.code);
      const message =
        typeof error.message === "string" ? normalizeSpaces(error.message) : "";
      return { code, message };
    }
  }

  if (status === 429) {
    return { code: "RATE_LIMITED", message: "" };
  }
  if (status === 400 || status === 405) {
    return { code: "BAD_REQUEST", message: "" };
  }
  if (status === 401) {
    return { code: "UNAUTHORIZED", message: "" };
  }

  return { code: "UPSTREAM_ERROR", message: "" };
}

function normalizeAssistantErrorCode(code) {
  if (
    code === "BAD_REQUEST" ||
    code === "RATE_LIMITED" ||
    code === "UPSTREAM_ERROR" ||
    code === "UNAUTHORIZED"
  ) {
    return code;
  }
  return "UPSTREAM_ERROR";
}

function isFallbackEligible(error) {
  return error?.code === "UPSTREAM_ERROR";
}

function mapAssistantErrorType(code) {
  if (code === "RATE_LIMITED") {
    return "rate_limited";
  }
  if (code === "BAD_REQUEST") {
    return "bad_request";
  }
  if (code === "UNAUTHORIZED") {
    return "unauthorized";
  }
  return "unexpected";
}

function appendAssistantResponse(response) {
  assistantState.history.push({
    mode: response.mode,
    title: response.title,
    body: response.body,
    suggested_next:
      Array.isArray(response.suggested_next) && response.suggested_next.length
        ? response.suggested_next.slice(0, 3)
        : undefined,
  });
  renderAssistantHistory();
}

function renderAssistantHistory() {
  renderChatHistory();
}

/**
 * Renders the full chat history as conversational bubbles.
 * User messages on the right, AI messages on the left.
 */
function renderChatHistory() {
  if (!assistantHistory) return;

  if (!assistantState.chatHistory.length) {
    assistantHistory.innerHTML = "";
    return;
  }

  assistantHistory.innerHTML = assistantState.chatHistory
    .map((turn) => {
      const isUser = turn.role === "user";
      return `
        <div class="chat-bubble ${isUser ? "chat-bubble--user" : "chat-bubble--ai"}">
          <span class="chat-bubble__label">${isUser ? "You" : "Guide"}</span>
          <p class="chat-bubble__text">${escapeHtml(turn.content)}</p>
        </div>`;
    })
    .join("");
}

function scrollChatToBottom() {
  if (assistantHistory) {
    assistantHistory.scrollTop = assistantHistory.scrollHeight;
  }
}

function renderAssistantCounter() {
  if (!assistantCounter) {
    return;
  }
  const used = assistantState.messagesUsed;
  assistantCounter.textContent = `Questions used: ${used} / ${ASSISTANT_MAX_MESSAGES}`;
}

function showAssistantError(type) {
  if (!assistantError) {
    return;
  }

  const messages = {
    network:
      "We couldn't generate this reflection right now. Please check your connection and try again.",
    rate_limited:
      "You have reached a temporary reflection request limit. Please pause briefly and try again.",
    bad_request:
      "We couldn't process this reflection request. Please try again.",
    unauthorized:
      "Premium unlock required. Please complete the payment to continue.",
    unexpected:
      "Something went wrong while generating this reflection. No data was lost.",
  };

  assistantError.textContent = messages[type] || messages.unexpected;
  assistantError.classList.remove("hidden");
  clearAssistantStatus();
  assistantState.loading = false;
  setAssistantButtonsDisabled(assistantState.messagesUsed >= ASSISTANT_MAX_MESSAGES);

  if (type === "unauthorized") {
    clearPremiumToken();
    openPaywallModal();
  }
}

function clearAssistantError() {
  if (!assistantError) {
    return;
  }
  assistantError.textContent = "";
  assistantError.classList.add("hidden");
}

function clearAssistantStatus() {
  if (!assistantStatus) {
    return;
  }
  assistantStatus.textContent = "";
  delete assistantStatus.dataset.loading;
  assistantStatus.classList.add("hidden");
}

function renderLimitState() {
  if (!assistantLimit || !assistantModeGroup) {
    return;
  }

  const limitReached = assistantState.messagesUsed >= ASSISTANT_MAX_MESSAGES;
  assistantLimit.classList.toggle("hidden", !limitReached);
  if (limitReached) {
    trackEvent("ai_limit_reached");
  }
  assistantModeGroup.classList.toggle("hidden", limitReached);
}

function buildAssistantBoundaryResponse(mode) {
  return {
    mode,
    title: "Reflection Boundary",
    body: "I can only provide educational, non-diagnostic reflection within the six available guide modes. Please choose one of the listed modes and I will respond with calm, practical guidance based on your current result profile.",
    suggested_next: ["Choose a mode above to continue your reflection session."],
  };
}

function generateLocalAssistantResponse(mode, context) {
  const { primary, secondary, confidence, mix } = context;
  const confidenceLine = getConfidenceGuidance(confidence);
  const mixLine = getRelativeMixLine(mix);
  const primaryLower = primary.toLowerCase();
  const secondaryLower = secondary.toLowerCase();

  const templates = {
    "Result Summary": {
      lead: `Your current reflection points to ${primary} as your primary pattern, with ${secondary} as a meaningful secondary influence. ${mixLine} ${confidenceLine}`,
      middle:
        `In practical terms, this blend may shape how you make decisions, communicate under pressure, and reset after demanding situations. A ${primaryLower} lead can bring clear momentum, while ${secondaryLower} often adds an important balancing perspective. Consider this profile as a useful mirror for this moment, not as a fixed label.`,
      action:
        "For this week, focus on one small behavior to test in real settings. Choose a routine context, notice what helps you stay steady, and write one sentence about what felt natural versus what required extra effort. This keeps the reflection grounded and usable.",
      suggested_next: [
        "Would you like strengths-in-action ideas for one real task this week?",
        "Do you want a communication prep reflection for one conversation?",
      ],
    },
    "Strengths in Action": {
      lead: `A practical strength focus starts with your ${primary} profile while keeping ${secondary} in view. ${mixLine} ${confidenceLine}`,
      middle:
        `For daily use, identify two strengths you can intentionally apply: one that supports execution and one that supports relationships. Execution strengths help you move work forward with structure, pace, or clarity. Relationship strengths help people feel understood and aligned, especially when priorities differ.`,
      action:
        "Try a simple plan: pick one meeting, one task block, and one personal interaction where you will use these strengths deliberately. Before each moment, name your intention in plain language. Afterward, note what improved and what you would adjust next time. This converts abstract strengths into repeatable behavior.",
      suggested_next: [
        "Want a watch-outs and reframes reflection to balance these strengths?",
        "Would a 7-day reflection plan help you apply this consistently?",
      ],
    },
    "Watch-outs & Reframes": {
      lead: `A helpful watch-out reflection treats patterns as signals, not flaws. With ${primary} and ${secondary} in your current profile, ${mixLine} ${confidenceLine}`,
      middle:
        `Watch-outs usually appear when pace, uncertainty, or emotional load increases. A useful reframe is to translate each pressure point into one adjustable behavior. Instead of trying to change your personality, adjust timing, wording, or decision cadence so your strengths still lead while reducing friction.`,
      action:
        "Use this sequence for one week: notice a repeating friction point, pause for one breath, name the pattern, choose one reframe sentence, then try one small action immediately. Keep the action concrete and observable. The goal is steady improvement, not perfect control.",
      suggested_next: [
        "Would you like a communication prep reflection for a high-stakes conversation?",
        "Do you want journaling prompts to track your reframes daily?",
      ],
    },
    "7-Day Reflection Plan": {
      lead: `Here is a seven-day reflection rhythm based on your ${primary}/${secondary} blend. ${mixLine} ${confidenceLine}`,
      middle:
        "Day 1: define one intention. Day 2: notice where your natural pattern helps. Day 3: identify one friction point. Day 4: test one small reframe. Day 5: check impact on others. Day 6: repeat what worked. Day 7: summarize one lesson and one next experiment.",
      action:
        "Keep each check-in short, preferably three to five minutes. Write only what you observed, what you tried, and what changed. If your week is busy, reduce scope rather than skipping the process. Consistency matters more than depth for early behavior change.",
      suggested_next: [
        "Want strengths-in-action guidance for Day 1 execution?",
        "Would journaling prompts help structure each day's check-in?",
      ],
    },
    "Communication Prep": {
      lead: `For communication prep, use your ${primary} lead intentionally and let ${secondary} support tone and pacing. ${mixLine} ${confidenceLine}`,
      middle:
        "Before the conversation, define your core message in one sentence and your desired outcome in one sentence. Then add one empathy line to show you understand the other person's priorities. This combination helps you stay direct without losing relational trust.",
      action:
        "During the conversation, ask one clarifying question before giving your recommendation. Reflect key points back briefly, then propose one concrete next step with timeline and owner. Afterward, note whether your tone, pace, and clarity matched your intention. This creates a reliable communication loop.",
      suggested_next: [
        "Would you like watch-outs and reframes for communication pressure points?",
        "Do you want a result summary reflection to reset your overall priorities?",
      ],
    },
    "Journaling Prompts": {
      lead: `Use journaling to turn your ${primary}/${secondary} reflection into clear observations. ${mixLine} ${confidenceLine}`,
      middle:
        "Prompt 1: Where did my natural pattern help today? Prompt 2: Where did I feel friction, and what triggered it? Prompt 3: Which small reframe did I test, and what changed? Prompt 4: What support or structure would help tomorrow? Keep responses concrete and short.",
      action:
        "If time is limited, answer only one prompt each day. Review your notes after one week and highlight repeated themes. You are looking for patterns you can work with, not self-judgment. Small, consistent reflection builds better self-awareness than occasional long entries.",
      suggested_next: [
        "Would a 7-day reflection plan help organize these prompts?",
        "Want communication prep guidance for one upcoming conversation?",
      ],
    },
  };

  const selected = templates[mode];
  if (!selected) {
    return buildAssistantBoundaryResponse(mode);
  }

  let body = `${selected.lead} ${selected.middle} ${selected.action}`;
  body = fitBodyWordRange(body, ASSISTANT_RESPONSE_WORD_MIN, ASSISTANT_RESPONSE_WORD_MAX);

  return {
    mode,
    title: mode,
    body,
    suggested_next:
      Array.isArray(selected.suggested_next) && selected.suggested_next.length
        ? selected.suggested_next.slice(0, 3)
        : undefined,
  };
}

function getConfidenceGuidance(confidence) {
  if (confidence === "low") {
    return "Confidence is currently low, so treat this as a blended range of tendencies and mixed influences rather than one strong pattern.";
  }
  if (confidence === "medium") {
    return "Confidence is medium, so your leading pattern is useful while overlap remains important to consider.";
  }
  return "Confidence is high, so your leading pattern appears more distinct in this response set.";
}

function getRelativeMixLine(mix) {
  const ordered = Object.entries(mix)
    .map(([name, value]) => ({ name, value: Number(value) }))
    .sort((a, b) => b.value - a.value);
  const top = ordered[0]?.name || "primary";
  const second = ordered[1]?.name || "secondary";
  const lower = ordered.slice(2).map((entry) => entry.name);

  if (lower.length === 2) {
    return `Your mix appears more influenced by ${top} and ${second}, while ${lower[0]} and ${lower[1]} play supporting roles.`;
  }

  return `Your mix appears to lean most toward ${top}, with ${second} also shaping your style.`;
}

function fitBodyWordRange(text, minWords, maxWords) {
  const fillerSentences = [
    "Keep your next step specific, observable, and realistic for your current week.",
    "Use this reflection as a guide for experimentation rather than as a final verdict.",
    "Progress is usually stronger when you review one behavior repeatedly across familiar situations.",
  ];

  let normalized = normalizeSpaces(text);
  let words = countWords(normalized);
  let fillerIndex = 0;

  while (words < minWords) {
    normalized = `${normalized} ${fillerSentences[fillerIndex % fillerSentences.length]}`;
    fillerIndex += 1;
    words = countWords(normalized);
  }

  if (words > maxWords) {
    normalized = truncateWords(normalized, maxWords);
  }

  return normalized;
}

function countWords(text) {
  if (!text) {
    return 0;
  }
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function truncateWords(text, maxWords) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return text;
  }

  let truncated = words.slice(0, maxWords).join(" ");
  truncated = truncated.replace(/[;,:-]+$/, "");
  if (!/[.!?]$/.test(truncated)) {
    truncated += ".";
  }
  return truncated;
}

function normalizeSpaces(text) {
  return text.replace(/\s+/g, " ").trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function copyShareLink() {
  if (!state.shareUrl) return;
  const link = `${window.location.origin}${window.location.pathname}#result=${state.shareUrl}`;
  try {
    await navigator.clipboard.writeText(link);
    showCopiedFeedback(copyLinkBtn, "Copy Share Link");
    trackEvent("share_link_copied");
  } catch (_err) {
    // Silent failure
  }
}

async function copyResultSummary() {
  if (!state.shareUrl || !state.resultMeta) return;

  const primary = state.resultMeta.primary;
  const confidence = state.resultMeta.confidenceLevel;
  // We can derive secondary from the DOM or state. It is safely rendered right now.
  const secondary = secondaryName.textContent;
  const link = `${window.location.origin}${window.location.pathname}#result=${state.shareUrl}`;

  const summaryText = `My Temperament Insight Result!
Primary: ${primary}
Secondary Influence: ${secondary}
Confidence: ${confidence.charAt(0).toUpperCase() + confidence.slice(1)}

Check out my full profile:
${link}
  `.trim();

  try {
    await navigator.clipboard.writeText(summaryText);
    showCopiedFeedback(copySummaryBtn, "Copy Result Summary");
  } catch (_err) {
    // Silent failure
  }
}

function showCopiedFeedback(btnEl, originalText) {
  if (!btnEl) return;
  btnEl.textContent = "Copied!";
  btnEl.classList.add("copied");

  setTimeout(() => {
    btnEl.textContent = originalText;
    btnEl.classList.remove("copied");
  }, 2000);
}

// ==========================================
// 7. UTILITIES & DATA STORAGE
// ==========================================
function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (_e) { }
}

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (_e) {
    return null;
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (_e) { }
}

let saveProgressTimeout = null;
function debounceSaveProgress() {
  if (saveProgressTimeout) {
    clearTimeout(saveProgressTimeout);
  }
  saveProgressTimeout = setTimeout(() => {
    saveProgress();
  }, 250);
}

function toCenteredValue(value) {
  return value - 3;
}

function getConfidenceLevel(scoreGap, depth) {
  const perTemperamentCount = depth / TEMPERAMENTS.length;
  const maxGap = perTemperamentCount * 4;
  const normalizedGap = maxGap > 0 ? scoreGap / maxGap : 0;

  if (normalizedGap >= 0.25) {
    return {
      level: "High",
      message: "Your top pattern is clearly distinct in this response set.",
    };
  }

  if (normalizedGap >= 0.12) {
    return {
      level: "Medium",
      message:
        "Your leading pattern is present, with noticeable overlap from your secondary pattern.",
    };
  }

  return {
    level: "Low",
    message:
      "Your responses show a blended profile, so treat this as a starting reflection rather than a fixed label.",
  };
}

function saveProgress() {
  if (!state.questions.length) {
    return;
  }

  const payload = {
    selectedDepth: state.selectedDepth,
    responses: state.responses,
    currentPage: state.currentPage,
    questionOrder: state.questions.map((question) => question.id),
    startedAt: state.startedAt,
  };

  safeSet(STORAGE_KEY, JSON.stringify(payload));
}

function restoreProgressIfAvailable() {
  const raw = safeGet(STORAGE_KEY);
  if (!raw) {
    return;
  }

  let saved;
  try {
    saved = JSON.parse(raw);
  } catch (_error) {
    clearProgress();
    return;
  }

  if (
    !saved ||
    typeof saved !== "object" ||
    !VALID_DEPTHS.includes(saved.selectedDepth)
  ) {
    clearProgress();
    return;
  }

  if (
    !Array.isArray(saved.questionOrder) ||
    saved.questionOrder.length !== saved.selectedDepth
  ) {
    clearProgress();
    return;
  }

  if (!isValidSavedQuestionOrder(saved.questionOrder, saved.selectedDepth)) {
    clearProgress();
    return;
  }

  const questions = buildQuestionSet(saved.selectedDepth, saved.questionOrder);
  const validIds = new Set(questions.map((question) => question.id));
  const restoredResponses = {};

  if (saved.responses && typeof saved.responses === "object") {
    Object.entries(saved.responses).forEach(([questionId, value]) => {
      const numericValue = Number(value);
      if (
        validIds.has(questionId) &&
        !Number.isNaN(numericValue) &&
        numericValue >= 1 &&
        numericValue <= 5
      ) {
        restoredResponses[questionId] = numericValue;
      }
    });
  }

  const totalPages = Math.ceil(questions.length / PAGE_SIZE);
  const cp = Number(saved.currentPage);
  if (Number.isNaN(cp) || cp < 0 || cp >= totalPages) {
    clearProgress();
    return;
  }

  state.selectedDepth = saved.selectedDepth;
  state.questions = questions;
  state.responses = restoredResponses;
  state.currentPage = cp;
  state.detailVisible = false;
  state.startedAt =
    Number.isFinite(saved.startedAt) && saved.startedAt > 0
      ? saved.startedAt
      : Date.now();
  state.completionTracked = false;
  state.abandonmentTracked = false;
  state.resultMeta = null;

  const depthInput = document.querySelector(
    `input[name="depth"][value="${state.selectedDepth}"]`,
  );
  if (depthInput) {
    depthInput.checked = true;
  }

  introPanel.classList.add("hidden");
  resultsPanel.classList.add("hidden");
  assessmentPanel.classList.remove("hidden");
  saveProgress();
  renderCurrentPage();
  scrollToPanel(assessmentPanel, "auto");
}

function clearProgress() {
  if (saveProgressTimeout) {
    clearTimeout(saveProgressTimeout);
    saveProgressTimeout = null;
  }
  if (temperamentDonutChart && typeof temperamentDonutChart.destroy === "function") {
    temperamentDonutChart.destroy();
    temperamentDonutChart = null;
  }
  safeRemove(STORAGE_KEY);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getScaleLabels(scoringRule) {
  if (scoringRule !== "Likert 1-5") {
    return [
      "Strongly disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly agree",
    ];
  }
  return [
    "Strongly disagree",
    "Disagree",
    "Neutral",
    "Agree",
    "Strongly agree",
  ];
}

function updateSimulationButtonState() {
  if (!simulateButton) {
    return;
  }

  const shouldShow =
    state.selectedDepth === 20 && !assessmentPanel.classList.contains("hidden");
  simulateButton.classList.toggle("hidden", !shouldShow);
  simulateButton.disabled = !shouldShow;
}

function getSimulatedResponseValue(question, dominant, secondary) {
  let traitBase = 2;
  if (question.temperament === dominant) {
    traitBase = 4;
  } else if (question.temperament === secondary) {
    traitBase = 3;
  }
  const jitterPool = [-1, 0, 0, 0, 1];
  const jitter = jitterPool[Math.floor(Math.random() * jitterPool.length)];
  const traitValue = clamp(traitBase + jitter, 1, 5);
  return question.reverseScored ? 6 - traitValue : traitValue;
}

function scrollToPanel(panel, behavior) {
  if (!panel || typeof panel.scrollIntoView !== "function") {
    return;
  }

  panel.scrollIntoView({ behavior, block: "start" });
}

function handlePageHide() {
  if (!shouldTrackAbandonment()) {
    return;
  }

  state.abandonmentTracked = true;
  trackEvent(ANALYTICS_EVENTS.assessmentAbandoned, {
    depth: state.selectedDepth,
    last_page_index: state.currentPage + 1,
  });
}

function shouldTrackAbandonment() {
  if (!state.questions.length) {
    return false;
  }
  if (state.completionTracked || state.abandonmentTracked) {
    return false;
  }
  if (assessmentPanel.classList.contains("hidden")) {
    return false;
  }
  return true;
}

function getDurationSeconds(startedAt) {
  if (!Number.isFinite(startedAt) || startedAt <= 0) {
    return 0;
  }
  return Math.max(0, Math.round((Date.now() - startedAt) / 1000));
}

function normalizeConfidenceLevel(level) {
  const normalized = String(level || "").toLowerCase();
  if (
    normalized === "high" ||
    normalized === "medium" ||
    normalized === "low"
  ) {
    return normalized;
  }
  return "low";
}

function getConfidencePercent(level) {
  if (level === "high") {
    return 85;
  }
  if (level === "medium") {
    return 68;
  }
  return 52;
}

function buildTemperamentMixPercentages(ranked) {
  const maxAbsScore = (state.selectedDepth / TEMPERAMENTS.length) * 2;
  const safeMax = maxAbsScore > 0 ? maxAbsScore : 1;
  const weights = TEMPERAMENTS.reduce((acc, temperament) => {
    const item = ranked.find((entry) => entry.temperament === temperament);
    const score = item ? item.score : 0;
    acc[temperament] = clamp((score + safeMax) / (safeMax * 2), 0, 1);
    return acc;
  }, {});

  const rawPercentages = TEMPERAMENTS.map((temperament) => ({
    temperament,
    value: weights[temperament],
  }));
  const total = rawPercentages.reduce((sum, entry) => sum + entry.value, 0);
  const normalized = rawPercentages.map((entry) => ({
    temperament: entry.temperament,
    raw: total > 0 ? (entry.value / total) * 100 : 25,
  }));
  const floors = normalized.map((entry) => ({
    temperament: entry.temperament,
    value: Math.floor(entry.raw),
    fraction: entry.raw - Math.floor(entry.raw),
  }));

  let remainder = 100 - floors.reduce((sum, entry) => sum + entry.value, 0);
  floors
    .slice()
    .sort((a, b) => b.fraction - a.fraction)
    .forEach((entry) => {
      if (remainder > 0) {
        const target = floors.find(
          (candidate) => candidate.temperament === entry.temperament,
        );
        target.value += 1;
        remainder -= 1;
      }
    });

  return floors.reduce((acc, entry) => {
    acc[entry.temperament] = entry.value;
    return acc;
  }, {});
}

function getTemperamentDisplayOrder(percentages, ranked) {
  const rankingIndex = (ranked || []).reduce((acc, entry, index) => {
    acc[entry.temperament] = index;
    return acc;
  }, {});

  return [...TEMPERAMENTS].sort((a, b) => {
    const diff = (percentages[b] ?? 0) - (percentages[a] ?? 0);
    if (diff !== 0) {
      return diff;
    }

    const rankA = rankingIndex[a];
    const rankB = rankingIndex[b];
    if (Number.isFinite(rankA) && Number.isFinite(rankB)) {
      return rankA - rankB;
    }

    return TEMPERAMENTS.indexOf(a) - TEMPERAMENTS.indexOf(b);
  });
}

function renderTemperamentLegend(percentages, displayOrder) {
  temperamentLegend.innerHTML = displayOrder
    .map((temperament) => {
      const value = percentages[temperament];
      return `
      <div class="mix-legend-row">
        <span class="mix-legend-name">
          <span class="mix-legend-dot" style="background: ${TEMPERAMENT_COLORS[temperament]}"></span>
          ${temperament}
        </span>
        <span class="mix-legend-val">${value}%</span>
      </div>
    `;
    })
    .join("");
}

let chartJsLoaderPromise = null;

function loadChartJs() {
  if (typeof window.Chart === "function") {
    return Promise.resolve(window.Chart);
  }
  if (chartJsLoaderPromise) {
    return chartJsLoaderPromise;
  }
  chartJsLoaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";
    script.onload = () => resolve(window.Chart);
    script.onerror = () => {
      chartJsLoaderPromise = null;
      reject(new Error("Failed to load Chart.js"));
    };
    document.head.appendChild(script);
  });
  return chartJsLoaderPromise;
}

async function renderTemperamentDonut(percentages, displayOrder) {
  const canvas = document.getElementById("temperament-donut");
  if (!canvas) {
    return;
  }

  try {
    await loadChartJs();
  } catch (_e) {
    // Fallback: If Chart.js fails to load over the network, render text-only
    return;
  }

  if (typeof window.Chart !== "function") {
    return;
  }
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  if (temperamentDonutChart) {
    temperamentDonutChart.destroy();
  }

  temperamentDonutChart = new window.Chart(context, {
    type: "doughnut",
    data: {
      labels: displayOrder,
      datasets: [
        {
          data: displayOrder.map((temperament) => percentages[temperament]),
          backgroundColor: displayOrder.map(
            (temperament) => TEMPERAMENT_COLORS[temperament],
          ),
          borderWidth: 0,
        },
      ],
    },
    options: {
      cutout: "72%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.label}: ${context.parsed}%`,
          },
        },
      },
      animation: {
        duration: 1000,
      },
    },
  });
}

function renderScoreBars(percentages, ranked) {
  const scoreGrid = document.querySelector(".score-grid");
  if (scoreGrid) {
    const displayOrder = getTemperamentDisplayOrder(percentages, ranked);
    const orderIndex = displayOrder.reduce((acc, temperament, index) => {
      acc[temperament] = index;
      return acc;
    }, {});

    const columns = Array.from(scoreGrid.querySelectorAll(".score-col"));
    columns
      .sort((a, b) => {
        const tempA = a.dataset.temp;
        const tempB = b.dataset.temp;
        return (orderIndex[tempA] ?? 0) - (orderIndex[tempB] ?? 0);
      })
      .forEach((column) => {
        scoreGrid.appendChild(column);
      });
  }

  TEMPERAMENTS.forEach((temperament) => {
    const key = temperament.toLowerCase();
    const bar = document.getElementById(`bar-${key}`);
    const label = document.getElementById(`pct-${key}`);
    const percent = percentages[temperament];

    if (label) {
      label.textContent = `${percent}%`;
    }
    if (bar) {
      bar.style.height = "0%";
      requestAnimationFrame(() => {
        bar.style.height = `${percent}%`;
      });
    }
  });
}

function renderScenarioPanels(primary, secondary) {
  if (!scenarioPanels.length || !scenarioPanels[0].card) return;

  const primaryLower = primary.toLowerCase();
  const secondaryLower = secondary.toLowerCase();

  const scenarioSets = [
    // Work: stalled meeting, deadline crunch, handoff clarity
    [
      {
        title: "Tension",
        body: `A meeting drifts; your ${primaryLower} side names the stall and refocuses the room.`,
        temp: primary,
      },
      {
        title: "Your Move",
        body: `You use your ${secondaryLower} side to suggest one clear next step and owner.`,
        temp: secondary,
      },
      {
        title: "Result",
        body: `Momentum returns; people align around your ${primaryLower}-${secondaryLower} mix of pace and care.`,
        temp: primary,
      },
    ],
    // Relationships: weekend plan conflict, support, compromise
    [
      {
        title: "Tension",
        body: `Weekend plans clash; your ${primaryLower} side senses rising stress and slows the heat.`,
        temp: primary,
      },
      {
        title: "Your Move",
        body: `You tap your ${secondaryLower} side to ask what matters most and offer a swap.`,
        temp: secondary,
      },
      {
        title: "Result",
        body: `You land a compromise shaped by your ${primaryLower}-${secondaryLower} balance of warmth and clarity.`,
        temp: primary,
      },
    ],
    // Personal growth: new habit, feedback, learning
    [
      {
        title: "Tension",
        body: `Starting a new habit feels wobbly; your ${primaryLower} side craves progress without overwhelm.`,
        temp: primary,
      },
      {
        title: "Your Move",
        body: `Your ${secondaryLower} side breaks it into one tiny daily action and a friendly reminder.`,
        temp: secondary,
      },
      {
        title: "Result",
        body: `You stick with it; your ${primaryLower}-${secondaryLower} mix turns small reps into steady growth.`,
        temp: primary,
      },
    ],
  ];

  const chosen =
    scenarioSets[Math.floor(Math.random() * scenarioSets.length)] || scenarioSets[0];

  scenarioPanels.forEach((panel, index) => {
    const beat = chosen[index];
    if (!panel.card || !panel.title || !panel.body || !beat) return;
    panel.card.dataset.temp = beat.temp;
    panel.title.textContent = beat.title;
    panel.body.textContent = beat.body;
  });
}

function trackEvent(name, props = {}) {
  try {
    if (
      typeof window === "undefined" ||
      typeof window.plausible !== "function"
    ) {
      return;
    }

    const normalizedProps = {};
    Object.entries(props).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        normalizedProps[key] = value;
      }
    });

    window.plausible(name, { props: normalizedProps });
  } catch (_error) {
    // Silent failure by design (ad blockers or script loading failures).
  }
}

// ─── Premium Token Helpers ────────────────────────────────────────────────

function loadPremiumTokenFromStorage() {
  try {
    const raw = localStorage.getItem(PREMIUM_TOKEN_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.token === "string") {
      premiumState.token = parsed.token;
      premiumState.expiresAt = parsed.expires_at || null;
    }
  } catch (_error) {
    // ignore parse errors
  }
}

function savePremiumToken(token, expiresAt) {
  premiumState.token = token;
  premiumState.expiresAt = expiresAt || null;
  try {
    localStorage.setItem(
      PREMIUM_TOKEN_KEY,
      JSON.stringify({ token, expires_at: expiresAt }),
    );
  } catch (_error) {
    // storage can fail in private mode; keep in-memory fallback
  }
}

function clearPremiumToken() {
  premiumState.token = null;
  premiumState.expiresAt = null;
  try {
    localStorage.removeItem(PREMIUM_TOKEN_KEY);
  } catch (_error) {
    // ignore
  }
}

function isPremiumTokenValid(token) {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payloadJson = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);
    const exp = typeof payload.exp === "number" ? payload.exp : null;
    if (!exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return exp > now;
  } catch (_error) {
    return false;
  }
}

function hasPremiumAccess() {
  if (!premiumState.token) return false;
  if (!isPremiumTokenValid(premiumState.token)) {
    clearPremiumToken();
    return false;
  }
  return true;
}

// --- Shareable Result URL Feature Utilities ---

/**
 * Encodes a JSON payload into a base64url string.
 * Uses TextEncoder for UTF-8 and safely converts to URL-friendly base64.
 *
 * @param {Object} payload
 * @returns {string} base64url encoded string
 */
function encodeSharePayload(payload) {
  try {
    const jsonStr = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(jsonStr);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = window.btoa(binary);
    // Convert base64 to base64url
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch (_error) {
    return null;
  }
}

/**
 * Decodes a base64url string back into a JSON payload.
 * Validates the minimum expected schema.
 *
 * @param {string} token
 * @returns {Object|null} Validated payload or null on any error
 */
function decodeSharePayload(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  try {
    // Convert base64url to base64
    let base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    // Pad with '='
    while (base64.length % 4) {
      base64 += "=";
    }

    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonStr = new TextDecoder().decode(bytes);
    const payload = JSON.parse(jsonStr);

    // Validate payload shape
    if (payload.v !== 1) return null;
    if (!TEMPERAMENTS.includes(payload.p)) return null;
    if (!TEMPERAMENTS.includes(payload.s)) return null;
    if (!["high", "medium", "low"].includes(payload.c)) return null;
    if (!payload.mix || typeof payload.mix !== "object") return null;

    // Validate mix sum and properties
    let mixSum = 0;
    for (const t of TEMPERAMENTS) {
      const val = payload.mix[t.toLowerCase()];
      if (typeof val !== "number") return null;
      mixSum += val;
    }
    if (mixSum !== 100) return null;

    return payload;
  } catch (_error) {
    // Fail silently on decoding, parsing, or validation errors
    return null;
  }
}

/**
 * Renders the results panel using a decoded share payload.
 * Bypasses the assessment flow completely.
 *
 * @param {Object} payload
 */
function renderSharedResults(payload) {
  introPanel.classList.add("hidden");
  assessmentPanel.classList.add("hidden");
  resultsPanel.classList.remove("hidden");

  trackEvent("shared_result_viewed");

  const primary = payload.p;
  const secondary = payload.s;
  const confidenceLevelFromPayload = payload.c; // "high", "medium", "low"

  const primaryProfile = TEMPERAMENT_PROFILES[primary];
  const secondaryProfile = TEMPERAMENT_PROFILES[secondary];
  const primaryVisual = TEMPERAMENT_VISUALS[primary];
  const secondaryVisual = TEMPERAMENT_VISUALS[secondary];
  const communicationProfile = TEMPERAMENT_COMMS[primary];

  // Re-map the payload mix to exactly match TEMPERAMENTS keys structure
  const mixPercentages = {
    Sanguine: payload.mix.sanguine,
    Choleric: payload.mix.choleric,
    Melancholic: payload.mix.melancholic,
    Phlegmatic: payload.mix.phlegmatic,
  };

  const confidenceLevel = normalizeConfidenceLevel(confidenceLevelFromPayload);
  const confidencePercentValue = getConfidencePercent(confidenceLevel);

  // Capitalize confidence representation
  const confidenceDisplayLevel =
    confidenceLevel.charAt(0).toUpperCase() + confidenceLevel.slice(1);

  resultName.textContent = primary;
  resultTagline.textContent = primaryVisual.tagline;
  resultTitle.textContent = `${primary} is your primary temperament, with ${secondary} as secondary influence.`;
  resultShort.textContent = `${primaryProfile.short} A secondary ${secondary.toLowerCase()} influence may add ${secondaryProfile.strengthFocus}.`;
  resultConfidence.textContent = `${confidenceDisplayLevel} confidence result`;

  resultProfileImage.src = primaryVisual.image;
  resultProfileImage.alt = `${primary} profile`;
  resultProfileName.textContent = primary;
  resultProfileSummary.textContent = primaryProfile.short;
  resultGrowth.textContent = `Practice focus: ${primaryProfile.challengeFocus}. Secondary ${secondary.toLowerCase()} influence may add ${secondaryProfile.strengthFocus}.`;

  const strengths = [...primaryProfile.strengths];
  strengths.push(`Secondary influence: ${secondaryProfile.strengthFocus}.`);

  const weaknesses = [...primaryProfile.weaknesses];
  weaknesses.push(`Possible watch-out: ${secondaryProfile.challengeFocus}.`);

  detailStrengths.innerHTML = strengths
    .map((item) => `<li>${item}</li>`)
    .join("");
  detailWeaknesses.innerHTML = weaknesses
    .map((item) => `<li>${item}</li>`)
    .join("");
  detailCommunication.textContent = `${primaryProfile.communication} Secondary ${secondary.toLowerCase()} influence may also shape tone and pace in conversations.`;
  secondaryName.textContent = secondary;
  secondaryDesc.textContent = secondaryProfile.short;
  secondaryTraits.textContent = secondaryVisual.traits;

  commsPreferred.textContent = communicationProfile.preferred;
  commsListener.textContent = communicationProfile.listener;
  commsExpression.textContent = communicationProfile.expression;
  commsPressure.textContent = communicationProfile.pressure;

  confidenceTitle.textContent = `${confidenceDisplayLevel} Confidence`;
  // Construct simple valid string message matching original logic's tone based on the label.
  if (confidenceLevel === "high") {
    confidenceMessage.textContent =
      "Your top pattern is clearly distinct in this response set.";
  } else if (confidenceLevel === "medium") {
    confidenceMessage.textContent =
      "Your leading pattern is present, with noticeable overlap from your secondary pattern.";
  } else {
    confidenceMessage.textContent =
      "Your responses show a blended profile, so treat this as a starting reflection rather than a fixed label.";
  }
  confidencePercent.textContent = `${confidencePercentValue}%`;
  confidenceLabel.textContent = confidenceLevel;
  confidenceRing.style.setProperty("--confidence-fill", confidencePercentValue);
  primaryPercentLabel.textContent = `${mixPercentages[primary]}%`;

  // We explicitly bypass getting ranked data since we don't have it natively, so we just sort the mix percentages array.
  const displayOrder = [...TEMPERAMENTS].sort(
    (a, b) => mixPercentages[b] - mixPercentages[a],
  );

  renderTemperamentLegend(mixPercentages, displayOrder);
  renderTemperamentDonut(mixPercentages, displayOrder);

  // Custom score bar rendering for shared results because rank logic is circumvented
  const scoreGrid = document.querySelector(".score-grid");
  if (scoreGrid) {
    const orderIndex = displayOrder.reduce((acc, temperament, index) => {
      acc[temperament] = index;
      return acc;
    }, {});

    const columns = Array.from(scoreGrid.querySelectorAll(".score-col"));
    columns
      .sort((a, b) => {
        const tempA = a.dataset.temp;
        const tempB = b.dataset.temp;
        return (orderIndex[tempA] ?? 0) - (orderIndex[tempB] ?? 0);
      })
      .forEach((column) => {
        scoreGrid.appendChild(column);
      });
  }

  TEMPERAMENTS.forEach((temperament) => {
    const key = temperament.toLowerCase();
    const bar = document.getElementById(`bar-${key}`);
    const label = document.getElementById(`pct-${key}`);
    const percent = mixPercentages[temperament];

    if (label) {
      label.textContent = `${percent}%`;
    }
    if (bar) {
      bar.style.height = "0%";
      requestAnimationFrame(() => {
        bar.style.height = `${percent}%`;
      });
    }
  });
  setAssistantContext({
    primary,
    secondary,
    confidence: confidenceLevel,
    mix: {
      sanguine: mixPercentages.Sanguine,
      choleric: mixPercentages.Choleric,
      melancholic: mixPercentages.Melancholic,
      phlegmatic: mixPercentages.Phlegmatic,
    },
  });
  resetAssistantSession();

  state.detailVisible = false;
  resultDetail.classList.add("hidden");
  detailToggle.textContent = "Show Detailed Explanation";

  // Hide the "Take Another Test" button or modify its behavior to clear hash and restart to avoid taking another test within hash context, we just hide the restart controls natively.
  const restartButton = document.querySelector(".result-restart");
  if (restartButton) {
    restartButton.href = "test-options.html";
    restartButton.addEventListener("click", () => {
      trackEvent("retake_test_clicked");
    });
    // The regular href cleans the hash simply by reloading cleanly.
  }
}

// ==========================================
// 8. SHARE CARD CANVAS RENDERING
// ==========================================

async function generateShareCard() {
  if (!state.resultMeta || !state.shareUrl || !shareCardCanvas) {
    return;
  }

  const originalText = shareCardBtn.textContent;
  shareCardBtn.textContent = "Generating...";
  shareCardBtn.disabled = true;

  try {
    await document.fonts.ready;

    const fullLink = new URL(
      `#result=${state.shareUrl}`,
      window.location.origin + window.location.pathname,
    ).toString();
    const shortSummary =
      TEMPERAMENT_PROFILES[state.resultMeta.primary]?.short || "";

    // Decode stored mix percentages from URL token
    const decodedPayload = decodeSharePayload(state.shareUrl);
    const mixPercents = decodedPayload?.mix || {};

    // Yield thread to allow button "Generating..." text to paint
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );

    const cardData = {
      primary: state.resultMeta.primary,
      secondary: state.resultMeta.secondary || secondaryName.textContent,
      confidence: state.resultMeta.confidenceLevel,
      summary: shortSummary,
      link: fullLink,
      mix: {
        Sanguine: mixPercents.sanguine || 0,
        Choleric: mixPercents.choleric || 0,
        Melancholic: mixPercents.melancholic || 0,
        Phlegmatic: mixPercents.phlegmatic || 0,
      },
    };

    drawShareCard(shareCardCanvas, cardData);

    shareCardPreview.classList.remove("hidden");
    shareCardBtn.classList.add("hidden");

    trackEvent("share_card_generated", {
      primary_temperament: cardData.primary,
      confidence_level: cardData.confidence,
    });
  } catch (_err) {
    shareCardBtn.textContent = "Failed to generate";
    setTimeout(() => {
      shareCardBtn.textContent = originalText;
      shareCardBtn.disabled = false;
    }, 2000);
  }
}

function drawShareCard(canvas, data) {
  const ctx = canvas.getContext("2d");

  // High DPI Setup
  const width = 1080;
  const height = 1350;
  const scale = window.devicePixelRatio || 1;
  const renderScale = 2; // For forced sharpness on export

  canvas.width = width * renderScale;
  canvas.height = height * renderScale;
  canvas.style.width = "100%"; // Let CSS handle display width

  // Scale the context to match the render scale
  ctx.scale(renderScale, renderScale);
  ctx.textBaseline = "top";

  // 1. Background
  ctx.fillStyle = "#F5F7FA"; // Match var(--bg-body) roughly
  ctx.fillRect(0, 0, width, height);

  // Add subtle gradient/mesh circle in top right
  const gradient = ctx.createRadialGradient(
    width - 200,
    200,
    0,
    width - 200,
    200,
    600,
  );
  gradient.addColorStop(0, TEMPERAMENT_COLORS[data.primary] + "22"); // 22 is hex alpha
  gradient.addColorStop(1, "rgba(245, 247, 250, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 2. Main Card Container
  const cardMargin = 80;
  const cardWidth = width - cardMargin * 2;
  const cardHeight = height - cardMargin * 2.5;

  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;
  ctx.beginPath();
  ctx.roundRect(cardMargin, cardMargin, cardWidth, cardHeight, 32);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 3. App Brand Header
  let contentY = cardMargin + 80;
  const contentX = cardMargin + 80;
  const innerWidth = cardWidth - 160;

  ctx.fillStyle = "#4a5568";
  ctx.font = "bold 28px Manrope, sans-serif";
  ctx.fillText("TEMPERAMENT INSIGHT", contentX, contentY);

  // 4. Primary Temperament
  contentY += 60;
  ctx.fillStyle = TEMPERAMENT_COLORS[data.primary] || "#1a202c";
  ctx.font = "800 110px Manrope, sans-serif";
  ctx.fillText(data.primary, contentX - 5, contentY);

  // 5. Secondary & Confidence
  contentY += 130;
  ctx.fillStyle = "#2d3748";
  ctx.font = "600 36px Manrope, sans-serif";
  ctx.fillText(`Secondary: ${data.secondary}`, contentX, contentY);

  ctx.font = "500 36px Manrope, sans-serif";
  ctx.fillStyle = "#718096";
  ctx.fillText(
    ` •  Confidence: ${data.confidence.charAt(0).toUpperCase() + data.confidence.slice(1)}`,
    contentX + ctx.measureText(`Secondary: ${data.secondary}`).width,
    contentY,
  );

  // 6. Summary Text
  contentY += 90;
  ctx.fillStyle = "#4a5568";
  ctx.font = "400 36px Manrope, sans-serif";
  const lineHeight = 54;
  contentY = wrapText(
    ctx,
    data.summary,
    contentX,
    contentY,
    innerWidth,
    lineHeight,
    4,
  );

  // 7. Mix Breakdown (Bars)
  contentY += 80;
  ctx.fillStyle = "#1a202c";
  ctx.font = "bold 32px Manrope, sans-serif";
  ctx.fillText("Temperament Mix", contentX, contentY);

  contentY += 60;
  const barMaxWidth = innerWidth - 150;

  const mixEntries = Object.entries(data.mix).sort((a, b) => b[1] - a[1]);

  mixEntries.forEach(([temp, pct]) => {
    ctx.fillStyle = "#4a5568";
    ctx.font = "600 28px Manrope, sans-serif";
    ctx.fillText(temp, contentX, contentY + 10);

    const barX = contentX + 200;
    ctx.fillStyle = "#EDF2F7";
    ctx.beginPath();
    ctx.roundRect(barX, contentY + 12, barMaxWidth, 24, 12);
    ctx.fill();

    const fillWidth = (pct / 100) * barMaxWidth;
    ctx.fillStyle = TEMPERAMENT_COLORS[temp] || "#A0AEC0";
    if (fillWidth > 0) {
      ctx.beginPath();
      ctx.roundRect(barX, contentY + 12, Math.max(fillWidth, 24), 24, 12);
      ctx.fill();
    }

    ctx.fillStyle = "#2d3748";
    ctx.font = "bold 28px Manrope, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${pct}%`, contentX + innerWidth, contentY + 10);
    ctx.textAlign = "left";

    contentY += 60;
  });

  // 8. Link & Footer
  const linkBoxH = 120;
  const linkBoxY = cardMargin + cardHeight - linkBoxH - 60;

  ctx.fillStyle = "#EDF2F7";
  ctx.beginPath();
  ctx.roundRect(contentX, linkBoxY, innerWidth, linkBoxH, 24);
  ctx.fill();

  ctx.fillStyle = "#718096";
  ctx.font = "500 24px Manrope, sans-serif";
  ctx.fillText(
    "View my full interactive profile:",
    contentX + 40,
    linkBoxY + 30,
  );

  ctx.fillStyle = "#2b6cb0";
  ctx.font = "600 28px Manrope, sans-serif";

  let displayLink = data.link;
  if (ctx.measureText(displayLink).width > innerWidth - 80) {
    displayLink = displayLink.substring(0, 50) + "...";
  }
  ctx.fillText(displayLink, contentX + 40, linkBoxY + 70);

  ctx.fillStyle = "#A0AEC0";
  ctx.font = "400 24px Manrope, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    "Educational reflection, not a clinical diagnosis. Take the test at whatismytemperament.com",
    width / 2,
    height - cardMargin + 30,
  );
  ctx.textAlign = "left";
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = text.split(" ");
  let line = "";
  let lineCount = 1;
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      if (lineCount >= maxLines) {
        ctx.fillText(line.trim() + "...", x, currentY);
        return currentY + lineHeight;
      } else {
        ctx.fillText(line, x, currentY);
        line = words[n] + " ";
        currentY += lineHeight;
        lineCount++;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
}

function downloadCanvasPNG(canvas, filename) {
  if (!canvas) return;
  const dataPath = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataPath;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (state.resultMeta) {
    trackEvent("share_card_downloaded", {
      primary_temperament: state.resultMeta.primary,
    });
  }
}

async function shareCanvasImage(canvas) {
  if (!canvas) return;

  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const file = new File([blob], "Temperament-Insight-Result.png", {
      type: "image/png",
    });
    const shareData = {
      files: [file],
      title: "My Temperament Insight Result",
      text: "Check out my temperament profile!",
    };

    try {
      await navigator.share(shareData);
      if (state.resultMeta) {
        trackEvent("share_card_shared", {
          primary_temperament: state.resultMeta.primary,
        });
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error sharing canvas image:", err);
      }
    }
  }, "image/png");
}

function openPrintableReport() {
  if (!state.shareUrl) return;

  // Construct absolute URL for the report page mapping the encoded payload cache
  const reportUrl = new URL(
    `report.html#result=${state.shareUrl}`,
    window.location.origin + window.location.pathname,
  ).toString();

  // Open the printable report in a new tab
  window.open(reportUrl, "_blank");

  if (state.resultMeta) {
    trackEvent("share_card_pdf_downloaded", {
      primary_temperament: state.resultMeta.primary,
      confidence_level: state.resultMeta.confidenceLevel,
    });
  }
}

// ==========================================
// FLOATING "JUMP TO CHAT" FAB
// ==========================================
function initChatFab() {
  if (!chatFab || !chatModal) return;

  // Show FAB only when results panel is visible
  const panelObserver = new MutationObserver(() => {
    const isVisible = !resultsPanel.classList.contains("hidden");
    if (isVisible) {
      chatFab.classList.remove("hidden");
    } else {
      chatFab.classList.add("hidden");
      closeChatModal();
    }
  });

  panelObserver.observe(resultsPanel, {
    attributes: true,
    attributeFilter: ["class"],
  });

  // Toggle modal on FAB click
  chatFab.addEventListener("click", () => {
    const isOpen = !chatModal.classList.contains("hidden");
    if (isOpen) {
      closeChatModal();
    } else {
      openChatModal();
    }
  });
}
