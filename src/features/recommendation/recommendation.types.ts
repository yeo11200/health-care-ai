/**
 * Recommendation Screen 관련 타입 정의
 */

import { LLMRecommendation } from "@/libs/api/llm.types";
import { HealthProfile } from "@/features/intake/intake.types";

/**
 * Recommendation Screen의 Navigation 파라미터
 */
export interface RecommendationScreenParams {
  profile: HealthProfile;
  recommendation?: LLMRecommendation;
  error?: string;
}

/**
 * Recommendation Screen의 Props
 */
export interface RecommendationScreenProps {
  route: {
    params: RecommendationScreenParams;
  };
  navigation: any; // React Navigation 타입은 나중에 정의
}
