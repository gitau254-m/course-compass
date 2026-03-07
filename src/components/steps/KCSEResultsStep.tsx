// ============================================================
// FILE: src/components/steps/KCSEResultsStep.tsx  ← REPLACE
//
// NEW KCSE GRADING SYSTEM (2024+):
//   Aggregate = Math + best language (English/Kiswahili) + best 5 others
//   = 7 subjects × max 12 pts = 84 max aggregate
//   Optional slots: 0/5 (not 0/8)
// ============================================================

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, ArrowLeft, Plus, X, BookOpen, Info, AlertTriangle } from 'lucide-react'; // ADDED AlertTriangle
import { GRADES, GRADE_POINTS, OPTIONAL_SUBJECTS } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── New KCSE aggregate grade boundaries (out of 84) ──────────
// Based on 7 subjects: A=12 each → 84 max
// Official Kenya 2024 grading boundaries:
function aggregateToGrade(total: number): string {
  if (total >= 81) return 'A';
  if (total >= 74) return 'A-';
  if (total >= 67) return 'B+';
  if (total >= 60) return 'B';
  if (total >= 53) return 'B-';
  if (total >= 46) return 'C+';
  if (total >= 40) return 'C';
  if (total >= 33) return 'C-';
  if (total >= 26) return 'D+';
  if (total >= 20) return 'D';
  if (total >= 14) return 'D-';
  return 'E';
}

function gradeColour(grade: string): string {
  if (['A', 'A-'].includes(grade)) return 'text-green-600';
  if (['B+', 'B', 'B-'].includes(grade)) return 'text-blue-600';
  if (['C+', 'C', 'C-'].includes(grade)) return 'text-yellow-600';
  return 'text-red-500';
}

