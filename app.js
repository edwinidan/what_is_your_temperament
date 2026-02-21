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
  Sanguine: "#d97706",
  Choleric: "#b91c1c",
  Melancholic: "#468254",
  Phlegmatic: "#047857",
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

const QUESTION_SEEDS = {
  Sanguine: [
    {
      type: "situational",
      text: "In new social settings, I usually start conversations early.",
    },
    {
      type: "behavioral",
      text: "I look for chances to keep group energy positive.",
    },
    {
      type: "emotional",
      text: "I feel energized when sharing experiences with others.",
    },
    {
      type: "situational",
      text: "When plans change suddenly, I can adapt and stay upbeat.",
    },
    {
      type: "behavioral",
      text: "I speak my thoughts before fully refining them.",
    },
    {
      type: "emotional",
      text: "Extended quiet periods leave me feeling restless.",
    },
    {
      type: "situational",
      text: "In team projects, I volunteer for outward-facing roles.",
    },
    {
      type: "behavioral",
      text: "I often use humor to ease tension in a room.",
    },
    {
      type: "emotional",
      text: "I recover quickly after minor social setbacks.",
    },
    {
      type: "situational",
      text: "I prefer activities with variety over strict routine.",
    },
    {
      type: "behavioral",
      text: "I maintain broad connections rather than a few deep ones.",
    },
    {
      type: "emotional",
      text: "I feel motivated by visible enthusiasm from people around me.",
    },
    {
      type: "situational",
      text: "During meetings, I am comfortable improvising.",
    },
    {
      type: "behavioral",
      text: "I decide quickly when an option seems exciting.",
    },
    {
      type: "emotional",
      text: "I feel constrained when interactions are highly formal.",
    },
  ],
  Choleric: [
    {
      type: "situational",
      text: "In uncertain situations, I naturally move toward taking charge.",
    },
    {
      type: "behavioral",
      text: "I set clear goals and push for measurable progress.",
    },
    {
      type: "emotional",
      text: "Slow decision-making around me can feel frustrating.",
    },
    {
      type: "situational",
      text: "When deadlines tighten, I become more directive.",
    },
    {
      type: "behavioral",
      text: "I challenge ideas directly when I see inefficiency.",
    },
    {
      type: "emotional",
      text: "I feel satisfied when effort leads to concrete results.",
    },
    {
      type: "situational",
      text: "In conflict, I focus first on resolution and action.",
    },
    {
      type: "behavioral",
      text: "I prioritize tasks by impact rather than comfort.",
    },
    {
      type: "emotional",
      text: "I remain confident when others hesitate.",
    },
    {
      type: "situational",
      text: "I prefer roles with authority over key decisions.",
    },
    {
      type: "behavioral",
      text: "I communicate expectations in a concise, firm way.",
    },
    {
      type: "emotional",
      text: "I feel restless when progress is unclear.",
    },
    {
      type: "situational",
      text: "In group work, I naturally track who owns each deliverable.",
    },
    {
      type: "behavioral",
      text: "I make decisions even with incomplete information.",
    },
    {
      type: "emotional",
      text: "I feel motivated by challenges that require persistence.",
    },
  ],
  Melancholic: [
    {
      type: "situational",
      text: "Before committing, I evaluate details carefully.",
    },
    {
      type: "behavioral",
      text: "I keep systems and plans organized.",
    },
    {
      type: "emotional",
      text: "I notice subtle emotional shifts in myself and others.",
    },
    {
      type: "situational",
      text: "I prepare alternatives before starting important tasks.",
    },
    {
      type: "behavioral",
      text: "I revise my work to improve accuracy.",
    },
    {
      type: "emotional",
      text: "Unresolved mistakes stay on my mind.",
    },
    {
      type: "situational",
      text: "I prefer clear expectations before beginning.",
    },
    {
      type: "behavioral",
      text: "I track commitments so nothing is overlooked.",
    },
    {
      type: "emotional",
      text: "I feel uneasy when standards are vague.",
    },
    {
      type: "situational",
      text: "In group decisions, I raise potential risks early.",
    },
    {
      type: "behavioral",
      text: "I think deeply before expressing strong opinions.",
    },
    {
      type: "emotional",
      text: "I feel responsible for the quality of outcomes.",
    },
    {
      type: "situational",
      text: "I favor planned schedules over spontaneous changes.",
    },
    {
      type: "behavioral",
      text: "I value thorough feedback, even when critical.",
    },
    {
      type: "emotional",
      text: "I take time to process emotional experiences fully.",
    },
  ],
  Phlegmatic: [
    {
      type: "situational",
      text: "During tension, I help keep interactions calm.",
    },
    {
      type: "behavioral",
      text: "I listen fully before responding.",
    },
    {
      type: "emotional",
      text: "I feel most comfortable in steady, predictable environments.",
    },
    {
      type: "situational",
      text: "In disagreements, I look for common ground.",
    },
    {
      type: "behavioral",
      text: "I support team needs consistently, even in background roles.",
    },
    {
      type: "emotional",
      text: "I remain composed when others become reactive.",
    },
    {
      type: "situational",
      text: "When priorities conflict, I seek balance rather than urgency.",
    },
    {
      type: "behavioral",
      text: "I prefer deliberate pacing over rapid shifts.",
    },
    {
      type: "emotional",
      text: "I value harmony more than being the center of attention.",
    },
    {
      type: "situational",
      text: "I adapt by observing first and acting after context is clear.",
    },
    {
      type: "behavioral",
      text: "I maintain routines that reduce unnecessary stress.",
    },
    {
      type: "emotional",
      text: "I feel drained by prolonged confrontation.",
    },
    {
      type: "situational",
      text: "I mediate when people have different working styles.",
    },
    {
      type: "behavioral",
      text: "I stay patient with repetitive or routine tasks.",
    },
    {
      type: "emotional",
      text: "I feel steady even when outcomes are uncertain.",
    },
  ],
};

