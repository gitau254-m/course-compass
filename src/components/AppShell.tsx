import { useApp } from '@/contexts/AppContext';
import { StepIndicator } from './StepIndicator';
import { WelcomeStep } from './steps/WelcomeStep';
import { KCSEResultsStep } from './steps/KCSEResultsStep';
import { InterestStep } from './steps/InterestStep';
import { PaymentStep } from './steps/PaymentStep';
import { ResultsStep } from './steps/ResultsStep';
import { GraduationCap } from 'lucide-react';

export function AppShell() {
  const { currentStep } = useApp();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep />;
      case 2:
        return <KCSEResultsStep />;
      case 3:
        return <InterestStep />;
      case 4:
        return <PaymentStep />;
      case 5:
        return <ResultsStep />;
      default:
        return <WelcomeStep />;
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-sm sm:text-base">
              KCSE Course Checker
            </span>
          </div>
        </div>
        {currentStep > 1 && currentStep < 5 && (
          <div className="border-t border-border bg-background">
            <StepIndicator />
          </div>
        )}
      </header>

      {/* Kenya stripe */}
      <div className="kenya-stripe" />

      {/* Main content */}
      <main className="container max-w-2xl mx-auto py-6 sm:py-10">
        {renderStep()}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 mt-auto">
        <div className="container max-w-2xl mx-auto px-4 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 KCSE Course Checker • Not affiliated with KNEC or KUCCPS
          </p>
        </div>
      </footer>
    </div>
  );
}