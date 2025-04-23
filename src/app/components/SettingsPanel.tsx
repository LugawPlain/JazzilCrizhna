"use client";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import OneColumnIcon from "@/components/icons/OneColumnIcon";
import TwoColumnIcon from "@/components/icons/TwoColumnIcon";
import ThreeColumnIcon from "@/components/icons/ThreeColumnIcon";

/**
 * Fixed column layout switcher at the bottom of the screen
 */
const SettingsPanel = React.memo(
  ({
    userColumnCount,
    setUserColumnCount,
    activeColumnCount,
  }: {
    userColumnCount: number | null;
    setUserColumnCount: (count: number | null) => void;
    activeColumnCount: number;
  }) => {
    const settingsRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Check if device is mobile with debounce
    useEffect(() => {
      const checkIfMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };

      // Initial check
      checkIfMobile();

      // Add event listener for window resize with debounce
      const handleResize = () => {
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current);
        }

        resizeTimeoutRef.current = setTimeout(() => {
          checkIfMobile();
        }, 100); // Debounce time of 100ms
      };

      window.addEventListener("resize", handleResize);

      // Cleanup
      return () => {
        window.removeEventListener("resize", handleResize);
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current);
        }
      };
    }, []);

    // Handle column count change with useCallback to prevent unnecessary re-renders
    const handleColumnChange = useCallback(
      (count: number) => {
        // Only update if the count is different from current
        if (count !== (userColumnCount || activeColumnCount)) {
          setUserColumnCount(count);
        }
      },
      [userColumnCount, activeColumnCount, setUserColumnCount]
    );

    // Get slider position class based on active column count - memoized
    const sliderPositionClass = useMemo(() => {
      const count = userColumnCount || activeColumnCount;
      if (count === 1) return "left-0";
      if (count === 2) return "left-1/3";
      if (count === 3) return "left-2/3";
      return "left-0";
    }, [userColumnCount, activeColumnCount]);

    // Memoize the current active count to avoid recalculations
    const currentActiveCount = useMemo(() => {
      return userColumnCount || activeColumnCount;
    }, [userColumnCount, activeColumnCount]);

    // Only show the slider on mobile devices
    if (!isMobile) return null;

    return (
      <div className="fixed bottom-4 left-0 right-0 z-40">
        <div
          ref={settingsRef}
          className="mx-auto w-fit bg-neutral-800/90 backdrop-blur-sm rounded-full shadow-lg"
        >
          {/* Mobile slider toggle for 1, 2, 3 columns */}
          <div className="relative flex h-10 w-full rounded-full bg-neutral-800 shadow-inner">
            {/* Sliding indicator - using transform instead of left for better performance */}
            <div
              className={`absolute top-0 h-10 w-1/3 transform rounded-full bg-gray-400 shadow-2xs transition-transform duration-300 ease-in-out ${sliderPositionClass}`}
              style={{
                willChange: "transform",
                boxShadow:
                  "0 0 8px rgba(0, 0, 0, 0.3) inset, -4px 0 8px rgba(0, 0, 0, 0.2), 4px 0 8px rgba(0, 0, 0, 0.2)",
              }} // Hint to browser for optimization
            />

            {/* Column buttons with SVG icons */}
            <div
              className={`relative z-10 flex-1 px-8 flex items-center justify-center transition-colors duration-200 cursor-pointer ${
                currentActiveCount === 1
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-400"
              }`}
              onClick={() => handleColumnChange(1)}
            >
              <OneColumnIcon />
            </div>
            <div
              className={`relative z-10 flex-1 px-8 flex items-center justify-center transition-colors duration-200 cursor-pointer ${
                currentActiveCount === 2
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-400"
              }`}
              onClick={() => handleColumnChange(2)}
            >
              <TwoColumnIcon />
            </div>
            <div
              className={`relative z-10 flex-1 px-8 flex items-center justify-center transition-colors duration-200 cursor-pointer ${
                currentActiveCount === 3
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-400"
              }`}
              onClick={() => handleColumnChange(3)}
            >
              <ThreeColumnIcon />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

SettingsPanel.displayName = "SettingsPanel";

export default SettingsPanel;
