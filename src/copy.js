// Founder copy, VERBATIM. Do not edit wording. Each tooltip is the question the next panel answers.
export const PANELS = [
  { id: 1, phase: "problem", badge: "early access",
    text: "Most of a caseworker's day never reaches a kid.",
    tooltip: "where does it go?" },
  { id: 2, phase: "problem",
    text: "It goes into forms. Intake, case notes, court prep, the state's system. The same facts, typed over and over.",
    tooltip: "whose fault is that?" },
  { id: 3, phase: "problem",
    text: "Not the worker's. No one chose this career for their love of paperwork.",
    tooltip: "so what do you do?" },
  { id: 4, phase: "solution",
    text: "Fostr takes it down once, during the visit, and sends it everywhere it's owed.",
    tooltip: "and it's accurate?" },
  { id: 5, phase: "solution",
    text: "Court filings can't be mostly right. Every line Fostr produces traces back to something in the record. No guessing.",
    tooltip: "who is this for?" },
  { id: 6, phase: "solution",
    text: "We're starting with child welfare, alongside the people already doing the work. Group homes, elder care, anywhere reporting is eating the job. That comes next.",
    tooltip: "why us?" },
  { id: 7, phase: "founder",
    text: "I was in the Massachusetts foster care system. The people responsible for me cared. They also had a stack of forms taller than I was. That's why Fostr exists.",
    attribution: "Jaden, founder" },
  { id: 8, phase: "cta",
    text: "Book 20 minutes with Jaden",
    secondary: "Email Jaden" },
];
export const BUSINESS_LINE = "PILOTING WITH CHILD-WELFARE AGENCIES IN MASSACHUSETTS";

// Contact / booking. TODO: swap in Jaden's real Cal.com link + contact email.
export const CAL_URL = "https://cal.com/jaden"; // TODO: replace with Jaden's real Cal.com link
export const CONTACT_EMAIL = "jaden@hireu.app";

// Hardcoded for now; later dynamic. Grounded in the founder copy, no new claims.
export const FAQS = [
  { q: "What does Fostr actually do?",
    a: "A caseworker captures the information once, during the visit, and Fostr sends it everywhere it's owed: intake, case notes, court prep, and the state's system. The same facts, entered once instead of typed over and over." },
  { q: "Is what it produces accurate enough for court?",
    a: "Every line Fostr produces traces back to something in the record. Nothing is guessed or invented, so a filing is never \"mostly right.\"" },
  { q: "Does it replace caseworkers?",
    a: "No. Fostr takes the paperwork off their plate so more of their day can reach the people they're there for. The work, and the judgment, stays theirs." },
  { q: "Who is it for right now?",
    a: "We're starting with child welfare, alongside the people already doing the work. Group homes, elder care, and anywhere reporting is eating the job come next." },
  { q: "Where are you piloting?",
    a: "We're piloting with child-welfare agencies in Massachusetts." },
  { q: "How do I see it in action?",
    a: "Book 20 minutes with Jaden, the founder. He'll walk you through a real workflow and answer anything." },
];
export const DEMO_DOCS = ["Intake", "Case notes", "Court prep", "State system"];
export const TRACE_EXAMPLE = {
  filingLine: "The child was present at the placement on March 14 and reported feeling safe.",
  sourceNote: "Visit note 03/14: K. at kinship placement, doing homework at the kitchen table. Said she feels safe here.",
  provenance: "TRACED TO VISIT 03/14",
};
