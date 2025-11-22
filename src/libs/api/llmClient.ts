import { HealthProfile } from "@/features/intake/intake.types";
import { LLMRecommendation, LLMError } from "./llm.types";

/**
 * 🔒 보안 개선: 백엔드 프록시 서버를 통해 API 호출
 *
 * API 키는 서버에서만 관리되며 클라이언트에 노출되지 않습니다.
 * Vercel Serverless Functions를 통해 API 호출
 */

// Vercel 환경에서는 자동으로 같은 도메인의 /api 경로 사용
// 로컬 개발 시에는 백엔드 서버(포트 3001) 또는 Vercel Dev Server 사용
const getApiBaseUrl = () => {
  // 프로덕션 환경에서는 상대 경로 사용 (같은 도메인)
  if (import.meta.env.PROD) {
    return "";
  }

  // 개발 환경: 환경 변수가 있으면 사용, 없으면 백엔드 서버(3001) 사용
  // Vercel Dev Server를 사용하는 경우 빈 문자열(상대 경로) 사용
  return import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
};

const API_BASE_URL = getApiBaseUrl();

/**
 * 환경 변수에서 Mock 모드 설정을 가져옵니다.
 */
const getApiConfig = () => {
  const useMock = import.meta.env.VITE_USE_MOCK_API === "true";
  return { useMock };
};

/**
 * Mock 추천 응답을 반환합니다.
 * 개발 및 테스트 목적으로 사용됩니다.
 */
function getMockRecommendation(profile: HealthProfile): LLMRecommendation {
  const supplements = [];

  // 피로감 관련
  if (
    (profile.concerns &&
      (profile.concerns.includes("피로") ||
        profile.concerns.includes("피로감"))) ||
    (profile.lifestyle &&
      (profile.lifestyle.includes("수면") ||
        profile.lifestyle.includes("피로")))
  ) {
    supplements.push({
      name: "멜라토닌",
      dosage: "0.5-3 mg",
      reason:
        "피로 고민 + 수면 질 저하 생활 패턴을 고려한 추천. 수면-각성 주기를 조절하고 수면의 질을 개선하여 피로감 완화에 도움.",
      caution:
        "일부 약물과 상호작용 가능성(예: 혈압약, 항응고제) 및 특정 질환이 있는 경우 의사와 상담.",
    });

    supplements.push({
      name: "비타민 D3",
      dosage: "1000-2000 IU",
      reason:
        "피로 고민 + 야근 자주 생활 패턴을 고려한 추천. 햇빛 노출이 부족한 생활에서 피로감과 근육/정서적 기분 저하를 완화하는 데 도움이 될 수 있습니다.",
      caution:
        "장기간 고용량 복용 시 혈청 칼슘 수치를 확인하는 것이 좋고, 고칼슘혈증 증상에 주의.",
    });
  }

  // 기본 추천
  if (supplements.length === 0) {
    supplements.push({
      name: "종합 비타민",
      dosage: "1정 (제조사 권장량)",
      reason: "기본적인 영양소 보충을 위해 추천합니다.",
      caution: "복용 중인 약물이 있으면 의사와 상담 후 섭취하세요.",
    });
  }

  const genderText =
    profile.gender === "male"
      ? "남성"
      : profile.gender === "female"
        ? "여성"
        : "기타";

  let summary = `나이 ${profile.age}세, ${genderText}을 고려한 맞춤형 영양제 추천입니다.`;

  if (profile.medications && profile.medications !== "없음") {
    summary += ` ⚠️ 현재 ${profile.medications}을 복용 중이므로 약물 상호작용을 주의해야 합니다. 반드시 의료 전문가와 상담 후 섭취하시기 바랍니다.`;
  }

  return {
    supplements,
    summary,
  };
}

/**
 * 백엔드 프록시 서버를 통해 LLM API를 호출합니다.
 *
 * @param profile - 사용자의 건강 정보
 * @param useMock - Mock 응답 사용 여부 (기본값: 환경 변수 또는 false)
 * @returns LLMRecommendation 객체
 * @throws LLMError - API 호출 실패 시
 */
export async function getRecommendation(
  profile: HealthProfile,
  useMock?: boolean
): Promise<LLMRecommendation> {
  const config = getApiConfig();
  const shouldUseMock = useMock ?? config.useMock;

  // Mock 모드
  if (shouldUseMock) {
    return getMockRecommendation(profile);
  }

  try {
    // Vercel 환경에서는 같은 도메인의 /api/recommendation 사용
    const apiUrl = `${API_BASE_URL}/api/recommendation`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        type: "api",
        message: `서버 오류 (${response.status}): ${response.statusText}`,
      }));

      throw {
        type: errorData.type || "api",
        message: errorData.message || "서버 오류가 발생했습니다.",
      } as LLMError;
    }

    const recommendation: LLMRecommendation = await response.json();
    return recommendation;
  } catch (error: any) {
    // 네트워크 에러
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw {
        type: "network",
        message:
          "백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.",
      } as LLMError;
    }

    // 이미 LLMError 형식인 경우 그대로 throw
    if (error.type && error.message) {
      throw error;
    }

    // 기타 에러
    throw {
      type: "network",
      message:
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
    } as LLMError;
  }
}
