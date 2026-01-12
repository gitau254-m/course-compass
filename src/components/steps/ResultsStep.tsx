import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  MapPin, 
  Briefcase, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Layers,
  Target,
  BookOpen
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  ClusterDefinition,
  CourseMatch,
  calculateAllClusterResults,
  matchCoursesWithCutoffs,
  getEligibilityDisplay
} from '@/lib/clusterEngine';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function ResultsStep() {
  const { user, compulsorySubjects, optionalSubjects, interestResponses, resetApp } = useApp();
  const [courses, setCourses] = useState<CourseMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  useEffect(() => {
    calculateEligibility();
  }, []);

  const calculateEligibility = async () => {
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

      // Fetch courses with cut-off data
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*');

      if (coursesError) throw coursesError;

      if (!coursesData || coursesData.length === 0) {
        toast.error('No courses found in database');
        setIsLoading(false);
        return;
      }

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

      // Calculate interest score by field
      const fieldScores: Record<string, number> = {};
      Object.values(interestResponses).forEach(response => {
        response.fields.forEach(field => {
          fieldScores[field] = (fieldScores[field] || 0) + response.score;
        });
      });

      // Calculate all cluster results
      const clusterResults = calculateAllClusterResults(allSubjects, clusters);

      // Match courses with cut-offs
      const matches = matchCoursesWithCutoffs(clusterResults, coursesData, fieldScores);

      setCourses(matches);

      // Save results to database
      if (user?.id && matches.length > 0) {
        const resultsToSave = matches.slice(0, 20).map(m => ({
          user_id: user.id,
          course_id: m.courseId,
          cluster_score: m.userClusterScore,
          interest_score: m.interestScore,
          final_rank: m.eligibilityStatus === 'likely_eligible' ? 'High' : 
                      m.eligibilityStatus === 'borderline' ? 'Medium' : 'Low',
        }));

        await supabase.from('eligibility_results').insert(resultsToSave);
      }

    } catch (error) {
      console.error('Error calculating eligibility:', error);
      toast.error('Failed to load results. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getEligibilityIcon = (status: string) => {
    switch (status) {
      case 'likely_eligible':
        return <CheckCircle className="w-4 h-4" />;
      case 'borderline':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <TrendingDown className="w-4 h-4" />;
    }
  };

  const getScoreDifferenceDisplay = (diff: number) => {
    if (diff >= 2) {
      return { text: `+${diff.toFixed(1)}`, color: 'text-green-600', icon: <TrendingUp className="w-3 h-3" /> };
    } else if (diff >= -2) {
      return { text: diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1), color: 'text-yellow-600', icon: <TrendingUp className="w-3 h-3 rotate-0" /> };
    } else {
      return { text: diff.toFixed(1), color: 'text-red-600', icon: <TrendingDown className="w-3 h-3" /> };
    }
  };

  // Group courses by eligibility status
  const likelyEligible = courses.filter(c => c.eligibilityStatus === 'likely_eligible');
  const borderline = courses.filter(c => c.eligibilityStatus === 'borderline');
  const notCompetitive = courses.filter(c => c.eligibilityStatus === 'not_competitive');

  if (isLoading) {
    return (
      <div className="fade-in max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 pulse-gentle">
          <GraduationCap className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Analyzing Your Results</h2>
        <p className="text-muted-foreground">Matching courses with 2024 cut-off points...</p>
      </div>
    );
  }

  return (
    <div className="fade-in max-w-2xl mx-auto px-4 pb-12">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
          Your Course Matches
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Compared against 2024 KUCCPS cut-off points
        </p>
      </div>

      {/* Kenya stripe decoration */}
      <div className="kenya-stripe rounded-full mb-6" />

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-card rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-green-600">{likelyEligible.length}</div>
          <div className="text-xs text-muted-foreground">Likely Eligible</div>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-yellow-600">{borderline.length}</div>
          <div className="text-xs text-muted-foreground">Borderline</div>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-muted-foreground">{notCompetitive.length}</div>
          <div className="text-xs text-muted-foreground">Below Cut-off</div>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Matches Found</h3>
          <p className="text-muted-foreground text-sm mb-4">
            We couldn't find courses matching your qualifications. Consider exploring diploma programs 
            or certificate courses as alternative pathways.
          </p>
          <Button onClick={resetApp} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Start Over
          </Button>
        </div>
      ) : (
        <>
          {/* Likely Eligible Courses */}
          {likelyEligible.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                Likely Eligible ({likelyEligible.length})
              </h3>
              <div className="space-y-3">
                {likelyEligible.slice(0, 10).map((match, index) => (
                  <CourseCard
                    key={`${match.courseId}-${index}`}
                    match={match}
                    isExpanded={expandedCourse === `${match.courseId}-${index}`}
                    onToggle={() => setExpandedCourse(
                      expandedCourse === `${match.courseId}-${index}` ? null : `${match.courseId}-${index}`
                    )}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Borderline Courses */}
          {borderline.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-yellow-700">
                <AlertTriangle className="w-4 h-4" />
                Borderline ({borderline.length})
              </h3>
              <div className="space-y-3">
                {borderline.slice(0, 5).map((match, index) => (
                  <CourseCard
                    key={`${match.courseId}-b-${index}`}
                    match={match}
                    isExpanded={expandedCourse === `${match.courseId}-b-${index}`}
                    onToggle={() => setExpandedCourse(
                      expandedCourse === `${match.courseId}-b-${index}` ? null : `${match.courseId}-b-${index}`
                    )}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Important Disclaimer
            </p>
            <ul className="text-xs text-amber-700 dark:text-amber-300 mt-1 space-y-1">
              <li>• This tool is <strong>NOT affiliated</strong> with KNEC or KUCCPS</li>
              <li>• Results are <strong>advisory</strong> based on historical 2024 data</li>
              <li>• Cut-off points <strong>vary yearly</strong> and are reference estimates only</li>
              <li>• Always verify with official KUCCPS placement results</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Button onClick={resetApp} variant="outline" className="w-full sm:w-auto">
          <RefreshCw className="w-4 h-4 mr-2" />
          Check for Another Person
        </Button>
      </div>
    </div>
  );
}

// Course Card Component
function CourseCard({ 
  match, 
  isExpanded, 
  onToggle, 
  index 
}: { 
  match: CourseMatch; 
  isExpanded: boolean; 
  onToggle: () => void;
  index: number;
}) {
  const display = getEligibilityDisplay(match.eligibilityStatus);
  const scoreDiff = match.userClusterScore - match.cutoff2024;
  const diffDisplay = scoreDiff >= 0 
    ? { text: `+${scoreDiff.toFixed(1)}`, color: 'text-green-600' }
    : { text: scoreDiff.toFixed(1), color: 'text-red-600' };

  return (
    <div
      className="course-card slide-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge className={cn('text-xs border', display.color)}>
              {display.label}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {match.clusterName}
            </Badge>
          </div>
          <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
            {match.courseName}
          </h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {match.institution}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-1 justify-end">
            <span className="text-lg font-bold text-primary">{match.userClusterScore.toFixed(1)}</span>
            <span className={cn('text-xs font-medium', diffDisplay.color)}>
              ({diffDisplay.text})
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Cut-off: {match.cutoff2024.toFixed(1)}
          </p>
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border slide-up">
          {/* Cluster Subjects Used */}
          <div className="mb-4">
            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-primary" />
              Cluster Subjects Used
            </h4>
            <div className="flex flex-wrap gap-2">
              {match.subjectsUsed.map((s, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {s.subject}: {s.grade} ({s.points}pts × {s.weight}w)
                </Badge>
              ))}
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="mb-4 bg-muted/50 rounded-lg p-3">
            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-primary" />
              Score Comparison
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Your Score:</span>
                <span className="font-bold text-primary ml-2">{match.userClusterScore.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">2024 Cut-off:</span>
                <span className="font-bold ml-2">{match.cutoff2024.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground ml-1">(Reference)</span>
              </div>
            </div>
          </div>

          {/* Interest Alignment */}
          {match.interestScore > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-success" />
                Interest Alignment
              </h4>
              <p className="text-sm text-muted-foreground">
                {match.interestScore >= 60 
                  ? `Strong match with your interest in ${match.field}` 
                  : match.interestScore >= 30 
                  ? `Moderate match with your interests`
                  : `Consider exploring if ${match.field} aligns with your goals`}
              </p>
            </div>
          )}

          {/* Career paths */}
          {match.careerPaths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-gold" />
                Career Paths
              </h4>
              <div className="flex flex-wrap gap-2">
                {match.careerPaths.map((career, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {career}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
