import { GRADE_POINTS } from './constants';

// Subject grade entry
export interface SubjectGrade {
  subject: string;
  grade: string;
  points: number;
}

// Cluster requirement definition
export interface ClusterRequirement {
  cluster_id: string;
  subject: string;
  category: 'compulsory' | 'group1' | 'group2' | 'group3' | 'any';
  min_grade: string | null;
  weight: number;
}

// Cluster definition
export interface ClusterDefinition {
  id: string;
  name: string;
  description: string | null;
  requirements: ClusterRequirement[];
}

// Cluster calculation result
export interface ClusterResult {
  clusterId: string;
  clusterName: string;
  clusterDescription: string | null;
  clusterScore: number;
  subjectsUsed: { subject: string; grade: string; points: number; weight: number }[];
  meetsRequirements: boolean;
  missingSubjects: string[];
  eligibilityStatus: 'likely_eligible' | 'borderline' | 'not_competitive';
}

// Course match with cut-off comparison
export interface CourseMatch {
  courseId: string;
  courseName: string;
  institution: string;
  field: string;
  description: string | null;
  careerPaths: string[];
  clusterId: string;
  clusterName: string;
  userClusterScore: number;
  cutoff2024: number;
  scoreDifference: number;
  eligibilityStatus: 'likely_eligible' | 'borderline' | 'not_competitive';
  subjectsUsed: { subject: string; grade: string; points: number; weight: number }[];
  interestScore: number;
  combinedScore: number;
}

// Tolerance margin for cut-off comparison (in points)
const CUTOFF_TOLERANCE = 2;

/**
 * Calculate cluster score based on KUCCPS methodology
 * Uses weighted average of best qualifying subjects
 */
export function calculateClusterScore(
  userGrades: SubjectGrade[],
  requirements: ClusterRequirement[]
): { score: number; subjectsUsed: { subject: string; grade: string; points: number; weight: number }[]; meetsRequirements: boolean; missingSubjects: string[] } {
  const subjectsUsed: { subject: string; grade: string; points: number; weight: number }[] = [];
  const missingSubjects: string[] = [];
  let totalWeightedScore = 0;
  let totalWeight = 0;

  // Create a map of user's grades for easy lookup
  const gradeMap = new Map<string, SubjectGrade>();
  userGrades.forEach(g => {
    gradeMap.set(g.subject.toLowerCase(), g);
  });

  // Group requirements by category
  const compulsory = requirements.filter(r => r.category === 'compulsory');
  const group1 = requirements.filter(r => r.category === 'group1');
  const group2 = requirements.filter(r => r.category === 'group2');
  const group3 = requirements.filter(r => r.category === 'group3');

  // Process compulsory subjects first
  for (const req of compulsory) {
    const userSubject = gradeMap.get(req.subject.toLowerCase());
    
    if (userSubject) {
      // Check minimum grade if specified
      if (req.min_grade && userSubject.points < GRADE_POINTS[req.min_grade]) {
        missingSubjects.push(`${req.subject} (need at least ${req.min_grade}, got ${userSubject.grade})`);
        continue;
      }
      
      subjectsUsed.push({
        subject: req.subject,
        grade: userSubject.grade,
        points: userSubject.points,
        weight: req.weight
      });
      totalWeightedScore += userSubject.points * req.weight;
      totalWeight += req.weight;
    } else {
      missingSubjects.push(req.subject);
    }
  }

  // Process group subjects (pick the best from each group)
  const processGroup = (group: ClusterRequirement[]) => {
    if (group.length === 0) return;
    
    let bestMatch: { req: ClusterRequirement; grade: SubjectGrade } | null = null;
    
    for (const req of group) {
      const userSubject = gradeMap.get(req.subject.toLowerCase());
      
      if (userSubject) {
        // Check minimum grade if specified
        if (req.min_grade && userSubject.points < GRADE_POINTS[req.min_grade]) {
          continue;
        }
        
        if (!bestMatch || userSubject.points > bestMatch.grade.points) {
          bestMatch = { req, grade: userSubject };
        }
      }
    }
    
    if (bestMatch) {
      subjectsUsed.push({
        subject: bestMatch.req.subject,
        grade: bestMatch.grade.grade,
        points: bestMatch.grade.points,
        weight: bestMatch.req.weight
      });
      totalWeightedScore += bestMatch.grade.points * bestMatch.req.weight;
      totalWeight += bestMatch.req.weight;
    }
  };

  processGroup(group1);
  processGroup(group2);
  processGroup(group3);

  // Calculate normalized score (0-48 scale based on KUCCPS)
  const rawScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  const normalizedScore = rawScore * 4; // Scale to approximate KUCCPS cluster points

  const meetsRequirements = missingSubjects.length === 0;

  return {
    score: Math.round(normalizedScore * 100) / 100,
    subjectsUsed,
    meetsRequirements,
    missingSubjects
  };
}

