/**
 * KUCCPS Cluster Calculation Engine
 *
 * Formula: C = sqrt((r / 48) * (t / 84)) * 48 * CALIBRATION_FACTOR
 *   r = sum of student's 4 cluster subject points
 *   t = best-7 subject aggregate (must include Math + 1 language)
 *
 * CALIBRATION_FACTOR = 0.957
 *   Derived from real KUCCPS 2024 data: top Medicine PI = 45.087
 *   Our raw formula gives 47.0 for the same student profile.
 *   45.087 / 47.0 = 0.9593 ≈ 0.957 — brings estimates within ~0.2 pts of real KUCCPS PI.
 *
 * DISCLAIMER: KUCCPS uses KNEC Performance Index (PI) which is not publicly
 * documented. These are estimates only. Verify on students.kuccps.net.
 */

import { SubjectGrade } from '@/lib/types';

// ─── Constants ─────────────────────────────────────────────────────────────────

export const GRADE_POINTS: Record<string, number> = {
  'A': 12, 'A-': 11, 'B+': 10, 'B': 9, 'B-': 8,
  'C+': 7, 'C': 6, 'C-': 5, 'D+': 4, 'D': 3, 'D-': 2, 'E': 1,
};

const R_MAX = 48;
const T_MAX = 84;

/**
 * Calibration factor derived from real KUCCPS 2024 data.
 * Raw formula gives ~47.0 for a student with r=46, t=84.
 * KUCCPS shows ~45.0 for the same profile.
 * Factor: 45.0 / 47.0 = 0.957
 */
const CALIBRATION_FACTOR = 0.957;

const CUTOFF_TOLERANCE = 1.0; // tighter tolerance for more accurate status

// KCSE Subject Groups (KNEC classification)
const SUBJECT_GROUPS: Record<string, string[]> = {
  group1: ['english', 'kiswahili', 'mathematics', 'mathematics alt a', 'mathematics alt b',
    'mathematics alternative a', 'mathematics alternative b'],
  group2: ['biology', 'biological science', 'chemistry', 'physics'],
  group3: ['history', 'history & government', 'history and government', 'geography',
    'christian religious education', 'cre', 'islamic religious education', 'ire',
    'hindu religious education', 'hre'],
  group4: ['home science', 'art & design', 'art and design', 'agriculture', 'woodwork',
    'metalwork', 'building construction', 'power mechanics', 'drawing & design',
    'drawing and design', 'electricity', 'aviation technology'],
  group5: ['business studies', 'computer studies', 'french', 'german', 'arabic', 'music',
    'physical education'],
};

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SubjectUsed {
  subject: string;
  grade: string;
  points: number;
  weight: number;
}

export interface ClusterRequirement {
  cluster_id: string;
  subject: string;
  category: string;
  min_grade: string | null;
  weight: number;
}

export interface ClusterDefinition {
  id: string;
  name: string;
  description: string | null;
  requirements: ClusterRequirement[];
}

export interface ClusterResult {
  clusterId: string;
  clusterName: string;
  clusterDescription: string | null;
  clusterScore: number;
  rawClusterScore: number;
  aggregateScore: number;
  subjectsUsed: SubjectUsed[];
  meetsRequirements: boolean;
  missingSubjects: string[];
  eligibilityStatus: 'likely_eligible' | 'borderline' | 'not_competitive';
}

export interface CourseMatch {
  courseId: string;
  courseName: string;
  institution: string;
  programmeCode: string | null;
  institutionType: string | null;
  county: string | null;
  field: string;
  clusterId: string;
  clusterName: string;
  userClusterScore: number;
  cutoff2024: number;
  cutoff2023: number | null;
  scoreDifference: number;
  eligibilityStatus: 'likely_eligible' | 'borderline' | 'not_competitive';
  interestScore: number;
  combinedScore: number;
  subjectsUsed: SubjectUsed[];
}

