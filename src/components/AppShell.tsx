// ============================================================
// FILE: src/components/AppShell.tsx  ← REPLACE
//
// CHANGES:
// 1. App icon changed to inline SVG: compass + open book
// 2. Profile dropdown (name, gender, age, start over)
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { StepIndicator } from './StepIndicator';
import { WelcomeStep } from './steps/WelcomeStep';
import { KCSEResultsStep } from './steps/KCSEResultsStep';
import { InterestStep } from './steps/InterestStep';
import { ClusterSummaryStep } from './steps/ClusterSummaryStep';
import { PaymentStep } from './steps/PaymentStep';
import { ResultsStep } from './steps/ResultsStep';
import { LogOut, ChevronDown } from 'lucide-react';

// ── Custom compass + book icon ────────────────────────────────
function CourseCompassIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Open book */}
      <path d="M2 6C2 6 5 5 8 5C9.5 5 11 5.5 12 6C13 5.5 14.5 5 16 5C19 5 22 6 22 6V18C22 18 19 17 16 17C14.5 17 13 17.5 12 18C11 17.5 9.5 17 8 17C5 17 2 18 2 18V6Z"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 6V18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* Compass needle */}
      <path d="M12 2L13.5 5H10.5L12 2Z" fill="currentColor" />
      <path d="M12 22L10.5 19H13.5L12 22Z" fill="currentColor" opacity="0.4" />
      <circle cx="12" cy="11" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function AppShell() {
  const { currentStep, user, resetApp } = useApp();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <WelcomeStep />;
      case 2: return <KCSEResultsStep />;
      case 3: return <InterestStep />;
      case 4: return <ClusterSummaryStep />;
      case 5: return <PaymentStep />;
      case 6: return <ResultsStep />;
      default: return <WelcomeStep />;
    }
  };

  const getInitials = () => {
    if (!user?.first_name) return '?';
    return user.first_name.charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-hero-gradient">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <CourseCompassIcon className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold text-sm sm:text-base">
                KCSE Course Checker
              </span>
            </div>

            {/* Profile icon (only if user exists) */}
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileOpen(v => !v)}
                  className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 rounded-full px-3 py-1.5 transition-colors"
                >
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-foreground">{getInitials()}</span>
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">{user.first_name}</span>
                  <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-border bg-muted/30">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-primary-foreground">{getInitials()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{user.first_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.gender} · Age {user.age}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => { setProfileOpen(false); resetApp(); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Start Over / Log Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {currentStep > 1 && currentStep < 6 && (
          <div className="border-t border-border bg-background">
            <StepIndicator />
          </div>
        )}
      </header>

      {/* Kenya stripe */}
      <div className="kenya-stripe" />

      {/* Main */}
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
