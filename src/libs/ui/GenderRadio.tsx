import React from "react";
import "./GenderRadio.css";

type GenderOption = "male" | "female" | "other";

interface GenderRadioProps {
  value?: GenderOption;
  onChange: (value: GenderOption) => void;
  error?: string;
}

const GENDER_OPTIONS: { value: GenderOption; label: string }[] = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
];

export const GenderRadio = React.memo<GenderRadioProps>(
  ({ value, onChange, error }) => {
    return (
      <div className="gender-radio-container">
        <label className="gender-radio-label">
          성별 <span className="gender-radio-required">*</span>
        </label>
        <div className="gender-radio-options">
          {GENDER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`gender-radio-option ${
                value === option.value ? "gender-radio-selected" : ""
              } ${error ? "gender-radio-error" : ""}`}
              onClick={() => onChange(option.value)}
            >
              <div
                className={`gender-radio-circle ${
                  value === option.value ? "gender-radio-circle-selected" : ""
                }`}
              />
              <span
                className={`gender-radio-text ${
                  value === option.value ? "gender-radio-text-selected" : ""
                }`}
              >
                {option.label}
              </span>
            </button>
          ))}
        </div>
        {error && <span className="gender-radio-error-text">{error}</span>}
      </div>
    );
  }
);

GenderRadio.displayName = "GenderRadio";
