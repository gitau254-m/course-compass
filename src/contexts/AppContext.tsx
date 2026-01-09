import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, SubjectGrade, EligibilityResult, Payment } from '@/lib/types';

interface AppContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  compulsorySubjects: SubjectGrade[];
  setCompulsorySubjects: (subjects: SubjectGrade[]) => void;
  optionalSubjects: SubjectGrade[];
  setOptionalSubjects: (subjects: SubjectGrade[]) => void;
  interestResponses: Record<string, { answer: string; score: number; fields: string[] }>;
  setInterestResponses: (responses: Record<string, { answer: string; score: number; fields: string[] }>) => void;
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [compulsorySubjects, setCompulsorySubjects] = useState<SubjectGrade[]>([
    { subject: 'Mathematics', grade: '', points: 0 },
    { subject: 'English', grade: '', points: 0 },
    { subject: 'Kiswahili', grade: '', points: 0 },
  ]);
  const [optionalSubjects, setOptionalSubjects] = useState<SubjectGrade[]>([]);
  const [interestResponses, setInterestResponses] = useState<Record<string, { answer: string; score: number; fields: string[] }>>({});
  const [payment, setPayment] = useState<Payment | null>(null);
  const [eligibilityResults, setEligibilityResults] = useState<EligibilityResult[]>([]);
  const [isReturningUser, setIsReturningUser] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.user) setUser(data.user);
        if (data.currentStep) setCurrentStep(data.currentStep);
        if (data.compulsorySubjects) setCompulsorySubjects(data.compulsorySubjects);
        if (data.optionalSubjects) setOptionalSubjects(data.optionalSubjects);
        if (data.interestResponses) setInterestResponses(data.interestResponses);
        if (data.payment) setPayment(data.payment);
        if (data.eligibilityResults) setEligibilityResults(data.eligibilityResults);
      } catch (e) {
        console.error('Failed to parse stored session:', e);
      }
    }
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    const data = {
      user,
      currentStep,
      compulsorySubjects,
      optionalSubjects,
      interestResponses,
      payment,
      eligibilityResults,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [user, currentStep, compulsorySubjects, optionalSubjects, interestResponses, payment, eligibilityResults]);

  const resetApp = () => {
    setCurrentStep(1);
    setUser(null);
    setCompulsorySubjects([
      { subject: 'Mathematics', grade: '', points: 0 },
      { subject: 'English', grade: '', points: 0 },
      { subject: 'Kiswahili', grade: '', points: 0 },
    ]);
    setOptionalSubjects([]);
    setInterestResponses({});
    setPayment(null);
    setEligibilityResults([]);
    setIsReturningUser(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AppContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        user,
        setUser,
        compulsorySubjects,
        setCompulsorySubjects,
        optionalSubjects,
        setOptionalSubjects,
        interestResponses,
        setInterestResponses,
        payment,
        setPayment,
        eligibilityResults,
        setEligibilityResults,
        isReturningUser,
        setIsReturningUser,
        resetApp,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}