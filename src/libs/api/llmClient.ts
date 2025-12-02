import { HealthProfile } from "@/features/intake/intake.types";
import { LLMRecommendation, LLMError } from "./llm.types";
import { llmResponseSchema } from "./llm.schema";

/**
 * 새 추천 API를 직접 호출합니다.
 * 클라이언트에서 직접 API 서버를 호출합니다.
 */

// API 기본 URL 설정
const getApiBaseUrl = () => {
  // 환경 변수에서 API Base URL 가져오기 (기본값: http://localhost:8000)
  return import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
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
 * API 응답 파싱 (result 필드가 JSON 문자열 또는 객체일 수 있음)
 */
function parseAPIResponse(response: {
  result: string | object;
  model_id?: string;
  region?: string;
}): LLMRecommendation {
  try {
    let parsed: any;

    // result가 문자열이면 파싱, 객체면 그대로 사용
    if (typeof response.result === "string") {
      console.log("📝 result가 문자열, JSON 파싱 시도...");
      parsed = JSON.parse(response.result);
    } else if (typeof response.result === "object") {
      console.log("📦 result가 객체, 그대로 사용...");
      parsed = response.result;
    } else {
      throw new Error(`예상치 못한 result 타입: ${typeof response.result}`);
    }

    console.log("✅ 파싱된 데이터:", parsed);
    const validated = llmResponseSchema.parse(parsed);

    if (!validated.supplements || validated.supplements.length === 0) {
      return {
        supplements: [
          {
            name: "종합 비타민",
            dosage: "1정 (제조사 권장량)",
            reason: "기본적인 영양소 보충을 위해 추천합니다.",
            caution: "개인 맞춤 추천을 위해 정확한 정보 입력이 필요합니다.",
          },
        ],
        summary: "안전 모드 추천입니다. 정확한 추천을 위해 다시 시도해주세요.",
      };
    }

    return validated;
  } catch (error) {
    console.error("❌ API 응답 파싱 실패:", error);
    console.error("📄 원본 result:", response.result);
    console.error("📄 result 타입:", typeof response.result);

    // 에러 상세 정보
    if (error instanceof Error) {
      console.error("에러 메시지:", error.message);
      console.error("에러 스택:", error.stack);
    }

    throw {
      type: "parse",
      message: `API 응답을 파싱할 수 없습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
    } as LLMError;
  }
}

/**
 * 새로운 추천 API를 직접 호출합니다.
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

  const TIMEOUT_MS = 60000;

  try {
    console.log("🌐 API 요청 전송:", `${API_BASE_URL}/health/recommend`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${API_BASE_URL}/health/recommend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        profile: {
          age: profile.age,
          gender: profile.gender,
          weight: profile.weight,
          smoking: profile.smoking,
          medications: profile.medications,
          concerns: profile.concerns,
          lifestyle: profile.lifestyle,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("❌ API 오류 응답:", response.status, errorText);
      throw {
        type: "api",
        message: `API 오류 (${response.status}): ${response.statusText}${errorText ? ` - ${errorText}` : ""}`,
      } as LLMError;
    }

    const data = await response.json();
    console.log("📦 API 원본 응답:", JSON.stringify(data, null, 2));
    console.log("📦 API 응답 타입:", typeof data);
    console.log("📦 result 필드 존재:", "result" in data);
    console.log("📦 result 타입:", typeof data.result);

    // 응답이 직접 supplements 배열을 가지고 있는 경우 (result 필드 없음)
    if (data.supplements && Array.isArray(data.supplements)) {
      console.log("✅ 응답이 직접 supplements 배열을 포함함");
      const validated = llmResponseSchema.parse(data);
      return validated;
    }

    // result 필드가 있는 경우
    if (!data.result) {
      console.error("❌ result 필드 없음:", data);
      throw {
        type: "api",
        message: "API 응답에 result 필드가 없습니다.",
      } as LLMError;
    }

    console.log("🔍 result 필드 파싱 시작:", data.result);
    const parsed = parseAPIResponse(data);
    console.log("✅ 파싱 완료:", parsed);
    return parsed;
  } catch (error: any) {
    // 타임아웃 에러
    if (
      error.name === "AbortError" ||
      (error instanceof Error && error.message.includes("timeout"))
    ) {
      throw {
        type: "timeout",
        message: "API 호출 시간이 초과되었습니다. 다시 시도해주세요.",
      } as LLMError;
    }

    // 네트워크 에러
    if (
      error instanceof TypeError &&
      (error.message.includes("fetch") || error.message.includes("network"))
    ) {
      throw {
        type: "network",
        message:
          "네트워크 연결을 확인해주세요. API 서버가 실행 중인지 확인해주세요.",
      } as LLMError;
    }

    // 이미 LLMError 형식인 경우 그대로 throw
    if (error.type && error.message) {
      throw error;
    }

    // 기타 에러
    throw {
      type: "api",
      message:
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
    } as LLMError;
  }
}
