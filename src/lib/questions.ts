// Seed question bank for the VEX IQ Role Readiness Assessment.
//
// All concepts are paraphrased in original wording for educational use.
// No official game manual text is copied. Questions are in English.
//
// The bank has TWO kinds of questions:
//
//  1. "knowledge"  — Competition Understanding. These DO have a correct answer
//     and measure whether the student understands VEX IQ expectations, safety,
//     rules, student-centered work, and basic role responsibilities. They are
//     written so the correct answer is NOT obviously the longest or the only
//     "good-behavior" option — distractors are plausible-but-weaker. Knowledge
//     questions do NOT contribute to role tendency.
//
//  2. "tendency"   — Role Tendency / Thinking Style. These have NO wrong answer.
//     Every option is a reasonable thing a VEX IQ student might do; each option
//     simply maps to a different role. They are the main driver of the suggested
//     focus. Picking a role's option adds one tendency point to that role.
//
// Keeping the two kinds separate is what stops "knowing the right answer" from
// deciding a student's role, and stops one broad role (e.g. Team Collaborator)
// from winning just because a student chooses sensible answers.

import type { RoleKey } from "./roles";

export type QuestionKind = "knowledge" | "tendency";

/** A choice on a knowledge question: it is either correct (1) or not (0). */
export interface KnowledgeChoice {
  id: string;
  text: string;
  correctnessScore: 0 | 1;
}

export interface KnowledgeQuestion {
  id: string;
  kind: "knowledge";
  text: string;
  category: string;
  choices: KnowledgeChoice[];
  correctChoiceId: string;
  /** Feedback shown for the correct answer. */
  feedback: string;
}

/** A choice on a tendency question: no correctness, just the role it reflects. */
export interface TendencyChoice {
  id: string;
  text: string;
  role: RoleKey;
}

export interface TendencyQuestion {
  id: string;
  kind: "tendency";
  text: string;
  category: string;
  choices: TendencyChoice[];
}

export type Question = KnowledgeQuestion | TendencyQuestion;

export function isKnowledgeQuestion(q: Question): q is KnowledgeQuestion {
  return q.kind === "knowledge";
}

export function isTendencyQuestion(q: Question): q is TendencyQuestion {
  return q.kind === "tendency";
}

// ---------------------------------------------------------------------------
// Knowledge / Competition Understanding questions (have correct answers).
// Distractors are plausible misconceptions, not absurd; lengths are balanced so
// the correct answer is not a length giveaway and is not always the longest.
// Correct positions are spread across A/B/C/D.
// ---------------------------------------------------------------------------

