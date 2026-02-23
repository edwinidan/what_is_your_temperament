// ==========================================
// TEMPERAMENT CONTENT TEXT MAP
// ==========================================
// This file centralizes the text content for the printable PDF report.
// It matches the existing content from app.js to ensure consistency.

const TEMPERAMENT_CONTENT = {
    sanguine: {
        name: "Sanguine",
        tagline: "The Expressive Spark",
        shortSummary: "Your responses suggest an outward-facing style that often gains energy from interaction, momentum, and variety.",
        strengths: [
            "You can quickly build rapport and make social spaces feel welcoming.",
            "You often adapt smoothly when circumstances shift.",
            "You tend to bring visible encouragement to group environments."
        ],
        weaknesses: [
            "You may move into action before fully clarifying details.",
            "Sustained repetition can feel draining and reduce focus.",
            "High enthusiasm can occasionally overshadow quieter perspectives."
        ],
        communication: "You often communicate with warmth, spontaneity, and visible emotion. Clarity improves when you pause to organize key points before responding.",
        confidenceCopy: {
            high: "Your top pattern is clearly distinct in this response set.",
            medium: "Your leading pattern is present, with noticeable overlap from your secondary pattern.",
            low: "Your responses show a blended profile, so treat this as a starting reflection rather than a fixed label."
        }
    },
    choleric: {
        name: "Choleric",
        tagline: "The Driven Builder",
        shortSummary: "Your responses suggest a goal-directed style that prefers initiative, structure, and measurable progress.",
        strengths: [
            "You often provide direction when situations are unclear.",
            "You are comfortable making decisions and advancing priorities.",
            "You tend to stay focused on outcomes under pressure."
        ],
        weaknesses: [
            "You may appear overly forceful when urgency is high.",
            "Patience can drop when processes feel slow.",
            "You may underemphasize emotional nuance during problem-solving."
        ],
        communication: "You typically communicate directly and concisely with clear expectations. Relational trust strengthens when directness is paired with space for others to process.",
        confidenceCopy: {
            high: "Your top pattern is clearly distinct in this response set.",
            medium: "Your leading pattern is present, with noticeable overlap from your secondary pattern.",
            low: "Your responses show a blended profile, so treat this as a starting reflection rather than a fixed label."
        }
    },
    melancholic: {
        name: "Melancholic",
        tagline: "The Thoughtful Soul",
        shortSummary: "Your responses suggest a reflective style that values depth, quality, consistency, and careful evaluation.",
        strengths: [
            "You often notice important details that others overlook.",
            "You are motivated by accuracy and thoughtful preparation.",
            "You tend to show steady responsibility toward commitments."
        ],
        weaknesses: [
            "You may remain on unresolved concerns for longer than needed.",
            "Ambiguous expectations can increase internal strain.",
            "Perfection pressure can delay completion or delegation."
        ],
        communication: "You often communicate thoughtfully, with careful wording and context. Shared understanding improves when you signal priorities before diving into details.",
        confidenceCopy: {
            high: "Your top pattern is clearly distinct in this response set.",
            medium: "Your leading pattern is present, with noticeable overlap from your secondary pattern.",
            low: "Your responses show a blended profile, so treat this as a starting reflection rather than a fixed label."
        }
    },
    phlegmatic: {
        name: "Phlegmatic",
        tagline: "The Steady Anchor",
        shortSummary: "Your responses suggest a steady style that values calm, harmony, and consistent pacing across relationships and tasks.",
        strengths: [
            "You often remain composed during interpersonal tension.",
            "You listen patiently and help stabilize group dynamics.",
            "You provide reliable follow-through in ongoing responsibilities."
        ],
        weaknesses: [
            "You may delay difficult conversations to preserve harmony.",
            "Fast pivots can feel disruptive and reduce engagement.",
            "You may understate your needs in highly assertive environments."
        ],
        communication: "You typically communicate in a calm, measured way and create space for others to speak. Momentum increases when you state your preferences earlier in discussions.",
        confidenceCopy: {
            high: "Your top pattern is clearly distinct in this response set.",
            medium: "Your leading pattern is present, with noticeable overlap from your secondary pattern.",
            low: "Your responses show a blended profile, so treat this as a starting reflection rather than a fixed label."
        }
    }
};
