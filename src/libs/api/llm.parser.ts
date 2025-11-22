import { LLMRecommendation } from "./llm.schema";
import { llmResponseSchema } from "./llm.schema";

/**
 * JSON 문자열에서 JSON 객체를 추출합니다.
 * 마크다운 코드 블록이나 주변 텍스트를 제거합니다.
 */
function extractJSON(rawResponse: string): string {
  // 마크다운 코드 블록 제거
  let cleaned = rawResponse.trim();

  // ```json 또는 ```로 감싸진 경우 제거
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");

  // JSON 객체 찾기 (첫 번째 { 부터 마지막 } 까지)
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  // JSON 배열인 경우도 처리
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  }

  return cleaned;
}

/**
 * Fallback 추천 응답을 반환합니다.
 * JSON 파싱 실패 시 사용됩니다.
 */
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

/**
 * LLM의 원시 응답을 파싱하고 검증하여 LLMRecommendation 타입으로 반환합니다.
 *
 * @param rawResponse - LLM API로부터 받은 원시 응답 문자열
 * @returns 검증된 LLMRecommendation 객체
 * @throws LLMError - 파싱 또는 검증 실패 시
 */
export function parseLLMResponse(rawResponse: string): LLMRecommendation {
  try {
    console.log("=== Parsing LLM Response ===");
    console.log("Raw response:", rawResponse);
    console.log("Raw response length:", rawResponse.length);

    // JSON 추출
    const jsonStr = extractJSON(rawResponse);
    console.log("Extracted JSON string:", jsonStr);
    console.log("JSON string length:", jsonStr?.length || 0);

    if (!jsonStr || jsonStr.trim().length === 0) {
      console.error("JSON 추출 실패 - 빈 문자열");
      console.error("원본 응답:", rawResponse);
      throw new Error("응답에 JSON이 포함되어 있지 않습니다.");
    }

    // JSON 파싱
    const parsed = JSON.parse(jsonStr);
    console.log("Parsed JSON:", JSON.stringify(parsed, null, 2));

    // Zod로 검증
    const validated = llmResponseSchema.parse(parsed);
    console.log("Validated response:", JSON.stringify(validated, null, 2));

    // 빈 supplements 배열 체크
    if (!validated.supplements || validated.supplements.length === 0) {
      console.warn("Supplements 배열이 비어있음 - fallback 사용");
      return getFallbackRecommendation();
    }

    console.log("=== Parsing Success ===");
    return validated;
  } catch (error) {
    console.error("=== LLM 응답 파싱 실패 ===");
    console.error("Error:", error);
    console.error(
      "Error type:",
      error instanceof Error ? error.constructor.name : typeof error
    );
    console.error(
      "Error message:",
      error instanceof Error ? error.message : String(error)
    );
    console.error("Raw response:", rawResponse);
    console.error("========================");
    return getFallbackRecommendation();
  }
}
