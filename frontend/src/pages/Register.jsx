import React, { useState, useEffect, useRef } from "react";

import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { db } from "../firebase";

import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";

import { Link, useNavigate } from "react-router-dom";
// ─────────────────────────────────────────────────────────────────────────────
// STARFIELD — identical to every other DevConnect page
// ─────────────────────────────────────────────────────────────────────────────
function StarField() {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const starsRef  = useRef([]);
  const shootRef  = useRef([]);
  const { scrollYProgress } = useScroll();
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, -80]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight * 2.5;
    };
    resize();
    window.addEventListener("resize", resize);

    // 280 twinkling stars
    starsRef.current = Array.from({ length: 280 }, () => {
      const dur = Math.random() * 3 + 1.5;
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight * 2.5,
        r: (Math.random() * 2.5 + 0.4) / 2,
        alpha: Math.random(),
        dAlpha: (0.005 / dur) * (Math.random() > 0.5 ? 1 : -1),
        scaleT: Math.random() * Math.PI * 2,
        scaleDelta: (2 * Math.PI) / (dur * 60),
        delayFrames: Math.floor(Math.random() * 180),
      };
    });

    // 5 shooting stars — purple-300 tail
    const mkShooter = (s) => ({
      x: 0, y: 0,
      angle: (Math.PI / 180) * (30 + Math.random() * 12),
      speed: 8 + Math.random() * 6,
      len: 80, alpha: 0, phase: "wait",
      waitFrames: Math.floor((4 + Math.random() * 3) * 60),
      waitCounter: Math.floor(s),
    });
    shootRef.current = Array.from({ length: 5 }, (_, i) => mkShooter(i * 80));

    const respawn = (sh) => {
      sh.x = Math.random() * canvas.width * 0.75;
      sh.y = Math.random() * canvas.height * 0.35;
      sh.alpha = 0; sh.phase = "shoot";
      sh.angle = (Math.PI / 180) * (30 + Math.random() * 12);
      sh.speed = 8 + Math.random() * 6;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      starsRef.current.forEach((s) => {
        if (s.delayFrames > 0) { s.delayFrames--; return; }
        s.alpha += s.dAlpha;
        if (s.alpha >= 1)   { s.alpha = 1;   s.dAlpha *= -1; }
        if (s.alpha <= 0.1) { s.alpha = 0.1; s.dAlpha *= -1; }
        s.scaleT += s.scaleDelta;
        const sc = 1 + 0.3 * Math.abs(Math.sin(s.scaleT));
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = "#ffffff";
        if (s.r > 0.7) { ctx.shadowBlur = 3; ctx.shadowColor = "rgba(255,255,255,0.5)"; }
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
        sh.alpha = Math.min(1, sh.alpha + 0.12);
        if (sh.x > canvas.width || sh.y > canvas.height * 0.6) {
          sh.alpha -= 0.07;
          if (sh.alpha <= 0) {
            sh.phase = "wait";
            sh.waitFrames = Math.floor((4 + Math.random() * 3) * 60);
            sh.waitCounter = 0; return;
          }
        }
        const tx = sh.x - Math.cos(sh.angle) * sh.len;
        const ty = sh.y - Math.sin(sh.angle) * sh.len;
        const g = ctx.createLinearGradient(tx, ty, sh.x, sh.y);
        g.addColorStop(0,    "rgba(255,255,255,0)");
        g.addColorStop(0.5,  `rgba(216,180,254,${sh.alpha * 0.6})`);
        g.addColorStop(0.85, `rgba(216,180,254,${sh.alpha})`);
        g.addColorStop(1,    `rgba(216,180,254,${sh.alpha * 0.15})`);
        ctx.save();
        ctx.strokeStyle = g; ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10; ctx.shadowColor = "rgba(192,132,252,0.5)";
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(sh.x, sh.y); ctx.stroke();
        ctx.restore();
      });

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <motion.div style={{ y: yParallax }} className="fixed inset-0 pointer-events-none z-0">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOATING PARTICLES
// ─────────────────────────────────────────────────────────────────────────────
function FloatingParticles() {
  const pts = useRef(
    Array.from({ length: 18 }, (_, i) => ({ x: 2 + i * 5.5, delay: i * 0.55, dur: 5 + (i % 5) }))
  );
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {pts.current.map((p, i) => (
        <motion.div key={i} className="absolute w-0.5 h-0.5 rounded-full bg-purple-400/22"
          style={{ left: `${p.x}%`, bottom: 0 }}
          animate={{ y: [0, -130, -230], opacity: [0, 0.45, 0], scale: [0.5, 1.2, 0.3] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SWEEP LINE
// ─────────────────────────────────────────────────────────────────────────────
function SweepLine() {
  return (
    <motion.div
      className="absolute top-0 left-0 right-0 h-[1.5px] pointer-events-none z-10"
      style={{
        background: "linear-gradient(90deg,transparent 0%,rgba(147,51,234,0.8) 35%,rgba(244,114,182,0.7) 55%,rgba(99,102,241,0.6) 75%,transparent 100%)",
        backgroundSize: "200% 100%",
      }}
      animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION TITLE
// ─────────────────────────────────────────────────────────────────────────────
function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-0.5 h-4 rounded-full bg-gradient-to-b from-purple-500 to-pink-500 flex-shrink-0" />
      <span className="text-white text-xs font-semibold tracking-wide" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {icon} {title}
      </span>
      <div className="flex-1 h-px bg-slate-800/80" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GLASS INPUT
// ─────────────────────────────────────────────────────────────────────────────
function GlassInput({ icon, focusKey, activeFocus, onFocus, onBlur, children }) {
  const isFocused = activeFocus === focusKey;
  return (
    <div
      className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isFocused ? "drop-shadow-[0_0_12px_rgba(147,51,234,0.28)]" : ""}`}
      style={{
        background: isFocused ? "rgba(15,12,41,0.88)" : "rgba(15,12,41,0.65)",
        border: isFocused ? "1px solid rgba(168,85,247,0.48)" : "1px solid rgba(148,163,184,0.10)",
        backdropFilter: "blur(16px)",
      }}
    >
      {icon && <span className="text-slate-600 flex-shrink-0 text-sm">{icon}</span>}
      {React.cloneElement(children, {
        onFocus: () => onFocus(focusKey),
        onBlur,
        className: "bg-transparent border-none outline-none w-full text-slate-200 text-sm placeholder-slate-600",
        style: { fontFamily: "'Space Grotesk', sans-serif" },
      })}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-purple-500 via-pink-400 to-indigo-500 rounded-full origin-left pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT — ALL original logic untouched
// ─────────────────────────────────────────────────────────────────────────────
const Register = () => {
  

  // ── ORIGINAL STATE ─────────────────────────────────────────────────────────
  const [name,       setName]       = useState("");
  const [username,   setUsername]   = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [occupation, setOccupation] = useState("");
  const [github,     setGithub]     = useState("");
  const [linkedin,   setLinkedin]   = useState("");
  const [skills,     setSkills]     = useState([]);
  const [skillInput, setSkillInput] = useState("");

  const navigate = useNavigate();
  const auth = getAuth();
  // ── ORIGINAL AVATAR LOGIC ──────────────────────────────────────────────────
  const getAvatar = (seed) =>
    `https://api.dicebear.com/9.x/toon-head/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9&eyes=wide&eyebrows=neutral,happy&mouth=smile&hair=bun,sideComed,spiky,undercut&rearHair=longStraight,longWavy,shoulderHigh&clothes=shirt,tShirt,openJacket&skinColor=f1c3a5,c68e7a&beardProbability=10`;
  const avatars = [
    getAvatar("ddssssddscr"), getAvatar("annnmmnmnmlccxex"), getAvatar("emma"),
    getAvatar("johccxxxn"),   getAvatar("noah"),               getAvatar("sopchia"),
    getAvatar("mike"),        getAvatar("olivia"),              getAvatar("licnnxxxxxxcccam"),
    getAvatar("ava"),         getAvatar("isabella"),
  ];
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);

  // ── ORIGINAL FIREBASE FUNCTIONS ────────────────────────────────────────────
  const checkUsername = async () => {
    const clean = username.toLowerCase().trim();
    const q = query(collection(db, "users"), where("username", "==", clean));
    const snap = await getDocs(q);
    return snap.empty;
  };

  const addSkill = (e) => {
    if (e.key === "Enter" && skillInput.trim()) {
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput("");
    }
  };

  const removeSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleRegister = async () => {
    try {
      const available = await checkUsername();
      if (!available) { alert("Username already taken!"); return; }
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      await updateProfile(user, {
  displayName: name,
  photoURL: selectedAvatar,
});
      await setDoc(doc(db, "users", user.uid), {
        name, username: username.toLowerCase().trim(), email, avatar: selectedAvatar,
        occupation, skills, github, linkedin,
        bio: "", followers: [], following: [], createdAt: new Date(),
      });
      navigate(`/profile/${user.uid}`);
    } catch (err) {
      console.log(err.message);
    }
  };
  // ── END ORIGINAL LOGIC ─────────────────────────────────────────────────────

  const [activeFocus, setActiveFocus] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [done, setDone]               = useState(false);

  const handleRegisterWithUI = async () => {
    setRegistering(true);
    await handleRegister();
    setDone(true);
    setTimeout(() => { setRegistering(false); setDone(false); }, 1500);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        select option { background: #0f0c29; color: #e2e8f0; }
        .reg-scroll::-webkit-scrollbar { width: 3px; }
        .reg-scroll::-webkit-scrollbar-track { background: transparent; }
        .reg-scroll::-webkit-scrollbar-thumb { background: rgba(147,51,234,0.25); border-radius: 999px; }
      `}</style>

      <div
        className="min-h-screen relative overflow-x-hidden flex items-start justify-center py-10 px-4"
        style={{ background: "linear-gradient(to bottom right, #0f0c29, #302b63, #24243e)" }}
      >
        <StarField />
        <FloatingParticles />

        {/* Ambient glow blobs */}
        <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] animate-pulse pointer-events-none z-0" />
        <div className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[100px] animate-pulse pointer-events-none z-0" style={{ animationDelay: "2s" }} />

        {/* ════════════════════════════════════════
            CENTERED GLASS CARD
        ════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10 w-full max-w-[460px]"
        >
          {/* outer glow aura layers */}
          <div className="absolute -inset-6 bg-gradient-to-br from-purple-600/22 via-pink-600/12 to-indigo-600/20 rounded-[3rem] blur-[36px] pointer-events-none" />
          <div className="absolute -inset-2 bg-gradient-to-br from-purple-600/10 via-transparent to-indigo-600/8 rounded-[2rem] blur-[14px] pointer-events-none" />

          {/* glass card */}
          <div
            className="relative overflow-hidden"
            style={{
              borderRadius: "28px",
              background: "rgba(11,11,26,0.74)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              border: "1px solid rgba(148,163,184,0.10)",
              boxShadow:
                "0 0 0 1px rgba(147,51,234,0.09), 0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <SweepLine />

            {/* inner top shimmer */}
            <div className="absolute top-0 left-0 right-0 h-24 pointer-events-none"
              style={{ background: "linear-gradient(to bottom,rgba(147,51,234,0.07) 0%,transparent 100%)" }} />

            {/* scrollable content */}
            <div className="reg-scroll overflow-y-auto" style={{ maxHeight: "min(82vh,860px)" }}>
              <div className="px-8 pt-8 pb-8 space-y-5">

                {/* ── Header ── */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center mb-2"
                >
                  <h1
                    className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent mb-1.5"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Join DevConnect
                  </h1>
                  <p className="text-slate-500 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Build your developer identity in the galaxy.
                  </p>
                </motion.div>

                {/* ── AVATAR PREVIEW + PICKER ── */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center gap-4"
                >
                  {/* preview */}
                  <div className="relative">
                    <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-purple-600/50 via-pink-500/40 to-indigo-600/50 blur-[14px] opacity-80" />
                    <div className="relative p-[3px] rounded-full bg-gradient-to-br from-purple-500 via-pink-400 to-indigo-500">
                      <motion.img
                        src={selectedAvatar || getAvatar(name || "dev")}
                        alt="avatar preview"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                        className="w-20 h-20 rounded-full bg-slate-900 block object-cover"
                        onError={(e) => { e.target.src = getAvatar("fallback"); }}
                      />
                    </div>
                    <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-900 shadow-[0_0_8px_rgba(74,222,128,0.75)]" />
                  </div>

                  {/* avatar grid */}
                  <div className="w-full">
                    <SectionTitle icon="🎨" title="Choose Avatar" />
                    <div className="grid grid-cols-6 gap-2">
                      {avatars.map((img, i) => {
                        const isSelected = selectedAvatar === img;
                        return (
                          <motion.button
                            key={i}
                            type="button"
                            whileHover={{ scale: 1.12, y: -3 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => setSelectedAvatar(img)}
                            className="relative group"
                          >
                            {isSelected && (
                              <motion.div
                                layoutId="avatar-selected"
                                className="absolute -inset-1 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 blur-[5px] opacity-80"
                              />
                            )}
                            <div
                              className={`relative p-[2px] rounded-full transition-all duration-300 ${
                                isSelected
                                  ? "bg-gradient-to-br from-purple-500 via-pink-400 to-indigo-500"
                                  : "bg-slate-700/50 group-hover:bg-gradient-to-br group-hover:from-purple-500/50 group-hover:to-indigo-500/50"
                              }`}
                            >
                              <img
                                src={img}
                                alt=""
                                onError={(e) => { e.target.src = getAvatar("fallback"); }}
                                className="w-full aspect-square rounded-full bg-slate-900 block object-cover"
                              />
                            </div>
                            {isSelected && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-[8px] text-white border border-[#0f0c29]"
                              >
                                ✓
                              </motion.span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>

                {/* divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />

                {/* ── IDENTITY ── */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="space-y-2.5"
                >
                  <SectionTitle icon="👤" title="Identity" />

                  <GlassInput icon="✦" focusKey="name" activeFocus={activeFocus} onFocus={setActiveFocus} onBlur={() => setActiveFocus(null)}>
                    <input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
                  </GlassInput>

                  <GlassInput icon="@" focusKey="username" activeFocus={activeFocus} onFocus={setActiveFocus} onBlur={() => setActiveFocus(null)}>
                    <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                  </GlassInput>

                  <GlassInput icon="✉" focusKey="email" activeFocus={activeFocus} onFocus={setActiveFocus} onBlur={() => setActiveFocus(null)}>
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </GlassInput>

                  <GlassInput icon="🔒" focusKey="password" activeFocus={activeFocus} onFocus={setActiveFocus} onBlur={() => setActiveFocus(null)}>
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </GlassInput>
                </motion.div>

                {/* ── OCCUPATION ── */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <SectionTitle icon="💼" title="Occupation" />
                  {/* original select — untouched */}
                  <div
                    className="relative flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{
                      background: "rgba(15,12,41,0.65)",
                      border: "1px solid rgba(148,163,184,0.10)",
                      backdropFilter: "blur(16px)",
                    }}
                  >
                    <span className="text-slate-600 text-sm flex-shrink-0">🛠️</span>
                    <select
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-slate-200 text-sm"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      <option value="">Select Occupation</option>
                      <option>Student</option>
                    <option>DevOps Architect</option>  
                     <option>ML Engineer</option>
                      <option>Backend Developer</option>
                      <option>Full Stack Developer</option>
                      <option>Mobile Developer</option>
                      <option>Network Engineer</option>
                      <option>Designer</option>
                    </select>
                  </div>
                </motion.div>

                {/* ── SKILLS ── */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.43 }}
                >
                  <SectionTitle icon="🛠️" title="Skills" />

                  <GlassInput icon="⌨️" focusKey="skill" activeFocus={activeFocus} onFocus={setActiveFocus} onBlur={() => setActiveFocus(null)}>
                    <input
                      placeholder="Type a skill and press Enter…"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={addSkill}
                    />
                  </GlassInput>

                  <AnimatePresence>
                    {skills.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-2 mt-2.5"
                      >
                        {skills.map((skill, i) => (
                          <motion.button
                            key={skill}
                            type="button"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            whileHover={{ scale: 1.06, boxShadow: "0 0 12px rgba(147,51,234,0.4)" }}
                            onClick={() => removeSkill(skill)}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-purple-300 border border-purple-500/25 bg-purple-600/12 hover:bg-red-600/12 hover:text-red-400 hover:border-red-500/25 transition-all duration-200 group"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                          >
                            {skill}
                            <span className="text-purple-500 group-hover:text-red-400 transition-colors text-[10px]">✕</span>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* ── LINKS ── */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.46 }}
                  className="space-y-2.5"
                >
                  <SectionTitle icon="🔗" title="Links (optional)" />

                  <GlassInput
                    icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.79-.26.79-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.01 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.19.7.8.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>}
                    focusKey="github" activeFocus={activeFocus} onFocus={setActiveFocus} onBlur={() => setActiveFocus(null)}
                  >
                    <input placeholder="https://github.com/username" value={github} onChange={(e) => setGithub(e.target.value)} />
                  </GlassInput>

                  <GlassInput
                    icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.94v5.67H9.37V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.59 0 4.26 2.36 4.26 5.44v6.3zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45C23.21 24 24 23.23 24 22.27V1.73C24 .77 23.21 0 22.22 0z"/></svg>}
                    focusKey="linkedin" activeFocus={activeFocus} onFocus={setActiveFocus} onBlur={() => setActiveFocus(null)}
                  >
                    <input placeholder="https://linkedin.com/in/username" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
                  </GlassInput>
                </motion.div>

                {/* ── REGISTER BUTTON ── */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="pt-1"
                >
                  <motion.button
                    type="button"
                    onClick={handleRegisterWithUI}
                    disabled={registering}
                    whileHover={!registering ? { scale: 1.03, boxShadow: "0 0 26px rgba(147,51,234,0.5)" } : {}}
                    whileTap={!registering ? { scale: 0.97 } : {}}
                    className="relative w-full py-3.5 rounded-xl text-sm font-semibold text-white overflow-hidden transition-all duration-300"
                    style={{
                      background: "linear-gradient(135deg,#9333ea 0%,#ec4899 50%,#6366f1 100%)",
                      boxShadow: "0 4px 20px rgba(147,51,234,0.3), inset 0 1px 0 rgba(255,255,255,0.12)",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    {/* shine sweep */}
                    {!registering && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/14 to-transparent -skew-x-12 pointer-events-none"
                        animate={{ x: ["-150%", "200%"] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                      />
                    )}
                    <AnimatePresence mode="wait">
                      {done ? (
                        <motion.span key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-1.5">
                          <span className="text-green-300">✓</span> Account Created!
                        </motion.span>
                      ) : registering ? (
                        <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2">
                          <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                            className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" />
                          Creating account…
                        </motion.span>
                      ) : (
                        <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-1.5">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z"/></svg>
                          Create Account
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  <p className="text-sm text-center pt-4 text-slate-500" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Already have an account?{" "}
                    <Link to="/login" className="text-purple-400 font-semibold hover:text-purple-300 transition-colors">
                      Sign in
                    </Link>
                  </p>
                </motion.div>

              </div>
            </div>

            {/* bottom inner glow */}
            <div className="absolute bottom-0 left-0 right-0 h-14 pointer-events-none"
              style={{ background: "linear-gradient(to top,rgba(147,51,234,0.05) 0%,transparent 100%)" }} />
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Register;