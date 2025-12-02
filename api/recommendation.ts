import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { HealthProfile } from "../src/features/intake/intake.types.js";
import { llmResponseSchema } from "../src/libs/api/llm.schema.js";
import type {
  LLMRecommendation,
  LLMError,
  Supplement,
} from "../src/libs/api/llm.types.js";

/**
 * Vercel Serverless Function: 영양제 추천 API
 * POST /api/recommendation
 */

// 환경 변수에서 API 설정 가져오기
const getApiConfig = () => {
  const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:8000";
  const useMock = process.env.USE_MOCK_API === "true";

  return { apiBaseUrl, useMock };
};

// Fallback 추천
function getFallbackRecommendation(): LLMRecommendation {
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

// LLM 응답 파싱 (새 API 형식: result 필드가 JSON 문자열)
function parseAPIResponse(response: {
  result: string;
  model_id?: string;
  region?: string;
}): LLMRecommendation {
  try {
    // result 필드는 JSON 문자열
    const parsed = JSON.parse(response.result);
    const validated = llmResponseSchema.parse(parsed);

    if (!validated.supplements || validated.supplements.length === 0) {
      return getFallbackRecommendation();
    }

    return validated;
  } catch (error) {
    console.error("API 응답 파싱 실패:", error);
    console.error("응답 result:", response.result);
    return getFallbackRecommendation();
  }
}

// Mock 추천
function getMockRecommendation(profile: HealthProfile): LLMRecommendation {
  const supplements: Supplement[] = [];

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
        "일부 약물(예: 혈압약, 항응고제)과 상호작용이 있을 수 있으므로, 특정 질환이 있거나 다른 약물을 복용 중이라면 의사와 상담하세요.",
    });
  }

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

// 새로운 API 호출
async function callRecommendationAPI(
  apiBaseUrl: string,
  profile: HealthProfile,
  retryCount: number = 0
): Promise<LLMRecommendation> {
  const MAX_RETRIES = 2;
  const TIMEOUT_MS = 60000;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${apiBaseUrl}/health/recommend`, {
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
      throw new Error(
        `API 오류 (${response.status}): ${response.statusText}${errorText ? ` - ${errorText}` : ""}`
      );
    }

    const data = await response.json();

    if (!data.result) {
      throw new Error("API 응답에 result 필드가 없습니다.");
    }

    return parseAPIResponse(data);
  } catch (error: any) {
    // 타임아웃 에러
    if (
      error.name === "AbortError" ||
      (error instanceof Error && error.message.includes("timeout"))
    ) {
      if (retryCount < MAX_RETRIES) {
        console.log(
          `타임아웃 발생. 재시도 중... (${retryCount + 1}/${MAX_RETRIES})`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, 2000 * (retryCount + 1))
        );
        return callRecommendationAPI(apiBaseUrl, profile, retryCount + 1);
      }
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
        message: "네트워크 연결을 확인해주세요.",
      } as LLMError;
    }

    throw error;
  }
}

// 추천 생성
async function getRecommendation(
  profile: HealthProfile
): Promise<LLMRecommendation> {
  const config = getApiConfig();

  // Mock 모드
  if (config.useMock) {
    return getMockRecommendation(profile);
  }

  try {
    return await callRecommendationAPI(config.apiBaseUrl, profile, 0);
  } catch (error: any) {
    // 이미 LLMError 형식인 경우
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

// 메인 핸들러
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더 설정
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // POST 요청만 허용
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 환경 변수 확인 (디버깅용)
    const config = getApiConfig();
    console.log("API Base URL:", config.apiBaseUrl);
    console.log("Mock 모드:", config.useMock);

    const profile: HealthProfile = req.body;

    // 입력 검증
    if (!profile || !profile.age || !profile.gender || !profile.weight) {
      return res.status(400).json({
        type: "validation",
        message: "필수 정보가 누락되었습니다.",
      });
    }

    // API 호출
    const recommendation = await getRecommendation(profile);

    return res.status(200).json(recommendation);
  } catch (error: any) {
    // 자세한 에러 로깅
    console.error("=== 추천 생성 오류 ===");
    console.error("Error:", error);
    console.error("Error type:", error?.type);
    console.error("Error message:", error?.message);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error stack:", error.stack);
    }

    // 에러 타입에 따라 적절한 상태 코드 반환
    if (error.type === "timeout") {
      return res.status(504).json({
        type: "timeout",
        message: error.message || "API 호출 시간이 초과되었습니다.",
      });
    }

    if (error.type === "api") {
      return res.status(502).json({
        type: "api",
        message: error.message || "API 오류가 발생했습니다.",
      });
    }

    if (error.type === "network") {
      return res.status(503).json({
        type: "network",
        message: error.message || "네트워크 연결을 확인해주세요.",
      });
    }

    // 기타 에러
    return res.status(500).json({
      type: "parse",
      message: error.message || "알 수 없는 오류가 발생했습니다.",
    });
  }
}
