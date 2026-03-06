import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap, MapPin, ChevronDown, ChevronUp, RefreshCw,
  TrendingUp, TrendingDown, AlertTriangle, Layers, BookOpen,
  Lock, CreditCard, Info, Star, ArrowLeft, Search,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  ClusterDefinition, CourseMatch, KuccpsChoice,
  calculateAllClusterResults, matchCoursesWithCutoffs,
  getEligibilityDisplay, buildKuccpsChoices,
} from '@/lib/clusterEngine';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const shouldUseMockPayment = () => import.meta.env.VITE_PAYMENT_MODE !== 'production';

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

function CourseCard({ choice, isExpanded, onToggle, positionLabel, isTopSlot }: {
  choice: KuccpsChoice; isExpanded: boolean; onToggle: () => void;
  positionLabel: string; isTopSlot: boolean;
}) {
  const { course } = choice;
  const { label, color, bgColor, borderColor } = getEligibilityDisplay(course.eligibilityStatus);

  return (
    <div className={cn('rounded-2xl border overflow-hidden transition-shadow', bgColor, borderColor, isTopSlot ? 'shadow-md' : 'shadow-sm hover:shadow-md')}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs',
            isTopSlot ? 'bg-primary text-primary-foreground shadow' : 'bg-muted text-muted-foreground'
          )}>{positionLabel}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-snug">{course.courseName}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
              <MapPin className="w-3 h-3 flex-shrink-0" />{course.institution}
              {course.county && ` · ${course.county}`}
              {course.institutionType && (
                <span className={cn('px-1.5 rounded text-[10px] font-medium',
                  course.institutionType === 'PUBLIC' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                )}>{course.institutionType}</span>
              )}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {course.clusterName}{course.programmeCode && ` · Code: ${course.programmeCode}`}
            </p>
          </div>
          <Badge className={cn('text-[10px] flex-shrink-0 border', color, bgColor, borderColor)}>{label}</Badge>
        </div>

        <div className="mt-3 flex items-center justify-between bg-white/60 rounded-lg px-3 py-2 gap-2 flex-wrap">
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground">Your est. pts</div>
            <div className="font-bold text-primary text-base">{course.userClusterScore.toFixed(3)}</div>
          </div>
          <div className="text-muted-foreground text-xs font-medium">vs</div>
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground">2024 cutoff</div>
            <div className="font-bold text-sm">{course.cutoff2024.toFixed(3)}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground">Gap</div>
            <ScorePill diff={course.scoreDifference} />
          </div>
          {course.cutoff2023 != null && (
            <div className="text-center hidden sm:block">
              <div className="text-[10px] text-muted-foreground">2023 cutoff</div>
              <div className="font-semibold text-xs">{course.cutoff2023.toFixed(3)}</div>
            </div>
          )}
        </div>

        <button onClick={onToggle} className="mt-3 w-full text-xs text-primary flex items-center justify-center gap-1 hover:underline">
          {isExpanded ? <><ChevronUp className="w-3 h-3" />Hide subjects</> : <><ChevronDown className="w-3 h-3" />Show cluster subjects</>}
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border/30 bg-white/40">
          <div className="pt-3 space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Cluster Subjects (r={course.subjectsUsed.reduce((s, x) => s + x.points, 0)}/48)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {course.subjectsUsed.map((s, i) => (
                  <span key={i} className="text-[11px] bg-muted px-2 py-0.5 rounded-full border">
                    {s.subject}: <strong>{s.grade}</strong> ({s.points}pts)
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700">
                <strong>ESTIMATED.</strong> Calibrated to match real KUCCPS 2024 data.
                Verify on <strong>students.kuccps.net</strong>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ResultsStep() {
  const { user, compulsorySubjects, optionalSubjects, interestResponses, resetApp, payment, setCurrentStep } = useApp();
  const [choices, setChoices] = useState<KuccpsChoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentValid, setIsPaymentValid] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { verifyAndLoad(); }, []);

  const verifyAndLoad = async () => {
    if (shouldUseMockPayment()) { setIsPaymentValid(true); await calculateEligibility(); return; }
    if (payment?.status === 'confirmed') { setIsPaymentValid(true); await calculateEligibility(); return; }
    if (user?.id) {
      const { data } = await supabase.from('payments').select('id,status')
        .eq('user_id', user.id).eq('status', 'confirmed').limit(1).maybeSingle();
      if (data) { setIsPaymentValid(true); await calculateEligibility(); return; }
    }
    setIsPaymentValid(false);
    setIsLoading(false);
  };

  const calculateEligibility = async () => {
    setIsLoading(true);
    try {
      const { data: clustersData, error: cErr } = await supabase
        .from('clusters').select('*, cluster_subject_requirements(*)');
      if (cErr) throw cErr;

      const { data: coursesData, error: coErr } = await supabase
        .from('courses').select('id,name,institution,field,cluster_id,cutoff_2024,cutoff_2023,programme_code,institution_type,county,cluster_weight');
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
      const matches = matchCoursesWithCutoffs(clusterResults, coursesData as any, fieldScores);
      setChoices(buildKuccpsChoices(matches));

      // Save to DB
      if (user?.id && matches.length > 0) {
        const toSave = matches.slice(0, 25).map(m => ({
          user_id: user.id, course_id: m.courseId, course_name: m.courseName,
          university: m.institution, cluster_code: m.clusterName,
          cluster_score: m.userClusterScore, course_cutoff: m.cutoff2024,
          status: m.eligibilityStatus === 'likely_eligible' ? 'eligible'
            : m.eligibilityStatus === 'borderline' ? 'borderline' : 'not_eligible',
        }));
        supabase.from('eligibility_results').insert(toSave).then(() => { });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load results. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="fade-in max-w-2xl mx-auto px-4 py-12 text-center">
      <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 pulse-gentle">
        <GraduationCap className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Generating Your KUCCPS Choices</h2>
      <p className="text-muted-foreground text-sm">Ranking courses by calibrated cluster points &amp; interests…</p>
    </div>
  );

  // ── Not paid ───────────────────────────────────────────────────────────
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

  // ── No results ─────────────────────────────────────────────────────────
  if (!choices.length) return (
    <div className="fade-in max-w-2xl mx-auto px-4 py-12 text-center">
      <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-semibold mb-2">No Qualified Courses Found</h2>
      <p className="text-muted-foreground mb-6 text-sm">Your grades may not meet minimum requirements. Check your entered grades.</p>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={() => setCurrentStep(2)}><ArrowLeft className="w-4 h-4 mr-2" />Edit Grades</Button>
        <Button variant="outline" onClick={resetApp}><RefreshCw className="w-4 h-4 mr-2" />Start Over</Button>
      </div>
    </div>
  );

  const primaryChoices = choices.filter(c => c.isTopChoice);
  const allExtras = choices.filter(c => !c.isTopChoice);
  const filteredExtras = searchQuery.trim()
    ? allExtras.filter(c =>
      c.course.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.course.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.course.field.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : allExtras;
  const totalEligible = choices.filter(c => c.course.eligibilityStatus !== 'not_competitive').length;

  return (
    <div className="fade-in max-w-2xl mx-auto px-4 pb-10">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <Star className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-bold">Your KUCCPS Course Choices</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Calibrated to 2024 KUCCPS data · Closest match first · Interest-adjusted
        </p>
      </div>

      <div className="kenya-stripe rounded-full mb-6" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-card rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-primary">{choices.length}</div>
          <div className="text-xs text-muted-foreground">Courses Ranked</div>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-700">{totalEligible}</div>
          <div className="text-xs text-muted-foreground">Likely/Borderline</div>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-blue-700">{primaryChoices.length}</div>
          <div className="text-xs text-muted-foreground">Primary Choices</div>
        </div>
      </div>

      {/* PRIMARY CHOICES */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Star className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-base">Top KUCCPS Choices</h3>
            <p className="text-xs text-muted-foreground">Slot 1a/b/c = best cluster (3 unis) · Slots 2–6 = next best clusters</p>
          </div>
        </div>

        {/* Slot 1 */}
        {primaryChoices.some(c => c.rank === 1) && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-primary flex items-center gap-1 mb-2 px-1">
              <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">1</span>
              Choice Group 1 — Your best cluster
              <span className="text-muted-foreground font-normal ml-1">(a · b · c = 3 universities)</span>
            </div>
            <div className="space-y-3 ml-2 pl-3 border-l-2 border-primary/20">
              {primaryChoices.filter(c => c.rank === 1).map(choice => (
                <CourseCard key={choice.course.courseId} choice={choice}
                  positionLabel={`1${choice.subRank}`} isTopSlot
                  isExpanded={expandedId === choice.course.courseId}
                  onToggle={() => setExpandedId(p => p === choice.course.courseId ? null : choice.course.courseId)}
                />
              ))}
            </div>
          </div>
        )}

        {[2, 3, 4, 5, 6].map(slot => {
          const sc = primaryChoices.filter(c => c.rank === slot);
          if (!sc.length) return null;
          return (
            <div key={slot} className="mt-4">
              <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-2 px-1">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">{slot}</span>
                Choice {slot} — {sc[0].course.clusterName}
              </div>
              <div className="space-y-3 ml-2 pl-3 border-l-2 border-border">
                {sc.map(choice => (
                  <CourseCard key={choice.course.courseId} choice={choice}
                    positionLabel={String(slot)} isTopSlot={false}
                    isExpanded={expandedId === choice.course.courseId}
                    onToggle={() => setExpandedId(p => p === choice.course.courseId ? null : choice.course.courseId)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* OTHER QUALIFIED (up to 25) */}
      {allExtras.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-base">Other Qualified Programmes</h3>
              <p className="text-xs text-muted-foreground">From all clusters · closest match first</p>
            </div>
            <span className="text-xs text-muted-foreground ml-auto font-semibold">{allExtras.length} courses</span>
          </div>

          {/* Search extras */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by course, university or field…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-3">
            {filteredExtras.map((choice, i) => (
              <CourseCard key={choice.course.courseId} choice={choice}
                positionLabel={String(primaryChoices.length + i + 1)} isTopSlot={false}
                isExpanded={expandedId === choice.course.courseId}
                onToggle={() => setExpandedId(p => p === choice.course.courseId ? null : choice.course.courseId)}
              />
            ))}
          </div>

          {searchQuery && filteredExtras.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">No courses match your search.</p>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Scores use <strong>C = √(r/48 × t/84) × 48 × 0.957</strong> — calibrated to match real 2024 KUCCPS data.
            Official KUCCPS uses KNEC Performance Index. Always verify on <strong>students.kuccps.net</strong>.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={resetApp} className="flex-1">
          <RefreshCw className="w-4 h-4 mr-2" />Start Over
        </Button>
        <Button onClick={() => window.open('https://students.kuccps.net/', '_blank')} className="flex-1 bg-gradient-primary">
          <GraduationCap className="w-4 h-4 mr-2" />Apply on KUCCPS
        </Button>
      </div>
    </div>
  );
}
