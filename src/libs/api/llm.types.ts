// Zod 스키마에서 타입을 추론하여 사용 (단일 소스 원칙)
export type { Supplement, LLMRecommendation } from "./llm.schema";

/**
 * LLM API 에러 타입
 */
export interface LLMError {
  type: "network" | "timeout" | "parse" | "api";
  message: string;
}

/**
 * LLM API 요청 파라미터
 */
export interface LLMRequestParams {
  profile: {
    age: number;
    gender: "male" | "female" | "other";
    weight: number;
    medications: string;
    concerns: string;
    lifestyle: string;
  };
}
