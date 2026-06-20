import { getPublicQuestions } from "@/lib/questions";
import AssessmentClient from "./AssessmentClient";

export const metadata = {
  title: "Start the assessment · VEX IQ Role Readiness",
};

export default function AssessmentPage() {
  const questions = getPublicQuestions();
  return <AssessmentClient questions={questions} />;
}
