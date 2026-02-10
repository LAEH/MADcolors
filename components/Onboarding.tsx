import React, { useState, useEffect } from 'react';
import { MousePointer2, Move, Keyboard, Palette, X, ChevronRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const STORAGE_KEY = 'munsell-onboarding-complete';

const steps = [
  {
    icon: Move,
    title: 'Spin the Wheel',
    description: 'Drag left or right on the bottom dial to browse through 40 Munsell hues. You can also scroll with your mouse wheel.',
    accent: 'from-orange-400 to-red-500',
  },
  {
    icon: Keyboard,
    title: 'Keyboard Navigation',
    description: 'Use arrow keys to step through hues one at a time. Press Home or End to jump to the first or last hue.',
    accent: 'from-blue-400 to-indigo-500',
  },
  {
    icon: MousePointer2,
    title: 'Select Colors',
    description: 'Click any color tile in the grid to explore it. You\'ll see its Munsell notation, hex code, and color harmonies.',
    accent: 'from-green-400 to-emerald-500',
  },
  {
    icon: Palette,
    title: 'Explore Harmonies',
    description: 'When you select a color, discover complementary, analogous, and triadic color schemes based on Munsell theory.',
    accent: 'from-purple-400 to-pink-500',
  },
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

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div
      className={`
        fixed inset-0 z-[100] flex items-center justify-center p-6
        transition-opacity duration-300
        ${isExiting ? 'opacity-0' : 'opacity-100'}
      `}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
        onClick={handleSkip}
      />

      {/* Card */}
      <div
        className={`
          relative max-w-md w-full
          bg-white rounded-3xl shadow-2xl
          overflow-hidden
          transition-all duration-500
          ${isExiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
        `}
      >
        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 z-10 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Skip tutorial"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon Header */}
        <div className={`bg-gradient-to-br ${step.accent} p-8 flex justify-center`}>
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
            <Icon className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
        </div>

        {/* Content */}
        <div className="p-8 pt-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            {step.title}
          </h2>
          <p className="text-slate-600 text-base leading-relaxed mb-8">
            {step.description}
          </p>

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${index === currentStep
                    ? 'w-6 bg-slate-900'
                    : index < currentStep
                      ? 'bg-slate-400'
                      : 'bg-slate-200'
                  }
                `}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          {/* Action Button */}
          <button
            onClick={handleNext}
            className={`
              w-full py-4 rounded-2xl font-semibold text-white
              bg-gradient-to-r ${step.accent}
              hover:shadow-lg hover:scale-[1.02]
              active:scale-[0.98]
              transition-all duration-200
              flex items-center justify-center gap-2
            `}
          >
            {isLastStep ? 'Start Exploring' : 'Next'}
            {!isLastStep && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
