import React, { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { SupplementCard } from "@/libs/ui/SupplementCard";
import { Button } from "@/libs/ui/Button";
import { HealthProfile } from "@/features/intake/intake.types";
import { LLMRecommendation } from "@/libs/api/llm.types";
import "./RecommendationScreen.css";

export const RecommendationScreen = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    profile: HealthProfile;
    recommendation: LLMRecommendation;
  };

  if (!state || !state.profile || !state.recommendation) {
    navigate("/error", {
      state: { error: "추천 결과를 찾을 수 없습니다." },
    });
    return null;
  }

  const { recommendation, profile } = state;

  // 약물 상호작용 경고가 있는지 확인
  const hasMedicationWarning =
    profile.medications &&
    profile.medications !== "없음" &&
    (recommendation.summary.includes("⚠️") ||
      recommendation.summary.includes("약물 상호작용") ||
      recommendation.summary.includes("의료 전문가"));

  // caution이 있는 supplement 개수
  const supplementsWithCaution = recommendation.supplements.filter(
    (s) => s.caution && s.caution.length > 0
  ).length;

  // "다시 입력하기" - 이전 데이터를 전달하여 폼을 채움
  const handleRetry = useCallback(() => {
    navigate("/", {
      state: { initialData: profile },
    });
  }, [navigate, profile]);

  // "처음으로" - 데이터를 초기화하고 빈 폼으로 시작
  const handleGoToIntake = useCallback(() => {
    navigate("/", {
      state: { initialData: undefined },
    });
  }, [navigate]);

  // 빈 supplements 배열 처리
  if (!recommendation.supplements || recommendation.supplements.length === 0) {
    return (
      <div className="recommendation-screen-container">
        <div className="recommendation-screen-empty">
          <h2 className="recommendation-screen-empty-title">추천 결과가 없습니다</h2>
          <p className="recommendation-screen-empty-text">
            관련 영양제를 찾지 못했습니다. 다시 시도해주세요.
          </p>
          <Button
            title="다시 입력하기"
            onClick={handleRetry}
            className="recommendation-screen-retry-button"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="recommendation-screen-container">
      <div className="recommendation-screen-content">
        <div className="recommendation-screen-header">
          <h1 className="recommendation-screen-title">맞춤형 영양제 추천</h1>
          <p className="recommendation-screen-subtitle">
            입력하신 건강 정보를 바탕으로 추천드립니다
          </p>
        </div>

        {/* 복용 중인 약물 정보 */}
        {profile.medications && profile.medications !== "없음" && (
          <div className="recommendation-screen-medication-section">
            <p className="recommendation-screen-medication-label">💊 복용 중인 약물</p>
            <div className="recommendation-screen-medication-card">
              <p className="recommendation-screen-medication-text">
                {profile.medications}
              </p>
            </div>
          </div>
        )}

        {/* 약물 상호작용 경고 */}
        {hasMedicationWarning && (
          <div className="recommendation-screen-warning-section">
            <div className="recommendation-screen-warning-header">
              <span className="recommendation-screen-warning-icon">⚠️</span>
              <h3 className="recommendation-screen-warning-title">약물 상호작용 주의</h3>
            </div>
            <div className="recommendation-screen-warning-card">
              <p className="recommendation-screen-warning-text">
                복용 중인 약물과 영양제 간 상호작용 가능성이 있습니다.{"\n"}
                각 영양제의 주의사항을 꼭 확인하고, 반드시 의료 전문가와
                상담 후 섭취하시기 바랍니다.
              </p>
            </div>
          </div>
        )}

        <div className="recommendation-screen-summary-section">
          <h3 className="recommendation-screen-summary-label">종합 요약</h3>
          <div className="recommendation-screen-summary-card">
            <p className="recommendation-screen-summary-text">
              {recommendation.summary}
            </p>
          </div>
        </div>

        <div className="recommendation-screen-supplements-section">
          <div className="recommendation-screen-section-header">
            <h3 className="recommendation-screen-section-title">
              추천 영양제 ({recommendation.supplements.length}개)
            </h3>
            {supplementsWithCaution > 0 && (
              <p className="recommendation-screen-caution-count">
                ⚠️ 주의사항 있음 ({supplementsWithCaution}개)
              </p>
            )}
          </div>
          {recommendation.supplements.map((supplement, index) => (
            <SupplementCard
              key={`${supplement.name}-${index}`}
              supplement={supplement}
              index={index}
              hasCaution={!!supplement.caution && supplement.caution.length > 0}
            />
          ))}
        </div>

        <div className="recommendation-screen-footer">
          <Button
            title="다시 입력하기"
            onClick={handleRetry}
            variant="secondary"
            className="recommendation-screen-retry-button"
          />

          <Button
            title="처음으로"
            onClick={handleGoToIntake}
            variant="primary"
            className="recommendation-screen-retry-button"
          />
        </div>
      </div>
    </div>
  );
});

RecommendationScreen.displayName = "RecommendationScreen";
