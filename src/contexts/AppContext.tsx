import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, SubjectGrade, EligibilityResult, Payment } from '@/lib/types';

// Record<string, any> accommodates both old { answer, score, fields }
// and new { answer, score, fields, fieldScores } shapes without type errors.
type InterestResponses = Record<string, any>;

interface AppContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  compulsorySubjects: SubjectGrade[];
  setCompulsorySubjects: (subjects: SubjectGrade[]) => void;
  optionalSubjects: SubjectGrade[];
  setOptionalSubjects: (subjects: SubjectGrade[]) => void;
  interestResponses: InterestResponses;
  setInterestResponses: (responses: InterestResponses) => void;
  payment: Payment | null;
  setPayment: (payment: Payment | null) => void;
  eligibilityResults: EligibilityResult[];
  setEligibilityResults: (results: EligibilityResult[]) => void;
  isReturningUser: boolean;
  setIsReturningUser: (value: boolean) => void;
  resetApp: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const STORAGE_KEY = 'kcse_course_checker_session';

const DEFAULT_COMPULSORY: SubjectGrade[] = [
  { subject: 'Mathematics', grade: '', points: 0 },
  { subject: 'English', grade: '', points: 0 },
  { subject: 'Kiswahili', grade: '', points: 0 },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [compulsorySubjects, setCompulsorySubjects] = useState<SubjectGrade[]>(DEFAULT_COMPULSORY);
  const [optionalSubjects, setOptionalSubjects] = useState<SubjectGrade[]>([]);
  const [interestResponses, setInterestResponses] = useState<InterestResponses>({});
  const [payment, setPayment] = useState<Payment | null>(null);
  const [eligibilityResults, setEligibilityResults] = useState<EligibilityResult[]>([]);
  const [isReturningUser, setIsReturningUser] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const data = JSON.parse(stored);
      if (data.user) setUser(data.user);
      if (data.currentStep) setCurrentStep(data.currentStep);
      if (data.compulsorySubjects) setCompulsorySubjects(data.compulsorySubjects);
      if (data.optionalSubjects) setOptionalSubjects(data.optionalSubjects);
      if (data.interestResponses) setInterestResponses(data.interestResponses);
      if (data.payment) setPayment(data.payment);
      if (data.eligibilityResults) setEligibilityResults(data.eligibilityResults);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        user, currentStep, compulsorySubjects,
        optionalSubjects, interestResponses, payment, eligibilityResults,
      }));
    } catch { /* ignore */ }
  }, [user, currentStep, compulsorySubjects, optionalSubjects, interestResponses, payment, eligibilityResults]);

  const resetApp = () => {
    setCurrentStep(1);
    setUser(null);
    setCompulsorySubjects(DEFAULT_COMPULSORY.map(s => ({ ...s })));
    setOptionalSubjects([]);
    setInterestResponses({});
    setPayment(null);
    setEligibilityResults([]);
    setIsReturningUser(false);
    localStorage.removeItem(STORAGE_KEY);
    try { sessionStorage.removeItem('pending_auth_id'); sessionStorage.removeItem('pending_email'); } catch { /* ignore */ }
  };

  return (
    <AppContext.Provider value={{
      currentStep, setCurrentStep,
      user, setUser,
      compulsorySubjects, setCompulsorySubjects,
      optionalSubjects, setOptionalSubjects,
      interestResponses, setInterestResponses,
      payment, setPayment,
      eligibilityResults, setEligibilityResults,
      isReturningUser, setIsReturningUser,
      resetApp,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
