import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { getRecommendation } from "@/libs/api/llmClient";
import { LLMRecommendation, LLMError } from "@/libs/api/llm.types";
import { HealthProfile } from "@/features/intake/intake.types";
import "./RecommendationPendingScreen.css";

export const RecommendationPendingScreen = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { profile: HealthProfile };

  if (!state || !state.profile) {
    navigate("/error", {
      state: { error: "건강 정보를 찾을 수 없습니다." },
    });
    return null;
  }

  const { profile } = state;
  const [error, setError] = useState<LLMError | null>(null);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchRecommendation = async () => {
      try {
        const recommendation: LLMRecommendation = await getRecommendation(profile);

        if (!isMounted || abortController.signal.aborted) {
          return;
        }

        // 성공 시 Recommendation 화면으로 이동
        navigate("/recommendation", {
          state: { profile, recommendation },
          replace: true,
        });
      } catch (err) {
        if (!isMounted || abortController.signal.aborted) {
          return;
        }

        // 에러 발생 시 Error 화면으로 이동
        const llmError = err as LLMError;
        setError(llmError);
        navigate("/error", {
          state: {
            error: llmError.message,
            retryScreen: "Intake",
          },
          replace: true,
        });
      }
    };

    fetchRecommendation();

    // 클린업 함수: 컴포넌트 언마운트 시 취소
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [profile, navigate]);

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
