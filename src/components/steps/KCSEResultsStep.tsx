import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, ArrowLeft, Plus, X, BookOpen } from 'lucide-react';
import { GRADES, GRADE_POINTS, OPTIONAL_SUBJECTS } from '@/lib/constants';
import { SubjectGrade } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function KCSEResultsStep() {
  const {
    user,
    currentStep,
    setCurrentStep,
    compulsorySubjects,
    setCompulsorySubjects,
    optionalSubjects,
    setOptionalSubjects,
  } = useApp();

  const [isLoading, setIsLoading] = useState(false);

  const updateCompulsoryGrade = (index: number, grade: string) => {
    const updated = [...compulsorySubjects];
    updated[index] = {
      ...updated[index],
      grade,
      points: GRADE_POINTS[grade] || 0,
    };
    setCompulsorySubjects(updated);
  };

  const addOptionalSubject = () => {
    if (optionalSubjects.length >= 5) {
      toast.error('You can only add up to 5 optional subjects');
      return;
    }
    setOptionalSubjects([...optionalSubjects, { subject: '', grade: '', points: 0 }]);
  };

  const updateOptionalSubject = (index: number, field: 'subject' | 'grade', value: string) => {
    const updated = [...optionalSubjects];
    if (field === 'subject') {
      updated[index] = { ...updated[index], subject: value };
    } else {
      updated[index] = {
        ...updated[index],
        grade: value,
        points: GRADE_POINTS[value] || 0,
      };
    }
    setOptionalSubjects(updated);
  };

  const removeOptionalSubject = (index: number) => {
    setOptionalSubjects(optionalSubjects.filter((_, i) => i !== index));
  };

  const getAvailableSubjects = (currentIndex: number) => {
    const usedSubjects = optionalSubjects
      .filter((_, i) => i !== currentIndex)
      .map((s) => s.subject);
    return OPTIONAL_SUBJECTS.filter((s) => !usedSubjects.includes(s));
  };

  const calculateMeanGrade = () => {
    const allSubjects = [...compulsorySubjects, ...optionalSubjects].filter(
      (s) => s.grade && s.points > 0
    );
    if (allSubjects.length === 0) return { points: 0, grade: '-' };
    
    const total = allSubjects.reduce((sum, s) => sum + s.points, 0);
    const mean = total / allSubjects.length;
    
    let grade = 'E';
    if (mean >= 11.5) grade = 'A';
    else if (mean >= 10.5) grade = 'A-';
    else if (mean >= 9.5) grade = 'B+';
    else if (mean >= 8.5) grade = 'B';
    else if (mean >= 7.5) grade = 'B-';
    else if (mean >= 6.5) grade = 'C+';
    else if (mean >= 5.5) grade = 'C';
    else if (mean >= 4.5) grade = 'C-';
    else if (mean >= 3.5) grade = 'D+';
    else if (mean >= 2.5) grade = 'D';
    else if (mean >= 1.5) grade = 'D-';
    
    return { points: mean.toFixed(2), grade };
  };

  const handleNext = async () => {
    // Validate compulsory subjects
    const missingCompulsory = compulsorySubjects.filter((s) => !s.grade);
    if (missingCompulsory.length > 0) {
      toast.error('Please select grades for all compulsory subjects');
      return;
    }

    // Validate optional subjects
    const incompleteOptional = optionalSubjects.filter(
      (s) => (s.subject && !s.grade) || (!s.subject && s.grade)
    );
    if (incompleteOptional.length > 0) {
      toast.error('Please complete all optional subject entries');
      return;
    }

    // Need at least 5 subjects total (3 compulsory + 2 optional minimum for meaningful results)
    const totalSubjects = compulsorySubjects.length + optionalSubjects.filter((s) => s.subject && s.grade).length;
    if (totalSubjects < 5) {
      toast.error('Please add at least 2 optional subjects');
      return;
    }

    setIsLoading(true);

    try {
      // Save results to database
      const allResults = [
        ...compulsorySubjects.map((s) => ({
          user_id: user!.id,
          subject: s.subject,
          grade: s.grade,
          grade_points: s.points,
        })),
        ...optionalSubjects
          .filter((s) => s.subject && s.grade)
          .map((s) => ({
            user_id: user!.id,
            subject: s.subject,
            grade: s.grade,
            grade_points: s.points,
          })),
      ];

      const { error } = await supabase.from('user_results').insert(allResults);

      if (error) throw error;

      setCurrentStep(3);
    } catch (error) {
      console.error('Error saving results:', error);
      toast.error('Failed to save results. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const meanGrade = calculateMeanGrade();

  return (
    <div className="fade-in max-w-lg mx-auto px-4">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <BookOpen className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
          Hey {user?.first_name}! 👋
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Enter your KCSE grades below
        </p>
      </div>

      <div className="glass-card rounded-2xl p-5 mb-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">
          Compulsory Subjects
        </h3>
        <div className="space-y-3">
          {compulsorySubjects.map((subject, index) => (
            <div key={subject.subject} className="flex items-center gap-3">
              <Label className="flex-1 text-sm font-medium">{subject.subject}</Label>
              <Select
                value={subject.grade}
                onValueChange={(value) => updateCompulsoryGrade(index, value)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {subject.grade && (
                <span className="text-xs text-muted-foreground w-8 text-center">
                  {subject.points} pts
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Optional Subjects
          </h3>
          <span className="text-xs text-muted-foreground">
            {optionalSubjects.length}/5 added
          </span>
        </div>

        <div className="space-y-3">
          {optionalSubjects.map((subject, index) => (
            <div key={index} className="flex items-center gap-2 slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <Select
                value={subject.subject}
                onValueChange={(value) => updateOptionalSubject(index, 'subject', value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableSubjects(index).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={subject.grade}
                onValueChange={(value) => updateOptionalSubject(index, 'grade', value)}
              >
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                onClick={() => removeOptionalSubject(index)}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {optionalSubjects.length < 5 && (
          <Button
            type="button"
            variant="outline"
            onClick={addOptionalSubject}
            className="w-full mt-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Subject
          </Button>
        )}
      </div>

      {/* Mean Grade Display */}
      <div className={cn(
        "rounded-xl p-4 mb-6 text-center transition-all",
        meanGrade.grade !== '-' ? 'bg-primary/10' : 'bg-muted'
      )}>
        <p className="text-sm text-muted-foreground mb-1">Your Mean Grade</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl font-bold text-primary">{meanGrade.grade}</span>
          <span className="text-sm text-muted-foreground">({meanGrade.points} points)</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(1)}
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={isLoading}
          className="flex-1 bg-gradient-primary hover:opacity-90"
        >
          {isLoading ? 'Saving...' : 'Continue'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}