const KNOWLEDGE_QUESTIONS: KnowledgeQuestion[] = [
  {
    id: "k1",
    kind: "knowledge",
    category: "Builder",
    correctChoiceId: "a",
    text: "A robot's lifting arm works at first but starts to sag after several matches. What should the team check first?",
    feedback:
      "Sagging usually comes from loose or worn mechanical parts, so a builder checks the structure first.",
    choices: [
      { id: "a", text: "Whether the gears, axles, or joints have loosened or worn.", correctnessScore: 1 },
      { id: "b", text: "Whether the driver has practised using the arm enough.", correctnessScore: 0 },
      { id: "c", text: "Whether a stronger motor would cover up the problem.", correctnessScore: 0 },
      { id: "d", text: "Whether the arm is simply being used too often.", correctnessScore: 0 },
    ],
  },
  {
    id: "k2",
    kind: "knowledge",
    category: "Builder",
    correctChoiceId: "c",
    text: "The robot drifts to one side instead of driving straight. What is the most likely mechanical cause?",
    feedback:
      "Drifting usually means the two drive sides are not matched — check friction, wheels, and connections.",
    choices: [
      { id: "a", text: "The field tiles are reflecting too much light into the sensors.", correctnessScore: 0 },
      { id: "b", text: "The robot needs a completely redesigned chassis.", correctnessScore: 0 },
      { id: "c", text: "One drive side has more friction or a loose wheel.", correctnessScore: 1 },
      { id: "d", text: "The driver is not holding the joystick firmly enough.", correctnessScore: 0 },
    ],
  },
  {
    id: "k3",
    kind: "knowledge",
    category: "Programmer",
    correctChoiceId: "b",
    text: "An autonomous routine drives too far on some runs and too short on others. What is the best first step?",
    feedback:
      "Inconsistent movement is best found by isolating and testing one step at a time.",
    choices: [
      { id: "a", text: "Rewrite the entire program again from the very beginning.", correctnessScore: 0 },
      { id: "b", text: "Test one movement at a time and compare the results.", correctnessScore: 1 },
      { id: "c", text: "Run the program faster so the errors matter less.", correctnessScore: 0 },
      { id: "d", text: "Switch to driving the robot by hand instead.", correctnessScore: 0 },
    ],
  },
  {
    id: "k4",
    kind: "knowledge",
    category: "Programmer / Student-Centered",
    correctChoiceId: "d",
    text: "A team uses code from the internet but cannot explain how it works. Why is this a problem in VEX IQ?",
    feedback:
      "VEX IQ is student-centered — students need to understand and explain their own code.",
    choices: [
      { id: "a", text: "It is never a problem; working code is always enough.", correctnessScore: 0 },
      { id: "b", text: "Only the teacher really needs to understand the code.", correctnessScore: 0 },
      { id: "c", text: "Downloaded code always runs slower on the robot.", correctnessScore: 0 },
      { id: "d", text: "Students should be able to understand and explain their own code.", correctnessScore: 1 },
    ],
  },
  {
    id: "k5",
    kind: "knowledge",
    category: "Driver",
    correctChoiceId: "b",
    text: "It is the last 15 seconds of a close match and your robot is mid-field. What is usually the stronger choice?",
    feedback:
      "With little time left, completing sure points usually beats a risky attempt that may not finish.",
    choices: [
      { id: "a", text: "Attempt the risky long route to the single highest goal.", correctnessScore: 0 },
      { id: "b", text: "Finish the reliable scoring you can complete in time.", correctnessScore: 1 },
      { id: "c", text: "Stop early to avoid making any mistakes.", correctnessScore: 0 },
      { id: "d", text: "Copy whatever the alliance partner is doing.", correctnessScore: 0 },
    ],
  },
  {
    id: "k6",
    kind: "knowledge",
    category: "Driver",
    correctChoiceId: "a",
    text: "Your team has only a few short practice sessions before a competition. Which plan helps the driver improve most?",
    feedback:
      "Drivers improve fastest from focused, timed practice on real routes plus reviewing mistakes.",
    choices: [
      { id: "a", text: "Run timed drills on real routes and review the mistakes.", correctnessScore: 1 },
      { id: "b", text: "Free-drive around the field with no specific goal.", correctnessScore: 0 },
      { id: "c", text: "Only practise the routes that already feel easy.", correctnessScore: 0 },
      { id: "d", text: "Practise once and rely on autonomous for the rest.", correctnessScore: 0 },
    ],
  },
  {
    id: "k7",
    kind: "knowledge",
    category: "Notebooker",
    correctChoiceId: "d",
    text: "Which engineering-notebook entry gives judges the most useful information?",
    feedback:
      "Strong notebook entries record the reason for a change and the data from testing it.",
    choices: [
      { id: "a", text: "\"We worked on the robot today and it went well.\"", correctnessScore: 0 },
      { id: "b", text: "\"The robot is finished now and it looks really good.\"", correctnessScore: 0 },
      { id: "c", text: "\"We adjusted several parts during the session and the robot now seems to work better overall.\"", correctnessScore: 0 },
      { id: "d", text: "\"We changed the gear ratio to 3:1 for torque; it then lifted the load 4 of 5 tries.\"", correctnessScore: 1 },
    ],
  },
  {
    id: "k8",
    kind: "knowledge",
    category: "Notebooker",
    correctChoiceId: "c",
    text: "Your team is inspired by another team's mechanism. What is the right way to use that idea?",
    feedback:
      "Honest notebooks credit inspiration and show the team's own changes and improvements.",
    choices: [
      { id: "a", text: "Copy it exactly and present it as your own.", correctnessScore: 0 },
      { id: "b", text: "Avoid mentioning it anywhere so that no one asks any questions.", correctnessScore: 0 },
      { id: "c", text: "Credit the inspiration and document how your team changed it.", correctnessScore: 1 },
      { id: "d", text: "Use it only if no other team finds out.", correctnessScore: 0 },
    ],
  },
  {
    id: "k9",
    kind: "knowledge",
    category: "Strategist",
    correctChoiceId: "a",
    text: "A field has both long open routes and narrow shortcuts. What should a strategist weigh when choosing?",
    feedback:
      "Strategy compares routes by time, risk, reliability, and scoring value — not by appearance.",
    choices: [
      { id: "a", text: "Time, reliability, risk, and the points each route scores.", correctnessScore: 1 },
      { id: "b", text: "Only which of the routes looks the most impressive to watch.", correctnessScore: 0 },
      { id: "c", text: "Whichever route the fastest robot would take.", correctnessScore: 0 },
      { id: "d", text: "The route with the brightest game pieces.", correctnessScore: 0 },
    ],
  },
  {
    id: "k10",
    kind: "knowledge",
    category: "Strategist",
    correctChoiceId: "b",
    text: "Your alliance partner's robot scores well on high goals. What is the smartest plan for your robot?",
    feedback:
      "Good alliances divide the work so each robot uses its strengths instead of overlapping.",
    choices: [
      { id: "a", text: "Compete for the same high goals to be safe.", correctnessScore: 0 },
      { id: "b", text: "Focus on the goals your partner is not covering.", correctnessScore: 1 },
      { id: "c", text: "Block the partner so it does not get in the way.", correctnessScore: 0 },
      { id: "d", text: "Wait and copy the partner's moves each time.", correctnessScore: 0 },
    ],
  },
  {
    id: "k11",
    kind: "knowledge",
    category: "Rules / Safety",
    correctChoiceId: "c",
    text: "The match has just ended and the referee is still confirming the score. What should the team do?",
    feedback:
      "Rules-aware teams leave everything in place and let the referee confirm the score first.",
    choices: [
      { id: "a", text: "Move the robot off to the side right away so it is ready for the next match.", correctnessScore: 0 },
      { id: "b", text: "Tidy the game pieces on the field to be helpful.", correctnessScore: 0 },
      { id: "c", text: "Leave the robot and pieces in place until the referee confirms the score.", correctnessScore: 1 },
      { id: "d", text: "Tell the referee which score the team believes is right.", correctnessScore: 0 },
    ],
  },
  {
    id: "k12",
    kind: "knowledge",
    category: "Rules / Safety",
    correctChoiceId: "d",
    text: "Your team is unsure whether a robot modification is legal. What is the best first step?",
    feedback:
      "When unsure, rules-aware teams check the current manual and use official clarification channels.",
    choices: [
      { id: "a", text: "Assume the modification is allowed unless another team decides to complain.", correctnessScore: 0 },
      { id: "b", text: "Use the rules from last year's competition.", correctnessScore: 0 },
      { id: "c", text: "Ask a nearby spectator what they think.", correctnessScore: 0 },
      { id: "d", text: "Read the current game manual and ask an official question if still unclear.", correctnessScore: 1 },
    ],
  },
  {
    id: "k13",
    kind: "knowledge",
    category: "Student-Centered",
    correctChoiceId: "b",
    text: "An adult offers to rewrite your engineering notebook so it sounds more professional. What should the students do?",
    feedback:
      "The notebook must stay in the students' own voice — adults can give feedback, not rewrite it.",
    choices: [
      { id: "a", text: "Accept the offer, because adults usually write more professionally than students do.", correctnessScore: 0 },
      { id: "b", text: "Keep it in their own words and ask only for general feedback.", correctnessScore: 1 },
      { id: "c", text: "Let the adult write the whole notebook this time.", correctnessScore: 0 },
      { id: "d", text: "Stop keeping a notebook to avoid the problem.", correctnessScore: 0 },
    ],
  },
  {
    id: "k14",
    kind: "knowledge",
    category: "Student-Centered",
    correctChoiceId: "a",
    text: "Which statement best describes a student-centered VEX IQ team?",
    feedback:
      "A student-centered team shares the work and the students can explain their own robot.",
    choices: [
      { id: "a", text: "Students share the work and can explain their own robot.", correctnessScore: 1 },
      { id: "b", text: "One strong student does all of the important work.", correctnessScore: 0 },
      { id: "c", text: "Adults build and program while the students watch.", correctnessScore: 0 },
      { id: "d", text: "The team focuses only on driving and ignores the design, the code, and the notebook.", correctnessScore: 0 },
    ],
  },
  {
    id: "k15",
    kind: "knowledge",
    category: "Teamwork",
    correctChoiceId: "c",
    text: "Two teammates disagree about which design to use. What is the strongest way to decide?",
    feedback:
      "Strong teams test ideas and compare evidence respectfully instead of deciding by volume.",
    choices: [
      { id: "a", text: "Let the louder teammate make the final call.", correctnessScore: 0 },
      { id: "b", text: "Ask an adult to choose the design without involving the students.", correctnessScore: 0 },
      { id: "c", text: "Test both ideas and compare the results together.", correctnessScore: 1 },
      { id: "d", text: "Stop discussing it and avoid the topic.", correctnessScore: 0 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Role Tendency / Thinking Style questions (NO correct answer).
// Each option is a reasonable choice; it maps to one role. These mostly drive
// the suggested focus. Roles are placed in DIFFERENT positions across questions
// so an "always pick A/B/C/D" pattern does not map to a single role.
// ---------------------------------------------------------------------------

const TENDENCY_QUESTIONS: TendencyQuestion[] = [
  {
    id: "t1",
    kind: "tendency",
    category: "Pre-match preparation",
    text: "Your team has 30 minutes before a practice match. What do you want to work on first?",
    choices: [
      { id: "a", text: "Practise the fastest scoring route over and over.", role: "Driver" },
      { id: "b", text: "Write down today's test results and plans in the notebook.", role: "Notebooker" },
      { id: "c", text: "Check the robot's structure and fix any weak parts.", role: "Builder" },
      { id: "d", text: "Run the autonomous code and fix movement that looks off.", role: "Programmer" },
    ],
  },
  {
    id: "t2",
    kind: "tendency",
    category: "After a build",
    text: "Your team just finished a big build. What feels most satisfying to do next?",
    choices: [
      { id: "a", text: "Record what you built and why, with photos and notes.", role: "Notebooker" },
      { id: "b", text: "Make the new mechanism sturdier and cleaner.", role: "Builder" },
      { id: "c", text: "Program the new mechanism so it runs on its own.", role: "Programmer" },
      { id: "d", text: "Plan how this changes your match strategy.", role: "Strategist" },
    ],
  },
  {
    id: "t3",
    kind: "tendency",
    category: "Team disagreement",
    text: "Two teammates disagree about how the robot should score. What do you naturally do?",
    choices: [
      { id: "a", text: "Compare both ideas by how many points each could score.", role: "Strategist" },
      { id: "b", text: "Help everyone share their view and reach a fair decision.", role: "TeamCollaborator" },
      { id: "c", text: "Try driving both ideas to see which one feels better.", role: "Driver" },
      { id: "d", text: "Write down the pros and cons of each idea to compare.", role: "Notebooker" },
    ],
  },
  {
    id: "t4",
    kind: "tendency",
    category: "Choosing what to improve",
    text: "Your robot already works. What do you most want to improve next?",
    choices: [
      { id: "a", text: "Make the autonomous routine more accurate.", role: "Programmer" },
      { id: "b", text: "Get faster and more precise at driving it.", role: "Driver" },
      { id: "c", text: "Find a smarter route to score more points.", role: "Strategist" },
      { id: "d", text: "Rebuild a part so it is stronger and lighter.", role: "Builder" },
    ],
  },
  {
    id: "t5",
    kind: "tendency",
    category: "Preparing for judging",
    text: "Your team is getting ready to talk with the judges. What part do you want to lead?",
    choices: [
      { id: "a", text: "Explaining how the robot is built and why.", role: "Builder" },
      { id: "b", text: "Explaining the team's game plan and choices.", role: "Strategist" },
      { id: "c", text: "Walking the judges through the notebook.", role: "Notebooker" },
      { id: "d", text: "Making sure everyone gets a turn to speak.", role: "TeamCollaborator" },
    ],
  },
  {
    id: "t6",
    kind: "tendency",
    category: "Analyzing field strategy",
    text: "Your team is studying a new game field. What catches your attention first?",
    choices: [
      { id: "a", text: "Which paths will be quick and easy to drive.", role: "Driver" },
      { id: "b", text: "What mechanism the robot needs to score well.", role: "Builder" },
      { id: "c", text: "Which movements the autonomous code should do.", role: "Programmer" },
      { id: "d", text: "Which goals are worth the most points.", role: "Strategist" },
    ],
  },
  {
    id: "t7",
    kind: "tendency",
    category: "Using limited practice time",
    text: "Your team has one hour of practice left. How do you want to spend it?",
    choices: [
      { id: "a", text: "Updating the notebook so nothing is forgotten.", role: "Notebooker" },
      { id: "b", text: "Testing and fixing the autonomous code.", role: "Programmer" },
      { id: "c", text: "Making sure everyone knows their job for the match.", role: "TeamCollaborator" },
      { id: "d", text: "Driving practice matches against the clock.", role: "Driver" },
    ],
  },
  {
    id: "t8",
    kind: "tendency",
    category: "After a failed match",
    text: "Your team just lost a close match. What do you want to do right after?",
    choices: [
      { id: "a", text: "Keep the team calm and encourage each other.", role: "TeamCollaborator" },
      { id: "b", text: "Write down what went wrong while it is fresh.", role: "Notebooker" },
      { id: "c", text: "Get back on the field and practise the part that failed.", role: "Driver" },
      { id: "d", text: "Rethink the plan for the next match.", role: "Strategist" },
    ],
  },
  {
    id: "t9",
    kind: "tendency",
    category: "A recurring problem",
    text: "A part of your robot keeps causing trouble in matches. What is your instinct?",
    choices: [
      { id: "a", text: "Decide whether to redesign around it or play to its limits.", role: "Strategist" },
      { id: "b", text: "Take it apart and rebuild that section more reliably.", role: "Builder" },
      { id: "c", text: "Get the team together to agree on a fix.", role: "TeamCollaborator" },
      { id: "d", text: "Add code that works around the problem.", role: "Programmer" },
    ],
  },
];

export const QUESTIONS: Question[] = [...KNOWLEDGE_QUESTIONS, ...TENDENCY_QUESTIONS];

/** Lightweight lookup map keyed by question id. */
export const QUESTIONS_BY_ID: Record<string, Question> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q]),
);

export const QUESTION_COUNT = QUESTIONS.length;
export const KNOWLEDGE_COUNT = KNOWLEDGE_QUESTIONS.length;
export const TENDENCY_COUNT = TENDENCY_QUESTIONS.length;

// Public-facing shape sent to the quiz UI. It deliberately omits correct
// answers, correctness scores, role mappings, and feedback so students cannot
// see the answer key or which role a choice maps to. Scoring happens on the
// server. Knowledge and tendency questions look identical to the student.
export interface PublicChoice {
  id: string;
  text: string;
}

export interface PublicQuestion {
  id: string;
  text: string;
  category: string;
  choices: PublicChoice[];
}

export function getPublicQuestions(): PublicQuestion[] {
  return QUESTIONS.map((q) => ({
    id: q.id,
    text: q.text,
    category: q.category,
    choices: q.choices.map((c) => ({ id: c.id, text: c.text })),
  }));
}
