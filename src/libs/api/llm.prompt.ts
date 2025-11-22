import { HealthProfile } from "@/features/intake/intake.types";

/**
 * HealthProfile을 기반으로 LLM 프롬프트를 생성합니다.
 *
 * @param profile - 사용자의 건강 정보
 * @returns LLM에 전달할 프롬프트 문자열
 */
export function buildPrompt(profile: HealthProfile): string {
  // 프롬프트를 간결하게 만들어 reasoning 모델의 토큰 사용을 줄입니다
  return `건강 정보 기반 영양제 추천 및 약물 상호작용 체크.

사용자: ${profile.age}세 ${profile.gender === "male" ? "남성" : profile.gender === "female" ? "여성" : "기타"}, ${profile.weight}kg, ${profile.smoking ? "흡연" : "비흡연"}
복용 중인 약물: ${profile.medications || "없음"}
건강 고민: ${profile.concerns && profile.concerns.length > 0 ? profile.concerns.join(", ") : "없음"}
생활 패턴: ${profile.lifestyle && profile.lifestyle.length > 0 ? profile.lifestyle.join(", ") : "없음"}

다음 두 가지를 수행하세요:

1. 약물 상호작용 체크:
   - 복용 중인 약물과 추천할 영양제 간의 상호작용을 분석하세요
   - 위험한 조합이 있으면 caution 필드에 명시하세요
   - 복용 중인 약물과 함께 섭취하면 안 되는 영양제가 있으면 해당 영양제를 추천하지 마세요
   - 예: 항응고제(와파린 등) 복용 시 비타민 K, 은행잎 추출물 등은 피해야 함

2. 종합 추천:
   - 복용 중인 약물 + 생활 패턴 + 건강 고민을 모두 종합하여 추천하세요
   - 각 영양제의 reason 필드에 다음을 포함하세요:
     * 어떤 건강 고민을 해결하기 위한 것인지
     * 어떤 생활 패턴을 고려한 것인지
     * 복용 중인 약물과의 호환성
   - 예: "피로 고민 + 야근 자주 + 수면 질 나쁨 → 멜라토닌 추천 (수면 개선으로 피로 완화)"

JSON 형식으로만 출력:
{
  "supplements": [{"name": "한국어명", "reason": "이유(약물+생활+고민 종합 고려)", "dosage": "1일 기준 섭취 용량 (예: 400 IU, 300 mg)", "caution": "주의사항(약물 상호작용 포함)"}],
  "summary": "요약(약물 상호작용 경고 포함)"
}

규칙:
1. JSON만 출력 (설명 없음)
2. supplements 최소 1개
3. name은 한국어 (예: "멜라토닌", "비타민 D3")
4. dosage는 1일 기준 섭취 용량을 명시 (예: "400 IU", "300 mg", "1000-2000 IU")
5. reason에는 약물+생활+고민을 종합한 추천 이유를 명시
6. caution에는 약물 상호작용, 복용 시 주의사항을 명시
7. summary에는 약물 상호작용 경고와 종합 추천 근거를 포함`;
}

/**
 * 프롬프트 템플릿 타입 정의
 */
export interface PromptTemplate {
  build(profile: HealthProfile): string;
}
