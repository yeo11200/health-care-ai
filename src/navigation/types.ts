import { HealthProfile } from "@/features/intake/intake.types";
import { LLMRecommendation } from "@/libs/api/llm.types";

export interface RouteParams {
  initialData?: HealthProfile;
  profile?: HealthProfile;
  recommendation?: LLMRecommendation;
  error?: string;
  retryScreen?: "Intake" | "RecommendationPending";
}
