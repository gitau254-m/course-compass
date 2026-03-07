import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap, MapPin, ChevronDown, ChevronUp, RefreshCw,
  TrendingUp, TrendingDown, AlertTriangle, Layers, BookOpen,
  Lock, CreditCard, Info, Star, ArrowLeft, Search, Award,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  ClusterDefinition, CourseMatch,
  calculateAllClusterResults, matchCoursesWithCutoffs,
  getEligibilityDisplay, buildKuccpsChoices,
} from '@/lib/clusterEngine';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { isPaymentConfirmed, DEV_MODE } from '@/lib/paymentConfig';

type ProgrammeFilter = 'both' | 'degree' | 'diploma';

function buildFieldScores(interestResponses: Record<string, any>): Record<string, number> {
  const scores: Record<string, number> = {};
  Object.values(interestResponses).forEach((resp: any) => {
    const fs: Record<string, number> = resp?.fieldScores ?? {};
    Object.entries(fs).forEach(([field, delta]) => { scores[field] = (scores[field] || 0) + (delta as number); });
    if (!resp?.fieldScores && resp?.fields && Array.isArray(resp.fields)) {
      const s: number = resp.score ?? 0;
      (resp.fields as string[]).forEach(f => { scores[f] = (scores[f] || 0) + s; });
    }
  });
  return scores;
}

function ScorePill({ diff }: { diff: number }) {
  if (diff >= 1.0) return <span className="flex items-center gap-1 text-green-700 text-xs font-semibold"><TrendingUp className="w-3 h-3" />+{diff.toFixed(3)}</span>;
  if (diff >= -1.0) return <span className="flex items-center gap-1 text-yellow-600 text-xs font-semibold"><AlertTriangle className="w-3 h-3" />{diff.toFixed(3)}</span>;
  return <span className="flex items-center gap-1 text-red-600 text-xs font-semibold"><TrendingDown className="w-3 h-3" />{diff.toFixed(3)}</span>;
}

