// Role definitions for the VEX IQ Role Readiness Assessment.
// These are the six learning areas the assessment evaluates. The first four
// are the core VEX IQ team roles; Strategist and Team Collaborator are added
// because competition success also depends on strategy, communication,
// rules awareness, and teamwork.

export const ROLE_KEYS = [
  "Builder",
  "Programmer",
  "Driver",
  "Notebooker",
  "Strategist",
  "TeamCollaborator",
] as const;

export type RoleKey = (typeof ROLE_KEYS)[number];

export type RoleWeights = Partial<Record<RoleKey, number>>;

export type RoleScores = Record<RoleKey, number>;

export interface RoleProfile {
  key: RoleKey;
  /** Friendly display name shown to students and teachers. */
  label: string;
  /** Short tagline. */
  tagline: string;
  /** Description of strengths for this role. */
  description: string;
  /** Encouraging "what this means" text for the student result page. */
  studentMeaning: string;
  /** Recommended next practice for a student strong in this role. */
  recommendedPractice: string;
  /** Suggested teacher training-plan steps when this role is high. */
  trainingPlan: string[];
  /** Accent color class used in the UI. */
  accent: string;
}

export const ROLE_PROFILES: Record<RoleKey, RoleProfile> = {
  Builder: {
    key: "Builder",
    label: "Builder",
    tagline: "Robot structure & mechanisms",
    description:
      "Strong in robot structure, mechanisms, inspection awareness, physical problem solving, stability, durability, and iteration.",
    studentMeaning:
      "You think carefully about how a robot is put together. You look for mechanical causes, care about stability and durability, and like to improve a design step by step.",
    recommendedPractice:
      "Build a small, stable mechanism (such as an intake or arm) and test it a few times. Write down what you changed and why each time.",
    trainingPlan: [
      "Give a mechanism challenge: build a stable intake or arm prototype.",
      "Ask the student to explain their design choices and test results.",
      "Practice quick inspection checks (size, sturdiness, alignment).",
    ],
    accent: "amber",
  },
  Programmer: {
    key: "Programmer",
    label: "Programmer / Coder",
    tagline: "Autonomous logic & debugging",
    description:
      "Strong in autonomous thinking, debugging, sensors, logic, sequences, loops, variables, and explaining code.",
    studentMeaning:
      "You enjoy making the robot follow instructions on its own. You debug step by step, think in logic and sequences, and can explain how your code works.",
    recommendedPractice:
      "Create a short autonomous routine that drives a set distance reliably. Test it several times and note what you changed when it failed.",
    trainingPlan: [
      "Give a coding challenge: create a reliable autonomous movement routine.",
      "Ask the student to explain the code flow and their debugging steps.",
      "Introduce a sensor (such as a distance or touch sensor) for consistency.",
    ],
    accent: "violet",
  },
  Driver: {
    key: "Driver",
    label: "Driver",
    tagline: "Control under pressure",
    description:
      "Strong in controller practice, match timing, field awareness, calm decision-making, accuracy, and handling the robot under pressure.",
    studentMeaning:
      "You stay calm and focused while driving. You watch the field, manage your timing, and make accurate decisions even when a match is busy.",
    recommendedPractice:
      "Run short, timed driving drills. Track your accuracy and how often you complete a scoring task before time runs out.",
    trainingPlan: [
      "Give timed driving drills with a clear scoring goal.",
      "Track accuracy, route planning, and decision-making under pressure.",
      "Practice stopping cleanly when the match timer ends.",
    ],
    accent: "rose",
  },
  Notebooker: {
    key: "Notebooker",
    label: "Notebook Writer",
    tagline: "Documenting the design journey",
    description:
      "Strong in documenting the design process, testing, iteration, sketches, data, decisions, citations, and explaining why the team made changes.",
    studentMeaning:
      "You explain the team's thinking clearly. You record goals, tests, data, and decisions so others can understand why the robot changed over time.",
    recommendedPractice:
      "After your next build or test, write a notebook entry with: goal, sketch or photo, test result, the change you made, and your next step.",
    trainingPlan: [
      "Give a documentation task right after a build/test cycle.",
      "Ask the student to write goal, test, data, decision, and next step.",
      "Practice crediting inspiration and explaining original team changes.",
    ],
    accent: "emerald",
  },
  Strategist: {
    key: "Strategist",
    label: "Strategist",
    tagline: "Scoring, routes & match planning",
    description:
      "Strong in scoring analysis, alliance coordination, route planning, rule-aware decision-making, match preparation, and adapting to partner strengths.",
    studentMeaning:
      "You think about how to score the most points. You compare routes, weigh time and risk, follow the rules, and plan how to work with an alliance partner.",
    recommendedPractice:
      "Look at a field diagram and plan two scoring routes. Compare them by time, reliability, risk, and points.",
    trainingPlan: [
      "Give a match-planning activity using a field diagram.",
      "Ask the student to compare scoring paths by time, risk, and points.",
      "Practice planning around game constraints and partner strengths.",
    ],
    accent: "sky",
  },
  TeamCollaborator: {
    key: "TeamCollaborator",
    label: "Team Collaborator",
    tagline: "Communication, rules & safety",
    description:
      "Strong in communication, respect, student-centered behavior, safety, rule awareness, and helping the team work fairly.",
    studentMeaning:
      "You help the whole team work well together. You communicate with respect, care about safety and the rules, and keep the work fair and student-led.",
    recommendedPractice:
      "Lead a short, respectful team discussion where everyone shares an idea, then help the team agree on a next step using evidence.",
    trainingPlan: [
      "Give an alliance communication and role-coordination task.",
      "Ask the student to lead a respectful team discussion.",
      "Practice rule checks using the current game manual.",
    ],
    accent: "indigo",
  },
};

export function roleLabel(key: RoleKey | string): string {
  return ROLE_PROFILES[key as RoleKey]?.label ?? String(key);
}

// Competition Understanding bands. These describe knowledge only and are kept
// deliberately non-final: no "Competition Ready", no "100% means ready". A high
// score means "ready for guided practice", not a finished or certified student.
export const UNDERSTANDING_LEVELS = [
  { min: 0, max: 49, label: "Developing" },
  { min: 50, max: 79, label: "Ready for Guided Practice" },
  { min: 80, max: 100, label: "Strong Understanding" },
] as const;

export function understandingLevel(score: number): string {
  const band = UNDERSTANDING_LEVELS.find((b) => score >= b.min && score <= b.max);
  return band?.label ?? "Developing";
}
