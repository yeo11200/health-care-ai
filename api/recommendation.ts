import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";
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
  const apiKey = process.env.OPENAI_API_KEY || "";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const useMock = process.env.USE_MOCK_API === "true";

  return { apiKey, model, useMock };
};

// 프롬프트 생성
function buildPrompt(profile: HealthProfile): string {
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

2. 종합 추천:
   - 복용 중인 약물 + 생활 패턴 + 건강 고민을 모두 종합하여 추천하세요

JSON 형식으로만 출력:
{
  "supplements": [{"name": "한국어명", "reason": "이유", "dosage": "1일 기준 섭취 용량", "caution": "주의사항"}],
  "summary": "요약"
}

규칙:
1. JSON만 출력 (설명 없음)
2. supplements 최소 1개
3. name은 한국어
4. dosage는 1일 기준 섭취 용량을 명시
5. reason에는 약물+생활+고민을 종합한 추천 이유를 명시
6. caution에는 약물 상호작용, 복용 시 주의사항을 명시
7. summary에는 약물 상호작용 경고와 종합 추천 근거를 포함`;
}

// JSON 파싱
function extractJSON(rawResponse: string): string {
  let cleaned = rawResponse.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return cleaned;
}

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

// LLM 응답 파싱
function parseLLMResponse(rawResponse: string): LLMRecommendation {
  try {
    const jsonStr = extractJSON(rawResponse);

    if (!jsonStr || jsonStr.trim().length === 0) {
      throw new Error("응답에 JSON이 포함되어 있지 않습니다.");
    }

    const parsed = JSON.parse(jsonStr);
    const validated = llmResponseSchema.parse(parsed);

    if (!validated.supplements || validated.supplements.length === 0) {
      return getFallbackRecommendation();
    }

    return validated;
  } catch (error) {
    console.error("LLM 응답 파싱 실패:", error);
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

// OpenAI API 호출
async function callOpenAIAPI(
  apiKey: string,
  model: string,
  prompt: string,
  retryCount: number = 0
): Promise<string> {
  const MAX_RETRIES = 2;
  const TIMEOUT_MS = 60000;

  const openai = new OpenAI({
    apiKey,
    timeout: TIMEOUT_MS,
    maxRetries: 0,
  });

  const maxTokens =
    model.includes("nano") ||
    model.includes("o1") ||
    model.includes("reasoning")
      ? 10000
      : 2000;

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: maxTokens,
    });

    const content = completion.choices[0]?.message?.content || "";
    const finishReason = completion.choices[0]?.finish_reason;

    if (!content) {
      if (retryCount < MAX_RETRIES && finishReason !== "length") {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1))
        );
        return callOpenAIAPI(apiKey, model, prompt, retryCount + 1);
      }

      if (finishReason === "length") {
        throw new Error("API 응답이 토큰 한도에 도달하여 비어있습니다.");
      }

      throw new Error("API 응답이 비어있습니다.");
    }

    return content;
  } catch (error: any) {
    if (
      retryCount < MAX_RETRIES &&
      ((error instanceof Error && error.message.includes("timeout")) ||
        (error instanceof OpenAI.APIError && error.status === 408))
    ) {
      await new Promise((resolve) =>
        setTimeout(resolve, 2000 * (retryCount + 1))
      );
      return callOpenAIAPI(apiKey, model, prompt, retryCount + 1);
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
  if (config.useMock || !config.apiKey) {
    return getMockRecommendation(profile);
  }

  try {
    const prompt = buildPrompt(profile);
    const rawResponse = await callOpenAIAPI(
      config.apiKey,
      config.model,
      prompt,
      0
    );
    return parseLLMResponse(rawResponse);
  } catch (error: any) {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 408 || error.message.includes("timeout")) {
        throw {
          type: "timeout",
          message: "API 호출 시간이 초과되었습니다. 다시 시도해주세요.",
        } as LLMError;
      }

      if (error.status === 429) {
        throw {
          type: "api",
          message:
            "API 사용량 한도를 초과했습니다. OpenAI 계정의 결제 정보와 사용량을 확인해주세요.",
        } as LLMError;
      }

      throw {
        type: "api",
        message: `API 오류 (${error.status}): ${error.message}`,
      } as LLMError;
    }

    if (error instanceof Error) {
      if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        throw {
          type: "network",
          message: "네트워크 연결을 확인해주세요.",
        } as LLMError;
      }
    }

    throw {
      type: "parse",
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
    if (!config.apiKey) {
      console.warn("⚠️ OPENAI_API_KEY가 설정되지 않았습니다.");
      console.warn(
        "환경 변수 키:",
        Object.keys(process.env).filter(
          (k) => k.includes("OPENAI") || k.includes("MOCK")
        )
      );
    }

    const profile: HealthProfile = req.body;

    // 입력 검증
    if (!profile || !profile.age || !profile.gender || !profile.weight) {
      return res.status(400).json({
        type: "validation",
        message: "필수 정보가 누락되었습니다.",
      });
    }

    // OpenAI API를 서버에서 호출
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
