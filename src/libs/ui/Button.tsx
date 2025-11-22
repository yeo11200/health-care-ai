import React from "react";
import "./Button.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  variant?: "primary" | "secondary" | "outline";
  loading?: boolean;
}

export const Button = React.memo<ButtonProps>(
  ({
    title,
    variant = "primary",
    disabled = false,
    loading = false,
    className = "",
    onClick,
    ...buttonProps
  }) => {
    return (
      <button
        className={`button button-${variant} ${loading || disabled ? "button-disabled" : ""} ${className}`}
        onClick={onClick}
        disabled={disabled || loading}
        {...buttonProps}
      >
        {loading ? (
          <span className="button-spinner">⏳</span>
        ) : (
          <span className="button-text">{title}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
