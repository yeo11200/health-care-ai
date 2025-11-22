import React from "react";
import "./Input.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export const Input = React.memo<InputProps>(
  ({ label, error, required, className = "", ...inputProps }) => {
    return (
      <div className="input-container">
        <label className="input-label">
          {label}
          {required && <span className="input-required"> *</span>}
        </label>
        <input
          className={`input-field ${error ? "input-error" : ""} ${className}`}
          {...inputProps}
        />
        {error && <span className="input-error-text">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
