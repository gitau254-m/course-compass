import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Lightbulb, Info } from 'lucide-react';
import { INTEREST_QUESTIONS } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function InterestStep() {
  const {
    user,
    setCurrentStep,
    interestResponses,
    setInterestResponses,
  } = useApp();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const question = INTEREST_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / INTEREST_QUESTIONS.length) * 100;

  const handleSelectOption = (option: (typeof question.options)[0]) => {
    setInterestResponses({
      ...interestResponses,
      [question.id]: {
        answer: option.label,
        score: 0,                  // legacy field – unused in new engine
        fields: [],               // legacy field – unused in new engine
        fieldScores: option.fieldScores,
      },
    } as any);

    if (currentQuestion < INTEREST_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 280);
    }
  };

  const isQuestionAnswered = (id: string) => !!(interestResponses as any)[id];
  const allAnswered = INTEREST_QUESTIONS.every(q => isQuestionAnswered(q.id));

  const handleNext = async () => {
    const unanswered = INTEREST_QUESTIONS.filter(q => !isQuestionAnswered(q.id));
    if (unanswered.length > 0) {
      // jump to first unanswered
      const idx = INTEREST_QUESTIONS.findIndex(q => !isQuestionAnswered(q.id));
      setCurrentQuestion(idx);
      toast.error('Please answer all questions before continuing');
      return;
    }

    setIsLoading(true);
    try {
      const responses = Object.entries(interestResponses).map(([questionId, data]) => {
        const q = INTEREST_QUESTIONS.find(q => q.id === questionId);
        return {
          user_id: user!.id,
          question: q?.question || questionId,
          answer: (data as any).answer ?? '',
          score: 0,
        };
      });

      const { error } = await supabase.from('interest_responses').insert(responses);
      if (error) throw error;

      setCurrentStep(4);
    } catch (error) {
      console.error('Error saving responses:', error);
      toast.error('Failed to save responses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentResponse = (interestResponses as any)[question.id];

  return (
    <div className="fade-in max-w-lg mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <Lightbulb className="w-7 h-7 text-gold" />
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
          Career Interests
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Your answers shape which courses rank highest for you
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-2 mb-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-right mb-4">
        {currentQuestion + 1} / {INTEREST_QUESTIONS.length}
      </p>

      {/* Disclaimer */}
      <div className="bg-gold/10 border border-gold/30 rounded-lg p-3 mb-5 flex gap-2">
        <Info className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
        <p className="text-xs text-foreground/70">
          These questions fine-tune course rankings based on what you enjoy.
          Eligibility is still based purely on your grades.
        </p>
      </div>

      {/* Question card */}
      <div className="glass-card rounded-2xl p-5 mb-5">
        <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
          Question {currentQuestion + 1} of {INTEREST_QUESTIONS.length}
        </span>

        <h3 className="text-base font-semibold mt-3 mb-1 leading-snug">
          {question.question}
        </h3>
        {question.helpText && (
          <p className="text-xs text-muted-foreground mb-4">{question.helpText}</p>
        )}

        <div className="space-y-2 mt-4">
          {question.options.map((option, idx) => {
            const isSelected = currentResponse?.answer === option.label;
            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(option)}
                className={cn(
                  'w-full p-3 rounded-xl text-left transition-all duration-200 border-2 flex items-center gap-3',
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border hover:border-primary/40 hover:bg-muted/50'
                )}
              >
                <span className="text-xl leading-none">{option.icon}</span>
                <span className={cn('font-medium text-sm', isSelected && 'text-primary')}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center gap-2 mb-5">
        {INTEREST_QUESTIONS.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => setCurrentQuestion(idx)}
            className={cn(
              'h-2.5 rounded-full transition-all duration-300',
              idx === currentQuestion
                ? 'bg-primary w-6'
                : isQuestionAnswered(q.id)
                  ? 'bg-success w-2.5'
                  : 'bg-muted w-2.5'
            )}
          />
        ))}
      </div>

      {/* Unanswered questions warning */}
      {!allAnswered && (
        <p className="text-xs text-center text-muted-foreground mb-3">
          Answer all {INTEREST_QUESTIONS.length} questions to continue
        </p>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => {
            if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
            else setCurrentStep(2);
          }}
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!allAnswered || isLoading}
          className="flex-1 bg-gradient-primary hover:opacity-90"
        >
          {isLoading ? 'Saving...' : 'View Cluster Results'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
