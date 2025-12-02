import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { getRecommendation } from "@/libs/api/llmClient";
import { LLMRecommendation, LLMError } from "@/libs/api/llm.types";
import { HealthProfile } from "@/features/intake/intake.types";
import "./RecommendationPendingScreen.css";

export const RecommendationPendingScreen = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { profile: HealthProfile };
  const hasCalledRef = useRef(false);

  if (!state || !state.profile) {
    navigate("/error", {
      state: { error: "건강 정보를 찾을 수 없습니다." },
    });
    return null;
  }

  const { profile } = state;
  const [error, setError] = useState<LLMError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    // 이미 호출된 경우 다시 호출하지 않음
    if (hasCalledRef.current) {
      return;
    }

    hasCalledRef.current = true;
    isMountedRef.current = true;
    const abortController = new AbortController();

    const fetchRecommendation = async () => {
      try {
        console.log("📡 API 호출 시작:", profile);
        setIsLoading(true);
        const recommendation: LLMRecommendation =
          await getRecommendation(profile);
        console.log("✅ API 응답 받음:", recommendation);

        // 추천 결과 검증
        if (
          !recommendation ||
          !recommendation.supplements ||
          recommendation.supplements.length === 0
        ) {
          console.error("❌ 유효하지 않은 추천 결과:", recommendation);
          throw {
            type: "parse",
            message: "추천 결과가 유효하지 않습니다.",
          } as LLMError;
        }

        setIsLoading(false);
        console.log("🔀 Recommendation 화면으로 이동 중...");

        // navigate는 항상 실행 (React Router가 안전하게 처리)
        navigate("/recommendation", {
          state: { profile, recommendation },
          replace: true,
        });
      } catch (err) {
        console.error("❌ API 호출 오류:", err);

        setIsLoading(false);
        // 에러 발생 시 Error 화면으로 이동
        const llmError = err as LLMError;
        console.error("🚨 에러 화면으로 이동:", llmError);
        setError(llmError);

        // navigate는 항상 실행
        navigate("/error", {
          state: {
            error: llmError.message || "알 수 없는 오류가 발생했습니다.",
            retryScreen: "Intake",
          },
          replace: true,
        });
      }
    };

    fetchRecommendation();

    // 클린업 함수: 컴포넌트 언마운트 시 취소
    return () => {
      isMountedRef.current = false;
      abortController.abort();
      hasCalledRef.current = false; // 리셋해서 다시 호출 가능하게
    };
  }, [profile, navigate]);

  if (!isLoading && error) {
    // 에러가 발생했는데 아직 화면 전환이 안 된 경우 강제로 에러 화면으로 이동
    console.log("⚠️ 에러 발생했지만 화면 전환이 안 됨. 강제 이동 시도");
    navigate("/error", {
      state: {
        error: error.message || "알 수 없는 오류가 발생했습니다.",
        retryScreen: "Intake",
      },
      replace: true,
    });
    return null;
  }

  return (
    <div className="recommendation-pending-screen-container">
      <div className="recommendation-pending-screen-content">
        <div className="recommendation-pending-screen-spinner">⏳</div>
        <p className="recommendation-pending-screen-text">
          영양제 추천을 생성하고 있습니다...
        </p>
        {error && (
          <p className="recommendation-pending-screen-error-text">
            오류가 발생했습니다: {error.message}
          </p>
        )}
      </div>
    </div>
  );
});

RecommendationPendingScreen.displayName = "RecommendationPendingScreen";
