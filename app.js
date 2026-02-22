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
    listener:
      "Attentive and detail-sensitive, often hearing what others miss.",
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
  ({ id, temperament, dimension, item_text, reverse_scored, scoring_rule }) => ({
    id,
    temperament,
    dimension,
    text: item_text,
    reverseScored: reverse_scored === "true",
    scoringRule: scoring_rule,
  })
);

const QUESTION_BY_ID = QUESTION_BANK_ROWS.reduce((acc, question) => {
  acc[question.id] = question;
  return acc;
}, {});

const QUESTION_BANK_BY_TEMPERAMENT = TEMPERAMENTS.reduce((acc, temperament) => {
  acc[temperament] = QUESTION_BANK_ROWS.filter(
    (question) => question.temperament === temperament
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
      {}
    );
    acc[temperament] = byDimension;
    return acc;
  },
  {}
);

validateQuestionBank(QUESTION_BANK_ROWS);

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

startButton.addEventListener("click", startAssessment);
prevButton.addEventListener("click", goToPreviousPage);
if (simulateButton) {
  simulateButton.addEventListener("click", simulateAssessmentForResults);
}
nextButton.addEventListener("click", goToNextPage);
detailToggle.addEventListener("click", toggleDetailView);
detailToggle.addEventListener("click", toggleDetailView);
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

function startAssessment() {
  const selectedDepthInput = document.querySelector(
    'input[name="depth"]:checked'
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
    sampleBalancedQuestions(temperament, perTemperament)
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
        `Question bank underflow for ${temperament}/${dimension}: needed ${required}, found ${pool.length}.`
      );
    }

    picks.push(...shuffleArray(pool).slice(0, required));
  });

  return picks;
}

