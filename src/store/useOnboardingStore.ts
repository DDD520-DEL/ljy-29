import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OnboardingStep = 'timer' | 'records' | 'analysis';

const ONBOARDING_STEPS: OnboardingStep[] = ['timer', 'records', 'analysis'];

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  currentStepIndex: number;
  isVisible: boolean;

  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  goToStep: (step: OnboardingStep) => void;

  getCurrentStep: () => OnboardingStep;
  getTotalSteps: () => number;
  isFirstStep: () => boolean;
  isLastStep: () => boolean;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      hasCompletedOnboarding: false,
      currentStepIndex: 0,
      isVisible: true,

      nextStep: () => {
        const { isLastStep, completeOnboarding } = get();
        if (isLastStep()) {
          completeOnboarding();
        } else {
          set((state) => ({ currentStepIndex: state.currentStepIndex + 1 }));
        }
      },

      prevStep: () => {
        set((state) => ({
          currentStepIndex: Math.max(0, state.currentStepIndex - 1),
        }));
      },

      skipOnboarding: () => {
        set({ isVisible: false, hasCompletedOnboarding: true });
      },

      completeOnboarding: () => {
        set({ isVisible: false, hasCompletedOnboarding: true });
      },

      resetOnboarding: () => {
        set({
          currentStepIndex: 0,
          hasCompletedOnboarding: false,
          isVisible: true,
        });
      },

      goToStep: (step: OnboardingStep) => {
        const index = ONBOARDING_STEPS.indexOf(step);
        if (index !== -1) {
          set({ currentStepIndex: index, isVisible: true });
        }
      },

      getCurrentStep: () => {
        return ONBOARDING_STEPS[get().currentStepIndex];
      },

      getTotalSteps: () => ONBOARDING_STEPS.length,

      isFirstStep: () => get().currentStepIndex === 0,

      isLastStep: () => get().currentStepIndex === ONBOARDING_STEPS.length - 1,
    }),
    {
      name: 'onboarding-storage',
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);
