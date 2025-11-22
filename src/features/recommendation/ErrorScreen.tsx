import React, { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Button } from "@/libs/ui/Button";
import "./ErrorScreen.css";

export const ErrorScreen = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    error?: string;
    retryScreen?: "Intake" | "RecommendationPending";
  };

  const error = state?.error || "알 수 없는 오류가 발생했습니다.";
  const retryScreen = state?.retryScreen;

  const handleRetry = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return (
    <div className="error-screen-container">
      <div className="error-screen-content">
        <div className="error-screen-icon-container">
          <span className="error-screen-icon">⚠️</span>
        </div>
        <h1 className="error-screen-title">오류가 발생했습니다</h1>
        <p className="error-screen-message">{error}</p>
        {(error.includes("할당량") || error.includes("quota")) && (
          <p className="error-screen-hint">
            💡 개발 중에는 Mock 모드를 사용하세요{"\n"}
            .env 파일에 VITE_USE_MOCK_API=true 추가
          </p>
        )}
        <div className="error-screen-button-container">
          <Button
            title="다시 시도"
            onClick={handleRetry}
            className="error-screen-button"
          />
          <Button
            title="처음으로"
            onClick={() => navigate("/")}
            variant="outline"
            className="error-screen-button"
          />
        </div>
      </div>
    </div>
  );
});

ErrorScreen.displayName = "ErrorScreen";
