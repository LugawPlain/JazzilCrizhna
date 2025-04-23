import React, { useState } from "react";

type ToggleState = "first" | "second" | "third";

interface ThreeStateToggleProps {
  initialState?: ToggleState;
  firstLabel?: string;
  secondLabel?: string;
  thirdLabel?: string;
  onChange?: (state: ToggleState) => void;
  disabled?: boolean;
  className?: string;
}

const ThreeStateToggle: React.FC<ThreeStateToggleProps> = ({
  initialState = "first",
  firstLabel = "First",
  secondLabel = "Second",
  thirdLabel = "Third",
  onChange,
  disabled = false,
  className = "",
}) => {
  const [currentState, setCurrentState] = useState<ToggleState>(initialState);

  const handleStateChange = (newState: ToggleState) => {
    if (disabled) return;

    setCurrentState(newState);
    onChange?.(newState);
  };

  // Determine the position class for the slider
  const getSliderPositionClass = () => {
    switch (currentState) {
      case "first":
        return "left-0";
      case "second":
        return "left-1/3";
      case "third":
        return "left-2/3";
      default:
        return "left-0";
    }
  };

  // Generate the color classes for each state button
  const getStateButtonClasses = (state: ToggleState) => {
    const isActive = currentState === state;

    return `
      relative z-10 flex-1 py-2 text-center text-sm font-medium transition-colors duration-200
      ${isActive ? "text-white" : "text-gray-500 hover:text-gray-700"}
      ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
    `;
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative flex h-10 w-full rounded-full bg-gray-200 p-1 shadow-inner">
        {/* Sliding indicator */}
        <div
          className={`absolute top-1 h-8 w-1/3 transform rounded-full bg-blue-600 transition-all duration-300 ease-in-out ${getSliderPositionClass()}`}
        />

        {/* State buttons */}
        <div
          className={getStateButtonClasses("first")}
          onClick={() => handleStateChange("first")}
        >
          {firstLabel}
        </div>
        <div
          className={getStateButtonClasses("second")}
          onClick={() => handleStateChange("second")}
        >
          {secondLabel}
        </div>
        <div
          className={getStateButtonClasses("third")}
          onClick={() => handleStateChange("third")}
        >
          {thirdLabel}
        </div>
      </div>
    </div>
  );
};

const ExampleUsage = () => {
  return (
    <div className="flex flex-col items-center p-8 space-y-8">
      {/* Custom labels */}
      <div className="w-full max-w-md space-y-2">
        <ThreeStateToggle
          firstLabel="Low"
          secondLabel="Medium"
          thirdLabel="High"
          initialState="second"
        />
      </div>
    </div>
  );
};

export default ExampleUsage;
