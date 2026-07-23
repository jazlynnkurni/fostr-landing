// Founder copy, VERBATIM. Do not edit wording. Each tooltip is the question the next panel answers.
export const PANELS = [
  { id: 1, phase: "problem", badge: "early access",
    text: "Most of a caseworker's day never reaches a kid.",
    tooltip: "where does it go?" },
  { id: 2, phase: "problem",
    text: "It goes into forms. Intake, case notes, court prep, the state's system — the same facts, typed over and over.",
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
    text: "We're starting with child welfare, alongside the people already doing the work. Group homes, elder care, anywhere reporting is eating the job — that comes next.",
    tooltip: "why us?" },
  { id: 7, phase: "founder",
    text: "I was in the Massachusetts foster care system. The people responsible for me cared. They also had a stack of forms taller than I was. That's why Fostr exists.",
    attribution: "Jaden, founder" },
  { id: 8, phase: "cta",
    text: "Book 20 minutes with Jaden",
    secondary: "Email Jaden" },
];
export const BUSINESS_LINE = "PILOTING WITH CHILD-WELFARE AGENCIES IN MASSACHUSETTS";
export const DEMO_DOCS = ["Intake", "Case notes", "Court prep", "State system"];
export const TRACE_EXAMPLE = {
  filingLine: "The child was present at the placement on March 14 and reported feeling safe.",
  sourceNote: "Visit note — 03/14: K. at kinship placement, doing homework at the kitchen table. Said she feels safe here.",
  provenance: "TRACED TO VISIT 03/14",
};
