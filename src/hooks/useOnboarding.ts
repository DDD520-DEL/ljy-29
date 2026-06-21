import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export type OnboardingStep = 'timer' | 'records' | 'analysis';

const ONBOARDING_STEPS: OnboardingStep[] = ['timer', 'records', 'analysis'];

export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useLocalStorage<boolean>(
    'hasCompletedOnboarding',
    false
  );
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(!hasCompletedOnboarding);

  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  const totalSteps = ONBOARDING_STEPS.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const nextStep = useCallback(() => {
    if (isLastStep) {
      completeOnboarding();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [isLastStep]);

  const prevStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [isFirstStep]);

  const skipOnboarding = useCallback(() => {
    setIsVisible(false);
    setHasCompletedOnboarding(true);
  }, [setHasCompletedOnboarding]);

  const completeOnboarding = useCallback(() => {
    setIsVisible(false);
    setHasCompletedOnboarding(true);
  }, [setHasCompletedOnboarding]);

  const resetOnboarding = useCallback(() => {
    setCurrentStepIndex(0);
    setHasCompletedOnboarding(false);
    setIsVisible(true);
  }, [setHasCompletedOnboarding]);

  const goToStep = useCallback((step: OnboardingStep) => {
    const index = ONBOARDING_STEPS.indexOf(step);
    if (index !== -1) {
      setCurrentStepIndex(index);
      setIsVisible(true);
    }
  }, []);

  return {
    isVisible: isVisible && !hasCompletedOnboarding,
    currentStep,
    currentStepIndex,
    totalSteps,
    isFirstStep,
    isLastStep,
    hasCompletedOnboarding,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
    resetOnboarding,
    goToStep,
  };
}
