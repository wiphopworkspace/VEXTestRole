// Seed question bank for the VEX IQ Role Readiness Assessment.
//
// All concepts are paraphrased in original wording for educational use.
// No official game manual text is copied. Questions are in English.

import type { RoleKey, RoleWeights } from "./roles";

export interface Choice {
  id: string;
  text: string;
  /** 1 for the correct answer to knowledge/situation questions, otherwise 0. */
  correctnessScore: 0 | 1;
  roleWeights: RoleWeights;
}

export interface Question {
  id: string;
  text: string;
  category: string;
  roleTags: RoleKey[];
  choices: Choice[];
  correctChoiceId: string;
  /** Feedback shown for the correct answer. */
  feedback: string;
}

export const QUESTIONS: Question[] = [
  {
    id: "q1",
    category: "Builder",
    roleTags: ["Builder"],
    text: "Your robot tips over when it drives across a small barrier. What should the team check first?",
    correctChoiceId: "b",
    feedback:
      "Good builders look for mechanical causes such as balance, support, and stability.",
    choices: [
      { id: "a", text: "Add more decorations to make it look better.", correctnessScore: 0, roleWeights: { Notebooker: 1 } },
      { id: "b", text: "Check the robot's center of gravity, wheelbase, and weight distribution.", correctnessScore: 1, roleWeights: { Builder: 3, Strategist: 1 } },
      { id: "c", text: "Ask an adult to rebuild the robot.", correctnessScore: 0, roleWeights: { TeamCollaborator: -1 } },
      { id: "d", text: "Skip testing and only practice driving.", correctnessScore: 0, roleWeights: { Driver: 1 } },
    ],
  },
  {
    id: "q2",
    category: "Builder",
    roleTags: ["Builder"],
    text: "During building, two beams do not align correctly. What is the best next step?",
    correctChoiceId: "b",
    feedback: "A good builder checks alignment and structure before making bigger changes.",
    choices: [
      { id: "a", text: "Force the parts together.", correctnessScore: 0, roleWeights: { Builder: -1 } },
      { id: "b", text: "Check hole spacing, connector placement, and whether the structure is square.", correctnessScore: 1, roleWeights: { Builder: 3, Notebooker: 1 } },
      { id: "c", text: "Remove the whole robot and start over immediately.", correctnessScore: 0, roleWeights: { Builder: 1 } },
      { id: "d", text: "Ignore it because the robot still moves.", correctnessScore: 0, roleWeights: { Driver: 1 } },
    ],
  },
  {
    id: "q3",
    category: "Builder / Rules",
    roleTags: ["Builder", "Strategist"],
    text: "The game allows the robot to carry only one Bean Bag at a time. What should the robot design focus on?",
    correctChoiceId: "b",
    feedback: "A strong design follows game constraints and solves the real scoring task.",
    choices: [
      { id: "a", text: "Carrying as many Bean Bags as possible.", correctnessScore: 0, roleWeights: { Strategist: -1 } },
      { id: "b", text: "Quickly and reliably controlling one Bean Bag.", correctnessScore: 1, roleWeights: { Builder: 2, Strategist: 2 } },
      { id: "c", text: "Blocking all other robots.", correctnessScore: 0, roleWeights: { Driver: 1 } },
      { id: "d", text: "Making the robot as tall as possible with no testing.", correctnessScore: 0, roleWeights: { Builder: 1 } },
    ],
  },
  {
    id: "q4",
    category: "Builder / Inspection",
    roleTags: ["Builder"],
    text: "The robot does not fit inside the required inspection size. What should the team do?",
    correctChoiceId: "b",
    feedback:
      "Builders must understand that a competition robot must pass inspection before competing.",
    choices: [
      { id: "a", text: "Hide the oversized part.", correctnessScore: 0, roleWeights: { TeamCollaborator: -2 } },
      { id: "b", text: "Redesign or adjust the mechanism so the robot passes inspection.", correctnessScore: 1, roleWeights: { Builder: 3, TeamCollaborator: 1 } },
      { id: "c", text: "Ask the referee to ignore it.", correctnessScore: 0, roleWeights: { TeamCollaborator: -2 } },
      { id: "d", text: "Only use the robot for practice and not matches.", correctnessScore: 0, roleWeights: { Strategist: 1 } },
    ],
  },
  {
    id: "q5",
    category: "Programmer",
    roleTags: ["Programmer"],
    text: "The autonomous program does not start correctly. What should the programmer do first?",
    correctChoiceId: "b",
    feedback: "Good programmers debug step by step and test small parts of the program.",
    choices: [
      { id: "a", text: "Randomly change many blocks at once.", correctnessScore: 0, roleWeights: { Programmer: -1 } },
      { id: "b", text: "Check the starting command, device setup, and run a small test program.", correctnessScore: 1, roleWeights: { Programmer: 3, Notebooker: 1 } },
      { id: "c", text: "Blame the driver.", correctnessScore: 0, roleWeights: { TeamCollaborator: -1 } },
      { id: "d", text: "Delete all code immediately.", correctnessScore: 0, roleWeights: { Programmer: 1 } },
    ],
  },
  {
    id: "q6",
    category: "Programmer",
    roleTags: ["Programmer"],
    text: "You want the robot to drive the same distance every time. Which idea is most useful?",
    correctChoiceId: "b",
    feedback: "Consistent movement usually needs measured values or sensor-based control.",
    choices: [
      { id: "a", text: "Guess the time and never adjust it.", correctnessScore: 0, roleWeights: { Driver: 1 } },
      { id: "b", text: "Use motor rotations, distance values, or sensor feedback when available.", correctnessScore: 1, roleWeights: { Programmer: 3, Driver: 1 } },
      { id: "c", text: "Push the robot by hand.", correctnessScore: 0, roleWeights: { TeamCollaborator: -1 } },
      { id: "d", text: "Only make the robot faster.", correctnessScore: 0, roleWeights: { Builder: 1 } },
    ],
  },
  {
    id: "q7",
    category: "Programmer / Documentation",
    roleTags: ["Programmer", "Notebooker"],
    text: "Your code works once, then fails on the second run. What is a good debugging habit?",
    correctChoiceId: "a",
    feedback: "Debugging and documentation work together.",
    choices: [
      { id: "a", text: "Write down what changed, test one change at a time, and record results.", correctnessScore: 1, roleWeights: { Programmer: 2, Notebooker: 2 } },
      { id: "b", text: "Never document code problems.", correctnessScore: 0, roleWeights: { Notebooker: -1 } },
      { id: "c", text: "Keep changing code until it accidentally works.", correctnessScore: 0, roleWeights: { Programmer: 1 } },
      { id: "d", text: "Stop using autonomous code.", correctnessScore: 0, roleWeights: { Driver: 1 } },
    ],
  },
  {
    id: "q8",
    category: "Programmer / Student-Centered",
    roleTags: ["Programmer", "TeamCollaborator"],
    text: "A student uses code from the internet but cannot explain how it works. What is the problem?",
    correctChoiceId: "b",
    feedback: "A student-centered team must understand its own code.",
    choices: [
      { id: "a", text: "Nothing; copying code is always enough.", correctnessScore: 0, roleWeights: { Programmer: -1 } },
      { id: "b", text: "The student must understand and be able to explain the code used on the robot.", correctnessScore: 1, roleWeights: { Programmer: 2, TeamCollaborator: 2 } },
      { id: "c", text: "Only the teacher needs to understand the code.", correctnessScore: 0, roleWeights: { TeamCollaborator: -2 } },
      { id: "d", text: "Code does not matter in VEX IQ.", correctnessScore: 0, roleWeights: { Programmer: -1 } },
    ],
  },
  {
    id: "q9",
    category: "Driver",
    roleTags: ["Driver"],
    text: "It is the last 20 seconds of a close match and your robot is mid-field. You can keep running short scoring cycles you know you can finish, or attempt one risky long route to a high-value goal. What is usually the better driver choice?",
    correctChoiceId: "a",
    feedback:
      "Strong drivers weigh time, distance, and reliability — finishing sure points usually beats an attempt that may not complete.",
    choices: [
      { id: "a", text: "Keep running the reliable scoring cycles you can finish before time runs out.", correctnessScore: 1, roleWeights: { Driver: 3, Strategist: 1 } },
      { id: "b", text: "Go for the risky long route to the high goal even though you might not finish in time.", correctnessScore: 0, roleWeights: { Driver: 1, Strategist: -1 } },
      { id: "c", text: "Speed up everywhere and accept more mistakes to fit in extra attempts.", correctnessScore: 0, roleWeights: { Driver: 1 } },
      { id: "d", text: "Coordinate nothing and just react to whatever your partner robot does.", correctnessScore: 0, roleWeights: { TeamCollaborator: -1 } },
    ],
  },
  {
    id: "q10",
    category: "Driver Practice",
    roleTags: ["Driver"],
    text: "Your team has only a few short practice sessions before a competition. Which driving practice plan is most effective?",
    correctChoiceId: "b",
    feedback: "Drivers improve fastest from focused, measured practice on real scoring routes plus reviewing mistakes — not from unstructured time.",
    choices: [
      { id: "a", text: "Free-drive around the field each session without a specific goal.", correctnessScore: 0, roleWeights: { Driver: 1 } },
      { id: "b", text: "Run timed drills on your real scoring routes and review the mistakes afterward.", correctnessScore: 1, roleWeights: { Driver: 3, Notebooker: 1 } },
      { id: "c", text: "Only practice the routes you are already confident with.", correctnessScore: 0, roleWeights: { Driver: 1 } },
      { id: "d", text: "Practice once, then rely on the autonomous program for the rest.", correctnessScore: 0, roleWeights: { Driver: -1 } },
    ],
  },
  {
    id: "q11",
    category: "Driver / Strategy",
    roleTags: ["Driver", "Strategist"],
    text: "Your alliance partner has a robot that scores better in high goals. What is a smart driver decision?",
    correctChoiceId: "b",
    feedback: "Good drivers understand teamwork and match coordination.",
    choices: [
      { id: "a", text: "Ignore the partner and do the same task.", correctnessScore: 0, roleWeights: { Driver: 1 } },
      { id: "b", text: "Coordinate roles so both robots use their strengths.", correctnessScore: 1, roleWeights: { Driver: 2, Strategist: 2, TeamCollaborator: 2 } },
      { id: "c", text: "Block your partner.", correctnessScore: 0, roleWeights: { TeamCollaborator: -2 } },
      { id: "d", text: "Stop driving.", correctnessScore: 0, roleWeights: { Driver: -1 } },
    ],
  },
  {
    id: "q12",
    category: "Rules / Safety Awareness",
    roleTags: ["TeamCollaborator", "Strategist"],
    text: "The match has just ended and the referee is still confirming the final score. What should the team do?",
    correctChoiceId: "a",
    feedback: "Rule-aware teams leave the field and robot as they are and let the referee confirm the score before touching anything.",
    choices: [
      { id: "a", text: "Wait calmly and leave the robot and field pieces where they are until the referee confirms the score.", correctnessScore: 1, roleWeights: { TeamCollaborator: 2, Strategist: 1 } },
      { id: "b", text: "Quickly move the robot off to the side so it is ready for the next match.", correctnessScore: 0, roleWeights: { TeamCollaborator: -1 } },
      { id: "c", text: "Start tidying up the game pieces on the field to be helpful.", correctnessScore: 0, roleWeights: { TeamCollaborator: -1 } },
      { id: "d", text: "Tell the referee the score you believe is correct and ask them to use it.", correctnessScore: 0, roleWeights: { TeamCollaborator: -1, Strategist: -1 } },
    ],
  },
  {
    id: "q13",
    category: "Notebooker",
    roleTags: ["Notebooker"],
    text: "After testing a new intake design, what should the notebook include?",
    correctChoiceId: "b",
    feedback: "A strong notebook explains the design process, not just the final result.",
    choices: [
      { id: "a", text: "Only \"it worked.\"", correctnessScore: 0, roleWeights: { Notebooker: 1 } },
      { id: "b", text: "The goal, sketch or photo, test result, problem, change made, and next step.", correctnessScore: 1, roleWeights: { Notebooker: 3, Builder: 1 } },
      { id: "c", text: "Nothing until the end of the season.", correctnessScore: 0, roleWeights: { Notebooker: -1 } },
      { id: "d", text: "Only the final robot picture.", correctnessScore: 0, roleWeights: { Notebooker: 1 } },
    ],
  },
  {
    id: "q14",
    category: "Notebooker / Academic Honesty",
    roleTags: ["Notebooker", "TeamCollaborator"],
    text: "Your team gets inspiration from another team's mechanism. What should you do?",
    correctChoiceId: "b",
    feedback:
      "Notebookers should document sources, inspiration, and original team changes.",
    choices: [
      { id: "a", text: "Copy it exactly and say it is yours.", correctnessScore: 0, roleWeights: { TeamCollaborator: -2 } },
      { id: "b", text: "Credit the inspiration and document how your team changed and improved the idea.", correctnessScore: 1, roleWeights: { Notebooker: 3, TeamCollaborator: 2 } },
      { id: "c", text: "Never write about it.", correctnessScore: 0, roleWeights: { Notebooker: -1 } },
      { id: "d", text: "Ask an adult to write the explanation.", correctnessScore: 0, roleWeights: { TeamCollaborator: -2 } },
    ],
  },
  {
    id: "q15",
    category: "Notebooker",
    roleTags: ["Notebooker"],
    text: "Which notebook entry is strongest?",
    correctChoiceId: "b",
    feedback: "Strong notebook writing includes reason, data, and evidence.",
    choices: [
      { id: "a", text: "\"We built today.\"", correctnessScore: 0, roleWeights: { Notebooker: 1 } },
      { id: "b", text: "\"We changed the gear ratio from 1:1 to 3:1 because the arm needed more torque. Test result: lifted the Bean Bag 4 out of 5 times.\"", correctnessScore: 1, roleWeights: { Notebooker: 3, Builder: 1 } },
      { id: "c", text: "\"The robot is cool.\"", correctnessScore: 0, roleWeights: {} },
      { id: "d", text: "\"The teacher fixed it.\"", correctnessScore: 0, roleWeights: { TeamCollaborator: -2 } },
    ],
  },
  {
    id: "q16",
    category: "Notebooker / Judging",
    roleTags: ["Notebooker"],
    text: "Judges ask why your team changed the robot design. What helps most?",
    correctChoiceId: "a",
    feedback: "Notebookers help the team explain the design journey.",
    choices: [
      { id: "a", text: "A clear notebook record showing tests, failures, decisions, and improvements.", correctnessScore: 1, roleWeights: { Notebooker: 3, TeamCollaborator: 1 } },
      { id: "b", text: "Saying \"I don't know.\"", correctnessScore: 0, roleWeights: { TeamCollaborator: -1 } },
      { id: "c", text: "Letting an adult answer.", correctnessScore: 0, roleWeights: { TeamCollaborator: -2 } },
      { id: "d", text: "Showing only decorations.", correctnessScore: 0, roleWeights: { Builder: 1 } },
    ],
  },
  {
    id: "q17",
    category: "Strategist",
    roleTags: ["Strategist"],
    text: "The field has long routes and narrow shortcuts. What should the strategist compare?",
    correctChoiceId: "b",
    feedback:
      "Strategy means choosing actions based on scoring, time, rules, and robot capability.",
    choices: [
      { id: "a", text: "Only which path looks cooler.", correctnessScore: 0, roleWeights: {} },
      { id: "b", text: "Time, reliability, robot size, scoring value, and risk.", correctnessScore: 1, roleWeights: { Strategist: 3, Driver: 1, Builder: 1 } },
      { id: "c", text: "Only the color of the Bean Bags.", correctnessScore: 0, roleWeights: { Strategist: -1 } },
      { id: "d", text: "Nothing; strategy is not needed.", correctnessScore: 0, roleWeights: { Strategist: -1 } },
    ],
  },
  {
    id: "q18",
    category: "Strategist / Rules",
    roleTags: ["Strategist"],
    text: "If the robot can possess only one Bean Bag, what strategy makes sense?",
    correctChoiceId: "a",
    feedback: "Good strategy follows the rules and optimizes around constraints.",
    choices: [
      { id: "a", text: "Plan fast cycles and efficient routes for one Bean Bag at a time.", correctnessScore: 1, roleWeights: { Strategist: 3, Driver: 1 } },
      { id: "b", text: "Plan to carry many Bean Bags.", correctnessScore: 0, roleWeights: { Strategist: -1 } },
      { id: "c", text: "Ignore possession rules.", correctnessScore: 0, roleWeights: { TeamCollaborator: -2 } },
      { id: "d", text: "Wait until the match is over.", correctnessScore: 0, roleWeights: { Driver: -1 } },
    ],
  },
  {
    id: "q19",
    category: "Strategist / Driver",
    roleTags: ["Strategist", "Driver"],
    text: "There are 10 seconds left and your robot is far from the highest goal. What should you consider?",
    correctChoiceId: "a",
    feedback: "Good match decisions consider time, distance, risk, and scoring value.",
    choices: [
      { id: "a", text: "The safest nearby scoring option that can be completed before time ends.", correctnessScore: 1, roleWeights: { Strategist: 2, Driver: 2 } },
      { id: "b", text: "A risky long route with no chance to finish.", correctnessScore: 0, roleWeights: { Driver: 1 } },
      { id: "c", text: "Stop immediately even if scoring is possible.", correctnessScore: 0, roleWeights: {} },
      { id: "d", text: "Ask the audience what to do.", correctnessScore: 0, roleWeights: { TeamCollaborator: -1 } },
    ],
  },
  {
    id: "q20",
    category: "Strategist / Teamwork",
    roleTags: ["Strategist", "TeamCollaborator"],
    text: "Before a teamwork match, what should two teams discuss?",
    correctChoiceId: "a",
    feedback: "Teamwork matches require communication and role coordination.",
    choices: [
      { id: "a", text: "Who will do which scoring tasks and how to avoid interfering with each other.", correctnessScore: 1, roleWeights: { Strategist: 3, TeamCollaborator: 2, Driver: 1 } },
      { id: "b", text: "Which team is better.", correctnessScore: 0, roleWeights: { TeamCollaborator: -1 } },
      { id: "c", text: "How to blame each other if the score is low.", correctnessScore: 0, roleWeights: { TeamCollaborator: -2 } },
      { id: "d", text: "Nothing; teamwork matches do not need planning.", correctnessScore: 0, roleWeights: { Strategist: -1 } },
    ],
  },
  {
    id: "q21",
    category: "Team Collaborator",
    roleTags: ["TeamCollaborator"],
    text: "Two students disagree about the robot design. What is the best team behavior?",
    correctChoiceId: "a",
    feedback: "Strong teams use respectful discussion and evidence-based decisions.",
    choices: [
      { id: "a", text: "Test both ideas if possible and compare results respectfully.", correctnessScore: 1, roleWeights: { TeamCollaborator: 3, Builder: 1, Notebooker: 1 } },
      { id: "b", text: "Let the loudest person decide.", correctnessScore: 0, roleWeights: { TeamCollaborator: -1 } },
      { id: "c", text: "Stop talking to each other.", correctnessScore: 0, roleWeights: { TeamCollaborator: -2 } },
      { id: "d", text: "Ask an adult to choose without student discussion.", correctnessScore: 0, roleWeights: { TeamCollaborator: -1 } },
    ],
  },
  {
    id: "q22",
    category: "Student-Centered / Notebooker",
    roleTags: ["Notebooker", "TeamCollaborator"],
    text: "An adult offers to rewrite the engineering notebook to make it sound better. What should students do?",
    correctChoiceId: "b",
    feedback: "The notebook should reflect student work and student voice.",
    choices: [
      { id: "a", text: "Accept, because adults write better.", correctnessScore: 0, roleWeights: { TeamCollaborator: -2 } },
      { id: "b", text: "Politely keep the notebook in the students' own words and ask only for general feedback.", correctnessScore: 1, roleWeights: { Notebooker: 2, TeamCollaborator: 2 } },
      { id: "c", text: "Delete the notebook.", correctnessScore: 0, roleWeights: { Notebooker: -1 } },
      { id: "d", text: "Let the adult create all documentation.", correctnessScore: 0, roleWeights: { TeamCollaborator: -2 } },
    ],
  },
  {
    id: "q23",
    category: "Rules Awareness",
    roleTags: ["Strategist", "TeamCollaborator"],
    text: "If the team is unsure about a game rule, what is the best first step?",
    correctChoiceId: "b",
    feedback:
      "Rule-aware teams use the current manual and official clarification channels.",
    choices: [
      { id: "a", text: "Guess and hope it is legal.", correctnessScore: 0, roleWeights: { Strategist: -1 } },
      { id: "b", text: "Read the current game manual and ask an official question only if still unclear.", correctnessScore: 1, roleWeights: { Strategist: 2, TeamCollaborator: 2, Notebooker: 1 } },
      { id: "c", text: "Use rules from a past season.", correctnessScore: 0, roleWeights: { Strategist: -1 } },
      { id: "d", text: "Ask a random spectator.", correctnessScore: 0, roleWeights: { TeamCollaborator: -1 } },
    ],
  },
  {
    id: "q24",
    category: "Team Role Understanding",
    roleTags: ["TeamCollaborator"],
    text: "Which statement best describes a strong VEX IQ team?",
    correctChoiceId: "b",
    feedback:
      "A strong VEX IQ team is student-centered: students share the work, understand their own robot, and can explain their choices.",
    choices: [
      { id: "a", text: "One student does all of the important work.", correctnessScore: 0, roleWeights: { TeamCollaborator: -1 } },
      { id: "b", text: "Students share the work, understand their own robot, communicate clearly, and can explain their design choices.", correctnessScore: 1, roleWeights: { TeamCollaborator: 1 } },
      { id: "c", text: "Adults build and program the robot while the students watch.", correctnessScore: 0, roleWeights: { TeamCollaborator: -2 } },
      { id: "d", text: "The team only practices driving and ignores design, code, and the notebook.", correctnessScore: 0, roleWeights: { TeamCollaborator: -1 } },
    ],
  },
];

/** Lightweight lookup map keyed by question id. */
export const QUESTIONS_BY_ID: Record<string, Question> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q]),
);

export const QUESTION_COUNT = QUESTIONS.length;

// Public-facing shape sent to the quiz UI. It deliberately omits correct
// answers, correctness scores, role weights, and feedback so students cannot
// see the answer key. Scoring happens on the server.
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
