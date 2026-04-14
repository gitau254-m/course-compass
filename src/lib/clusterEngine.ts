/**
 * KUCCPS Cluster Calculation Engine
 *
 * Formula: C = sqrt(r/48 * t/84) * 48 * CALIBRATION_FACTOR
 *   r = sum of cluster subject grade points actually taken by the student
 *   t = best-7 subject aggregate incl. Math + 1 language (max 84)
 *
 * CALIBRATION_FACTOR = 0.952
 *   Derived from real KUCCPS 2024 data (two students):
 *   · High student (A-, 8 subjects): error < 0.5 pts across clusters
 *   · Mid student (B-, 8 subjects): error < 0.4 pts with correct subject selection
 *
 * CRITICAL SUBJECT SELECTION RULES (matching KUCCPS behaviour):
 *   1. Only use subjects DEFINED in the cluster requirements — no padding.
 *   2. If a MANDATORY named subject is COMPLETELY ABSENT → cluster score = 0.000
 *      e.g. no Physics for C4/C5/C6, no Biology for C13, no Music for C16
 *   3. If a mandatory subject EXISTS but BELOW min_grade → include in r (lowers score),
 *      flag as requirement not met, shown in orange. Score is NOT zeroed.
 *   4. Group slots ("any group X") → pick best available; if nothing, skip.
 *
 * DISCLAIMER: KUCCPS uses KNEC Performance Index (continuous scores, not discrete grade points).
 * These are estimates. Verify on students.kuccps.net.
 */

import { SubjectGrade } from '@/lib/types';

// ─── Constants ────────────────────────────────────────────────────────────────

export const GRADE_POINTS: Record<string, number> = {
  'A': 12, 'A-': 11, 'B+': 10, 'B': 9, 'B-': 8,
  'C+': 7, 'C': 6, 'C-': 5, 'D+': 4, 'D': 3, 'D-': 2, 'E': 1,
};

const R_MAX = 48;
const T_MAX = 84;
const CALIBRATION_FACTOR = 0.952;
const CUTOFF_TOLERANCE = 1.0;

// ─── Clusters where a specific subject must be PRESENT (any grade) ─────────────
// If the student has NONE of these → score = 0.000 (fast-path, before any calculation).
const ABSOLUTE_REQUIRED_SUBJECTS: Record<string, string[]> = {
  '8':  ['agriculture'],
  '11': ['art & design', 'art and design', 'home science', 'drawing & design'],
  '12': ['physical education'],
  '13': ['biology', 'biological science'],
  '15': ['agriculture', 'biology', 'biological science'],
  '16': ['music'],
};

// ─── Subject groups (KNEC classification) ─────────────────────────────────────

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

// ─── UUID → Cluster Number ─────────────────────────────────────────────────────

export function extractClusterNumber(clusterId: string): string {
  if (!clusterId) return clusterId;
  const parts = clusterId.split('-');
  if (parts.length === 5) {
    const num = parseInt(parts[4], 10);
    if (!isNaN(num) && num > 0) return String(num);
  }
  const plain = parseInt(clusterId, 10);
  if (!isNaN(plain) && plain > 0) return String(plain);
  return clusterId;
}

const CLUSTER_LABEL_MAP: Record<string, string> = {
  '1':  'Cluster 1 – Law',
  '2':  'Cluster 2 – Business, Hospitality, Tourism & Related',
  '3':  'Cluster 3 – Communication, Media, Languages, PR, Film, Graphics & Related',
  '4':  'Cluster 4 – Geosciences & Related',
  '5':  'Cluster 5 – Engineering, Engineering Technology, Energy & Related',
  '6':  'Cluster 6 – Architecture, Quantity Survey, Building Construction, Urban Planning & Related',
  '7':  'Cluster 7 – Computer Science, Cyber Security, Information Technology & Related',
  '8':  'Cluster 8 – Agricultural Economics, Agribusiness & Related',
  '9':  'Cluster 9 – General Sciences, Biological Sciences, Physics, Chemistry & Related',
  '10': 'Cluster 10 – Actuarial Science, Mathematics, Statistics & Related',
  '11': 'Cluster 11 – Interior Design, Fashion Design, Textile & Related',
  '12': 'Cluster 12 – Sports Science & Related',
  '13': 'Cluster 13 – Medicine, Nursing, Dentistry, Pharmacy, Health Sciences & Related',
  '14': 'Cluster 14 – History, Archeology, Geography & Related',
  '15': 'Cluster 15 – Agriculture, Animal Health, Food Science & Nutrition, Environmental Sciences, Natural Resources & Related',
  '16': 'Cluster 16 – Music & Related',
  '17': 'Cluster 17 – Education & Related',
  '18': 'Cluster 18 – Religious Studies, Theology, Islamic Studies & Related',
};

