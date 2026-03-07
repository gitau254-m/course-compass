import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import {
  Layers, CheckCircle, XCircle, AlertTriangle,
  ChevronRight, BookOpen, GraduationCap, ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ClusterDefinition, ClusterResult, calculateAllClusterResults } from '@/lib/clusterEngine';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ClusterWithCount extends ClusterResult {
  courseCount: number;
}

export function ClusterSummaryStep() {
  const { user, compulsorySubjects, optionalSubjects, setCurrentStep, isDiplomaOnly } = useApp(); // ADDED isDiplomaOnly
  const [clusterResults, setClusterResults] = useState<ClusterWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllNotMet, setShowAllNotMet] = useState(false);

  useEffect(() => { calculateClusters(); }, []);

  const calculateClusters = async () => {
    setIsLoading(true);
    try {
      const { data: clustersData, error } = await supabase
        .from('clusters')
        .select('*, cluster_subject_requirements(*)');
      if (error) throw error;

      const { data: courseCounts } = await supabase.from('courses').select('cluster_id');
      const countMap: Record<string, number> = {};
      (courseCounts ?? []).forEach((c: any) => {
        if (c.cluster_id) countMap[c.cluster_id] = (countMap[c.cluster_id] || 0) + 1;
      });

      const clusters: ClusterDefinition[] = (clustersData ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description ?? null,
        requirements: (c.cluster_subject_requirements ?? []).map((r: any) => ({
          cluster_id: r.cluster_id,
          subject: r.subject,
          category: r.category,
          min_grade: r.min_grade ?? null,
          weight: Number(r.weight) || 0.25,
        })),
      }));

      const allSubjects = [...compulsorySubjects, ...optionalSubjects].filter(s => s.grade);
      const results = calculateAllClusterResults(allSubjects, clusters);

      setClusterResults(results.map(r => ({ ...r, courseCount: countMap[r.clusterId] || 0 })));

      // Save to user_cluster_results (using `any` cast to bypass strict Json type)
      if (user?.id && results.length > 0) {
        const toSave = results.map(r => ({
          user_id: user.id,
          cluster_id: r.clusterId,
          cluster_score: r.clusterScore,
          subjects_used: r.subjectsUsed as any,
          eligibility_status: r.eligibilityStatus,
        }));
        supabase
          .from('user_cluster_results')
          .upsert(toSave, { onConflict: 'user_id,cluster_id' })
          .then(() => { });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to calculate cluster eligibility');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fade-in max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 pulse-gentle">
          <Layers className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Calculating Cluster Eligibility</h2>
        <p className="text-muted-foreground text-sm">Analysing your grades across all 20 KUCCPS clusters…</p>
      </div>
    );
  }

  const eligible = clusterResults.filter(r => r.meetsRequirements && r.clusterScore > 0);
  const notMet = clusterResults.filter(r => !r.meetsRequirements);
  const displayed = showAllNotMet ? notMet : notMet.slice(0, 4);

  const rowStyle = (r: ClusterResult) => {
    if (r.eligibilityStatus === 'likely_eligible')
      return 'border-green-200 bg-green-50';
    if (r.eligibilityStatus === 'borderline')
      return 'border-yellow-200 bg-yellow-50';
    return 'border-red-200 bg-red-50';
  };

  const scoreColor = (r: ClusterResult) => {
    if (r.eligibilityStatus === 'likely_eligible') return 'text-green-700';
    if (r.eligibilityStatus === 'borderline') return 'text-yellow-700';
    return 'text-red-600';
  };

  const RowIcon = ({ r }: { r: ClusterResult }) => {
    if (r.eligibilityStatus === 'likely_eligible') return <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />;
    if (r.eligibilityStatus === 'borderline') return <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />;
    return <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />;
  };

  return (
    <div className="fade-in max-w-2xl mx-auto px-4 pb-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <Layers className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-bold">Your Cluster Eligibility</h2>
        <p className="text-xs text-muted-foreground mt-1">
          ESTIMATED scores · <code className="bg-muted px-1 rounded">C = √(r/48 × t/84) × 48</code>
        </p>
      </div>

      <div className="kenya-stripe rounded-full mb-6" />

      {/* ADDED: Diploma-only orange banner */}
      {isDiplomaOnly && (
        <div className="mb-6 bg-orange-50 border border-orange-300 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-orange-800 text-sm">Diploma Programmes Only</p>
            <p className="text-xs text-orange-700 mt-1">
              Your mean grade is below <strong>C+</strong>. Only clusters available for
              <strong> Diploma & Certificate</strong> programmes are shown below.
              Degree courses will show 0 on the results page.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-card rounded-xl p-3 text-center border border-green-200">
          <div className="text-2xl font-bold text-green-700">{eligible.length}</div>
          <div className="text-xs text-muted-foreground">Eligible Clusters</div>
        </div>
        <div className="glass-card rounded-xl p-3 text-center border border-red-200">
          <div className="text-2xl font-bold text-red-600">{notMet.length}</div>
          <div className="text-xs text-muted-foreground">Not Qualifying</div>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-primary">
            {eligible.reduce((s, r) => s + r.courseCount, 0)}
          </div>
          <div className="text-xs text-muted-foreground">Programmes</div>
        </div>
      </div>

      {/* Eligible clusters — each shows its OWN unique score */}
      {eligible.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Eligible Clusters ({eligible.length})
          </h3>
          <div className="space-y-2">
            {eligible.map(cluster => (
              <div key={cluster.clusterId}
                className={cn('rounded-xl p-3 border flex items-center justify-between', rowStyle(cluster))}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <RowIcon r={cluster} />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{cluster.clusterName}</p>
                    <p className="text-xs opacity-70">
                      {cluster.courseCount > 0
                        ? `${cluster.courseCount} programme${cluster.courseCount !== 1 ? 's' : ''}`
                        : 'Programmes loading…'}
                      {' · '}r={cluster.rawClusterScore}/48, t={cluster.aggregateScore}/84
                    </p>
                  </div>
                </div>
                <div className={cn('text-right flex-shrink-0 ml-3', scoreColor(cluster))}>
                  <div className="font-bold text-lg leading-none">{cluster.clusterScore.toFixed(3)}</div>
                  <div className="text-[10px] opacity-60">est. pts</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Not meeting requirements */}
      {notMet.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-muted-foreground" />
            Subject Requirements Not Met ({notMet.length})
          </h3>
          <div className="space-y-2">
            {displayed.map(cluster => (
              <div key={cluster.clusterId} className="bg-muted/40 rounded-xl p-3 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-muted-foreground">{cluster.clusterName}</span>
                  <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Missing: {cluster.missingSubjects.slice(0, 2).join(', ')}
                  {cluster.missingSubjects.length > 2 && ` +${cluster.missingSubjects.length - 2} more`}
                </p>
              </div>
            ))}
          </div>
          {notMet.length > 4 && (
            <button
              onClick={() => setShowAllNotMet(v => !v)}
              className="text-xs text-primary mt-2 underline"
            >
              {showAllNotMet ? 'Show less' : `Show ${notMet.length - 4} more`}
            </button>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            <strong>ESTIMATED Scores.</strong> Official KUCCPS uses KNEC Performance Index (PI) not publicly available,
            so your actual portal values will differ slightly. Use <code className="bg-blue-100 px-1 rounded">C = √(r/48 × t/84) × 48</code> as a guide only.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setCurrentStep(3)} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>
        <Button onClick={() => setCurrentStep(5)} className="flex-1" size="lg">
          <GraduationCap className="w-4 h-4 mr-2" />Continue to Payment
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground mt-4">
        Not affiliated with KNEC or KUCCPS. For guidance only.
      </p>
    </div>
  );
}
