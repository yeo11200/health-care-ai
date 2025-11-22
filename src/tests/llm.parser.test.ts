/**
 * LLM Parser 테스트
 */

import { parseLLMResponse } from "@/libs/api/llm.parser";
import { LLMRecommendation } from "@/libs/api/llm.schema";

describe("parseLLMResponse", () => {
  describe("정상 응답 파싱", () => {
    it("올바른 JSON 응답을 파싱해야 함", () => {
      // 실제 LLM 응답 형식을 기반으로 작성
      const validResponse = JSON.stringify({
        supplements: [
          {
            name: "멜라토닌",
            dosage: "0.5-3 mg",
            reason:
              "수면-각성 주기를 조절하고 수면의 질을 개선하는 데 도움; 피로감의 주요 원인인 만성 수면 부족에 대응하기 위해 취침 30~60분 전에 0.5–3 mg 복용이 일반적입니다.",
            caution:
              "일부 약물과 상호작용 가능성(예: 혈압약, 항응고제) 및 특정 질환이 있는 경우 의사와 상담; 운전이나 기계 조작 시 주의; 임신·수유 중인 경우 주의.",
          },
          {
            name: "비타민 D3",
            dosage: "1000-2000 IU",
            reason:
              "햇빛 노출이 부족한 생활에서 피로감과 근육/정서적 기분 저하를 완화하는 데 도움이 될 수 있으며, 일반적으로 1000–2000 IU를 매일 시작합니다.",
            caution:
              "장기간 고용량 복용 시 혈청 칼슘 수치를 확인하는 것이 좋고, 고칼슘혈증 증상에 주의; 특정 약물과의 상호작용 가능.",
          },
          {
            name: "비타민 B12",
            dosage: "1000-2500 mcg",
            reason:
              "에너지 대사 지원 및 피로 감소에 도움; 특히 흡수가 잘 되지 않는 경우나 비건/저단백 식이일 때 보충이 유용할 수 있습니다.",
            caution:
              "일부 약물과의 상호작용 가능성(예: 메트포르민, 위산억제제) 및 드물게 알레르기 반응 가능.",
          },
          {
            name: "오메가-3 (EPA+DHA)",
            dosage: "1000-2000 mg",
            reason:
              "뇌 건강 및 기분 개선에 도움을 줄 수 있으며 전반적인 피로 완화에도 기여할 수 있습니다; 식사와 함께 섭취하는 것이 흡수를 돕습니다.",
            caution:
              "혈액 응고제 복용 시 주의; 어패류 알레르기가 있는 경우 피해야 함.",
          },
        ],
        summary:
          "피로와 수면질 저하를 고려하여 수면 개선과 에너지 대사를 지원하는 보충제를 제안합니다. 현재 마그네슘을 복용 중이므로 총 섭취량 관리가 필요하며, 시작 전 의료 전문가와 상담하는 것을 권합니다.",
      });

      const result = parseLLMResponse(validResponse);

      expect(result).toBeDefined();
      expect(result.supplements).toHaveLength(4);
      expect(result.supplements[0].name).toBe("멜라토닌");
      expect(result.supplements[0].dosage).toBe("0.5-3 mg");
      expect(result.supplements[0].reason).toContain("수면-각성 주기");
      expect(result.supplements[0].caution).toContain("약물과 상호작용");
      expect(result.supplements[1].name).toBe("비타민 D3");
      expect(result.supplements[1].dosage).toBe("1000-2000 IU");
      expect(result.supplements[2].name).toBe("비타민 B12");
      expect(result.supplements[2].dosage).toBe("1000-2500 mcg");
      expect(result.supplements[3].name).toBe("오메가-3 (EPA+DHA)");
      expect(result.supplements[3].dosage).toBe("1000-2000 mg");
      expect(result.summary).toContain("피로와 수면질 저하");
    });

    it("마크다운 코드 블록이 포함된 응답을 파싱해야 함", () => {
      const responseWithMarkdown = `\`\`\`json
{
      "supplements": [
    {
      "name": "오메가3",
      "dosage": "1000 mg",
      "reason": "뇌 건강과 심혈관 건강에 도움"
    }
  ],
  "summary": "오메가3 추천입니다."
}
\`\`\``;

      const result = parseLLMResponse(responseWithMarkdown);

      expect(result).toBeDefined();
      expect(result.supplements).toHaveLength(1);
      expect(result.supplements[0].name).toBe("오메가3");
    });

    it("주변 텍스트가 포함된 응답을 파싱해야 함", () => {
      const responseWithText = `다음은 추천 결과입니다:
{
  "supplements": [
    {
      "name": "비타민 D",
      "dosage": "1000 IU",
      "reason": "뼈 건강과 면역력 향상"
    }
  ],
  "summary": "비타민 D 추천입니다."
}
이상입니다.`;

      const result = parseLLMResponse(responseWithText);

      expect(result).toBeDefined();
      expect(result.supplements).toHaveLength(1);
      expect(result.supplements[0].name).toBe("비타민 D");
    });
  });

  describe("잘못된 JSON → fallback 테스트", () => {
    it("잘못된 JSON 형식일 때 fallback을 반환해야 함", () => {
      const invalidJson = "{ invalid json }";

      const result = parseLLMResponse(invalidJson);

      expect(result).toBeDefined();
      expect(result.supplements).toBeDefined();
      expect(result.supplements.length).toBeGreaterThan(0);
      expect(result.summary).toContain("안전 모드");
    });

    it("빈 문자열일 때 fallback을 반환해야 함", () => {
      const emptyResponse = "";

      const result = parseLLMResponse(emptyResponse);

      expect(result).toBeDefined();
      expect(result.supplements).toBeDefined();
      expect(result.supplements.length).toBeGreaterThan(0);
    });

    it("JSON이 아닌 텍스트일 때 fallback을 반환해야 함", () => {
      const textResponse = "죄송합니다. 추천을 생성할 수 없습니다.";

      const result = parseLLMResponse(textResponse);

      expect(result).toBeDefined();
      expect(result.supplements).toBeDefined();
      expect(result.supplements.length).toBeGreaterThan(0);
    });

    it("supplements 배열이 비어있을 때 fallback을 반환해야 함", () => {
      const emptySupplements = JSON.stringify({
        supplements: [],
        summary: "추천 결과가 없습니다.",
      });

      const result = parseLLMResponse(emptySupplements);

      expect(result).toBeDefined();
      expect(result.supplements).toBeDefined();
      expect(result.supplements.length).toBeGreaterThan(0);
      expect(result.summary).toContain("안전 모드");
    });

    it("필수 필드가 누락된 경우 fallback을 반환해야 함", () => {
      const missingFields = JSON.stringify({
        supplements: [
          {
            name: "비타민 C",
            dosage: "500 mg",
            // reason 누락
          },
        ],
        // summary 누락
      });

      const result = parseLLMResponse(missingFields);

      expect(result).toBeDefined();
      expect(result.supplements).toBeDefined();
      expect(result.supplements.length).toBeGreaterThan(0);
      expect(result.summary).toContain("안전 모드");
    });
  });

  describe("타입 검증", () => {
    it("반환 타입이 LLMRecommendation이어야 함", () => {
      const validResponse = JSON.stringify({
        supplements: [
          {
            name: "테스트",
            dosage: "100 mg",
            reason: "테스트 이유",
          },
        ],
        summary: "테스트 요약",
      });

      const result = parseLLMResponse(validResponse);

      // 타입 체크
      const recommendation: LLMRecommendation = result;
      expect(recommendation).toBeDefined();
      expect(recommendation.supplements).toBeDefined();
      expect(recommendation.summary).toBeDefined();
    });
  });
});
