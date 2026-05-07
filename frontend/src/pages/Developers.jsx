import { useEffect, useState, useContext, useRef } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// STARFIELD — identical to ProfileHeader / Feed
// 260 twinkling stars + 5 purple-300 shooting stars + scroll parallax
// ─────────────────────────────────────────────────────────────────────────────
function StarField() {
  const canvasRef  = useRef(null);
  const animRef    = useRef(null);
  const starsRef   = useRef([]);
  const shootRef   = useRef([]);
  const { scrollYProgress } = useScroll();
  const yParallax  = useTransform(scrollYProgress, [0, 1], [0, -100]);

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

    // ── 260 twinkling white stars ──
    starsRef.current = Array.from({ length: 260 }, () => {
      const dur = Math.random() * 3 + 1.5;          // 1.5 – 4.5 s
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight * 2.5,
        r: (Math.random() * 2.5 + 0.5) / 2,
        alpha: Math.random(),
        dAlpha: (0.005 / dur) * (Math.random() > 0.5 ? 1 : -1),
        scaleT: Math.random() * Math.PI * 2,
        scaleDelta: (2 * Math.PI) / (dur * 60),
        delayFrames: Math.floor(Math.random() * 180),
      };
    });

    // ── 5 shooting stars (purple-300 #d8b4fe tail) ──
    const mkShooter = (stagger) => ({
      x: 0, y: 0,
      angle: (Math.PI / 180) * (30 + Math.random() * 12),
      speed: 8 + Math.random() * 6,
      len: 80,
      alpha: 0,
      phase: "wait",
      waitFrames: Math.floor((4 + Math.random() * 3) * 60),
      waitCounter: Math.floor(stagger),
    });
    shootRef.current = Array.from({ length: 5 }, (_, i) => mkShooter(i * 80));

    const respawn = (sh) => {
      sh.x     = Math.random() * canvas.width * 0.7;
      sh.y     = Math.random() * canvas.height * 0.35;
      sh.alpha = 0;
      sh.phase = "shoot";
      sh.angle = (Math.PI / 180) * (30 + Math.random() * 12);
      sh.speed = 8 + Math.random() * 6;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // stars
      starsRef.current.forEach((s) => {
        if (s.delayFrames > 0) { s.delayFrames--; return; }
        s.alpha += s.dAlpha;
        if (s.alpha >= 1)   { s.alpha = 1;   s.dAlpha *= -1; }
        if (s.alpha <= 0.1) { s.alpha = 0.1; s.dAlpha *= -1; }
        s.scaleT += s.scaleDelta;
        const sc = 1 + 0.3 * Math.abs(Math.sin(s.scaleT));
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle   = "#ffffff";
        if (s.r > 0.7) { ctx.shadowBlur = 3; ctx.shadowColor = "rgba(255,255,255,0.5)"; }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * sc, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // shooting stars
      shootRef.current.forEach((sh) => {
        if (sh.phase === "wait") {
          if (++sh.waitCounter >= sh.waitFrames) { sh.waitCounter = 0; respawn(sh); }
          return;
        }
        sh.x    += Math.cos(sh.angle) * sh.speed;
        sh.y    += Math.sin(sh.angle) * sh.speed;
        sh.alpha = Math.min(1, sh.alpha + 0.12);
        if (sh.x > canvas.width || sh.y > canvas.height * 0.6) {
          sh.alpha -= 0.07;
          if (sh.alpha <= 0) {
            sh.phase       = "wait";
            sh.waitFrames  = Math.floor((4 + Math.random() * 3) * 60);
            sh.waitCounter = 0;
            return;
          }
        }
        const tx = sh.x - Math.cos(sh.angle) * sh.len;
        const ty = sh.y - Math.sin(sh.angle) * sh.len;
        const g  = ctx.createLinearGradient(tx, ty, sh.x, sh.y);
        g.addColorStop(0,    "rgba(255,255,255,0)");
        g.addColorStop(0.5,  `rgba(216,180,254,${sh.alpha * 0.6})`);  // purple-300
        g.addColorStop(0.85, `rgba(216,180,254,${sh.alpha})`);
        g.addColorStop(1,    `rgba(216,180,254,${sh.alpha * 0.15})`);
        ctx.save();
        ctx.strokeStyle = g;
        ctx.lineWidth   = 1.5;
        ctx.shadowBlur  = 10;
        ctx.shadowColor = "rgba(192,132,252,0.5)";
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
// FLOATING PARTICLES — tiny purple drifting dots, same as Feed
// ─────────────────────────────────────────────────────────────────────────────
function FloatingParticles() {
  const particles = useRef(
    Array.from({ length: 16 }, (_, i) => ({
      x: 3 + i * 6.1,
      delay: i * 0.65,
      dur: 5 + (i % 5),
    }))
  );
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.current.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-purple-400/25"
          style={{ left: `${p.x}%`, bottom: 0 }}
          animate={{ y: [0, -120, -220], opacity: [0, 0.55, 0], scale: [0.5, 1.2, 0.3] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED SHIMMER TOP LINE — same as CreatePost / Post cards
// ─────────────────────────────────────────────────────────────────────────────
function ShimmerLine() {
  return (
    <motion.div
      className="absolute top-0 left-0 right-0 h-0.5 pointer-events-none"
      style={{
        background:
          "linear-gradient(90deg,transparent 0%,rgba(216,180,254,0.7) 40%,rgba(244,114,182,0.6) 60%,transparent 100%)",
        backgroundSize: "200% 100%",
      }}
      animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT — all original logic preserved exactly
// ─────────────────────────────────────────────────────────────────────────────
const Developers = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);

  const [users, setUsers]   = useState([]);
  const [search, setSearch] = useState("");

  // ── ORIGINAL LOGIC — UNCHANGED ────────────────────────────────────────────
  useEffect(() => {
    const fetchUsers = async () => {
      let q;
      if (search) {
        q = query(
          collection(db, "users"),
          where("username", ">=", search),
          where("username", "<=", search + "\uf8ff")
        );
      } else {
        q = collection(db, "users");
      }
      const snapshot = await getDocs(q);
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    };
    fetchUsers();
  }, [search]);

  if (!currentUser) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(to bottom right, #0f0c29, #302b63, #24243e)" }}
      >
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="flex items-center gap-3 text-slate-400 text-sm"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block w-4 h-4 border-2 border-slate-600 border-t-purple-400 rounded-full"
          />
          Loading…
        </motion.div>
      </div>
    );
  }
  // ── END ORIGINAL LOGIC ───────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .dev-input { outline: none; background: transparent; border: none; width: 100%; }
        .dev-input::placeholder { color: rgb(71 85 105); }
      `}</style>

      <div
        className="min-h-screen relative overflow-x-hidden"
        style={{ background: "linear-gradient(to bottom right, #0f0c29, #302b63, #24243e)" }}
      >
        {/* ── Starfield canvas + parallax ── */}
        <StarField />

        {/* ── Floating particles ── */}
        <FloatingParticles />

        {/* ── Ambient glow blobs — identical to ProfileHeader / Feed ── */}
        <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] animate-pulse pointer-events-none z-0" />
        <div
          className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[100px] animate-pulse pointer-events-none z-0"
          style={{ animationDelay: "2s" }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-5 py-12">

          {/* ── Page Header ── */}
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1
                  className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Developers
                </h1>
                <p
                  className="text-slate-500 text-xs mt-1"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {search
                    ? `${users.length} result${users.length !== 1 ? "s" : ""} for "${search}"`
                    : `${users.length} developer${users.length !== 1 ? "s" : ""} in the community`}
                </p>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-slate-700/40">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_6px_rgba(74,222,128,0.7)] animate-pulse" />
                <span className="text-slate-400 text-xs font-medium"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Live
                </span>
              </div>
            </div>
          </motion.div>

          {/* ── Search Bar ── */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="relative mb-7 group"
          >
            {/* focus aura */}
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/15 via-pink-600/8 to-indigo-600/15 rounded-3xl blur-[18px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-400 pointer-events-none" />

            <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 group-focus-within:border-purple-500/50 rounded-2xl overflow-hidden transition-all duration-300">
              <ShimmerLine />

              <div className="flex items-center gap-3 px-4 py-3.5">
                <motion.svg
                  animate={{ color: search ? "#c084fc" : "#475569" }}
                  transition={{ duration: 0.3 }}
                  width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" className="flex-shrink-0"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </motion.svg>

                {/* original input — untouched */}
                <input
                  type="text"
                  placeholder="Search developers by username…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="dev-input text-slate-200 text-sm"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                />

                <AnimatePresence>
                  {search && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      whileTap={{ scale: 0.82 }}
                      onClick={() => setSearch("")}
                      className="w-5 h-5 rounded-full bg-slate-700/70 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-600/80 transition-all flex-shrink-0"
                    >
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* ── Empty state ── */}
          <AnimatePresence>
            {users.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45 }}
                className="relative bg-slate-900/40 backdrop-blur-md border border-slate-800/50 border-dashed rounded-2xl py-20 flex flex-col items-center gap-4 overflow-hidden"
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(147,51,234,0.07)_0%,transparent_65%)] pointer-events-none" />
                <motion.div
                  animate={{ y: [0, -8, 0], scale: [1, 1.07, 1] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-14 h-14 rounded-2xl bg-purple-600/12 border border-purple-500/18 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(147,51,234,0.15)]"
                >
                  🔭
                </motion.div>
                <div className="text-center">
                  <p className="text-slate-400 text-sm font-semibold mb-1"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {search ? "No developers found" : "No developers yet"}
                  </p>
                  <p className="text-slate-600 text-xs"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {search ? `No match for "${search}"` : "Be the first to join the community"}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Developer cards ── */}
          <AnimatePresence>
            {users.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {users.map((u, i) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10, scale: 0.97 }}
                    transition={{ duration: 0.4, delay: i * 0.06, ease: "easeOut" }}
                    whileHover={{ y: -4 }}
                    className="relative group"
                  >
                    {/* card hover glow aura */}
                    <div className="absolute -inset-2 bg-gradient-to-br from-purple-600/18 via-pink-600/8 to-indigo-600/15 rounded-3xl blur-[22px] opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />

                    <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 group-hover:border-purple-500/35 rounded-2xl overflow-hidden transition-all duration-300">

                      {/* animated gradient top line — same as Post/CreatePost */}
                      <motion.div
                        className="h-0.5 w-full pointer-events-none"
                        style={{
                          background:
                            "linear-gradient(90deg,transparent 0%,rgba(147,51,234,0.55) 35%,rgba(244,114,182,0.45) 65%,transparent 100%)",
                          backgroundSize: "200% 100%",
                        }}
                        animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                        transition={{ duration: 4 + i * 0.3, repeat: Infinity, ease: "linear" }}
                      />

                      {/* inner radial shimmer */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(147,51,234,0.04)_0%,transparent_55%)] pointer-events-none" />

                      <div className="relative flex items-center gap-4 px-5 py-4">

                        {/* ── Avatar — same gradient ring + glow as ProfileHeader ── */}
                        <div className="relative flex-shrink-0">
                          {/* glow ring */}
                          <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-purple-600/40 via-pink-500/30 to-indigo-600/40 blur-[7px] opacity-0 group-hover:opacity-80 transition-opacity duration-300" />
                          {/* gradient border */}
                          <div className="relative p-[2.5px] rounded-full bg-gradient-to-br from-slate-600 via-slate-600 to-slate-600 group-hover:from-purple-500 group-hover:via-pink-400 group-hover:to-indigo-500 transition-all duration-400">
                            {u.avatar ? (
                              <motion.img
                                src={u.avatar}
                                alt={u.name}
                                whileHover={{ scale: 1.06 }}
                                transition={{ duration: 0.25 }}
                                className="w-12 h-12 rounded-full block bg-slate-900 object-cover"
                              />
                            ) : (
                              <div
                                className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-700 to-indigo-700 flex items-center justify-center text-white text-sm font-bold"
                                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                              >
                                {u.name?.[0]?.toUpperCase() || "U"}
                              </div>
                            )}
                          </div>
                          {/* online dot */}
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-slate-900 shadow-[0_0_8px_rgba(74,222,128,0.75)]" />
                        </div>

                        {/* ── Info ── */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-white text-sm font-semibold leading-none mb-0.5 truncate"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                          >
                            {u.name}
                          </p>
                          <p
                            className="text-slate-500 text-xs truncate mb-1"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                          >
                            @{u.username}
                          </p>

                          {u.occupation && (
                            <p
                              className="text-[11px] text-purple-400/70 truncate mb-1.5"
                              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                            >
                              {u.occupation}
                            </p>
                          )}

                          {/* skill pills */}
                          {u.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {u.skills.slice(0, 3).map((sk) => (
                                <motion.span
                                  key={sk}
                                  whileHover={{ scale: 1.07, boxShadow: "0 0 10px rgba(147,51,234,0.35)" }}
                                  className="text-[10px] text-purple-300/80 bg-purple-500/8 border border-purple-500/18 px-2 py-0.5 rounded-full cursor-default transition-all duration-200"
                                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                                >
                                  {sk}
                                </motion.span>
                              ))}
                              {u.skills.length > 3 && (
                                <span
                                  className="text-[10px] text-slate-600"
                                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                                >
                                  +{u.skills.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* ── Action buttons ── */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* View Profile — gradient button */}
                          <motion.button
                            whileHover={{ scale: 1.07, boxShadow: "0 0 18px rgba(147,51,234,0.45)" }}
                            whileTap={{ scale: 0.93 }}
                            onClick={() => navigate(`/profile/${u.id}`)}
                            className="relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/40 transition-all duration-300"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                          >
                            {/* shine sweep */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/12 to-transparent -skew-x-12 pointer-events-none"
                              animate={{ x: ["-150%", "200%"] }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
                            />
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            View
                          </motion.button>

                          {/* Chat — glass ghost button */}
                          {u.id !== currentUser.uid && (
                            <motion.button
                              whileHover={{ scale: 1.07, borderColor: "rgba(99,102,241,0.5)" }}
                              whileTap={{ scale: 0.93 }}
                              onClick={() => navigate(`/chat/${u.id}`)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800/60 border border-slate-700/50 hover:text-indigo-300 transition-all duration-300"
                              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                              </svg>
                              Chat
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </>
  );
};

export default Developers;