/**
 * Determine eligibility status based on score vs cut-off
 */
export function determineEligibilityStatus(
  userScore: number,
  cutoff: number
): 'likely_eligible' | 'borderline' | 'not_competitive' {
  const difference = userScore - cutoff;
  
  if (difference >= CUTOFF_TOLERANCE) {
    return 'likely_eligible';
  } else if (difference >= -CUTOFF_TOLERANCE) {
    return 'borderline';
  } else {
    return 'not_competitive';
  }
}

/**
 * Calculate all cluster eligibility for a user
 */
export function calculateAllClusterResults(
  userGrades: SubjectGrade[],
  clusters: ClusterDefinition[]
): ClusterResult[] {
  const results: ClusterResult[] = [];

  for (const cluster of clusters) {
    const { score, subjectsUsed, meetsRequirements, missingSubjects } = calculateClusterScore(
      userGrades,
      cluster.requirements
    );

    // Determine eligibility based on score thresholds
    let eligibilityStatus: 'likely_eligible' | 'borderline' | 'not_competitive';
    if (meetsRequirements && score >= 35) {
      eligibilityStatus = 'likely_eligible';
    } else if (meetsRequirements && score >= 25) {
      eligibilityStatus = 'borderline';
    } else {
      eligibilityStatus = 'not_competitive';
    }

    results.push({
      clusterId: cluster.id,
      clusterName: cluster.name,
      clusterDescription: cluster.description,
      clusterScore: score,
      subjectsUsed,
      meetsRequirements,
      missingSubjects,
      eligibilityStatus
    });
  }

  // Sort by score descending
  results.sort((a, b) => b.clusterScore - a.clusterScore);

  return results;
}

/**
 * Match courses based on cluster results and cut-offs
 */
export function matchCoursesWithCutoffs(
  clusterResults: ClusterResult[],
  courses: {
    id: string;
    name: string;
    institution: string | null;
    field: string;
    description: string | null;
    career_paths: string[] | null;
    cluster_id: string | null;
    cutoff_2024: number | null;
    mean_points_required: number;
  }[],
  interestScores: Record<string, number>
): CourseMatch[] {
  const matches: CourseMatch[] = [];
  
  // Create a map of cluster results
  const clusterMap = new Map<string, ClusterResult>();
  clusterResults.forEach(r => clusterMap.set(r.clusterId, r));

  for (const course of courses) {
    if (!course.cluster_id) continue;
    
    const clusterResult = clusterMap.get(course.cluster_id);
    if (!clusterResult || !clusterResult.meetsRequirements) continue;

    const cutoff = course.cutoff_2024 || 30;
    const scoreDifference = clusterResult.clusterScore - cutoff;
    const eligibilityStatus = determineEligibilityStatus(clusterResult.clusterScore, cutoff);
    
    // Calculate interest alignment
    const interestScore = interestScores[course.field] || 0;
    const normalizedInterestScore = (interestScore / 15) * 100;
    
    // Combined score for ranking
    const combinedScore = clusterResult.clusterScore * 0.7 + normalizedInterestScore * 0.3;

    matches.push({
      courseId: course.id,
      courseName: course.name,
      institution: course.institution || 'Various Universities',
      field: course.field,
      description: course.description,
      careerPaths: course.career_paths || [],
      clusterId: course.cluster_id,
      clusterName: clusterResult.clusterName,
      userClusterScore: clusterResult.clusterScore,
      cutoff2024: cutoff,
      scoreDifference,
      eligibilityStatus,
      subjectsUsed: clusterResult.subjectsUsed,
      interestScore: normalizedInterestScore,
      combinedScore
    });
  }

  // Sort by combined score descending
  matches.sort((a, b) => b.combinedScore - a.combinedScore);

  return matches;
}

/**
 * Get eligibility status display properties
 */
export function getEligibilityDisplay(status: 'likely_eligible' | 'borderline' | 'not_competitive') {
  switch (status) {
    case 'likely_eligible':
      return {
        label: 'Likely Eligible',
        color: 'bg-green-500/20 text-green-700 border-green-500/30',
        description: 'Your score is above the 2024 cut-off'
      };
    case 'borderline':
      return {
        label: 'Borderline',
        color: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
        description: 'Your score is close to the cut-off'
      };
    case 'not_competitive':
      return {
        label: 'Not Competitive',
        color: 'bg-red-500/20 text-red-700 border-red-500/30',
        description: 'Your score is below the cut-off'
      };
  }
}
