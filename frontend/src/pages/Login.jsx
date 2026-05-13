import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";

// ─── STARFIELD ────────────────────────────────────────────────────────────────
function StarField() {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const starsRef  = useRef([]);
  const shootRef  = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    starsRef.current = Array.from({ length: 300 }, () => {
      const dur = Math.random() * 3 + 1.5;
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: (Math.random() * 2.5 + 0.4) / 2,
        alpha: Math.random(),
        dAlpha: (0.005 / dur) * (Math.random() > 0.5 ? 1 : -1),
        scaleT: Math.random() * Math.PI * 2,
        scaleDelta: (2 * Math.PI) / (dur * 60),
        delayFrames: Math.floor(Math.random() * 180),
        color: Math.random() > 0.88 ? "#c084fc" : Math.random() > 0.75 ? "#818cf8" : "#ffffff",
      };
    });

    const mkShooter = (s) => ({
      x: 0, y: 0,
      angle: (Math.PI / 180) * (28 + Math.random() * 16),
      speed: 7 + Math.random() * 7,
      len: 90, alpha: 0, phase: "wait",
      waitFrames: Math.floor((3 + Math.random() * 4) * 60),
      waitCounter: Math.floor(s),
    });
    shootRef.current = Array.from({ length: 6 }, (_, i) => mkShooter(i * 65));

    const respawn = (sh) => {
      sh.x = Math.random() * canvas.width * 0.8;
      sh.y = Math.random() * canvas.height * 0.45;
      sh.alpha = 0; sh.phase = "shoot";
      sh.angle = (Math.PI / 180) * (28 + Math.random() * 16);
      sh.speed = 7 + Math.random() * 7;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      starsRef.current.forEach((s) => {
        if (s.delayFrames > 0) { s.delayFrames--; return; }
        s.alpha += s.dAlpha;
        if (s.alpha >= 1)   { s.alpha = 1;   s.dAlpha *= -1; }
        if (s.alpha <= 0.08) { s.alpha = 0.08; s.dAlpha *= -1; }
        s.scaleT += s.scaleDelta;
        const sc = 1 + 0.3 * Math.abs(Math.sin(s.scaleT));
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        if (s.r > 0.7) { ctx.shadowBlur = 4; ctx.shadowColor = s.color + "90"; }
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * sc, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      shootRef.current.forEach((sh) => {
        if (sh.phase === "wait") {
          if (++sh.waitCounter >= sh.waitFrames) { sh.waitCounter = 0; respawn(sh); }
          return;
        }
        sh.x += Math.cos(sh.angle) * sh.speed;
        sh.y += Math.sin(sh.angle) * sh.speed;
        sh.alpha = Math.min(1, sh.alpha + 0.1);
        if (sh.x > canvas.width || sh.y > canvas.height * 0.75) {
          sh.alpha -= 0.07;
          if (sh.alpha <= 0) { sh.phase = "wait"; sh.waitFrames = Math.floor((3 + Math.random() * 4) * 60); sh.waitCounter = 0; return; }
        }
        const tx = sh.x - Math.cos(sh.angle) * sh.len;
        const ty = sh.y - Math.sin(sh.angle) * sh.len;
        const g = ctx.createLinearGradient(tx, ty, sh.x, sh.y);
        g.addColorStop(0,    "rgba(255,255,255,0)");
        g.addColorStop(0.45, `rgba(216,180,254,${sh.alpha * 0.55})`);
        g.addColorStop(0.82, `rgba(216,180,254,${sh.alpha})`);
        g.addColorStop(1,    `rgba(216,180,254,${sh.alpha * 0.12})`);
        ctx.save();
        ctx.strokeStyle = g; ctx.lineWidth = 1.5;
        ctx.shadowBlur = 12; ctx.shadowColor = "rgba(192,132,252,0.55)";
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(sh.x, sh.y); ctx.stroke();
        ctx.restore();
      });

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
}

// ─── FLOATING PARTICLES ───────────────────────────────────────────────────────
function FloatingParticles() {
  const pts = useRef(Array.from({ length: 20 }, (_, i) => ({ x: 2 + i * 5, delay: i * 0.5, dur: 4 + (i % 5) })));
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {pts.current.map((p, i) => (
        <motion.div key={i} className="absolute w-0.5 h-0.5 rounded-full bg-purple-400/25"
          style={{ left: `${p.x}%`, bottom: 0 }}
          animate={{ y: [0, -150, -260], opacity: [0, 0.5, 0], scale: [0.4, 1.3, 0.2] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

// ─── ORB DECORATION — floating glowing orbs around card ──────────────────────
function FloatingOrbs() {
  return (
    <>
      {/* top-left orb */}
      <motion.div
        className="absolute -top-8 -left-8 w-20 h-20 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)", filter: "blur(12px)" }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* top-right orb */}
      <motion.div
        className="absolute -top-6 -right-8 w-16 h-16 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(244,114,182,0.3) 0%, transparent 70%)", filter: "blur(10px)" }}
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      {/* bottom orb */}
      <motion.div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-24 h-10 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)", filter: "blur(14px)" }}
        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
    </>
  );
}

// ─── SWEEP LINE ───────────────────────────────────────────────────────────────
function SweepLine() {
  return (
    <motion.div
      className="absolute top-0 left-0 right-0 h-[1.5px] pointer-events-none z-10"
      style={{
        background: "linear-gradient(90deg,transparent 0%,rgba(147,51,234,0.85) 35%,rgba(244,114,182,0.75) 55%,rgba(99,102,241,0.65) 75%,transparent 100%)",
        backgroundSize: "200% 100%",
      }}
      animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
    />
  );
}

// ─── DEVCONNECT LOGO MARK ─────────────────────────────────────────────────────
function LogoMark() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col items-center gap-3 mb-7"
    >
      {/* icon */}
      <motion.div
        animate={{ boxShadow: ["0 0 20px rgba(147,51,234,0.4)", "0 0 40px rgba(147,51,234,0.65)", "0 0 20px rgba(147,51,234,0.4)"] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-indigo-600 flex items-center justify-center"
        style={{ boxShadow: "0 0 28px rgba(147,51,234,0.5), inset 0 1px 0 rgba(255,255,255,0.15)" }}
      >
        <svg width="26" height="26" viewBox="0 0 16 16" fill="none">
          <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.4" fill="rgba(255,255,255,0.1)"/>
          <circle cx="8" cy="8" r="2.2" fill="white"/>
        </svg>
      </motion.div>

      {/* wordmark */}
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <span className="text-white">Dev</span>
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">Connect</span>
        </h1>
        <p className="text-slate-500 text-xs mt-0.5 tracking-wide" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Connect with developers across the galaxy.
        </p>
      </div>
    </motion.div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const Login = () => {
  // ── ALL ORIGINAL STATE & LOGIC — UNCHANGED ──────────────────────────────────
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const auth     = getAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/feed");
    } catch (error) {
      alert("Invalid email or password");
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user   = result.user;
      const userRef  = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName, email: user.email,
          username: user.email.split("@")[0], avatar: user.photoURL,
          bio: "", skills: [], github: "", linkedin: "",
          followers: [], following: [], postCount: 0,
        });
      }
      navigate("/feed");
    } catch (error) {
      console.error(error);
      alert("Google sign-in failed");
    }
  };
  // ── END ORIGINAL LOGIC ───────────────────────────────────────────────────────

  const [inputFocus, setInputFocus] = useState(null);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .li-input { outline: none; background: transparent; border: none; width: 100%; color: #e2e8f0; font-size: 14px; font-family: 'Space Grotesk', sans-serif; }
        .li-input::placeholder { color: rgb(71,85,105); }
      `}</style>

      <div
        className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10"
        style={{ background: "linear-gradient(135deg, #0f0c29 0%, #1a0a3a 30%, #302b63 60%, #24243e 100%)" }}
      >
        <StarField />
        <FloatingParticles />

        {/* Ambient glow blobs */}
        <div className="fixed top-1/4 left-1/4 w-[520px] h-[520px] bg-purple-600/14 rounded-full blur-[130px] animate-pulse pointer-events-none z-0" />
        <div className="fixed bottom-1/4 right-1/4 w-[420px] h-[420px] bg-pink-600/9 rounded-full blur-[110px] animate-pulse pointer-events-none z-0" style={{ animationDelay: "2s" }} />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-600/6 rounded-full blur-[90px] animate-pulse pointer-events-none z-0" style={{ animationDelay: "1s" }} />

        {/* ── Main card assembly ── */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10 w-full max-w-[400px]"
        >
          {/* multi-layer glow aura */}
          <motion.div
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -inset-8 rounded-[3rem] pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(147,51,234,0.22) 0%, rgba(244,114,182,0.1) 45%, transparent 70%)", filter: "blur(20px)" }}
          />
          <div className="absolute -inset-3 bg-gradient-to-br from-purple-600/15 via-pink-600/8 to-indigo-600/12 rounded-[2.5rem] blur-[18px] pointer-events-none" />

          {/* glass card */}
          <div
            className="relative overflow-hidden"
            style={{
              borderRadius: "26px",
              background: "rgba(9, 7, 22, 0.78)",
              backdropFilter: "blur(36px)",
              WebkitBackdropFilter: "blur(36px)",
              border: "1px solid rgba(148,163,184,0.08)",
              boxShadow: "0 0 0 1px rgba(147,51,234,0.1), 0 40px 90px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
          >
            <SweepLine />
            <FloatingOrbs />

            {/* inner shimmer */}
            <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
              style={{ background: "linear-gradient(to bottom, rgba(147,51,234,0.08) 0%, transparent 100%)" }} />

            <div className="relative px-8 pt-9 pb-8">

              {/* Logo + title */}
              <LogoMark />

              {/* Section label */}
              <div className="flex items-center gap-2 mb-5">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
                <span className="text-slate-600 text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Sign in
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
              </div>

              {/* Form — all handlers untouched */}
              <form onSubmit={handleSubmit} className="space-y-3">

                {/* Email */}
                <motion.div
                  animate={inputFocus === "email" ? { scale: 1.01 } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300"
                  style={{
                    background: inputFocus === "email" ? "rgba(15,12,41,0.9)" : "rgba(15,12,41,0.6)",
                    border: inputFocus === "email" ? "1px solid rgba(168,85,247,0.5)" : "1px solid rgba(148,163,184,0.09)",
                    backdropFilter: "blur(16px)",
                    boxShadow: inputFocus === "email" ? "0 0 20px rgba(147,51,234,0.18), inset 0 1px 0 rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <svg className="flex-shrink-0 text-slate-600 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input className="li-input" type="email" placeholder="Email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setInputFocus("email")} onBlur={() => setInputFocus(null)} />
                  <AnimatePresence>
                    {inputFocus === "email" && (
                      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ scaleX: 0 }} transition={{ duration: 0.25 }}
                        className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-purple-500 via-pink-400 to-indigo-500 rounded-full origin-left pointer-events-none" />
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Password */}
                <motion.div
                  animate={inputFocus === "password" ? { scale: 1.01 } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300"
                  style={{
                    background: inputFocus === "password" ? "rgba(15,12,41,0.9)" : "rgba(15,12,41,0.6)",
                    border: inputFocus === "password" ? "1px solid rgba(168,85,247,0.5)" : "1px solid rgba(148,163,184,0.09)",
                    backdropFilter: "blur(16px)",
                    boxShadow: inputFocus === "password" ? "0 0 20px rgba(147,51,234,0.18), inset 0 1px 0 rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <svg className="flex-shrink-0 text-slate-600 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input className="li-input" type="password" placeholder="Password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setInputFocus("password")} onBlur={() => setInputFocus(null)} />
                  <AnimatePresence>
                    {inputFocus === "password" && (
                      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ scaleX: 0 }} transition={{ duration: 0.25 }}
                        className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-purple-500 via-pink-400 to-indigo-500 rounded-full origin-left pointer-events-none" />
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Login button */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(147,51,234,0.55)" }}
                  whileTap={{ scale: 0.97 }}
                  className="relative w-full py-3.5 rounded-xl text-sm font-bold text-white overflow-hidden mt-1"
                  style={{
                    background: "linear-gradient(135deg, #9333ea 0%, #ec4899 50%, #6366f1 100%)",
                    boxShadow: "0 4px 22px rgba(147,51,234,0.35), inset 0 1px 0 rgba(255,255,255,0.14)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {/* shine sweep */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/16 to-transparent -skew-x-12 pointer-events-none"
                    animate={{ x: ["-150%", "200%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
                  />
                  <span className="relative flex items-center justify-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13 12H3"/>
                    </svg>
                    Sign In
                  </span>
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-0.5">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-800/80 to-transparent" />
                  <span className="text-slate-600 text-[11px]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>or continue with</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-800/80 to-transparent" />
                </div>

                {/* Google button */}
                <motion.button
                  type="button"
                  onClick={handleGoogleLogin}
                  whileHover={{ scale: 1.02, borderColor: "rgba(168,85,247,0.38)", boxShadow: "0 0 16px rgba(147,51,234,0.12)" }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition-all duration-300"
                  style={{
                    background: "rgba(12, 10, 28, 0.65)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(148,163,184,0.10)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="google" className="w-4 h-4" />
                  Continue with Google
                </motion.button>

                {/* Register link */}
                <p className="text-sm text-center pt-2 text-slate-500" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Don't have an account?{" "}
                  <Link to="/register" className="text-purple-400 font-semibold hover:text-purple-300 transition-colors">
                    Create one →
                  </Link>
                </p>
              </form>
            </div>

            {/* bottom glow */}
            <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
              style={{ background: "linear-gradient(to top, rgba(147,51,234,0.06) 0%, transparent 100%)" }} />
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Login;