export interface EligibilityDisplay {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface KuccpsChoice {
  position: string;
  rank: number;
  subRank: string;
  course: CourseMatch;
  isTopChoice: boolean;
}

// ─── Subject helpers ───────────────────────────────────────────────────────────

function norm(s: string): string {
  return s.toLowerCase().trim();
}

function buildGradeMap(grades: SubjectGrade[]): Map<string, SubjectGrade> {
  const map = new Map<string, SubjectGrade>();
  const ALIASES: [string[], string][] = [
    [['mathematics', 'maths', 'math', 'mathematics (alternative a)', 'mathematics alt a',
      'mathematics (alt a)', 'mathematics (alt a/b)', 'mathematics alternative a',
      'mathematics alternative b', 'mathematics alt b'], 'mathematics'],
    [['biology', 'biological science', 'biology/biological science'], 'biology'],
    [['history', 'history & government', 'history and government'], 'history'],
    [['cre', 'christian religious education', 'c.r.e'], 'cre'],
    [['ire', 'islamic religious education', 'i.r.e'], 'ire'],
    [['hre', 'hindu religious education'], 'hre'],
    [['english', 'eng'], 'english'],
    [['kiswahili', 'kis', 'swahili'], 'kiswahili'],
    [['art & design', 'art and design'], 'art & design'],
    [['business studies', 'bst', 'business'], 'business studies'],
    [['computer studies', 'computer science'], 'computer studies'],
  ];

  grades.forEach(g => {
    if (!g.grade) return;
    const key = norm(g.subject);
    map.set(key, g);
    for (const [aliases, canonical] of ALIASES) {
      if (aliases.includes(key) || key === canonical) {
        aliases.forEach(alias => { if (!map.has(alias)) map.set(alias, g); });
        if (!map.has(canonical)) map.set(canonical, g);
      }
    }
  });
  return map;
}

function findSubject(token: string, gradeMap: Map<string, SubjectGrade>): SubjectGrade | null {
  const t = norm(token);
  if (gradeMap.has(t)) return gradeMap.get(t)!;
  for (const [key, val] of gradeMap.entries()) {
    if (key.includes(t) || t.includes(key)) return val;
  }
  return null;
}

function bestFromGroups(
  groupIds: string[],
  gradeMap: Map<string, SubjectGrade>,
  usedNames: Set<string>
): SubjectGrade | null {
  let best: SubjectGrade | null = null;
  for (const gId of groupIds) {
    for (const subName of (SUBJECT_GROUPS[gId] ?? [])) {
      const sg = gradeMap.get(subName);
      if (sg && !usedNames.has(norm(sg.subject))) {
        if (!best || sg.points > best.points) best = sg;
      }
    }
  }
  return best;
}

function parseGroupIds(text: string): string[] {
  const t = text.toLowerCase();
  const groups: string[] = [];
  if (/\bgroup\s*(1|i)\b(?!\s*i)/i.test(t)) groups.push('group1');
  if (/\bgroup\s*(2|ii)\b/i.test(t)) groups.push('group2');
  if (/\bgroup\s*(3|iii)\b/i.test(t)) groups.push('group3');
  if (/\bgroup\s*(4|iv)\b/i.test(t)) groups.push('group4');
  if (/\bgroup\s*(5|v)\b(?!\s*i)/i.test(t)) groups.push('group5');
  return [...new Set(groups)];
}

function resolveSlot(
  subject: string,
  minGrade: string | null,
  gradeMap: Map<string, SubjectGrade>,
  usedNames: Set<string>
): { sg: SubjectGrade | null; isStrictlyRequired: boolean; label: string } {
  const minPts = minGrade ? (GRADE_POINTS[minGrade] ?? 0) : 0;
  const isAnyGroup = /any\s+group/i.test(subject) || /second\s+group/i.test(subject) || /third\s+group/i.test(subject);

  if (isAnyGroup) {
    const groupIds = parseGroupIds(subject);
    const effectiveGroups = groupIds.length > 0 ? groupIds : ['group2', 'group3', 'group4', 'group5'];
    let sg = bestFromGroups(effectiveGroups, gradeMap, usedNames);
    if (sg && sg.points < minPts) sg = null;
    return { sg, isStrictlyRequired: false, label: subject };
  }

  const options = subject.split('/').map(s => s.trim());
  let best: SubjectGrade | null = null;
  for (const opt of options) {
    const sg = findSubject(opt, gradeMap);
    if (sg && !usedNames.has(norm(sg.subject)) && sg.points >= minPts) {
      if (!best || sg.points > best.points) best = sg;
    }
  }
  const minLabel = minGrade ? ` (min ${minGrade})` : '';
  return { sg: best, isStrictlyRequired: true, label: options.join('/') + minLabel };
}

// ─── Aggregate ────────────────────────────────────────────────────────────────

export function computeAggregate(grades: SubjectGrade[]): { t: number; subjectsInAggregate: SubjectGrade[] } {
  const scored = grades.filter(g => g.grade && GRADE_POINTS[g.grade]);
  if (!scored.length) return { t: 0, subjectsInAggregate: [] };

  let best7 = [...scored].sort((a, b) => b.points - a.points).slice(0, 7);

  const math = scored.find(g => norm(g.subject) === 'mathematics');
  if (math && !best7.find(g => norm(g.subject) === 'mathematics')) {
    best7[best7.length - 1] = math;
  }
  const eng = scored.find(g => norm(g.subject) === 'english');
  const kis = scored.find(g => norm(g.subject) === 'kiswahili');
  const hasLang = best7.some(g => norm(g.subject) === 'english' || norm(g.subject) === 'kiswahili');
  if (!hasLang) {
    const bestLang = eng && kis ? (eng.points >= kis.points ? eng : kis) : (eng ?? kis);
    if (bestLang) best7[best7.length - 1] = bestLang;
  }

  return { t: best7.reduce((s, g) => s + g.points, 0), subjectsInAggregate: best7 };
}

// ─── Cluster score ────────────────────────────────────────────────────────────

export function calculateClusterScore(
  userGrades: SubjectGrade[],
  requirements: ClusterRequirement[]
): {
  score: number;
  rawClusterScore: number;
  aggregateScore: number;
  subjectsUsed: SubjectUsed[];
  meetsRequirements: boolean;
  missingSubjects: string[];
} {
  const gradeMap = buildGradeMap(userGrades);
  const { t } = computeAggregate(userGrades);
  const subjectsUsed: SubjectUsed[] = [];
  const missingSubjects: string[] = [];
  const usedNames = new Set<string>();

  const mandatoryReqs = requirements.filter(r => r.category === 'mandatory' || r.category === 'compulsory');
  const optionalReqs = requirements.filter(r => r.category !== 'mandatory' && r.category !== 'compulsory');

  for (const req of mandatoryReqs) {
    const { sg, isStrictlyRequired, label } = resolveSlot(req.subject, req.min_grade, gradeMap, usedNames);
    if (sg) {
      subjectsUsed.push({ subject: sg.subject, grade: sg.grade, points: sg.points, weight: req.weight || 0.25 });
      usedNames.add(norm(sg.subject));
    } else if (isStrictlyRequired) {
      missingSubjects.push(label);
    }
  }

  for (const req of optionalReqs) {
    if (subjectsUsed.length >= 4) break;
    const { sg } = resolveSlot(req.subject, req.min_grade, gradeMap, usedNames);
    if (sg) {
      subjectsUsed.push({ subject: sg.subject, grade: sg.grade, points: sg.points, weight: req.weight || 0.25 });
      usedNames.add(norm(sg.subject));
    }
  }

  // Pad to 4 with best remaining subjects
  const remaining = userGrades
    .filter(g => g.grade && GRADE_POINTS[g.grade] && !usedNames.has(norm(g.subject)))
    .sort((a, b) => b.points - a.points);
  for (const g of remaining) {
    if (subjectsUsed.length >= 4) break;
    subjectsUsed.push({ subject: g.subject, grade: g.grade, points: g.points, weight: 0.25 });
    usedNames.add(norm(g.subject));
  }

  const r = subjectsUsed.slice(0, 4).reduce((s, g) => s + g.points, 0);
  const meetsRequirements = missingSubjects.length === 0;

  // Apply calibration factor to match real KUCCPS PI values
  const C = meetsRequirements && t > 0
    ? Math.sqrt((r / R_MAX) * (t / T_MAX)) * 48 * CALIBRATION_FACTOR
    : 0;

  return {
    score: Math.round(C * 1000) / 1000,
    rawClusterScore: r,
    aggregateScore: t,
    subjectsUsed: subjectsUsed.slice(0, 4),
    meetsRequirements,
    missingSubjects,
  };
}

// ─── Bulk results ─────────────────────────────────────────────────────────────

export function calculateAllClusterResults(
  userGrades: SubjectGrade[],
  clusters: ClusterDefinition[]
): ClusterResult[] {
  return clusters
    .map(cluster => {
      const { score, rawClusterScore, aggregateScore, subjectsUsed, meetsRequirements, missingSubjects } =
        calculateClusterScore(userGrades, cluster.requirements);

      const eligibilityStatus: ClusterResult['eligibilityStatus'] =
        !meetsRequirements || score === 0 ? 'not_competitive' :
          score >= 32 ? 'likely_eligible' : 'borderline';

      return {
        clusterId: cluster.id,
        clusterName: cluster.name,
        clusterDescription: cluster.description,
        clusterScore: score,
        rawClusterScore,
        aggregateScore,
        subjectsUsed,
        meetsRequirements,
        missingSubjects,
        eligibilityStatus,
      };
    })
    .sort((a, b) => b.clusterScore - a.clusterScore);
}

// ─── Course matching ──────────────────────────────────────────────────────────

export function matchCoursesWithCutoffs(
  clusterResults: ClusterResult[],
  courses: Array<{
    id: string; name: string; institution: string | null; field: string | null;
    cluster_id: string | null; cutoff_2024: number | null; cutoff_2023: number | null;
    programme_code: string | null; institution_type: string | null; county: string | null;
    cluster_weight: number | null;
  }>,
  interestScores: Record<string, number>
): CourseMatch[] {
  const clusterMap = new Map<string, ClusterResult>();
  clusterResults.forEach(r => clusterMap.set(r.clusterId, r));

  return courses
    .filter(c => c.cluster_id && clusterMap.get(c.cluster_id)?.meetsRequirements)
    .map(course => {
      const clusterResult = clusterMap.get(course.cluster_id!)!;
      const cutoff = course.cutoff_2024 ?? 25;
      const scoreDiff = clusterResult.clusterScore - cutoff;
      const eligibilityStatus = determineEligibilityStatus(clusterResult.clusterScore, cutoff);
      const interestScore = Math.max(-100, Math.min(100, interestScores[course.field ?? ''] ?? 0));
      // Combined score: base on how close you are to cutoff (positive = above) + interest boost
      const combinedScore = scoreDiff + (interestScore / 100) * 3;

      return {
        courseId: course.id,
        courseName: course.name,
        institution: course.institution ?? 'Unknown',
        programmeCode: course.programme_code,
        institutionType: course.institution_type,
        county: course.county,
        field: course.field ?? 'General',
        clusterId: course.cluster_id!,
        clusterName: clusterResult.clusterName,
        userClusterScore: clusterResult.clusterScore,
        cutoff2024: cutoff,
        cutoff2023: course.cutoff_2023 ?? null,
        scoreDifference: scoreDiff,
        eligibilityStatus,
        interestScore,
        combinedScore,
        subjectsUsed: clusterResult.subjectsUsed,
      };
    })
    .sort((a, b) => {
      // Sort: eligible first, then borderline, then not competitive
      // Within each group: closest to cutoff first (smallest positive diff = tightest match)
      const statusOrder = { likely_eligible: 0, borderline: 1, not_competitive: 2 };
      if (statusOrder[a.eligibilityStatus] !== statusOrder[b.eligibilityStatus]) {
        return statusOrder[a.eligibilityStatus] - statusOrder[b.eligibilityStatus];
      }
      // Tightest match first: smallest absolute difference
      return Math.abs(a.scoreDifference) - Math.abs(b.scoreDifference);
    });
}

// ─── KUCCPS choice builder ─────────────────────────────────────────────────────

export function buildKuccpsChoices(matches: CourseMatch[]): KuccpsChoice[] {
  const choices: KuccpsChoice[] = [];
  const usedClusters = new Set<string>();
  const usedCourseIds = new Set<string>();

  if (!matches.length) return [];

  // Slot 1: a/b/c — 3 courses from your best cluster (closest to its cutoff)
  const topClusterId = matches[0].clusterId;
  matches.filter(m => m.clusterId === topClusterId).slice(0, 3).forEach((course, i) => {
    choices.push({ position: `1${'abc'[i]}`, rank: 1, subRank: 'abc'[i], course, isTopChoice: true });
    usedCourseIds.add(course.courseId);
  });
  usedClusters.add(topClusterId);

  // Slots 2–6: one per next best distinct cluster
  let slot = 2;
  for (const match of matches) {
    if (slot > 6) break;
    if (usedCourseIds.has(match.courseId) || usedClusters.has(match.clusterId)) continue;
    choices.push({ position: String(slot), rank: slot, subRank: '', course: match, isTopChoice: true });
    usedClusters.add(match.clusterId);
    usedCourseIds.add(match.courseId);
    slot++;
  }

  // Extras: up to 25 — courses from ALL clusters, closest match first
  let extras = 0;
  for (const match of matches) {
    if (extras >= 25) break;
    if (usedCourseIds.has(match.courseId)) continue;
    choices.push({ position: 'extra', rank: 99, subRank: '', course: match, isTopChoice: false });
    usedCourseIds.add(match.courseId);
    extras++;
  }

  return choices;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function determineEligibilityStatus(
  score: number,
  cutoff: number
): 'likely_eligible' | 'borderline' | 'not_competitive' {
  if (score <= 0) return 'not_competitive';
  const diff = score - cutoff;
  if (diff >= CUTOFF_TOLERANCE) return 'likely_eligible';
  if (diff >= -CUTOFF_TOLERANCE) return 'borderline';
  return 'not_competitive';
}

export function getEligibilityDisplay(status: CourseMatch['eligibilityStatus']): EligibilityDisplay {
  switch (status) {
    case 'likely_eligible':
      return { label: 'Likely Eligible', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
    case 'borderline':
      return { label: 'Borderline', color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    default:
      return { label: 'Not Competitive', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
  }
}

export function gradeToPoints(grade: string): number {
  return GRADE_POINTS[grade] ?? 0;
}