export function KCSEResultsStep() {
  const {
    user,
    setCurrentStep,
    compulsorySubjects,  // [Math, English, Kiswahili]
    setCompulsorySubjects,
    optionalSubjects,
    setOptionalSubjects,
    setIsDiplomaOnly, // ADDED
  } = useApp();

  const [isLoading, setIsLoading] = useState(false);

  const updateCompulsoryGrade = (index: number, grade: string) => {
    const updated = [...compulsorySubjects];
    updated[index] = { ...updated[index], grade, points: GRADE_POINTS[grade] || 0 };
    setCompulsorySubjects(updated);
  };

  // Max 5 optional subjects (matches new KCSE system)
  const addOptionalSubject = () => {
    if (optionalSubjects.length >= 5) {
      toast.error('Maximum 5 optional subjects (new KCSE system)');
      return;
    }
    setOptionalSubjects([...optionalSubjects, { subject: '', grade: '', points: 0 }]);
  };

  const updateOptionalSubject = (index: number, field: 'subject' | 'grade', value: string) => {
    const updated = [...optionalSubjects];
    if (field === 'subject') {
      updated[index] = { ...updated[index], subject: value };
    } else {
      updated[index] = { ...updated[index], grade: value, points: GRADE_POINTS[value] || 0 };
    }
    setOptionalSubjects(updated);
  };

  const removeOptionalSubject = (index: number) => {
    setOptionalSubjects(optionalSubjects.filter((_, i) => i !== index));
  };

  const getAvailableSubjects = (currentIndex: number) => {
    const used = optionalSubjects.filter((_, i) => i !== currentIndex).map(s => s.subject);
    return OPTIONAL_SUBJECTS.filter(s => !used.includes(s));
  };

  // ── New KCSE 7-subject aggregate calculation ──────────────
  // Rule: Math + best language (Eng/Kisw) + best 5 others
  // "Others" = worst language + all optional subjects
  const calculateAggregate = () => {
    const math = compulsorySubjects.find(s => s.subject === 'Mathematics');
    const english = compulsorySubjects.find(s => s.subject === 'English');
    const kisw = compulsorySubjects.find(s => s.subject === 'Kiswahili');

    const mathPts = math?.points || 0;
    const engPts = english?.points || 0;
    const kiswPts = kisw?.points || 0;

    // Best language goes into the 7, worst language goes into the "others" pool
    const bestLangPts = Math.max(engPts, kiswPts);
    const worstLangPts = Math.min(engPts, kiswPts);

    // Pool = worst language + all completed optional subjects
    const optionalPool = [
      ...(worstLangPts > 0 ? [worstLangPts] : []),
      ...optionalSubjects.filter(s => s.grade && s.points > 0).map(s => s.points),
    ].sort((a, b) => b - a);  // sort descending

    // Pick best 5 from pool
    const best5 = optionalPool.slice(0, 5);

    const selectedPts = [
      ...(mathPts > 0 ? [mathPts] : []),
      ...(bestLangPts > 0 ? [bestLangPts] : []),
      ...best5,
    ];

    const total = selectedPts.reduce((s, p) => s + p, 0);
    const subjectCount = selectedPts.length;

    return {
      total,
      grade: subjectCount >= 1 ? aggregateToGrade(total) : '-',
      subjectCount,
    };
  };

  const agg = calculateAggregate();

  // ADDED: C+ boundary is aggregate >= 46 out of 84. Below that = diploma only.
  const isBelowCPlus = agg.total > 0 && agg.total < 46;

  // ── Save and go to next step ──────────────────────────────
  const handleNext = async () => {
    if (!user?.id) {
      toast.error('Session expired. Please go back to step 1.');
      setCurrentStep(1);
      return;
    }

    const missing = compulsorySubjects.filter(s => !s.grade);
    if (missing.length > 0) {
      toast.error(`Please select grades for: ${missing.map(s => s.subject).join(', ')}`);
      return;
    }

    const incomplete = optionalSubjects.filter(s =>
      (s.subject && !s.grade) || (!s.subject && s.grade)
    );
    if (incomplete.length > 0) {
      toast.error('Please complete all optional subject entries (both name and grade)');
      return;
    }

    const totalSubjects = compulsorySubjects.length +
      optionalSubjects.filter(s => s.subject && s.grade).length;
    if (totalSubjects < 5) {
      toast.error('Please add at least 2 optional subjects for accurate results');
      return;
    }

    setIsLoading(true);
    try {
      // Delete old entries for this user (allows re-entry if they go back)
      await supabase.from('user_results').delete().eq('user_id', user.id);

      const allResults = [
        ...compulsorySubjects.map(s => ({
          user_id: user.id, subject: s.subject, grade: s.grade, grade_points: s.points,
        })),
        ...optionalSubjects.filter(s => s.subject && s.grade).map(s => ({
          user_id: user.id, subject: s.subject, grade: s.grade, grade_points: s.points,
        })),
      ];

      const { error } = await supabase.from('user_results').insert(allResults);
      if (error) throw error;

      setIsDiplomaOnly(isBelowCPlus); // ADDED: persist diploma-only flag before moving on

      toast.success('Grades saved!');
      setCurrentStep(3);
    } catch (err: any) {
      console.error('Error saving results:', err);
      toast.error('Failed to save grades. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fade-in max-w-lg mx-auto px-4 pb-8">

      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <BookOpen className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-bold">
          Hey {user?.first_name || 'there'}! 👋
        </h2>
        <p className="text-muted-foreground text-sm mt-1">Enter your KCSE grades below</p>
      </div>

      {/* Compulsory Subjects */}
      <div className="glass-card rounded-2xl p-5 mb-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">
          Compulsory Subjects
        </h3>
        <div className="space-y-3">
          {compulsorySubjects.map((subject, index) => (
            <div key={subject.subject} className="flex items-center gap-3">
              <Label className="flex-1 text-sm font-medium min-w-0">{subject.subject}</Label>
              <Select value={subject.grade} onValueChange={v => updateCompulsoryGrade(index, v)}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className={cn(
                'text-xs font-bold w-12 text-right shrink-0',
                subject.grade ? gradeColour(subject.grade) : 'text-muted-foreground'
              )}>
                {subject.grade ? `${subject.points} pts` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Optional Subjects — max 5 */}
      <div className="glass-card rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Optional Subjects
          </h3>
          <span className="text-xs text-muted-foreground">{optionalSubjects.length}/5 added</span>
        </div>

        <div className="space-y-3">
          {optionalSubjects.map((subject, index) => (
            <div key={index} className="flex items-center gap-2 slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}>
              <Select value={subject.subject}
                onValueChange={v => updateOptionalSubject(index, 'subject', v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableSubjects(index).map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={subject.grade}
                onValueChange={v => updateOptionalSubject(index, 'grade', v)}>
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className={cn(
                'text-xs font-bold w-8 text-center shrink-0',
                subject.grade ? gradeColour(subject.grade) : 'text-muted-foreground'
              )}>
                {subject.grade ? `${subject.points}` : '—'}
              </span>
              <button onClick={() => removeOptionalSubject(index)}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {optionalSubjects.length < 5 && (
          <Button type="button" variant="outline" onClick={addOptionalSubject} className="w-full mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Add Subject
          </Button>
        )}

        {/* Grading info note */}
        <div className="flex items-start gap-2 mt-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>New KCSE system:</strong> Your aggregate uses Math + best language (Eng/Kisw) + best 5 others = 7 subjects max
          </p>
        </div>
      </div>

      {/* Aggregate Score Display */}
      <div className={cn(
        'rounded-xl p-5 mb-6 transition-all',
        agg.grade !== '-' ? 'bg-primary/10 border border-primary/20' : 'bg-muted'
      )}>
        <p className="text-sm text-muted-foreground text-center mb-2">Your Aggregate Score</p>
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <span className={cn('text-4xl font-bold',
              agg.grade !== '-' ? gradeColour(agg.grade) : 'text-muted-foreground')}>
              {agg.grade}
            </span>
            <p className="text-xs text-muted-foreground mt-1">Grade</p>
          </div>
          {agg.total > 0 && (
            <div className="text-center border-l pl-6">
              <span className="text-3xl font-bold text-foreground">{agg.total}</span>
              <p className="text-xs text-muted-foreground mt-1">
                points ({agg.subjectCount} of 7 subjects)
              </p>
            </div>
          )}
        </div>

        {/* Grade scale reference */}
        {agg.total > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-1 text-xs text-center text-muted-foreground">
            <span className="bg-background/60 rounded px-1 py-0.5">A: 81–84</span>
            <span className="bg-background/60 rounded px-1 py-0.5">A-: 74–80</span>
            <span className="bg-background/60 rounded px-1 py-0.5">B+: 67–73</span>
            <span className="bg-background/60 rounded px-1 py-0.5">B: 60–66</span>
          </div>
        )}

        {/* ADDED: Diploma-only warning — only appears when aggregate < 46 (below C+) */}
        {isBelowCPlus && (
          <div className="mt-4 flex items-start gap-2 bg-orange-100 border border-orange-300 rounded-xl px-3 py-3">
            <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div className="text-xs text-orange-700">
              <p className="font-semibold">Diploma Programmes Only</p>
              <p className="mt-0.5">
                Your aggregate of <strong>{agg.total}/84 ({agg.grade})</strong> is below the
                minimum <strong>C+ (46 points)</strong> required for university degree admission.
                You will see <strong>diploma results only</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>
        <Button onClick={handleNext} disabled={isLoading}
          className="flex-1 bg-gradient-primary hover:opacity-90">
          {isLoading ? 'Saving...' : 'Continue'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
