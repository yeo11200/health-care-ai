import React from "react";
import { Supplement } from "@/libs/api/llm.types";
import "./SupplementCard.css";

interface SupplementCardProps {
  supplement: Supplement;
  index: number;
  hasCaution?: boolean;
}

export const SupplementCard = React.memo<SupplementCardProps>(
  ({ supplement, index, hasCaution = false }) => {
    return (
      <div
        className={`supplement-card ${
          hasCaution ? "supplement-card-caution" : ""
        }`}
      >
        <div className="supplement-card-header">
          <div className="supplement-card-number">
            {index + 1}
          </div>
          <h3 className="supplement-card-name">{supplement.name}</h3>
        </div>
        <div className="supplement-card-content">
          <div className="supplement-card-dosage-section">
            <span className="supplement-card-dosage-label">💊 1일 섭취 용량</span>
            <span className="supplement-card-dosage">{supplement.dosage}</span>
          </div>
          <div className="supplement-card-reason-section">
            <span className="supplement-card-label">추천 이유</span>
            <p className="supplement-card-reason">{supplement.reason}</p>
          </div>
          {supplement.caution && (
            <div className="supplement-card-caution-section">
              <span className="supplement-card-caution-label">⚠️ 주의사항</span>
              <p className="supplement-card-caution-text">{supplement.caution}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

SupplementCard.displayName = "SupplementCard";
