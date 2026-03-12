import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect, useRef, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LandingPage from "./components/LandingPage";

const queryClient = new QueryClient();

// ── Global PWA Install Context ────────────────────────────────────────────
// Captures beforeinstallprompt at the App level so it works from ANY page,
// including the landing page which loads before /app
interface InstallCtx {
  canInstall: boolean;
  triggerInstall: () => void;
}
export const InstallContext = createContext<InstallCtx>({ canInstall: false, triggerInstall: () => { } });
export const useInstall = () => useContext(InstallContext);

// ── WhatsApp Floating Button with Popup ───────────────────────────────────
function WhatsAppButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Dark overlay when popup is open */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 9990,
              background: "rgba(0,0,0,0.25)"
            }}
          />
        )}
      </AnimatePresence>

      {/* Popup card */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="popup"
            initial={{ opacity: 0, scale: 0.85, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 12 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            style={{
              position: "fixed",
              bottom: "90px",
              right: "20px",
              zIndex: 9995,
              width: "270px",
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{ background: "#25D366", padding: "14px 16px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, fill: "white" }}>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div>
                  <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Course Compass Support</div>
                  <div style={{ color: "rgba(255,255,255,0.82)", fontSize: 12 }}>Choose how to reach us</div>
                </div>
              </div>
            </div>

            {/* Options */}
            <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>

              {/* Option 1 — Join Group */}
              <a
                href="https://chat.whatsapp.com/Bakeu05hUXn5QKV77kSL69?mode=hqctcla"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
                onClick={() => setOpen(false)}
              >
                <div style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: "#f0fdf4", border: "1.5px solid #bbf7d0",
                  borderRadius: 12, padding: "12px 14px",
                  cursor: "pointer", transition: "background 0.15s"
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#dcfce7")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#f0fdf4")}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    {/* Group icon */}
                    <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "white" }}>
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#15803d" }}>Join Community Group</div>
                    <div style={{ fontSize: 11, color: "#4b5563", marginTop: 2, lineHeight: 1.4 }}>
                      KUCCPS & HELB guidance, mentorship and tips
                    </div>
                  </div>
                </div>
              </a>

              {/* Option 2 — Direct Chat */}
              <a
                href="https://wa.me/254103837257?text=Hi%2C%20I%20have%20a%20question%20about%20the%20KCSE%20Course%20Checker%20app"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
                onClick={() => setOpen(false)}
              >
                <div style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: "#f0fdf4", border: "1.5px solid #bbf7d0",
                  borderRadius: 12, padding: "12px 14px",
                  cursor: "pointer", transition: "background 0.15s"
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#dcfce7")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#f0fdf4")}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "white" }}>
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#15803d" }}>Chat with Us Directly</div>
                    <div style={{ fontSize: 11, color: "#4b5563", marginTop: 2, lineHeight: 1.4 }}>
                      Personal assistance — we'll reply as soon as possible
                    </div>
                  </div>
                </div>
              </a>

              <p style={{ fontSize: 10, color: "#9ca3af", textAlign: "center", marginTop: 2 }}>
                Tap outside to close
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The floating button itself */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={open ? { rotate: 45 } : { rotate: 0 }}
        style={{
          position: "fixed", bottom: "24px", right: "20px",
          zIndex: 9999, width: 56, height: 56,
          background: open ? "#ef4444" : "#25D366",
          borderRadius: "50%", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          transition: "background 0.2s"
        }}
        title={open ? "Close" : "Chat with us on WhatsApp"}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.svg
              key="close"
              initial={{ opacity: 0, rotate: -45 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0 }}
              viewBox="0 0 24 24"
              style={{ width: 26, height: 26, fill: "white" }}
            >
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </motion.svg>
          ) : (
            <motion.svg
              key="wa"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              viewBox="0 0 24 24"
              style={{ width: 28, height: 28, fill: "white" }}
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────
const App = () => {
  // Capture the install prompt as early as possible — at the root App level
  // so it works whether the user lands on / or /app
  const installPromptRef = useRef<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  useEffect(() => {
    if (isStandalone) return; // already installed — don't show anything
    const handler = (e: Event) => {
      e.preventDefault();
      installPromptRef.current = e;
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler as EventListener);
    // Also listen for successful install — hide button after install
    window.addEventListener('appinstalled', () => setCanInstall(false));
    return () => {
      window.removeEventListener('beforeinstallprompt', handler as EventListener);
    };
  }, []);

  const triggerInstall = async () => {
    if (!installPromptRef.current) return;
    installPromptRef.current.prompt();
    const { outcome } = await installPromptRef.current.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
      installPromptRef.current = null;
    }
  };

  return (
    <InstallContext.Provider value={{ canInstall, triggerInstall }}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Landing page — shown at the root URL */}
              <Route path="/" element={<LandingPage />} />
              {/* The actual app — checker flow */}
              <Route path="/app" element={<Index />} />
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>

            {/* WhatsApp popup button — shown on every page */}
            <WhatsAppButton />

            {/* ── Native install banner (Chrome/Edge/Samsung Browser) ── */}
            {/* Shows at the bottom when browser fires beforeinstallprompt */}
            <AnimatePresence>
              {canInstall && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  style={{
                    position: "fixed", bottom: 0, left: 0, right: 0,
                    zIndex: 9980, background: "#fff",
                    borderTop: "1px solid #e5e7eb",
                    boxShadow: "0 -4px 24px rgba(0,0,0,0.10)",
                    padding: "14px 20px",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: "#059669", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                    }}>
                      {/* Graduation cap icon */}
                      <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, fill: "white" }}>
                        <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>Install Course Compass</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 1 }}>Add to your home screen for quick access</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => setCanInstall(false)}
                      style={{
                        background: "none", border: "1px solid #d1d5db",
                        borderRadius: 8, padding: "7px 14px",
                        fontSize: 13, color: "#6b7280", cursor: "pointer", fontWeight: 500
                      }}
                    >
                      Not now
                    </button>
                    <button
                      onClick={triggerInstall}
                      style={{
                        background: "#059669", border: "none",
                        borderRadius: 8, padding: "7px 16px",
                        fontSize: 13, color: "white", cursor: "pointer", fontWeight: 700
                      }}
                    >
                      Install
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </InstallContext.Provider>
  );
};

export default App;
