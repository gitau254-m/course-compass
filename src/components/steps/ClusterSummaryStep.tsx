import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Layers,
  BookOpen
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  ClusterResult, 
  ClusterDefinition,
  calculateAllClusterResults,
  getEligibilityDisplay
} from '@/lib/clusterEngine';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function ClusterSummaryStep() {
  const { user, compulsorySubjects, optionalSubjects, setCurrentStep } = useApp();
  const [clusterResults, setClusterResults] = useState<ClusterResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    calculateClusters();
  }, []);

  const calculateClusters = async () => {
    setIsLoading(true);
    
    try {
      // Fetch cluster definitions with requirements
      const { data: clustersData, error: clustersError } = await supabase
        .from('clusters')
        .select(`
          *,
          cluster_subject_requirements(*)
        `);

      if (clustersError) throw clustersError;

      // Format cluster data
      const clusters: ClusterDefinition[] = (clustersData || []).map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        requirements: (c.cluster_subject_requirements || []).map((r) => ({
          cluster_id: r.cluster_id,
          subject: r.subject,
          category: r.category as 'compulsory' | 'group1' | 'group2' | 'group3' | 'any',
          min_grade: r.min_grade,
          weight: Number(r.weight)
        }))
      }));

      // Get user grades
      const allSubjects = [...compulsorySubjects, ...optionalSubjects].filter(s => s.grade);
      
      // Calculate all cluster results
      const results = calculateAllClusterResults(allSubjects, clusters);
      setClusterResults(results);

      // Save cluster results to database
      if (user?.id && results.length > 0) {
        const resultsToSave = results.map(r => ({
          user_id: user.id,
          cluster_id: r.clusterId,
          cluster_score: r.clusterScore,
          subjects_used: r.subjectsUsed,
          eligibility_status: r.eligibilityStatus
        }));

        await supabase.from('user_cluster_results').insert(resultsToSave);
      }

    } catch (error) {
      console.error('Error calculating clusters:', error);
      toast.error('Failed to calculate cluster eligibility');
    } finally {
      setIsLoading(false);
    }
  };

  const eligibleClusters = clusterResults.filter(r => r.meetsRequirements);
  const partialClusters = clusterResults.filter(r => !r.meetsRequirements && r.clusterScore > 20);

  const handleProceed = () => {
    setCurrentStep(4); // Go to payment step
  };

  if (isLoading) {
    return (
      <div className="fade-in max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 pulse-gentle">
          <Layers className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Calculating Cluster Eligibility</h2>
        <p className="text-muted-foreground">Analyzing your grades across all KUCCPS clusters...</p>
      </div>
    );
  }

  return (
    <div className="fade-in max-w-2xl mx-auto px-4 pb-8">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <Layers className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
          Your Cluster Eligibility
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Based on KUCCPS cluster calculation methodology
        </p>
      </div>

      {/* Kenya stripe decoration */}
      <div className="kenya-stripe rounded-full mb-6" />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-primary">{eligibleClusters.length}</div>
          <div className="text-xs text-muted-foreground">Clusters Eligible</div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gold">
            {eligibleClusters.filter(c => c.eligibilityStatus === 'likely_eligible').length}
          </div>
          <div className="text-xs text-muted-foreground">Strong Matches</div>
        </div>
      </div>

      {/* Eligible Clusters */}
      {eligibleClusters.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success" />
            Eligible Clusters ({eligibleClusters.length})
          </h3>
          <div className="space-y-2">
            {eligibleClusters.slice(0, 8).map((cluster) => {
              const display = getEligibilityDisplay(cluster.eligibilityStatus);
              return (
                <div
                  key={cluster.clusterId}
                  className="glass-card rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{cluster.clusterName}</span>
                      <Badge className={cn('text-xs', display.color)}>
                        {display.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cluster.clusterDescription}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      {cluster.clusterScore.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">points</div>
                  </div>
                </div>
              );
            })}
          </div>
          {eligibleClusters.length > 8 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              +{eligibleClusters.length - 8} more clusters
            </p>
          )}
        </div>
      )}

      {/* Partial/Missing Requirements */}
      {partialClusters.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            Missing Requirements ({partialClusters.length})
          </h3>
          <div className="space-y-2">
            {partialClusters.slice(0, 3).map((cluster) => (
              <div
                key={cluster.clusterId}
                className="bg-muted/50 rounded-xl p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{cluster.clusterName}</span>
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Missing: {cluster.missingSubjects.slice(0, 2).join(', ')}
                  {cluster.missingSubjects.length > 2 && ` (+${cluster.missingSubjects.length - 2} more)`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              What's Next?
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              Complete payment to see specific course matches, 2024 cut-off comparisons, 
              and university recommendations for each eligible cluster.
            </p>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <Button 
        onClick={handleProceed}
        className="w-full"
        size="lg"
      >
        Continue to Payment
        <ChevronRight className="w-4 h-4 ml-2" />
      </Button>

      {/* Disclaimer */}
      <p className="text-xs text-center text-muted-foreground mt-6">
        This tool is not affiliated with KNEC or KUCCPS. Cluster calculations are based on 
        publicly available KUCCPS methodology and are for guidance only.
      </p>
    </div>
  );
}
