import { z } from "zod";

/**
 * Supplement 검증 스키마
 */
export const supplementSchema = z.object({
  name: z.string().min(1, "영양제 이름은 필수입니다"),
  reason: z.string().min(1, "추천 이유는 필수입니다"),
  dosage: z.string().min(1, "1일 기준 섭취 용량은 필수입니다"),
  caution: z.string().optional(),
});

/**
 * LLM 응답 검증 스키마
 */
export const llmResponseSchema = z.object({
  supplements: z
    .array(supplementSchema)
    .min(1, "최소 1개 이상의 영양제가 필요합니다"),
  summary: z.string().min(1, "요약은 필수입니다"),
});

/**
 * Zod 스키마에서 TypeScript 타입 추론
 * 타입과 스키마의 일관성을 보장합니다.
 */
export type LLMRecommendation = z.infer<typeof llmResponseSchema>;
export type Supplement = z.infer<typeof supplementSchema>;
