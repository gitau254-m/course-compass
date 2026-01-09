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
  Star,
  RefreshCw,
  Award,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EligibilityResult, Course, University } from '@/lib/types';
import { GRADE_POINTS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CourseMatch extends EligibilityResult {
  course: Course;
  universities: University[];
  whyQualified: string[];
}

export function ResultsStep() {
  const { user, compulsorySubjects, optionalSubjects, interestResponses, resetApp } = useApp();
  const [courses, setCourses] = useState<CourseMatch[]>([]);
  const [suggestedCourses, setSuggestedCourses] = useState<CourseMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  useEffect(() => {
    calculateEligibility();
  }, []);

  const calculateEligibility = async () => {
    setIsLoading(true);
    
    try {
      // Get all courses with their cluster subjects
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          course_cluster_subjects(*),
          universities(*)
        `);

      if (coursesError) throw coursesError;

      if (!coursesData || coursesData.length === 0) {
        // Insert sample courses if none exist
        await insertSampleCourses();
        return calculateEligibility();
      }

      // Calculate user's mean grade
      const allSubjects = [...compulsorySubjects, ...optionalSubjects].filter(s => s.grade);
      const totalPoints = allSubjects.reduce((sum, s) => sum + s.points, 0);
      const meanPoints = allSubjects.length > 0 ? totalPoints / allSubjects.length : 0;

      // Calculate interest score by field
      const fieldScores: Record<string, number> = {};
      Object.values(interestResponses).forEach(response => {
        response.fields.forEach(field => {
          fieldScores[field] = (fieldScores[field] || 0) + response.score;
        });
      });

      // Process each course
      const matches: CourseMatch[] = [];

      for (const course of coursesData) {
        // Check mean grade requirement
        if (meanPoints < course.mean_points_required) continue;

        // Calculate cluster score
        let clusterScore = 0;
        let totalWeight = 0;
        const whyQualified: string[] = [];

        const clusterSubjects = course.course_cluster_subjects || [];
        
        for (const cluster of clusterSubjects) {
          const userSubject = allSubjects.find(
            s => s.subject.toLowerCase() === cluster.subject.toLowerCase()
          );
          
          if (userSubject) {
            // Check minimum grade if specified
            if (cluster.min_grade && userSubject.points < GRADE_POINTS[cluster.min_grade]) {
              continue;
            }
            
            clusterScore += userSubject.points * cluster.weight;
            totalWeight += cluster.weight;
            
            if (userSubject.points >= 9) {
              whyQualified.push(`Strong ${cluster.subject} performance (${userSubject.grade})`);
            }
          }
        }

        const normalizedClusterScore = totalWeight > 0 
          ? (clusterScore / (totalWeight * 12)) * 100 
          : (meanPoints / 12) * 100;

        // Get interest score for this field
        const interestScore = fieldScores[course.field] || 0;
        const normalizedInterestScore = (interestScore / 15) * 100; // Max 15 points

        // Determine final rank
        const combinedScore = normalizedClusterScore * 0.7 + normalizedInterestScore * 0.3;
        let finalRank: 'High' | 'Medium' | 'Low' = 'Low';
        if (combinedScore >= 70) finalRank = 'High';
        else if (combinedScore >= 50) finalRank = 'Medium';

        // Add qualification reasons
        whyQualified.push(`Mean grade of ${meanPoints.toFixed(1)} points meets requirement`);
        if (interestScore > 6) {
          whyQualified.push(`Matches your interest in ${course.field}`);
        }

        matches.push({
          id: `temp-${course.id}`,
          user_id: user!.id,
          course_id: course.id,
          cluster_score: normalizedClusterScore,
          interest_score: normalizedInterestScore,
          final_rank: finalRank,
          created_at: new Date().toISOString(),
          course: course,
          universities: course.universities || [],
          whyQualified,
        });
      }

      // Sort by combined score
      matches.sort((a, b) => {
        const scoreA = a.cluster_score * 0.7 + a.interest_score * 0.3;
        const scoreB = b.cluster_score * 0.7 + b.interest_score * 0.3;
        return scoreB - scoreA;
      });

      // Split into main and suggested
      const mainCourses = matches.slice(0, 10);
      const suggested = matches.slice(10, 14);

      setCourses(mainCourses);
      setSuggestedCourses(suggested);

      // Save results to database
      if (mainCourses.length > 0) {
        const resultsToSave = mainCourses.map(m => ({
          user_id: user!.id,
          course_id: m.course_id,
          cluster_score: m.cluster_score,
          interest_score: m.interest_score,
          final_rank: m.final_rank,
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

  const insertSampleCourses = async () => {
    const sampleCourses = [
      {
        name: 'Bachelor of Medicine and Surgery',
        field: 'Health',
        mean_grade_required: 'A-',
        mean_points_required: 11,
        description: 'Train to become a medical doctor',
        career_paths: ['Doctor', 'Surgeon', 'Medical Researcher'],
      },
      {
        name: 'Bachelor of Engineering (Civil)',
        field: 'Engineering',
        mean_grade_required: 'B+',
        mean_points_required: 10,
        description: 'Design and build infrastructure',
        career_paths: ['Civil Engineer', 'Construction Manager', 'Urban Planner'],
      },
      {
        name: 'Bachelor of Commerce',
        field: 'Business',
        mean_grade_required: 'B',
        mean_points_required: 9,
        description: 'Business administration and management',
        career_paths: ['Accountant', 'Business Analyst', 'Marketing Manager'],
      },
      {
        name: 'Bachelor of Computer Science',
        field: 'IT',
        mean_grade_required: 'B',
        mean_points_required: 9,
        description: 'Software development and IT systems',
        career_paths: ['Software Developer', 'Data Scientist', 'IT Consultant'],
      },
      {
        name: 'Bachelor of Education (Science)',
        field: 'Education',
        mean_grade_required: 'C+',
        mean_points_required: 7,
        description: 'Teach science subjects in schools',
        career_paths: ['Teacher', 'Education Administrator', 'Curriculum Developer'],
      },
      {
        name: 'Bachelor of Laws (LLB)',
        field: 'Law',
        mean_grade_required: 'B+',
        mean_points_required: 10,
        description: 'Legal studies and practice',
        career_paths: ['Lawyer', 'Judge', 'Legal Consultant'],
      },
      {
        name: 'Bachelor of Nursing',
        field: 'Health',
        mean_grade_required: 'B-',
        mean_points_required: 8,
        description: 'Healthcare and patient care',
        career_paths: ['Nurse', 'Healthcare Manager', 'Clinical Specialist'],
      },
      {
        name: 'Bachelor of Architecture',
        field: 'Architecture',
        mean_grade_required: 'B',
        mean_points_required: 9,
        description: 'Design buildings and spaces',
        career_paths: ['Architect', 'Urban Designer', 'Interior Designer'],
      },
    ];

    const universities = [
      { name: 'University of Nairobi', location: 'Nairobi' },
      { name: 'Kenyatta University', location: 'Nairobi' },
      { name: 'Jomo Kenyatta University', location: 'Juja' },
      { name: 'Moi University', location: 'Eldoret' },
      { name: 'Egerton University', location: 'Nakuru' },
    ];

    for (const course of sampleCourses) {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert(course)
        .select()
        .single();

      if (courseError) continue;

      // Add random universities
      const randomUnis = universities
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 3) + 2);

      for (const uni of randomUnis) {
        await supabase.from('universities').insert({
          ...uni,
          course_id: courseData.id,
        });
      }
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'High': return 'match-high';
      case 'Medium': return 'match-medium';
      default: return 'match-low';
    }
  };

  const getRankIcon = (rank: string) => {
    switch (rank) {
      case 'High': return <Star className="w-4 h-4" />;
      case 'Medium': return <TrendingUp className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="fade-in max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 pulse-gentle">
          <GraduationCap className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Analyzing Your Results</h2>
        <p className="text-muted-foreground">Finding the best courses for you...</p>
      </div>
    );
  }

  return (
    <div className="fade-in max-w-2xl mx-auto px-4 pb-12">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
          Your Course Matches
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Based on your KCSE results and interests
        </p>
      </div>

      {/* Kenya stripe decoration */}
      <div className="kenya-stripe rounded-full mb-6" />

      {courses.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Matches Found</h3>
          <p className="text-muted-foreground text-sm mb-4">
            We couldn't find courses matching your qualifications. Try improving your grades or explore diploma programs.
          </p>
          <Button onClick={resetApp} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Start Over
          </Button>
        </div>
      ) : (
        <>
          {/* Main courses */}
          <div className="space-y-4 mb-8">
            {courses.map((match, index) => (
              <div
                key={match.course.id}
                className="course-card slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={cn('text-xs', getRankColor(match.final_rank))}>
                        {getRankIcon(match.final_rank)}
                        <span className="ml-1">{match.final_rank} Match</span>
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-foreground">{match.course.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{match.course.description}</p>
                  </div>
                  <button
                    onClick={() => setExpandedCourse(
                      expandedCourse === match.course.id ? null : match.course.id
                    )}
                    className="p-2 text-muted-foreground hover:text-foreground"
                  >
                    {expandedCourse === match.course.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {expandedCourse === match.course.id && (
                  <div className="mt-4 pt-4 border-t border-border slide-up">
                    {/* Universities */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        Universities Offering This Course
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {match.universities.map((uni) => (
                          <Badge key={uni.id} variant="secondary" className="text-xs">
                            {uni.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Why you qualify */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        Why You Qualify
                      </h4>
                      <ul className="space-y-1">
                        {match.whyQualified.map((reason, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-success mt-1">•</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Career paths */}
                    {match.course.career_paths && match.course.career_paths.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                          <Briefcase className="w-4 h-4 text-gold" />
                          Career Paths
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {match.course.career_paths.map((career, i) => (
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
            ))}
          </div>

          {/* Suggested courses */}
          {suggestedCourses.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-gold" />
                You Might Also Consider
              </h3>
              <div className="grid gap-3">
                {suggestedCourses.map((match) => (
                  <div
                    key={match.course.id}
                    className="bg-muted/50 rounded-xl p-4 border border-border/50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{match.course.name}</h4>
                        <p className="text-xs text-muted-foreground">{match.course.field}</p>
                      </div>
                      <Badge className={cn('text-xs', getRankColor(match.final_rank))}>
                        {match.final_rank}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-8 text-center">
        <Button onClick={resetApp} variant="outline" className="w-full sm:w-auto">
          <RefreshCw className="w-4 h-4 mr-2" />
          Check for Another Person
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground mt-6">
        This guidance tool is not affiliated with KNEC or KUCCPS. Results are for informational purposes only.
      </p>
    </div>
  );
}