function CourseCard({ course, index, isExpanded, onToggle, isDiploma }: {
  course: CourseMatch; index: number; isExpanded: boolean;
  onToggle: () => void; isDiploma?: boolean;
}) {
  const { label, color, bgColor, borderColor } = getEligibilityDisplay(course.eligibilityStatus);
  return (
    <div className={cn('rounded-2xl border overflow-hidden transition-shadow shadow-sm hover:shadow-md', bgColor, borderColor, isDiploma ? 'border-l-4 border-l-blue-400' : '')}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs', isDiploma ? 'bg-blue-100 text-blue-700' : 'bg-primary/10 text-primary')}>{index}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-sm leading-snug">{course.courseName}</h3>
              {isDiploma && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium border border-blue-200">DIPLOMA</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
              <MapPin className="w-3 h-3 flex-shrink-0" />{course.institution}{course.county && ` · ${course.county}`}
              {course.institutionType && <span className={cn('px-1.5 rounded text-[10px] font-medium', course.institutionType === 'PUBLIC' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700')}>{course.institutionType}</span>}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{course.clusterName}{course.programmeCode && ` · Code: ${course.programmeCode}`}</p>
          </div>
          <Badge className={cn('text-[10px] flex-shrink-0 border', color, bgColor, borderColor)}>{label}</Badge>
        </div>
        <div className="mt-3 flex items-center justify-between bg-white/60 rounded-lg px-3 py-2 gap-2 flex-wrap">
          <div className="text-center"><div className="text-[10px] text-muted-foreground">Your est. pts</div><div className="font-bold text-primary text-base">{course.userClusterScore.toFixed(3)}</div></div>
          <div className="text-muted-foreground text-xs font-medium">vs</div>
          <div className="text-center"><div className="text-[10px] text-muted-foreground">2024 cutoff</div><div className="font-bold text-sm">{course.cutoff2024.toFixed(3)}</div></div>
          <div className="text-center"><div className="text-[10px] text-muted-foreground">Gap</div><ScorePill diff={course.scoreDifference} /></div>
          {course.cutoff2023 != null && <div className="text-center hidden sm:block"><div className="text-[10px] text-muted-foreground">2023</div><div className="font-semibold text-xs">{course.cutoff2023.toFixed(3)}</div></div>}
        </div>
        <button onClick={onToggle} className="mt-3 w-full text-xs text-primary flex items-center justify-center gap-1 hover:underline">
          {isExpanded ? <><ChevronUp className="w-3 h-3" />Hide subjects</> : <><ChevronDown className="w-3 h-3" />Show cluster subjects</>}
        </button>
      </div>
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border/30 bg-white/40">
          <div className="pt-3 space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Cluster Subjects (r={course.subjectsUsed.reduce((s, x) => s + x.points, 0)}/48)</p>
              <div className="flex flex-wrap gap-1.5">
                {course.subjectsUsed.map((s, i) => (
                  <span key={i} className="text-[11px] bg-muted px-2 py-0.5 rounded-full border">{s.subject}: <strong>{s.grade}</strong> ({s.points}pts)</span>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700"><strong>ESTIMATED.</strong> Verify on <strong>students.kuccps.net</strong>.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ResultsStep() {
  const { user, compulsorySubjects, optionalSubjects, interestResponses, resetApp, payment, setCurrentStep, isDiplomaOnly } = useApp(); // ADDED isDiplomaOnly
  const [degreeMatches, setDegreeMatches] = useState<CourseMatch[]>([]);
  const [diplomaMatches, setDiplomaMatches] = useState<CourseMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentValid, setIsPaymentValid] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // ADDED: if isDiplomaOnly, lock to 'diploma' from the start
  const [filter, setFilter] = useState<ProgrammeFilter>(isDiplomaOnly ? 'diploma' : 'both');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { verifyAndLoad(); }, []);

  // ADDED: keep filter in sync if isDiplomaOnly is set after mount
  useEffect(() => {
    if (isDiplomaOnly) setFilter('diploma');
  }, [isDiplomaOnly]);

  const verifyAndLoad = async () => {
    if (DEV_MODE) { setIsPaymentValid(true); await calculateEligibility(); return; }
    if (payment && isPaymentConfirmed(payment.status)) { setIsPaymentValid(true); await calculateEligibility(); return; }
    if (user?.id) {
      const { data } = await supabase.from('payments').select('id,status').eq('user_id', user.id).eq('status', 'confirmed').limit(1).maybeSingle();
      if (data) { setIsPaymentValid(true); await calculateEligibility(); return; }
    }
    setIsPaymentValid(false);
    setIsLoading(false);
  };

  const calculateEligibility = async () => {
    setIsLoading(true);
    try {
      const { data: clustersData, error: cErr } = await supabase.from('clusters').select('*, cluster_subject_requirements(*)');
      if (cErr) throw cErr;
      const { data: coursesData, error: coErr } = await supabase.from('courses').select('id,name,institution,field,cluster_id,cutoff_2024,cutoff_2023,programme_code,institution_type,county,cluster_weight,programme_level');
      if (coErr) throw coErr;
      if (!coursesData?.length) { toast.error('No courses found'); setIsLoading(false); return; }

      const clusters: ClusterDefinition[] = (clustersData ?? []).map((c: any) => ({
        id: c.id, name: c.name, description: c.description ?? null,
        requirements: (c.cluster_subject_requirements ?? []).map((r: any) => ({
          cluster_id: r.cluster_id, subject: r.subject, category: r.category,
          min_grade: r.min_grade ?? null, weight: Number(r.weight) || 0.25,
        })),
      }));

      const allSubjects = [...compulsorySubjects, ...optionalSubjects].filter(s => s.grade);
      const fieldScores = buildFieldScores(interestResponses as Record<string, any>);
      const clusterResults = calculateAllClusterResults(allSubjects, clusters);

      const degreeCourses = (coursesData as any[]).filter(c => c.programme_level !== 'diploma');
      const diplomaCourses = (coursesData as any[]).filter(c => c.programme_level === 'diploma');

      // ADDED: if diploma-only, set 0 degrees
      setDegreeMatches(isDiplomaOnly ? [] : matchCoursesWithCutoffs(clusterResults, degreeCourses, fieldScores));
      setDiplomaMatches(matchCoursesWithCutoffs(clusterResults, diplomaCourses, fieldScores));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load results. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return (
    <div className="fade-in max-w-2xl mx-auto px-4 py-12 text-center">
      <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 pulse-gentle">
        <GraduationCap className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Calculating Your Results</h2>
      <p className="text-muted-foreground text-sm">Checking degrees and diplomas…</p>
    </div>
  );

  if (!isPaymentValid) return (
    <div className="fade-in max-w-2xl mx-auto px-4 py-12 text-center">
      <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-semibold mb-2">Payment Required</h2>
      <p className="text-muted-foreground mb-6">Complete payment to unlock your personalised course rankings.</p>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={() => setCurrentStep(4)}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <Button onClick={() => setCurrentStep(5)}><CreditCard className="w-4 h-4 mr-2" />Go to Payment</Button>
      </div>
    </div>
  );

  const degreeChoices = buildKuccpsChoices(degreeMatches);
  const primaryDegrees = degreeChoices.filter(c => c.isTopChoice);
  const extraDegrees = degreeChoices.filter(c => !c.isTopChoice);
  const qualifiedDiplomas = diplomaMatches.filter(m => m.eligibilityStatus !== 'not_competitive').slice(0, 25);

  const applySearch = (list: CourseMatch[]) =>
    searchQuery.trim() ? list.filter(c =>
      c.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.field.toLowerCase().includes(searchQuery.toLowerCase())) : list;

  const showDegrees = filter === 'both' || filter === 'degree';
  const showDiplomas = filter === 'both' || filter === 'diploma';
  const totalQualified = degreeMatches.filter(m => m.eligibilityStatus !== 'not_competitive').length + diplomaMatches.filter(m => m.eligibilityStatus !== 'not_competitive').length;

  if (!degreeMatches.length && !diplomaMatches.length) return (
    <div className="fade-in max-w-2xl mx-auto px-4 py-12 text-center">
      <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-semibold mb-2">No Qualified Courses Found</h2>
      <p className="text-muted-foreground mb-6 text-sm">Check your entered grades are correct.</p>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={() => setCurrentStep(2)}><ArrowLeft className="w-4 h-4 mr-2" />Edit Grades</Button>
        <Button variant="outline" onClick={resetApp}><RefreshCw className="w-4 h-4 mr-2" />Start Over</Button>
      </div>
    </div>
  );

  return (
    <div className="fade-in max-w-2xl mx-auto px-4 pb-10">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <Star className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-bold">Your KUCCPS Course Results</h2>
        <p className="text-muted-foreground text-sm mt-1">Degrees & Diplomas · 2024 calibrated data · Closest match first</p>
      </div>
      <div className="kenya-stripe rounded-full mb-6" />

      {/* ADDED: Diploma-only orange banner at top of results */}
      {isDiplomaOnly && (
        <div className="mb-6 bg-orange-50 border border-orange-300 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-orange-800 text-sm">Diploma Programmes Only</p>
            <p className="text-xs text-orange-700 mt-1">
              Your aggregate is below <strong>C+</strong>. Degree programmes are not shown.
              Below are diploma and certificate courses you qualify for.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="glass-card rounded-xl p-3 text-center"><div className="text-2xl font-bold text-primary">{degreeMatches.length + diplomaMatches.length}</div><div className="text-xs text-muted-foreground">Courses Ranked</div></div>
        <div className="glass-card rounded-xl p-3 text-center"><div className="text-2xl font-bold text-green-700">{totalQualified}</div><div className="text-xs text-muted-foreground">You Qualify For</div></div>
        <div className="glass-card rounded-xl p-3 text-center"><div className="text-2xl font-bold text-blue-700">{qualifiedDiplomas.length}</div><div className="text-xs text-muted-foreground">Diploma Options</div></div>
      </div>

      {/* Programme Level Toggle — ADDED: disable degree/both buttons when isDiplomaOnly */}
      <div className="glass-card rounded-2xl p-4 mb-6">
        <p className="text-xs font-semibold text-muted-foreground mb-3 text-center">Show me:</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { key: 'both' as ProgrammeFilter, label: 'Both', icon: <Layers className="w-4 h-4" /> },
            { key: 'degree' as ProgrammeFilter, label: 'Degrees Only', icon: <GraduationCap className="w-4 h-4" /> },
            { key: 'diploma' as ProgrammeFilter, label: 'Diplomas Only', icon: <Award className="w-4 h-4" /> },
          ]).map(opt => (
            <button key={opt.key}
              // ADDED: if isDiplomaOnly, lock to diploma — disable the other two
              onClick={() => { if (!isDiplomaOnly || opt.key === 'diploma') setFilter(opt.key); }}
              disabled={isDiplomaOnly && opt.key !== 'diploma'}
              className={cn('flex flex-col items-center gap-1 rounded-xl p-3 text-xs font-medium border transition-all',
                filter === opt.key ? 'bg-primary text-primary-foreground border-primary shadow' : 'bg-background text-muted-foreground border-border hover:border-primary/50',
                isDiplomaOnly && opt.key !== 'diploma' ? 'opacity-40 cursor-not-allowed' : '')}>
              {opt.icon}<span className="text-center leading-tight">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search by course, university or field…" value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      {/* DEGREES */}
      {showDegrees && primaryDegrees.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center"><GraduationCap className="w-4 h-4 text-primary-foreground" /></div>
            <div><h3 className="font-bold text-base">Degree Programmes</h3><p className="text-xs text-muted-foreground">Slot 1a/b/c = best cluster · Slots 2–6 = next clusters</p></div>
            <span className="ml-auto text-xs font-semibold text-muted-foreground">{degreeMatches.filter(m => m.eligibilityStatus !== 'not_competitive').length} qualify</span>
          </div>
          {primaryDegrees.filter(c => c.rank === 1).length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-semibold text-primary flex items-center gap-1 mb-2 px-1">
                <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">1</span>
                Choice Group 1 · Your best cluster <span className="text-muted-foreground font-normal ml-1">(a · b · c)</span>
              </div>
              <div className="space-y-3 ml-2 pl-3 border-l-2 border-primary/20">
                {primaryDegrees.filter(c => c.rank === 1).map((choice, i) => (
                  <CourseCard key={choice.course.courseId} course={choice.course} index={i + 1} isDiploma={false}
                    isExpanded={expandedId === choice.course.courseId}
                    onToggle={() => setExpandedId(p => p === choice.course.courseId ? null : choice.course.courseId)} />
                ))}
              </div>
            </div>
          )}
          {[2, 3, 4, 5, 6].map(slot => {
            const sc = primaryDegrees.filter(c => c.rank === slot);
            if (!sc.length) return null;
            return (
              <div key={slot} className="mt-4">
                <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-2 px-1">
                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">{slot}</span>
                  Choice {slot} · {sc[0].course.clusterName}
                </div>
                <div className="space-y-3 ml-2 pl-3 border-l-2 border-border">
                  {sc.map(choice => (
                    <CourseCard key={choice.course.courseId} course={choice.course} index={slot} isDiploma={false}
                      isExpanded={expandedId === choice.course.courseId}
                      onToggle={() => setExpandedId(p => p === choice.course.courseId ? null : choice.course.courseId)} />
                  ))}
                </div>
              </div>
            );
          })}
          {extraDegrees.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">Other Qualified Degree Programmes</h4>
                <span className="text-xs text-muted-foreground ml-auto">{applySearch(extraDegrees.map(c => c.course)).length} courses</span>
              </div>
              <div className="space-y-3">
                {applySearch(extraDegrees.map(c => c.course)).map((course, i) => (
                  <CourseCard key={course.courseId} course={course} index={primaryDegrees.length + i + 1} isDiploma={false}
                    isExpanded={expandedId === course.courseId}
                    onToggle={() => setExpandedId(p => p === course.courseId ? null : course.courseId)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DIPLOMAS */}
      {showDiplomas && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center"><Award className="w-4 h-4 text-white" /></div>
            <div>
              <h3 className="font-bold text-base">Diploma Programmes</h3>
              <p className="text-xs text-muted-foreground">{qualifiedDiplomas.length > 0 ? `${qualifiedDiplomas.length} diploma courses you qualify for` : 'Diplomas require minimum C- mean grade'}</p>
            </div>
          </div>
          {qualifiedDiplomas.length === 0 ? (
            <div className="glass-card rounded-xl p-6 text-center text-muted-foreground text-sm">
              <Award className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No diploma courses matched. Diplomas typically require a C- mean grade in KCSE.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applySearch(qualifiedDiplomas).map((course, i) => (
                <CourseCard key={course.courseId} course={course} index={i + 1} isDiploma={true}
                  isExpanded={expandedId === course.courseId}
                  onToggle={() => setExpandedId(p => p === course.courseId ? null : course.courseId)} />
              ))}
              {searchQuery && applySearch(qualifiedDiplomas).length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">No diplomas match your search.</p>
              )}
            </div>
          )}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>About Diploma Placement:</strong> Minimum entry is <strong>C- (5 pts)</strong> mean grade. Offered at National Polytechnics, TVETs and some universities.</p>
                <p>A diploma can lead to a <strong>degree upgrade later</strong> through bridging programmes.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">Scores calibrated to 2024 KUCCPS data. Always verify on <strong>students.kuccps.net</strong>.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={resetApp} className="flex-1"><RefreshCw className="w-4 h-4 mr-2" />Start Over</Button>
        <Button onClick={() => window.open('https://students.kuccps.net/', '_blank')} className="flex-1 bg-gradient-primary"><GraduationCap className="w-4 h-4 mr-2" />Apply on KUCCPS</Button>
      </div>

      {/* ── Leave a Review ── */}
      <ReviewForm userId={user?.id} />
    </div>
  );
}

// ── Review submission form ────────────────────────────────────────────────────
function ReviewForm({ userId }: { userId?: string }) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !message.trim() || rating === 0) {
      toast.error('Please fill in your name, a message, and select a star rating.');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        reviewer_name: name.trim(),
        message: message.trim(),
        rating,
        user_id: userId ?? null,
        approved: false, // admin must approve before it shows on Welcome
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error('Could not save review. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) return (
    <div className="mt-8 bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
      <div className="flex gap-0.5 justify-center mb-2">
        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
      </div>
      <p className="font-semibold text-green-800 text-sm">Thank you for your review!</p>
      <p className="text-xs text-green-700 mt-1">It will appear on the home page once approved.</p>
    </div>
  );

  return (
    <div className="mt-8 glass-card rounded-2xl p-5">
      <h3 className="font-semibold text-sm mb-1">Rate Your Experience</h3>
      <p className="text-xs text-muted-foreground mb-4">Help other students by leaving a quick review.</p>

      {/* Star picker */}
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map(i => (
          <button key={i} type="button"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(i)}
            className="p-0.5 focus:outline-none">
            <Star className={`w-7 h-7 transition-colors ${(hovered || rating) >= i ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
          </button>
        ))}
        {rating > 0 && <span className="text-xs text-muted-foreground self-center ml-1">{rating}/5</span>}
      </div>

      <div className="space-y-3">
        <input type="text" placeholder="Your name" value={name}
          onChange={e => setName(e.target.value)} maxLength={40}
          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <textarea placeholder="Share your experience in a few words..." value={message}
          onChange={e => setMessage(e.target.value)} rows={3} maxLength={200}
          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
        <Button onClick={handleSubmit} disabled={isLoading || !name || !message || rating === 0}
          className="w-full" variant="outline">
          {isLoading ? 'Submitting…' : 'Submit Review'}
        </Button>
      </div>
    </div>
  );
}
