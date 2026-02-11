import React, { useState, useEffect, useCallback } from 'react';

interface OnboardingProps {
  onComplete: () => void;
}

const STORAGE_KEY = 'madcolors-onboarding-complete';

const TOUR_STEPS = [
  { target: 'hue-dial', text: 'Drag or scroll to browse hues', position: 'above' as const },
  { target: 'color-grid', text: 'Click any color tile to explore it', position: 'below' as const },
];

export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShowOnboarding(true);
  };

  return { showOnboarding, completeOnboarding, resetOnboarding };
};

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 12;

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const [exiting, setExiting] = useState(false);

  const measure = useCallback(() => {
    const sel = TOUR_STEPS[step]?.target;
    if (!sel) return;
    const el = document.querySelector(`[data-tour="${sel}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top - PADDING,
      left: r.left - PADDING,
      width: r.width + PADDING * 2,
      height: r.height + PADDING * 2,
    });
  }, [step]);

  useEffect(() => {
    // Small delay to let the UI settle on first render
    const timer = setTimeout(measure, 100);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  const advance = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setExiting(true);
      setTimeout(onComplete, 250);
    }
  };

  if (!rect) return null;

  const tourStep = TOUR_STEPS[step];
  const tooltipAbove = tourStep.position === 'above';

  return (
    <div
      className={`fixed inset-0 z-[100] transition-opacity duration-250 ${exiting ? 'opacity-0' : 'opacity-100'}`}
      onClick={advance}
      style={{ cursor: 'pointer' }}
    >
      {/* Spotlight cutout via box-shadow */}
      <div
        className="absolute transition-all duration-500 ease-out"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          borderRadius: 16,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
        }}
      >
        {/* Pulsing ring */}
        <div
          className="absolute inset-0 rounded-2xl animate-pulse"
          style={{
            border: '2px solid rgba(255,255,255,0.4)',
          }}
        />
      </div>

      {/* Tooltip */}
      <div
        className="absolute transition-all duration-500 ease-out flex flex-col items-center pointer-events-none"
        style={{
          left: rect.left + rect.width / 2,
          ...(tooltipAbove
            ? { top: rect.top - 12, transform: 'translate(-50%, -100%)' }
            : { top: rect.top + rect.height + 12, transform: 'translate(-50%, 0)' }
          ),
        }}
      >
        {/* Arrow pointing toward spotlight */}
        {!tooltipAbove && (
          <div
            className="w-3 h-3 bg-white rotate-45 -mb-1.5"
            style={{ boxShadow: '-1px -1px 2px rgba(0,0,0,0.06)' }}
          />
        )}
        <div className="bg-white text-slate-800 text-sm font-medium px-5 py-2.5 rounded-full shadow-lg whitespace-nowrap">
          {tourStep.text}
        </div>
        {tooltipAbove && (
          <div
            className="w-3 h-3 bg-white rotate-45 -mt-1.5"
            style={{ boxShadow: '1px 1px 2px rgba(0,0,0,0.06)' }}
          />
        )}
      </div>
    </div>
  );
};

export default Onboarding;
