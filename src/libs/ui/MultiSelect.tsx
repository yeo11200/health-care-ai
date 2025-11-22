import React, { useState, useRef, useEffect } from "react";
import "./MultiSelect.css";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label: string;
  options: MultiSelectOption[];
  value?: string[];
  onChange: (value: string[]) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

export const MultiSelect = React.memo<MultiSelectProps>(
  ({
    label,
    options,
    value = [],
    onChange,
    error,
    required,
    placeholder = "선택해주세요",
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const selectedValues = value || [];

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = "hidden";
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = "unset";
      };
    }, [isOpen]);

    const handleToggle = (optionValue: string) => {
      const currentValue = selectedValues;
      if (currentValue.includes(optionValue)) {
        onChange(currentValue.filter((v) => v !== optionValue));
      } else {
        onChange([...currentValue, optionValue]);
      }
    };

    const handleClose = () => {
      setIsOpen(false);
    };

    const getSelectedLabels = () => {
      if (selectedValues.length === 0) {
        return placeholder;
      }
      return selectedValues
        .map((val) => options.find((opt) => opt.value === val)?.label)
        .filter(Boolean)
        .join(", ");
    };

    const selectedLabelsText = getSelectedLabels();

    return (
      <div className="multi-select-container">
        <label className="multi-select-label">
          {label} {required && <span className="multi-select-required">*</span>}
        </label>
        <button
          type="button"
          className={`multi-select-button ${
            error ? "multi-select-error" : ""
          } ${isOpen ? "multi-select-open" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span
            className={`multi-select-text ${
              selectedValues.length === 0 ? "multi-select-placeholder" : ""
            }`}
          >
            {selectedLabelsText}
          </span>
          <span className="multi-select-arrow">{isOpen ? "▲" : "▼"}</span>
        </button>
        {error && <span className="multi-select-error-text">{error}</span>}

        {isOpen && (
          <div className="multi-select-modal-overlay" onClick={handleClose}>
            <div
              className="multi-select-modal-content"
              onClick={(e) => e.stopPropagation()}
              ref={modalRef}
            >
              <div className="multi-select-modal-header">
                <span className="multi-select-modal-title">{label}</span>
                <button
                  type="button"
                  className="multi-select-close-button"
                  onClick={handleClose}
                >
                  완료
                </button>
              </div>
              <div className="multi-select-options-list">
                {options.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`multi-select-option-item ${
                        isSelected ? "multi-select-option-selected" : ""
                      }`}
                      onClick={() => handleToggle(option.value)}
                    >
                      <div
                        className={`multi-select-checkbox ${
                          isSelected ? "multi-select-checkbox-selected" : ""
                        }`}
                      >
                        {isSelected && <span className="multi-select-checkmark">✓</span>}
                      </div>
                      <span
                        className={`multi-select-option-text ${
                          isSelected ? "multi-select-option-text-selected" : ""
                        }`}
                      >
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

MultiSelect.displayName = "MultiSelect";
