import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRecommendation } from "../server/llmProxy.js";
import type { HealthProfile } from "../src/features/intake/intake.types.js";

/**
 * Vercel Serverless Function: 영양제 추천 API
 * POST /api/recommendation
 */
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
    console.error("추천 생성 오류:", error);

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
