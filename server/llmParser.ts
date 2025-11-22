import { llmResponseSchema } from '../src/libs/api/llm.schema.js';
import type { LLMRecommendation } from '../src/libs/api/llm.types.js';

/**
 * JSON 문자열에서 JSON 객체를 추출합니다.
 */
function extractJSON(rawResponse: string): string {
  let cleaned = rawResponse.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return cleaned;
}

/**
 * Fallback 추천 응답을 반환합니다.
 */
function getFallbackRecommendation(): LLMRecommendation {
  return {
    supplements: [
      {
        name: '종합 비타민',
        dosage: '1정 (제조사 권장량)',
        reason: '기본적인 영양소 보충을 위해 추천합니다.',
        caution: '개인 맞춤 추천을 위해 정확한 정보 입력이 필요합니다.',
      },
    ],
    summary: '안전 모드 추천입니다. 정확한 추천을 위해 다시 시도해주세요.',
  };
}

/**
 * LLM의 원시 응답을 파싱하고 검증합니다.
 */
export function parseLLMResponse(rawResponse: string): LLMRecommendation {
  try {
    const jsonStr = extractJSON(rawResponse);

    if (!jsonStr || jsonStr.trim().length === 0) {
      throw new Error('응답에 JSON이 포함되어 있지 않습니다.');
    }

    const parsed = JSON.parse(jsonStr);
    const validated = llmResponseSchema.parse(parsed);

    if (!validated.supplements || validated.supplements.length === 0) {
      return getFallbackRecommendation();
    }

    return validated;
  } catch (error) {
    console.error('LLM 응답 파싱 실패:', error);
    return getFallbackRecommendation();
  }
}