export function getClusterLabel(clusterId: string, fallbackName: string): string {
  const num = extractClusterNumber(clusterId);
  return CLUSTER_LABEL_MAP[num] ?? `Cluster ${num} – ${fallbackName}`;
}

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
  clusterNumber: string;
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
      'mathematics alternative b', 'mathematics alt b', 'mathematics alt'], 'mathematics'],
    [['biology', 'biological science', 'biology/biological science'], 'biology'],
    [['history', 'history & government', 'history and government', 'history and gov'], 'history'],
    [['cre', 'christian religious education', 'c.r.e', 'christian re'], 'cre'],
    [['ire', 'islamic religious education', 'i.r.e', 'islamic re'], 'ire'],
    [['hre', 'hindu religious education'], 'hre'],
    [['english', 'eng'], 'english'],
    [['kiswahili', 'kis', 'swahili'], 'kiswahili'],
    [['art & design', 'art and design', 'art and design (school)'], 'art & design'],
    [['business studies', 'bst', 'business'], 'business studies'],
    [['computer studies', 'computer science'], 'computer studies'],
    [['geography', 'geog'], 'geography'],
    [['agriculture', 'agric'], 'agriculture'],
    [['drawing & design', 'drawing and design', 'technical drawing'], 'drawing & design'],
    [['physical education', 'pe', 'phys ed'], 'physical education'],
    [['music'], 'music'],
    [['home science', 'home sci'], 'home science'],
    [['physics', 'phy'], 'physics'],
    [['chemistry', 'chem'], 'chemistry'],
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

function isGroupSlotToken(subject: string): boolean {
  return /any\s+group|second\s+group|third\s+group|best\s+group/i.test(subject);
}

/**
 * Resolves a single cluster requirement slot.
 *
 * Named subject ABSENT  → isAbsent=true  (mandatory named slot → return 0 for whole cluster)
 * Named subject below min → include in r, flag requirement not met (shown in orange)
 * Group slot absent      → isAbsent=false, sg=null  (skip silently, don't zero cluster)
 */
function resolveSlot(
  subject: string,
  minGrade: string | null,
  gradeMap: Map<string, SubjectGrade>,
  usedNames: Set<string>
): { sg: SubjectGrade | null; isAbsent: boolean; meetsMinGrade: boolean; label: string } {
  const minPts = minGrade ? (GRADE_POINTS[minGrade] ?? 0) : 0;

  // ── GROUP SLOT ─────────────────────────────────────────────────────────────
  if (isGroupSlotToken(subject)) {
    const groupIds = parseGroupIds(subject);
    const effectiveGroups = groupIds.length > 0 ? groupIds : ['group2', 'group3', 'group4', 'group5'];
    const sg = bestFromGroups(effectiveGroups, gradeMap, usedNames);
    if (!sg || usedNames.has(norm(sg.subject))) {
      return { sg: null, isAbsent: false, meetsMinGrade: true, label: subject };
    }
    const meets = sg.points >= minPts;
    return {
      sg, isAbsent: false, meetsMinGrade: meets,
      label: meets ? subject : `${sg.subject} (min ${minGrade}, got ${sg.grade})`,
    };
  }

  // ── NAMED SUBJECT (may be "SubA/SubB" alternatives) ───────────────────────
  const options = subject.split('/').map(s => s.trim());
  let bestMeetsMin: SubjectGrade | null = null;
  let bestBelowMin: SubjectGrade | null = null;

  for (const opt of options) {
    const sg = findSubject(opt, gradeMap);
    if (!sg || usedNames.has(norm(sg.subject))) continue;
    if (sg.points >= minPts) {
      if (!bestMeetsMin || sg.points > bestMeetsMin.points) bestMeetsMin = sg;
    } else {
      if (!bestBelowMin || sg.points > bestBelowMin.points) bestBelowMin = sg;
    }
  }

  const displayLabel = options.join('/') + (minGrade ? ` (min ${minGrade})` : '');

  if (bestMeetsMin) {
    return { sg: bestMeetsMin, isAbsent: false, meetsMinGrade: true, label: displayLabel };
  }
  if (bestBelowMin) {
    // Subject taken but below minimum — still contributes to r (KUCCPS behaviour)
    return {
      sg: bestBelowMin, isAbsent: false, meetsMinGrade: false,
      label: `${options.join('/')} (min ${minGrade}, got ${bestBelowMin.grade})`,
    };
  }

  // Subject completely absent
  return { sg: null, isAbsent: true, meetsMinGrade: false, label: displayLabel };
}

