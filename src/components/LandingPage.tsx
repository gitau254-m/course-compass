import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  BookOpen, CheckCircle, Zap, Shield, ArrowRight,
  GraduationCap, Star, ChevronRight, Users, Award, RefreshCw, LogIn
} from "lucide-react";

function FadeUp({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  const stats = [
    { number: "393", label: "Courses Listed", icon: <BookOpen className="w-5 h-5" /> },
    { number: "291", label: "Degree Programmes", icon: <GraduationCap className="w-5 h-5" /> },
    { number: "102", label: "Diploma Courses", icon: <Award className="w-5 h-5" /> },
    { number: "2024", label: "KUCCPS Data", icon: <CheckCircle className="w-5 h-5" /> },
  ];

  const features = [
    {
      icon: <Zap className="w-6 h-6 text-emerald-600" />,
      title: "Instant Results",
      desc: "Enter your KCSE grades and see every course you qualify for in seconds — no waiting, no guessing.",
      bg: "bg-emerald-50",
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-blue-600" />,
      title: "Cluster Calculator",
      desc: "Automatic cluster weight calculation using the official KUCCPS formula — accurate and verified.",
      bg: "bg-blue-50",
    },
    {
      icon: <BookOpen className="w-6 h-6 text-purple-600" />,
      title: "Degrees & Diplomas",
      desc: "Check both university degrees and TVET diploma courses in one place. No separate searches needed.",
      bg: "bg-purple-50",
    },
    {
      icon: <Shield className="w-6 h-6 text-orange-600" />,
      title: "Official Cutoff Points",
      desc: "All cutoff data sourced directly from KUCCPS 2024 — updated, verified and reliable.",
      bg: "bg-orange-50",
    },
  ];

  const steps = [
    { n: "1", title: "Enter your grades", desc: "Type in your KCSE subject grades — takes less than a minute" },
    { n: "2", title: "We calculate", desc: "Your cluster weights are computed using the official KUCCPS formula automatically" },
    { n: "3", title: "See your courses", desc: "Get a full ranked list of degrees and diplomas you qualify for with exact cutoff points" },
  ];

  const reviews = [
    { name: "Brian M.", rating: 5, text: "This saved me so much time. I knew exactly which courses to apply for without confusion." },
    { name: "Aisha K.", rating: 5, text: "Very accurate. The cluster calculation matched exactly what KUCCPS showed me." },
    { name: "James O.", rating: 5, text: "Simple to use and the results were spot on. Highly recommend to all KCSE candidates." },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm"
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">Course Compass</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Returning user shortcut in navbar */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/app")}
              className="flex items-center gap-1.5 text-emerald-700 border border-emerald-200 bg-emerald-50 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors hidden sm:flex"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/app")}
              className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Check My Courses
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-emerald-50 via-white to-teal-50 pt-20 pb-24 px-5 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-100 rounded-full blur-3xl opacity-40 translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-6"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Official 2024 KUCCPS Data
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-5"
          >
            Find Every Course{" "}
            <span className="relative inline-block">
              <span className="text-emerald-600">You Qualify For</span>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="absolute -bottom-1 left-0 right-0 h-1 bg-emerald-300 rounded-full origin-left"
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-500 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed"
          >
            Enter your KCSE grades and instantly see all degree and diploma
            programmes you are eligible for — with official 2024 cutoff points.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 20px 40px rgba(16,185,129,0.3)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/app")}
              className="inline-flex items-center gap-3 bg-emerald-600 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-emerald-700 transition-all shadow-lg w-full sm:w-auto justify-center"
            >
              <GraduationCap className="w-5 h-5" />
              Check My Courses
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            {/* Returning user button in hero */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/app")}
              className="inline-flex items-center gap-2 text-emerald-700 border-2 border-emerald-200 bg-white px-6 py-4 rounded-2xl text-base font-semibold hover:bg-emerald-50 transition-all w-full sm:w-auto justify-center"
            >
              <RefreshCw className="w-4 h-4" />
              Retrieve My Results
            </motion.button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-gray-400 mt-4 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            Results in under 1 minute · Securely saved to your account
          </motion.p>
        </div>
      </section>

      {/* ── RETURNING USERS BANNER ──────────────────────────── */}
      <FadeUp>
        <section className="bg-blue-50 border-y border-blue-100 py-6 px-5">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">Already checked your courses before?</p>
                <p className="text-gray-500 text-sm mt-0.5">
                  Sign in with the same Google account or email you used — your results are saved and ready to view instantly.
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/app")}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm flex-shrink-0 w-full sm:w-auto justify-center"
            >
              <LogIn className="w-4 h-4" />
              Sign In & Retrieve Results
            </motion.button>
          </div>
        </section>
      </FadeUp>

      {/* ── STATS BAR ───────────────────────────────────────── */}
      <section className="bg-emerald-600 py-10">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 px-6">
          {stats.map((s, i) => (
            <FadeUp key={i} delay={i * 0.07}>
              <div className="text-center">
                <div className="flex justify-center mb-2 text-emerald-200">{s.icon}</div>
                <div className="text-3xl font-extrabold text-white">{s.number}</div>
                <div className="text-emerald-100 text-sm mt-1">{s.label}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section className="py-24 px-5 max-w-5xl mx-auto">
        <FadeUp className="text-center mb-14">
          <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">Why use Course Compass</span>
          <h2 className="text-3xl font-extrabold text-gray-900 mt-2">
            Everything you need to choose the right course
          </h2>
        </FadeUp>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <FadeUp key={i} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(0,0,0,0.08)" }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm cursor-default"
              >
                <div className={`w-12 h-12 ${f.bg} rounded-2xl flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section className="bg-gray-50 py-24 px-5">
        <div className="max-w-3xl mx-auto">
          <FadeUp className="text-center mb-14">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">Simple process</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">How it works</h2>
          </FadeUp>
          <div className="relative">
            <div className="hidden md:block absolute top-7 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-0.5 bg-emerald-200 z-0" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
              {steps.map((s, i) => (
                <FadeUp key={i} delay={i * 0.12}>
                  <div className="flex flex-col items-center text-center">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-2xl font-extrabold mb-5 shadow-lg"
                    >
                      {s.n}
                    </motion.div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{s.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
          <FadeUp className="text-center mt-14" delay={0.2}>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 20px 40px rgba(16,185,129,0.3)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/app")}
              className="inline-flex items-center gap-3 bg-emerald-600 text-white px-9 py-4 rounded-2xl text-lg font-bold hover:bg-emerald-700 transition-all shadow-lg"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </FadeUp>
        </div>
      </section>

      {/* ── REVIEWS ─────────────────────────────────────────── */}
      <section className="py-24 px-5 max-w-5xl mx-auto">
        <FadeUp className="text-center mb-14">
          <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">Student reviews</span>
          <h2 className="text-3xl font-extrabold text-gray-900 mt-2">What students are saying</h2>
        </FadeUp>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(r.rating)].map((_, si) => (
                    <Star key={si} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-5">"{r.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-700 font-bold text-sm">{r.name[0]}</span>
                  </div>
                  <p className="font-semibold text-gray-900">{r.name}</p>
                </div>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────── */}
      <section className="relative bg-emerald-600 py-24 px-5 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500 rounded-full blur-3xl opacity-40 -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500 rounded-full blur-3xl opacity-30 translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <FadeUp>
            <div className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              <Users className="w-4 h-4" />
              Join thousands of Kenyan students
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Ready to find your course?
            </h2>
            <p className="text-emerald-100 text-lg mb-10">
              Results in under 1 minute. Saved securely to your account.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/app")}
                className="inline-flex items-center gap-3 bg-white text-emerald-700 px-9 py-4 rounded-2xl text-lg font-extrabold hover:bg-emerald-50 shadow-xl transition-all w-full sm:w-auto justify-center"
              >
                <GraduationCap className="w-5 h-5" />
                Check My Courses
                <ChevronRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/app")}
                className="inline-flex items-center gap-2 bg-white/20 text-white border border-white/30 px-7 py-4 rounded-2xl text-base font-semibold hover:bg-white/30 transition-all w-full sm:w-auto justify-center"
              >
                <LogIn className="w-4 h-4" />
                Sign In & Retrieve Results
              </motion.button>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="bg-gray-900 py-10 px-5">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">Course Compass</span>
            <span className="text-gray-500 text-sm">· Built for Kenyan students</span>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <a
              href="https://wa.me/254103837257"
              target="_blank" rel="noopener noreferrer"
              className="text-gray-400 hover:text-emerald-400 transition-colors"
            >
              WhatsApp Support
            </a>
            <a
              href="https://chat.whatsapp.com/Bakeu05hUXn5QKV77kSL69?mode=hqctcla"
              target="_blank" rel="noopener noreferrer"
              className="text-gray-400 hover:text-emerald-400 transition-colors"
            >
              Join Community
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
