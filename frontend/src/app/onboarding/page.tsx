'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, SkipForward } from 'lucide-react';

// ── Step definitions ──────────────────────────────────────────────

interface Step {
  icon: string;
  title: string;
  description: string;
  detail: string;
}

const STEPS: Step[] = [
  {
    icon: '🏠',
    title: 'Welcome',
    description: 'Design your HDB before you get the keys',
    detail:
      'Start planning your dream home even before your BTO is ready. Visualize every room with photorealistic renders and make confident design decisions early.',
  },
  {
    icon: '📋',
    title: 'Select BTO',
    description: 'Choose your project and flat layout from our library',
    detail:
      'Browse available BTO projects and pick your exact flat model — we have detailed floor plans for 3-room, 4-room, and 5-room layouts across Singapore estates.',
  },
  {
    icon: '💬',
    title: 'Chat with AI',
    description: 'Tell our AI consultant your style preferences per room',
    detail:
      'Describe your dream style naturally through conversation. Our AI learns your preferences for colors, materials, and furniture — room by room.',
  },
  {
    icon: '🖼️',
    title: 'Generate Renders',
    description: 'Get photorealistic renders of every room',
    detail:
      'AI generates stunning, photorealistic images of each room from multiple angles. Tweak and regenerate until every space feels perfect.',
  },
];

// ── Step Indicator ─────────────────────────────────────────────────

function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const isCompleted = i < currentStep;
        const isActive = i === currentStep;
        return (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                isCompleted
                  ? 'bg-teal-600 text-white'
                  : isActive
                    ? 'bg-teal-600 text-white ring-2 ring-teal-300 ring-offset-2 ring-offset-slate-50'
                    : 'bg-slate-200 text-slate-400'
              }`}
            >
              {isCompleted ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            {i < totalSteps - 1 && (
              <div
                className={`w-10 h-0.5 rounded transition-colors duration-300 ${
                  isCompleted ? 'bg-teal-600' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Preview Card for remaining steps ───────────────────────────────

function PreviewCard({ step, index }: { step: Step; index: number }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-lg border border-slate-100 p-3 opacity-50 hover:opacity-60 transition">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-lg shrink-0">
        {step.icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-slate-500 truncate">
          {step.title}
        </div>
        <div className="text-[10px] text-slate-400 truncate">
          {step.description}
        </div>
      </div>
    </div>
  );
}

// ── Main Onboarding Component ──────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const completed = localStorage.getItem('onboarding_completed');
    if (completed === 'true') {
      router.replace('/dashboard');
    }
  }, [router]);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem('onboarding_completed', 'true');
    setIsExiting(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 300);
  }, [router]);

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      completeOnboarding();
    }
  }, [currentStep, completeOnboarding]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, []);

  const handleSkip = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const step = STEPS[currentStep];
  const remainingSteps = STEPS.slice(currentStep + 1);
  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div
      className={`min-h-screen bg-gradient-to-b from-teal-50 to-slate-50 flex flex-col transition-opacity duration-300 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Skip link */}
      <div className="flex justify-end px-6 pt-4">
        <button
          onClick={handleSkip}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          <SkipForward className="w-3.5 h-3.5" />
          Skip
        </button>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 max-w-lg mx-auto w-full">
        {/* Step indicator */}
        <StepIndicator
          currentStep={currentStep}
          totalSteps={STEPS.length}
        />

        {/* Current step content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 w-full text-center mb-6">
          <div className="text-6xl mb-5">{step.icon}</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            {step.title}
          </h1>
          <p className="text-base text-teal-700 font-medium mb-3">
            {step.description}
          </p>
          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            {step.detail}
          </p>
        </div>

        {/* Preview cards for remaining steps */}
        {remainingSteps.length > 0 && (
          <div className="w-full space-y-2 mb-6">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-2">
              Coming up next
            </p>
            {remainingSteps.map((s, i) => (
              <PreviewCard
                key={s.title}
                step={s}
                index={currentStep + 1 + i}
              />
            ))}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between w-full gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isFirstStep}
            className="text-slate-500"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back
          </Button>

          <Button
            className="bg-teal-600 hover:bg-teal-700 text-white flex-1 max-w-[200px]"
            onClick={handleNext}
          >
            {isLastStep ? (
              <>
                Get Started
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