// ─── Fast-path absolute check ──────────────────────────────────────────────────

function passesAbsoluteCheck(clusterId: string, gradeMap: Map<string, SubjectGrade>): boolean {
  const clusterNum = extractClusterNumber(clusterId);
  const reqs = ABSOLUTE_REQUIRED_SUBJECTS[clusterNum];
  if (!reqs || reqs.length === 0) return true;
  return reqs.some(reqSubject => !!findSubject(reqSubject, gradeMap));
}

// ─── Aggregate (t): best-7 subjects ───────────────────────────────────────────

export function computeAggregate(grades: SubjectGrade[]): { t: number; subjectsInAggregate: SubjectGrade[] } {
  const scored = grades.filter(g => g.grade && GRADE_POINTS[g.grade]);
  if (!scored.length) return { t: 0, subjectsInAggregate: [] };

  let best7 = [...scored]
    .sort((a, b) => (GRADE_POINTS[b.grade] ?? 0) - (GRADE_POINTS[a.grade] ?? 0))
    .slice(0, 7);

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

  return {
    t: best7.reduce((s, g) => s + (GRADE_POINTS[g.grade] ?? 0), 0),
    subjectsInAggregate: best7,
  };
}

// ─── Per-cluster score ─────────────────────────────────────────────────────────

export function calculateClusterScore(
  userGrades: SubjectGrade[],
  requirements: ClusterRequirement[],
  clusterId: string = ''
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

  // ── STEP 1: Absolute presence check ─────────────────────────────────────────
  // Clusters like Music (C16), Medicine (C13), Agriculture (C8) etc.
  // If student has none of the required subjects → 0 immediately.
  if (clusterId && !passesAbsoluteCheck(clusterId, gradeMap)) {
    const clusterNum = extractClusterNumber(clusterId);
    const missing = ABSOLUTE_REQUIRED_SUBJECTS[clusterNum]?.[0] ?? 'Required subject';
    return { score: 0, rawClusterScore: 0, aggregateScore: t, subjectsUsed: [], meetsRequirements: false, missingSubjects: [missing] };
  }

  const subjectsUsed: SubjectUsed[] = [];
  const missingSubjects: string[] = [];
  const usedNames = new Set<string>();

  const mandatoryReqs = requirements.filter(r => r.category === 'mandatory' || r.category === 'compulsory');
  const optionalReqs  = requirements.filter(r => r.category !== 'mandatory' && r.category !== 'compulsory');

  // ── STEP 2: Mandatory / Compulsory slots ─────────────────────────────────────
  for (const req of mandatoryReqs) {
    const { sg, isAbsent, meetsMinGrade, label } = resolveSlot(
      req.subject, req.min_grade, gradeMap, usedNames
    );

    if (sg) {
      subjectsUsed.push({
        subject: sg.subject,
        grade: sg.grade,
        points: GRADE_POINTS[sg.grade] ?? sg.points,
        weight: req.weight || 1,
      });
      usedNames.add(norm(sg.subject));
      if (!meetsMinGrade) missingSubjects.push(label);

    } else if (isAbsent && !isGroupSlotToken(req.subject)) {
      // ── KEY FIX ──────────────────────────────────────────────────────────────
      // A named mandatory subject (e.g. Physics, History) is completely absent.
      // This means the student cannot qualify for this cluster at all → 0.000
      // Group slots being absent are fine — they are "best available" fillers.
      return {
        score: 0,
        rawClusterScore: 0,
        aggregateScore: t,
        subjectsUsed: [],
        meetsRequirements: false,
        missingSubjects: [label],
      };
    }
    // Group slot absent → silently skip (no zero)
  }

  // ── STEP 3: Optional slots (strictly from cluster definition, no external padding) ─
  for (const req of optionalReqs) {
    if (subjectsUsed.length >= 4) break;
    const { sg, meetsMinGrade, label } = resolveSlot(
      req.subject, req.min_grade, gradeMap, usedNames
    );
    if (sg) {
      subjectsUsed.push({
        subject: sg.subject,
        grade: sg.grade,
        points: GRADE_POINTS[sg.grade] ?? sg.points,
        weight: req.weight || 1,
      });
      usedNames.add(norm(sg.subject));
      if (!meetsMinGrade) missingSubjects.push(label);
    }
  }

  const r = subjectsUsed.reduce((s, g) => s + g.points, 0);
  const meetsRequirements = missingSubjects.length === 0;

  if (r === 0 || t === 0) {
    return { score: 0, rawClusterScore: 0, aggregateScore: t, subjectsUsed: [], meetsRequirements: false, missingSubjects };
  }

  // KUCCPS formula calibrated against real 2024 data
  const C = Math.sqrt((r / R_MAX) * (t / T_MAX)) * 48 * CALIBRATION_FACTOR;

  return {
    score: Math.round(C * 1000) / 1000,
    rawClusterScore: r,
    aggregateScore: t,
    subjectsUsed: subjectsUsed.slice(0, 4),
    meetsRequirements,
    missingSubjects,
  };
}

