import { Check } from 'lucide-react';
import { STEPS } from '@/lib/constants';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

export function StepIndicator() {
  const { currentStep } = useApp();

  return (
    <div className="w-full py-4 px-2">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const isPending = currentStep < step.id;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300',
                    isCompleted && 'step-completed',
                    isActive && 'step-active ring-4 ring-primary/20',
                    isPending && 'step-pending'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs mt-1 hidden sm:block text-center max-w-[60px]',
                    isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-8 sm:w-12 h-0.5 mx-1 transition-colors duration-300',
                    currentStep > step.id ? 'bg-success' : 'bg-border'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}