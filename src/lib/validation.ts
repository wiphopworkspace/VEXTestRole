import { z } from "zod";
import { QUESTIONS } from "./questions";

// Validation schemas (Zod) for the assessment submission.

export const studentInfoSchema = z.object({
  studentName: z.string().trim().min(1, "Please enter your name.").max(120),
  nickname: z.string().trim().max(120).optional().or(z.literal("")),
  gradeLevel: z.string().trim().min(1, "Please select a grade level.").max(60),
  className: z.string().trim().min(1, "Please enter your class.").max(120),
  teacherEmail: z
    .string()
    .trim()
    .min(1, "Please enter your teacher's email.")
    .email("Please enter a valid email address.")
    .max(200),
  teamName: z.string().trim().max(120).optional().or(z.literal("")),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Consent is required before starting the quiz." }),
  }),
});

export const answerSchema = z.object({
  questionId: z.string().min(1),
  selectedChoiceId: z.string().min(1),
});

export const submissionSchema = z.object({
  student: studentInfoSchema,
  answers: z
    .array(answerSchema)
    .min(1, "No answers were submitted.")
    .superRefine((answers, ctx) => {
      const ids = new Set(answers.map((a) => a.questionId));
      for (const q of QUESTIONS) {
        if (!ids.has(q.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please answer every question before submitting.",
          });
          return;
        }
      }
    }),
});

export type StudentInfoInput = z.infer<typeof studentInfoSchema>;
export type SubmissionInput = z.infer<typeof submissionSchema>;
