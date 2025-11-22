import OpenAI from "openai";
import dotenv from "dotenv";
import { buildPrompt } from "./llmPrompt.js";
import { parseLLMResponse } from "./llmParser.js";
import type { HealthProfile } from "../src/features/intake/intake.types.js";
import type { LLMRecommendation, LLMError } from "../src/libs/api/llm.types.js";

// 환경 변수 로드
dotenv.config();

/**
 * 환경 변수에서 API 설정을 가져옵니다.
 * 서버 측에서는 VITE_ 접두사 없이 사용합니다.
 */
const getApiConfig = () => {
  const apiKey = process.env.OPENAI_API_KEY || "";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const useMock = process.env.USE_MOCK_API === "true";

  return { apiKey, model, useMock };
};

/**
 * Mock 추천 응답을 반환합니다.
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
 * OpenAI API를 호출합니다.
 */
async function callOpenAIAPI(
  apiKey: string,
  model: string,
  prompt: string,
  retryCount: number = 0
): Promise<string> {
  const MAX_RETRIES = 2;
  const TIMEOUT_MS = 60000;

  // 서버 환경에서는 dangerouslyAllowBrowser 불필요
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

/**
 * LLM API를 호출하여 추천을 받습니다.
 */
export async function getRecommendation(
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
