import React from "react";
import "./BooleanRadio.css";

interface BooleanRadioProps {
  label: string;
  value?: boolean;
  onChange: (value: boolean) => void;
  error?: string;
  required?: boolean;
  trueLabel?: string;
  falseLabel?: string;
}

export const BooleanRadio = React.memo<BooleanRadioProps>(
  ({
    label,
    value,
    onChange,
    error,
    required = false,
    trueLabel = "예",
    falseLabel = "아니오",
  }) => {
    return (
      <div className="boolean-radio-container">
        <label className="boolean-radio-label">
          {label} {required && <span className="boolean-radio-required">*</span>}
        </label>
        <div className="boolean-radio-options">
          <button
            type="button"
            className={`boolean-radio-option ${
              value === true ? "boolean-radio-selected" : ""
            } ${error ? "boolean-radio-error" : ""}`}
            onClick={() => onChange(true)}
          >
            <div
              className={`boolean-radio-circle ${
                value === true ? "boolean-radio-circle-selected" : ""
              }`}
            />
            <span
              className={`boolean-radio-text ${
                value === true ? "boolean-radio-text-selected" : ""
              }`}
            >
              {trueLabel}
            </span>
          </button>

          <button
            type="button"
            className={`boolean-radio-option ${
              value === false ? "boolean-radio-selected" : ""
            } ${error ? "boolean-radio-error" : ""}`}
            onClick={() => onChange(false)}
          >
            <div
              className={`boolean-radio-circle ${
                value === false ? "boolean-radio-circle-selected" : ""
              }`}
            />
            <span
              className={`boolean-radio-text ${
                value === false ? "boolean-radio-text-selected" : ""
              }`}
            >
              {falseLabel}
            </span>
          </button>
        </div>
        {error && <span className="boolean-radio-error-text">{error}</span>}
      </div>
    );
  }
);

BooleanRadio.displayName = "BooleanRadio";
