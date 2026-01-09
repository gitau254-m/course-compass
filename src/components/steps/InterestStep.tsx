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

  const handleSelectOption = (option: typeof question.options[0]) => {
    setInterestResponses({
      ...interestResponses,
      [question.id]: {
        answer: option.label,
        score: option.score,
        fields: option.fields,
      },
    });

    // Auto-advance after selection
    if (currentQuestion < INTEREST_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    }
  };

  const handleNext = async () => {
    // Validate all questions answered
    const unanswered = INTEREST_QUESTIONS.filter(
      (q) => !interestResponses[q.id]
    );
    if (unanswered.length > 0) {
      toast.error('Please answer all questions');
      return;
    }

    setIsLoading(true);

    try {
      // Save interest responses to database
      const responses = Object.entries(interestResponses).map(([questionId, data]) => {
        const q = INTEREST_QUESTIONS.find((q) => q.id === questionId);
        return {
          user_id: user!.id,
          question: q?.question || questionId,
          answer: data.answer,
          score: data.score,
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

  const isQuestionAnswered = (id: string) => !!interestResponses[id];
  const allAnswered = INTEREST_QUESTIONS.every((q) => isQuestionAnswered(q.id));

  return (
    <div className="fade-in max-w-lg mx-auto px-4">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <Lightbulb className="w-7 h-7 text-gold" />
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
          Career Interests
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Help us understand your preferences
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-2 mb-6">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Disclaimer */}
      <div className="bg-gold/10 border border-gold/30 rounded-lg p-3 mb-6 flex gap-2">
        <Info className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gold-foreground">
          These questions help rank courses based on your interests and do not determine eligibility.
        </p>
      </div>

      {/* Question */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
            Question {currentQuestion + 1} of {INTEREST_QUESTIONS.length}
          </span>
        </div>

        <h3 className="text-lg font-medium mb-5">{question.question}</h3>

        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = interestResponses[question.id]?.answer === option.label;
            
            return (
              <button
                key={index}
                onClick={() => handleSelectOption(option)}
                className={cn(
                  'w-full p-4 rounded-xl text-left transition-all duration-200 border-2',
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
              >
                <span className={cn(
                  'font-medium',
                  isSelected && 'text-primary'
                )}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Question dots */}
      <div className="flex justify-center gap-2 mb-6">
        {INTEREST_QUESTIONS.map((q, index) => (
          <button
            key={q.id}
            onClick={() => setCurrentQuestion(index)}
            className={cn(
              'w-2.5 h-2.5 rounded-full transition-all',
              index === currentQuestion
                ? 'bg-primary w-6'
                : isQuestionAnswered(q.id)
                ? 'bg-success'
                : 'bg-muted'
            )}
          />
        ))}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => {
            if (currentQuestion > 0) {
              setCurrentQuestion(currentQuestion - 1);
            } else {
              setCurrentStep(2);
            }
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
          {isLoading ? 'Saving...' : 'Continue to Payment'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}