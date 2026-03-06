// ============================================================
// FILE: src/pages/ResultsPage.tsx   ← REPLACE
// ============================================================

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface EligibleCourse {
  id: string;
  course_name: string;
  university: string;
  cluster_code: string;
  cluster_score: number;
  course_cutoff: number; a
  status: string;
}

interface ResultsPageProps {
  userId: string;
  interests?: string[];
}

export default function ResultsPage({ userId, interests = [] }: ResultsPageProps) {
  const [courses, setCourses] = useState<EligibleCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "eligible" | "recommended">("all");

  useEffect(() => {
    if (!userId) { setError("Missing user ID. Please restart."); setLoading(false); return; }
    fetchResults();
  }, [userId]);

  const fetchResults = async () => {
    setLoading(true); setError(null);
    try {
      const { data, error: dbErr } = await supabase
        .from("eligibility_results")
        .select("*")
        .eq("user_id", userId)
        .order("cluster_score", { ascending: false });
      if (dbErr) { setError(dbErr.message); return; }
      setCourses(data ?? []);
    } catch (e: any) {
      setError("Network error. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const isRecommended = (c: EligibleCourse) =>
    interests.length > 0 &&
    interests.some((i) =>
      c.course_name.toLowerCase().includes(i.toLowerCase()) ||
      c.cluster_code.toLowerCase().includes(i.toLowerCase())
    );

  const filtered = courses.filter((c) => {
    if (activeFilter === "eligible") return c.status === "eligible";
    if (activeFilter === "recommended") return isRecommended(c);
    return true;
  });

  const eligibleCount = courses.filter((c) => c.status === "eligible").length;
  const recommendedCount = courses.filter((c) => isRecommended(c)).length;

  // ── Loading ─────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-600 font-medium">Loading your results...</p>
      </div>
    </div>
  );

  // ── Error ──────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-lg">
        <p className="text-4xl mb-4">⚠️</p>
        <h2 className="text-xl font-bold mb-2">Could not load results</h2>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <button onClick={fetchResults} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-medium">
          Try Again
        </button>
      </div>
    </div>
  );

  // ── No results ─────────────────────────────────────────────
  if (courses.length === 0) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-lg">
        <p className="text-4xl mb-4">📋</p>
        <h2 className="text-xl font-bold mb-2">No results yet</h2>
        <p className="text-gray-400 text-sm">Cluster calculation may not have completed. Go back and try again.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-indigo-200 text-sm mb-1">Course Compass Results</p>
          <h1 className="text-3xl font-bold mb-4">Your Eligible Courses</h1>
          <div className="flex justify-center gap-8">
            <div>
              <p className="text-3xl font-bold">{eligibleCount}</p>
              <p className="text-indigo-200 text-xs">You qualify for</p>
            </div>
            <div className="border-l border-indigo-400 pl-8">
              <p className="text-3xl font-bold">{courses.length}</p>
              <p className="text-indigo-200 text-xs">Total checked</p>
            </div>
            {recommendedCount > 0 && (
              <div className="border-l border-indigo-400 pl-8">
                <p className="text-3xl font-bold">{recommendedCount}</p>
                <p className="text-indigo-200 text-xs">Match interests</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {(["all", "eligible", "recommended"] as const).map((f) => {
            const label = { all: `All (${courses.length})`, eligible: `Eligible (${eligibleCount})`, recommended: `Recommended (${recommendedCount})` }[f];
            if (f === "recommended" && recommendedCount === 0) return null;
            return (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeFilter === f ? "bg-indigo-600 text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300"}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Course cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">🔍</p>
            <p className="text-sm">No courses match this filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((course) => {
              const eligible = course.status === "eligible";
              const recommended = isRecommended(course);
              const score = Number(course.cluster_score);
              const cutoff = Number(course.course_cutoff);
              const pct = cutoff > 0 ? Math.min(100, (score / cutoff) * 100) : 100;

              return (
                <div key={course.id} className={`bg-white rounded-xl border p-4 shadow-sm ${eligible ? "border-green-200" : "border-gray-200 opacity-80"}`}>
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{course.cluster_code}</span>
                    {eligible && <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ Eligible</span>}
                    {!eligible && <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">⚠️ Below cutoff</span>}
                    {recommended && <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">⭐ Recommended</span>}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-0.5">{course.course_name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{course.university}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Your score: <strong className="text-gray-900">{score.toFixed(1)}</strong></span>
                      <span>Cutoff: <strong className="text-gray-900">{cutoff}</strong></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${eligible ? "bg-green-500" : "bg-orange-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
