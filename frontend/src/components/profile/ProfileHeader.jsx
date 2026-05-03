import { useContext, useEffect, useRef, useState } from "react";
import { updateDoc, doc, arrayUnion, arrayRemove, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import FollowList from "./FollowList";

// ─── STAR FIELD CANVAS ────────────────────────────────────────────────────────
function StarField() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const starsRef = useRef([]);
  const shootersRef = useRef([]);
  const { scrollYProgress } = useScroll();
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, -100]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 2;
    };
    resize();
    window.addEventListener("resize", resize);

    // 260 stars — white, opacity [0.1→1→0.1], scale [1→1.3→1]
    starsRef.current = Array.from({ length: 260 }, () => {
      const dur = Math.random() * 3 + 1.5;
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight * 2,
        r: (Math.random() * 2.5 + 0.5) / 2,
        alpha: Math.random(),
        dAlpha: (0.005 / dur) * (Math.random() > 0.5 ? 1 : -1),
        scaleT: Math.random() * Math.PI * 2,
        scaleDelta: (2 * Math.PI) / (dur * 60),
        delayFrames: Math.floor(Math.random() * 3 * 60),
      };
    });

    // 5 shooting stars
    const mkShooter = (stagger) => ({
      x: 0, y: 0,
      angle: Math.PI / 180 * (30 + Math.random() * 12),
      speed: 8 + Math.random() * 6,
      len: 80,
      alpha: 0,
      phase: "wait",
      waitFrames: Math.floor((4 + Math.random() * 3) * 60),
      waitCounter: Math.floor(stagger),
    });
    shootersRef.current = Array.from({ length: 5 }, (_, i) => mkShooter(i * 80));

    const respawn = (sh) => {
      sh.x = Math.random() * canvas.width * 0.7;
      sh.y = Math.random() * canvas.height * 0.35;
      sh.alpha = 0;
      sh.phase = "shoot";
      sh.angle = Math.PI / 180 * (30 + Math.random() * 12);
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
        const scale = 1 + 0.3 * Math.abs(Math.sin(s.scaleT));
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = "#ffffff";
        if (s.r > 0.7) { ctx.shadowBlur = 3; ctx.shadowColor = "rgba(255,255,255,0.5)"; }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      shootersRef.current.forEach((sh) => {
        if (sh.phase === "wait") {
          sh.waitCounter++;
          if (sh.waitCounter >= sh.waitFrames) { sh.waitCounter = 0; respawn(sh); }
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
            sh.waitCounter = 0;
            return;
          }
        }
        const tx = sh.x - Math.cos(sh.angle) * sh.len;
        const ty = sh.y - Math.sin(sh.angle) * sh.len;
        const grad = ctx.createLinearGradient(tx, ty, sh.x, sh.y);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(0.5, `rgba(216,180,254,${sh.alpha * 0.6})`);
        grad.addColorStop(0.85, `rgba(216,180,254,${sh.alpha})`);
        grad.addColorStop(1, `rgba(216,180,254,${sh.alpha * 0.15})`);
        ctx.save();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(192,132,252,0.5)";
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(sh.x, sh.y);
        ctx.stroke();
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

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, delay = 0, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -6 }}
      onClick={onClick}
      className={`relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 hover:border-purple-500/50 rounded-2xl p-6 text-center group transition-all duration-300 ${onClick ? "cursor-pointer" : ""}`}
    >
      {/* Hover glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative">
        <span className="text-2xl mb-2 block">{icon}</span>
        <p className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {value}
        </p>
        <p className="text-slate-500 text-xs tracking-widest uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {label}
        </p>
      </div>
    </motion.div>
  );
}

// ─── POST PLACEHOLDER CARD ────────────────────────────────────────────────────
function PostPlaceholder({ delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4 }}
      className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 hover:border-purple-500/40 rounded-2xl p-5 group transition-all duration-300 cursor-pointer overflow-hidden"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="relative space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-purple-500 rounded-full" />
          <div className="h-2.5 bg-slate-700/60 rounded-full w-24 animate-pulse" />
          <div className="ml-auto h-2 bg-slate-800/80 rounded-full w-12" />
        </div>
        <div className="space-y-2">
          <div className="h-2.5 bg-slate-700/50 rounded-full w-full" />
          <div className="h-2.5 bg-slate-700/50 rounded-full w-4/5" />
          <div className="h-2.5 bg-slate-700/40 rounded-full w-3/5" />
        </div>
        <div className="flex gap-4 pt-2 border-t border-slate-800/60">
          <div className="h-2 bg-slate-800/60 rounded-full w-10" />
          <div className="h-2 bg-slate-800/60 rounded-full w-10" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const ProfileHeader = ({ user, userId }) => {
  const [liveUser, setLiveUser] = useState(user);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);

  useEffect(() => {
    const userRef = doc(db, "users", userId);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) setLiveUser(snap.data());
    });
    return () => unsubscribe();
  }, [userId]);

  if (!liveUser || !currentUser) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(to bottom right, #0f0c29, #302b63, #24243e)" }}
      >
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-slate-400 text-sm"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Loading profile…
        </motion.div>
      </div>
    );
  }

  const followers = Array.isArray(liveUser.followers) ? liveUser.followers : [];
  const following = Array.isArray(liveUser.following) ? liveUser.following : [];
  const isFollowing = followers.includes(currentUser.uid);
  const isOwner = currentUser.uid === userId;
  const postCount = liveUser.postCount ?? 0;

  const handleFollow = async () => {
    const currentUserRef = doc(db, "users", currentUser.uid);
    const profileRef = doc(db, "users", userId);
    if (isFollowing) {
      await updateDoc(profileRef, { followers: arrayRemove(currentUser.uid) });
      await updateDoc(currentUserRef, { following: arrayRemove(userId) });
    } else {
      await updateDoc(profileRef, { followers: arrayUnion(currentUser.uid) });
      await updateDoc(currentUserRef, { following: arrayUnion(userId) });
    }
  };

  const avatarSrc =
    liveUser.avatar ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${liveUser.name || "User"}&backgroundColor=1a1a3e`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
      `}</style>

      <div
        className="min-h-screen relative overflow-x-hidden"
        style={{ background: "linear-gradient(to bottom right, #0f0c29, #302b63, #24243e)" }}
      >
        <StarField />

        {/* Ambient glows */}
        <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] animate-pulse pointer-events-none z-0" />
        <div className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[100px] animate-pulse pointer-events-none z-0" style={{ animationDelay: "2s" }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 space-y-8">

          {/* ── Follow List Modals ── */}
          <AnimatePresence>
            {showFollowers && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={() => setShowFollowers(false)}
              >
                <motion.div
                  initial={{ scale: 0.92, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.92, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                >
                  <FollowList ids={followers} title="Followers" onClose={() => setShowFollowers(false)} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showFollowing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={() => setShowFollowing(false)}
              >
                <motion.div
                  initial={{ scale: 0.92, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.92, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                >
                  <FollowList ids={following} title="Following" onClose={() => setShowFollowing(false)} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── HERO PROFILE CARD ── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative"
          >
            {/* Card glow aura */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/30 via-pink-600/20 to-indigo-600/30 rounded-3xl blur-[40px] opacity-70 pointer-events-none" />

            <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden">
              {/* Top decorative band */}
              <div className="h-28 w-full bg-gradient-to-r from-purple-900/60 via-fuchsia-900/40 to-indigo-900/60 relative overflow-hidden">
                {/* Subtle grid */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: "linear-gradient(rgba(168,85,247,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.3) 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                  }}
                />
                {/* Radial glow in banner */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(147,51,234,0.25)_0%,transparent_70%)]" />
              </div>

              {/* Profile content */}
              <div className="px-8 pb-8">
                {/* Avatar row — floats over banner */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-14 mb-6">
                  {/* Avatar with floating + glow ring */}
                  <div className="relative w-fit">
                    {/* Glow ring */}
                    <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-purple-600/50 via-pink-600/50 to-indigo-600/50 blur-[18px] opacity-80" />
                    {/* Gradient border ring */}
                    <div className="relative p-[3px] rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500">
                      <motion.img
                        src={avatarSrc}
                        alt="avatar"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-24 h-24 rounded-full block bg-slate-900 object-cover"
                      />
                    </div>
                    {/* Online dot */}
                    <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-900 shadow-[0_0_8px_rgba(74,222,128,0.7)]" />
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pb-1">
                    {!isOwner && (
                      <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(147,51,234,0.45)" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleFollow}
                        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                          isFollowing
                            ? "bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:border-pink-500/40 hover:text-pink-400"
                            : "bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/40"
                        }`}
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {isFollowing ? "Unfollow" : "Follow"}
                      </motion.button>
                    )}

                    {isOwner && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate("/edit-profile")}
                        className="px-5 py-2 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800/60 border border-slate-700/50 hover:border-purple-500/40 hover:text-white transition-all duration-300"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        Edit Profile
                      </motion.button>
                    )}

                    {/* GitHub */}
                    {liveUser.github && (
                      <motion.a
                        whileHover={{ scale: 1.05 }}
                        href={liveUser.github}
                        target="_blank"
                        rel="noreferrer"
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-purple-500/40 text-slate-400 hover:text-white transition-all duration-300"
                        title="GitHub"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.79-.26.79-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.01 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.19.7.8.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
                        </svg>
                      </motion.a>
                    )}

                    {/* LinkedIn */}
                    {liveUser.linkedin && (
                      <motion.a
                        whileHover={{ scale: 1.05 }}
                        href={liveUser.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-blue-500/40 text-slate-400 hover:text-blue-400 transition-all duration-300"
                        title="LinkedIn"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.94v5.67H9.37V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.59 0 4.26 2.36 4.26 5.44v6.3zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45C23.21 24 24 23.23 24 22.27V1.73C24 .77 23.21 0 22.22 0z"/>
                        </svg>
                      </motion.a>
                    )}
                  </div>
                </div>

                {/* Name, username, occupation */}
                <div className="mb-4">
                  <h1
                    className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent leading-tight"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {liveUser.name}
                  </h1>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-slate-400 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      @{liveUser.username}
                    </span>
                    {liveUser.occupation && (
                      <>
                        <span className="text-slate-700 text-xs">·</span>
                        <span className="text-purple-400 text-sm font-medium" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                          {liveUser.occupation}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {liveUser.bio && (
                  <p
                    className="text-slate-300 text-sm leading-relaxed mb-5 max-w-xl"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {liveUser.bio}
                  </p>
                )}

                {/* Skills */}
                {liveUser.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {liveUser.skills.map((skill, i) => (
                      <motion.span
                        key={i}
                        whileHover={{ scale: 1.06, boxShadow: "0 0 14px rgba(147,51,234,0.45)" }}
                        className="px-3 py-1 text-xs font-medium bg-purple-600/15 text-purple-300 border border-purple-500/25 rounded-full cursor-default transition-all duration-200 hover:bg-purple-600/25 hover:border-purple-400/50"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                )}

                {/* Followers / Following */}
                <div className="flex items-center gap-6 pt-4 border-t border-slate-800/60">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    onClick={() => setShowFollowers(true)}
                    className="flex items-center gap-1.5 group/stat"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    <span className="text-lg font-bold text-white group-hover/stat:text-purple-300 transition-colors">
                      {followers.length}
                    </span>
                    <span className="text-slate-500 text-sm group-hover/stat:text-slate-400 transition-colors">
                      Followers
                    </span>
                  </motion.button>

                  <div className="w-px h-4 bg-slate-700/60" />

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    onClick={() => setShowFollowing(true)}
                    className="flex items-center gap-1.5 group/stat"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    <span className="text-lg font-bold text-white group-hover/stat:text-purple-300 transition-colors">
                      {following.length}
                    </span>
                    <span className="text-slate-500 text-sm group-hover/stat:text-slate-400 transition-colors">
                      Following
                    </span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── STATS STRIP ── */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label="Posts"
              value={postCount}
              icon="✍️"
              delay={0.15}
            />
            <StatCard
              label="Followers"
              value={followers.length}
              icon="👥"
              delay={0.22}
              onClick={() => setShowFollowers(true)}
            />
            <StatCard
              label="Following"
              value={following.length}
              icon="🔭"
              delay={0.29}
              onClick={() => setShowFollowing(true)}
            />
          </div>

          {/* ── POSTS SECTION ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            {/* Section header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="w-1 h-5 rounded-full bg-gradient-to-b from-purple-500 to-pink-500" />
                <h2
                  className="text-white font-semibold text-base"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Activity
                </h2>
                <span
                  className="text-xs text-slate-600 bg-slate-800/50 border border-slate-700/50 px-2 py-0.5 rounded-full"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {postCount} posts
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.04 }}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                View all →
              </motion.button>
            </div>

            {postCount === 0 ? (
              /* Empty state */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="relative bg-slate-900/40 backdrop-blur-md border border-slate-800/60 border-dashed rounded-2xl py-16 text-center"
              >
                <div className="text-3xl mb-3">🛸</div>
                <p
                  className="text-slate-500 text-sm"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  No posts yet. The feed awaits.
                </p>
              </motion.div>
            ) : (
              /* Post grid placeholders — replace with real PostCard components */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: Math.min(postCount, 4) }).map((_, i) => (
                  <PostPlaceholder key={i} delay={0.38 + i * 0.08} />
                ))}
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </>
  );
};

export default ProfileHeader;