// ─── Bulk results ──────────────────────────────────────────────────────────────

export function calculateAllClusterResults(
  userGrades: SubjectGrade[],
  clusters: ClusterDefinition[]
): ClusterResult[] {
  return clusters
    .map(cluster => {
      const { score, rawClusterScore, aggregateScore, subjectsUsed, meetsRequirements, missingSubjects } =
        calculateClusterScore(userGrades, cluster.requirements, cluster.id);

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

// ─── Course matching ───────────────────────────────────────────────────────────

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
    .filter(c => {
      if (!c.cluster_id) return false;
      const cr = clusterMap.get(c.cluster_id);
      if (!cr) return false;
      return cr.clusterScore > 0; // only show courses where cluster score > 0
    })
    .map(course => {
      const clusterResult = clusterMap.get(course.cluster_id!)!;
      const cutoff = course.cutoff_2024 ?? 25;
      const scoreDiff = clusterResult.clusterScore - cutoff;
      const eligibilityStatus = determineEligibilityStatus(clusterResult.clusterScore, cutoff);
      const interestScore = Math.max(-100, Math.min(100, interestScores[course.field ?? ''] ?? 0));
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
        clusterNumber: extractClusterNumber(course.cluster_id!),
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
      const statusOrder = { likely_eligible: 0, borderline: 1, not_competitive: 2 };
      if (statusOrder[a.eligibilityStatus] !== statusOrder[b.eligibilityStatus]) {
        return statusOrder[a.eligibilityStatus] - statusOrder[b.eligibilityStatus];
      }
      return Math.abs(a.scoreDifference) - Math.abs(b.scoreDifference);
    });
}

// ─── KUCCPS choice builder ─────────────────────────────────────────────────────

export function buildKuccpsChoices(matches: CourseMatch[]): KuccpsChoice[] {
  const choices: KuccpsChoice[] = [];
  const usedClusters = new Set<string>();
  const usedCourseIds = new Set<string>();

  if (!matches.length) return [];

  const topClusterId = matches[0].clusterId;
  matches.filter(m => m.clusterId === topClusterId).slice(0, 3).forEach((course, i) => {
    choices.push({ position: `1${'abc'[i]}`, rank: 1, subRank: 'abc'[i], course, isTopChoice: true });
    usedCourseIds.add(course.courseId);
  });
  usedClusters.add(topClusterId);

  let slot = 2;
  for (const match of matches) {
    if (slot > 6) break;
    if (usedCourseIds.has(match.courseId) || usedClusters.has(match.clusterId)) continue;
    choices.push({ position: String(slot), rank: slot, subRank: '', course: match, isTopChoice: true });
    usedClusters.add(match.clusterId);
    usedCourseIds.add(match.courseId);
    slot++;
  }

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

// ─── Helpers ───────────────────────────────────────────────────────────────────

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