function validateQuestionBank(questionBankRows) {
  if (questionBankRows.length !== 240) {
    throw new Error(
      `Question bank must contain exactly 240 items, found ${questionBankRows.length}.`
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
        `Invalid temperament '${question.temperament}' for question ${question.id}.`
      );
    }
    if (typeof question.reverseScored !== "boolean") {
      throw new Error(
        `Invalid reverseScored value for question ${question.id}; expected boolean.`
      );
    }
    if (question.scoringRule !== "Likert 1-5") {
      throw new Error(
        `Invalid scoring rule for question ${question.id}; expected 'Likert 1-5'.`
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
        `${temperament} must have exactly 60 items, found ${temperamentCounts[temperament]}.`
      );
    }

    const temperamentDimensions = dimensionCounts[temperament];
    const dimensionNames = Object.keys(temperamentDimensions);
    if (dimensionNames.length !== 3) {
      throw new Error(
        `${temperament} must have exactly 3 dimensions, found ${dimensionNames.length}.`
      );
    }

    dimensionNames.forEach((dimension) => {
      if (temperamentDimensions[dimension] !== 20) {
        throw new Error(
          `${temperament}/${dimension} must have 20 items, found ${temperamentDimensions[dimension]}.`
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
        `Invalid CSV row at line ${index + 2}: expected ${headers.length} fields, found ${values.length}.`
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
  const pageQuestions = state.questions.slice(startIndex, startIndex + PAGE_SIZE);
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
      const thumbScale = 1 + (Math.abs(currentValue - 3) * 0.15);

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
  questionPage.querySelectorAll('.question-range').forEach((input) => {
    const questionId = input.name;
    const question = state.questions.find((q) => q.id === questionId);
    const labels = getScaleLabels(question.scoringRule);
    const labelDisplay = document.getElementById(`label-val-${questionId}`);

    const updateValue = (val) => {
      state.responses[questionId] = Number(val);
      labelDisplay.innerHTML = labels[val - 1];
      input.setAttribute("data-answered", "true");
      const scale = 1 + (Math.abs(val - 3) * 0.15);
      input.style.setProperty("--thumb-scale", scale);
      pageWarning.classList.add("hidden");
      syncProgressOnly();
      saveProgress();
    };

    input.addEventListener("input", (event) => {
      const val = event.target.value;
      labelDisplay.innerHTML = labels[val - 1];
      const scale = 1 + (Math.abs(val - 3) * 0.15);
      input.style.setProperty('--thumb-scale', scale);
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
    `Answered ${answered} of ${total}`
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

  const dominant = TEMPERAMENTS[Math.floor(Math.random() * TEMPERAMENTS.length)];
  const secondaryPool = TEMPERAMENTS.filter(
    (temperament) => temperament !== dominant
  );
  const secondary =
    secondaryPool[Math.floor(Math.random() * secondaryPool.length)];

  state.questions.forEach((question) => {
    state.responses[question.id] = getSimulatedResponseValue(
      question,
      dominant,
      secondary
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
  const pageQuestions = state.questions.slice(startIndex, startIndex + PAGE_SIZE);
  return pageQuestions.every((question) => state.responses[question.id]);
}

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
    const value = state.responses[question.id];
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
      phlegmatic: mixPercentages["Phlegmatic"]
    }
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

  detailStrengths.innerHTML = strengths.map((item) => `<li>${item}</li>`).join("");
  detailWeaknesses.innerHTML = weaknesses.map((item) => `<li>${item}</li>`).join("");
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

  state.detailVisible = false;
  resultDetail.classList.add("hidden");
  detailToggle.textContent = "Show Detailed Explanation";

  trackEvent(ANALYTICS_EVENTS.assessmentCompleted, {
    depth: state.selectedDepth,
    duration_seconds: durationSeconds,
    confidence_level: confidenceLevel,
  });
  clearProgress();
  scrollToPanel(resultsPanel, "smooth");
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
      message:
        "Your top pattern is clearly distinct in this response set.",
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

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (_error) {
    // Ignore storage failures (e.g., private mode or blocked storage).
  }
}

function restoreProgressIfAvailable() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (_error) {
    return;
  }
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

  if (!saved || !VALID_DEPTHS.includes(saved.selectedDepth)) {
    clearProgress();
    return;
  }

  const questions = buildQuestionSet(saved.selectedDepth, saved.questionOrder);
  const validIds = new Set(questions.map((question) => question.id));
  const restoredResponses = {};

  Object.entries(saved.responses || {}).forEach(([questionId, value]) => {
    const numericValue = Number(value);
    if (validIds.has(questionId) && numericValue >= 1 && numericValue <= 5) {
      restoredResponses[questionId] = numericValue;
    }
  });

  const totalPages = Math.ceil(questions.length / PAGE_SIZE);
  state.selectedDepth = saved.selectedDepth;
  state.questions = questions;
  state.responses = restoredResponses;
  state.currentPage = clamp(Number(saved.currentPage) || 0, 0, totalPages - 1);
  state.detailVisible = false;
  state.startedAt =
    Number.isFinite(saved.startedAt) && saved.startedAt > 0
      ? saved.startedAt
      : Date.now();
  state.completionTracked = false;
  state.abandonmentTracked = false;
  state.resultMeta = null;

  const depthInput = document.querySelector(
    `input[name="depth"][value="${state.selectedDepth}"]`
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
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_error) {
    // Ignore storage failures (e.g., private mode or blocked storage).
  }
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
  if (normalized === "high" || normalized === "medium" || normalized === "low") {
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

  let remainder =
    100 - floors.reduce((sum, entry) => sum + entry.value, 0);
  floors
    .slice()
    .sort((a, b) => b.fraction - a.fraction)
    .forEach((entry) => {
      if (remainder > 0) {
        const target = floors.find(
          (candidate) => candidate.temperament === entry.temperament
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
  temperamentLegend.innerHTML = displayOrder.map((temperament) => {
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
  }).join("");
}

function renderTemperamentDonut(percentages, displayOrder) {
  const canvas = document.getElementById("temperament-donut");
  if (!canvas || typeof window.Chart !== "function") {
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
            (temperament) => TEMPERAMENT_COLORS[temperament]
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

function trackEvent(name, props = {}) {
  try {
    if (typeof window === "undefined" || typeof window.plausible !== "function") {
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
    Phlegmatic: payload.mix.phlegmatic
  };

  const confidenceLevel = normalizeConfidenceLevel(confidenceLevelFromPayload);
  const confidencePercentValue = getConfidencePercent(confidenceLevel);

  // Capitalize confidence representation
  const confidenceDisplayLevel = confidenceLevel.charAt(0).toUpperCase() + confidenceLevel.slice(1);

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

  detailStrengths.innerHTML = strengths.map((item) => `<li>${item}</li>`).join("");
  detailWeaknesses.innerHTML = weaknesses.map((item) => `<li>${item}</li>`).join("");
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
    confidenceMessage.textContent = "Your top pattern is clearly distinct in this response set.";
  } else if (confidenceLevel === "medium") {
    confidenceMessage.textContent = "Your leading pattern is present, with noticeable overlap from your secondary pattern.";
  } else {
    confidenceMessage.textContent = "Your responses show a blended profile, so treat this as a starting reflection rather than a fixed label.";
  }
  confidencePercent.textContent = `${confidencePercentValue}%`;
  confidenceLabel.textContent = confidenceLevel;
  confidenceRing.style.setProperty("--confidence-fill", confidencePercentValue);
  primaryPercentLabel.textContent = `${mixPercentages[primary]}%`;

  // We explicitly bypass getting ranked data since we don't have it natively, so we just sort the mix percentages array.
  const displayOrder = [...TEMPERAMENTS].sort((a, b) => mixPercentages[b] - mixPercentages[a]);

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

  state.detailVisible = false;
  resultDetail.classList.add("hidden");
  detailToggle.textContent = "Show Detailed Explanation";

  // Hide the "Take Another Test" button or modify its behavior to clear hash and restart to avoid taking another test within hash context, we just hide the restart controls natively.
  const restartButton = document.querySelector(".result-restart");
  if (restartButton) {
    restartButton.href = "test-options.html";
    // The regular href cleans the hash simply by reloading cleanly.
  }
}
