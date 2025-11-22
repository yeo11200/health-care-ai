import { z } from "zod";

/**
 * Health Profile 검증 스키마
 */
export const intakeSchema = z.object({
  age: z
    .number({
      required_error: "나이를 입력해주세요",
      invalid_type_error: "나이는 숫자여야 합니다",
    })
    .int("나이는 정수여야 합니다")
    .positive("나이는 양수여야 합니다")
    .min(1, "나이는 1 이상이어야 합니다")
    .max(150, "나이는 150 이하여야 합니다"),

  gender: z.enum(["male", "female", "other"], {
    required_error: "성별을 선택해주세요",
    invalid_type_error: "유효한 성별을 선택해주세요",
  }),

  weight: z
    .number({
      required_error: "체중을 입력해주세요",
      invalid_type_error: "체중은 숫자여야 합니다",
    })
    .positive("체중은 양수여야 합니다")
    .min(1, "체중은 1kg 이상이어야 합니다")
    .max(500, "체중은 500kg 이하여야 합니다"),

  medications: z
    .string({
      required_error: "복용 중인 약물을 입력해주세요",
      invalid_type_error: "약물 정보는 문자열이어야 합니다",
    })
    .min(1, "복용 중인 약물을 입력해주세요 (없으면 '없음' 입력)")
    .max(500, "약물 정보는 500자 이하여야 합니다"),

  concerns: z
    .array(z.string())
    .min(1, "건강 고민을 최소 1개 이상 선택해주세요"),

  lifestyle: z
    .array(z.string())
    .min(1, "생활 패턴을 최소 1개 이상 선택해주세요"),

  smoking: z
    .boolean({
      required_error: "흡연 여부를 선택해주세요",
      invalid_type_error: "흡연 여부는 선택 필수입니다",
    })
    .default(false),
});

/**
 * Zod 스키마에서 TypeScript 타입 추론
 * 타입과 스키마의 일관성을 보장합니다.
 */
export type HealthProfile = z.infer<typeof intakeSchema>;
