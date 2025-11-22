import React from "react";
import "./TextArea.css";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export const TextArea = React.memo<TextAreaProps>(
  ({ label, error, required, className = "", ...textAreaProps }) => {
    return (
      <div className="textarea-container">
        <label className="textarea-label">
          {label}
          {required && <span className="textarea-required"> *</span>}
        </label>
        <textarea
          className={`textarea-field ${error ? "textarea-error" : ""} ${className}`}
          {...textAreaProps}
        />
        {error && <span className="textarea-error-text">{error}</span>}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