const QUESTION_BANK = TEMPERAMENTS.reduce((acc, temperament) => {
  acc[temperament] = QUESTION_SEEDS[temperament].map((seed, index) => ({
    ...seed,
    id: `${temperament.charAt(0)}-${index + 1}`,
    temperament,
  }));
  return acc;
}, {});

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
};
let temperamentDonutChart = null;

const introPanel = document.getElementById("intro-panel");
const assessmentPanel = document.getElementById("assessment-panel");
const resultsPanel = document.getElementById("results-panel");
const startButton = document.getElementById("start-btn");
const prevButton = document.getElementById("prev-btn");
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
nextButton.addEventListener("click", goToNextPage);
detailToggle.addEventListener("click", toggleDetailView);
window.addEventListener("pagehide", handlePageHide);
restoreProgressIfAvailable();

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

function buildQuestionSet(depth) {
  const perTemperament = depth / TEMPERAMENTS.length;
  const chosenByTemperament = TEMPERAMENTS.reduce((acc, temperament) => {
    acc[temperament] = QUESTION_BANK[temperament].slice(0, perTemperament);
    return acc;
  }, {});

  const interleaved = [];
  for (let cycle = 0; cycle < perTemperament; cycle += 1) {
    for (let t = 0; t < TEMPERAMENTS.length; t += 1) {
      const temperament = TEMPERAMENTS[t];
      const offsetIndex = (cycle + t) % perTemperament;
      interleaved.push(chosenByTemperament[temperament][offsetIndex]);
    }
  }

  return interleaved.map((question, index) => ({
    ...question,
    ordinal: index + 1,
  }));
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
      const labels = getScaleLabels(question.type);
      const currentValue = state.responses[question.id] || 3;
      const hasResponse = !!state.responses[question.id];
      const thumbScale = 1 + (Math.abs(currentValue - 3) * 0.15);

      return `
        <article class="question-card">
          <div class="question-top">
            <span class="question-type">${question.type}</span>
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
  nextButton.textContent =
    state.currentPage === pageCount - 1 ? "View Results" : "Next";
  pageWarning.classList.add("hidden");

  trackEvent(ANALYTICS_EVENTS.assessmentPageViewed, {
    depth: state.selectedDepth,
    page_index: state.currentPage + 1,
  });
}

function bindQuestionListeners() {
  questionPage.querySelectorAll('.question-range').forEach((input) => {
    const questionId = input.name;
    const question = state.questions.find(q => q.id === questionId);
    const labels = getScaleLabels(question.type);
    const labelDisplay = document.getElementById(`label-val-${questionId}`);

    const updateValue = (val) => {
      state.responses[questionId] = Number(val);
      labelDisplay.innerHTML = labels[val - 1];
      input.setAttribute('data-answered', 'true');
      const scale = 1 + (Math.abs(val - 3) * 0.15);
      input.style.setProperty('--thumb-scale', scale);
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
      if (input.getAttribute('data-answered') === 'false') {
        updateValue(input.value);
      }
    });
    input.addEventListener("touchstart", () => {
      if (input.getAttribute('data-answered') === 'false') {
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
    scores[question.temperament] += centered;
    signal[question.temperament] += Math.abs(centered);
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
  renderTemperamentLegend(mixPercentages);
  renderTemperamentDonut(mixPercentages);
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

  const questions = buildQuestionSet(saved.selectedDepth);
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

function getScaleLabels(type) {
  if (type === "emotional") {
    return ["Not at all", "Slightly", "Moderately", "Mostly", "Very much"];
  }
  if (type === "situational") {
    return ["Very unlikely", "Unlikely", "Unsure", "Likely", "Very likely"];
  }
  return [
    "Strongly disagree",
    "Disagree",
    "Neutral",
    "Agree",
    "Strongly agree",
  ];
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

function renderTemperamentLegend(percentages) {
  temperamentLegend.innerHTML = TEMPERAMENTS.map((temperament) => {
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

function renderTemperamentDonut(percentages) {
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
      labels: TEMPERAMENTS,
      datasets: [
        {
          data: TEMPERAMENTS.map((temperament) => percentages[temperament]),
          backgroundColor: TEMPERAMENTS.map(
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
    const rankingIndex = (ranked || []).reduce((acc, entry, index) => {
      acc[entry.temperament] = index;
      return acc;
    }, {});

    const columns = Array.from(scoreGrid.querySelectorAll(".score-col"));
    columns
      .sort((a, b) => {
        const tempA = a.dataset.temp;
        const tempB = b.dataset.temp;
        const percentA = percentages[tempA] ?? 0;
        const percentB = percentages[tempB] ?? 0;
        const diff = percentB - percentA;

        if (diff !== 0) {
          return diff;
        }

        const rankA = rankingIndex[tempA];
        const rankB = rankingIndex[tempB];
        if (Number.isFinite(rankA) && Number.isFinite(rankB)) {
          return rankA - rankB;
        }

        return TEMPERAMENTS.indexOf(tempA) - TEMPERAMENTS.indexOf(tempB);
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
