import { BrowserRouter, Routes, Route } from "react-router-dom";
import { IntakeScreen } from "@/features/intake/IntakeScreen";
import { RecommendationPendingScreen } from "@/features/recommendation/RecommendationPendingScreen";
import { RecommendationScreen } from "@/features/recommendation/RecommendationScreen";
import { ErrorScreen } from "@/features/recommendation/ErrorScreen";
import "./AppNavigator.css";

export const AppNavigator = () => {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route
            path="/"
            element={<IntakeScreen />}
          />
          <Route
            path="/recommendation-pending"
            element={<RecommendationPendingScreen />}
          />
          <Route
            path="/recommendation"
            element={<RecommendationScreen />}
          />
          <Route
            path="/error"
            element={<ErrorScreen />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
};
