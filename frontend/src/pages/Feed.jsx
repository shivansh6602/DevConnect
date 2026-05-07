import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  updateDoc,
  doc,
  increment,
  onSnapshot,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebase";
import { useContext, useEffect, useRef, useState } from "react";
import CreatePost from "../components/posts/CreatePost";
import PostList from "../components/posts/PostList";
import { AuthContext } from "../context/AuthContext";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";

// ─────────────────────────────────────────────────────────────
// STARFIELD — identical to ProfileHeader: 260 stars, 5 shooters,
//             scroll parallax, same purple-300 shooting-star tail
// ─────────────────────────────────────────────────────────────
function StarField() {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const starsRef  = useRef([]);
  const shootRef  = useRef([]);
  const { scrollYProgress } = useScroll();
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, -100]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight * 2.5;   // taller for scrolling pages
    };
    resize();
    window.addEventListener("resize", resize);

    // ── 260 twinkling stars ──
    starsRef.current = Array.from({ length: 260 }, () => {
      const dur = Math.random() * 3 + 1.5;
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

    // ── 5 shooting stars ──
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
      const w = canvas.width;
      sh.x     = Math.random() * w * 0.7;
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

      // shooters
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
            sh.phase      = "wait";
            sh.waitFrames = Math.floor((4 + Math.random() * 3) * 60);
            sh.waitCounter = 0;
            return;
          }
        }
        const tx = sh.x - Math.cos(sh.angle) * sh.len;
        const ty = sh.y - Math.sin(sh.angle) * sh.len;
        const g  = ctx.createLinearGradient(tx, ty, sh.x, sh.y);
        g.addColorStop(0,    "rgba(255,255,255,0)");
        g.addColorStop(0.5,  `rgba(216,180,254,${sh.alpha * 0.6})`);   // purple-300
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

// ─────────────────────────────────────────────────────────────
// FLOATING PARTICLE — tiny drifting dot for extra depth
// ─────────────────────────────────────────────────────────────
function Particle({ delay, x, duration }) {
  return (
    <motion.div
      className="absolute w-0.5 h-0.5 rounded-full bg-purple-400/30 pointer-events-none"
      style={{ left: `${x}%`, bottom: 0 }}
      animate={{ y: [0, -120, -220], opacity: [0, 0.6, 0], scale: [0.5, 1.2, 0.3] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeOut" }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// SUGGESTED USER ROW — same glassmorphism language
// ─────────────────────────────────────────────────────────────
function SuggestedUserRow({ u, onFollow, delay }) {
  const [followed, setFollowed] = useState(false);

  const handleFollow = () => {
    setFollowed(true);
    onFollow(u.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex items-center justify-between py-2.5 border-b border-slate-800/50 last:border-0 group"
    >
      <div className="flex items-center gap-3">
        {u.avatar ? (
          <img
            src={u.avatar}
            alt={u.name}
            className="w-8 h-8 rounded-xl border border-slate-700/50 object-cover flex-shrink-0 group-hover:border-purple-500/40 transition-colors duration-300"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-xl border border-slate-700/50 flex items-center justify-center text-xs font-bold text-purple-300 flex-shrink-0"
            style={{ background: "linear-gradient(135deg,rgba(147,51,234,0.3),rgba(79,70,229,0.3))", fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {u.name?.[0]?.toUpperCase() || "U"}
          </div>
        )}

        <div className="min-w-0">
          <p className="text-white text-xs font-semibold truncate leading-none mb-0.5"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {u.name}
          </p>
          {u.occupation && (
            <p className="text-slate-500 text-[10px] truncate leading-none"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {u.occupation}
            </p>
          )}
        </div>
      </div>

      <motion.button
        whileHover={!followed ? { scale: 1.06, boxShadow: "0 0 14px rgba(147,51,234,0.35)" } : {}}
        whileTap={!followed ? { scale: 0.95 } : {}}
        onClick={handleFollow}
        disabled={followed}
        className={`flex-shrink-0 px-3 py-1 rounded-lg text-[11px] font-semibold transition-all duration-300 ${
          followed
            ? "text-slate-500 bg-slate-800/40 border border-slate-700/30 cursor-default"
            : "text-white bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/35"
        }`}
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {followed ? "✓ Following" : "+ Follow"}
      </motion.button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN FEED
// ─────────────────────────────────────────────────────────────
const Feed = ({ posts, setPosts }) => {
  const { user }   = useContext(AuthContext);
  const [following, setFollowing]         = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  // ── ALL ORIGINAL FIREBASE LOGIC — UNCHANGED ──────────────────────────────
  const addPost = async (data) => {
    try {
      const userDoc  = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();
      if (!userData) { console.log("User data not found"); return; }
      const newPost = {
        title: data.title, content: data.text, likes: 0, likedBy: [],
        userId: user.uid,
        user: { name: userData.name, email: userData.email, avatar: userData.avatar, userId: user.uid },
        createdAt: new Date(),
      };
      await addDoc(collection(db, "posts"), newPost);
    } catch (error) { console.log("Error adding post:", error); }
  };

  const deletePost = async (id) => {
    try { await deleteDoc(doc(db, "posts", id)); }
    catch (error) { console.error("Error deleting post:", error); }
  };

  const likePost = async (id) => {
    try {
      const postRef  = doc(db, "posts", id);
      const postSnap = await getDoc(postRef);
      const data     = postSnap.data();
      if (data.likedBy?.includes(user.uid)) { console.log("Already Liked"); return; }
      await updateDoc(postRef, { likes: increment(1), likedBy: [...(data.likedBy || []), user.uid] });
    } catch (error) { console.error("Error liking post:", error); }
  };

  const followUser = async (targetId) => {
    const currentUserRef = doc(db, "users", user.uid);
    const targetRef      = doc(db, "users", targetId);
    await updateDoc(targetRef, { followers: arrayUnion(user.uid) });
    await updateDoc(currentUserRef, { following: arrayUnion(targetId) });
  };

  const addComment = async (postId, text) => {
    if (!text.trim()) return;
    try {
      const commentRef = collection(db, "posts", postId, "comments");
      const userDoc    = await getDoc(doc(db, "users", user.uid));
      const userData   = userDoc.data();
      await addDoc(commentRef, {
        text, likes: 0, likedBy: [], createdAt: new Date(),
        user: { name: userData.name, email: userData.email, avatar: userData.avatar, userId: user.uid },
      });
    } catch (error) { console.log("Error adding comment:", error); }
  };

  const deleteComment = async (postId, commentId) => {
    try { await deleteDoc(doc(db, "posts", postId, "comments", commentId)); }
    catch (error) { console.log("Error deleting", error); }
  };

  const likeComment = async (postId, commentId) => {
    try {
      const commentRef  = doc(db, "posts", postId, "comments", commentId);
      const commentSnap = await getDoc(commentRef);
      const data        = commentSnap.data();
      if (data.likedBy?.includes(user.uid)) { console.log("Already liked comment"); return; }
      await updateDoc(commentRef, { likes: increment(1), likedBy: [...(data.likedBy || []), user.uid] });
    } catch (error) { console.log("Error liking comment:", error); }
  };

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) setFollowing(snap.data().following || []);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "posts"), (snapshot) => {
      const postsData = snapshot.docs.map((d) => ({ id: d.id, ...d.data(), comments: [] }));
      const filtered  = postsData.filter((p) => following.includes(p.userId) || p.userId === user.uid);
      setPosts(filtered);
      filtered.forEach((post) => {
        onSnapshot(collection(db, "posts", post.id, "comments"), (cSnap) => {
          const comments = cSnap.docs.map((c) => ({ id: c.id, ...c.data() }));
          setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, comments } : p)));
        });
      });
    });
    return () => unsub();
  }, [user, following]);

  useEffect(() => {
    if (!user) return;
    const fetchSuggested = async () => {
      const snap     = await getDocs(collection(db, "users"));
      const allUsers = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const filtered = allUsers.filter((u) => u.id !== user.uid && !following.includes(u.id));
      setSuggestedUsers(filtered.slice(0, 5));
    };
    fetchSuggested();
  }, [user, following]);
  // ── END ORIGINAL LOGIC ────────────────────────────────────────────────────

  // floating particles data (static, never changes)
  const particles = useRef(
    Array.from({ length: 14 }, (_, i) => ({
      x: 5 + i * 7,
      delay: i * 0.9,
      duration: 5 + (i % 5),
    }))
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── Root wrapper — same bg gradient as ProfileHeader ── */}
      <div
        className="min-h-screen relative overflow-x-hidden"
        style={{ background: "linear-gradient(to bottom right, #0f0c29, #302b63, #24243e)" }}
      >
        {/* ── Starfield ── */}
        <StarField />

        {/* ── Floating particles ── */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {particles.current.map((p, i) => (
            <Particle key={i} x={p.x} delay={p.delay} duration={p.duration} />
          ))}
        </div>

        {/* ── Ambient glow blobs — identical to ProfileHeader ── */}
        <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] animate-pulse pointer-events-none z-0" />
        <div
          className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[100px] animate-pulse pointer-events-none z-0"
          style={{ animationDelay: "2s" }}
        />

        {/* ── Page content ── */}
        <div className="relative z-10 max-w-5xl mx-auto px-5 py-10">

          {/* ── Page header ── */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="flex items-center justify-between mb-8 mt-8"
          >
            <div>
              <h1
                className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Developer Feed
              </h1>
              <p className="text-slate-500 text-xs mt-0.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Posts from people you follow
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-slate-700/40">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_6px_rgba(74,222,128,0.7)] animate-pulse" />
              <span className="text-slate-400 text-xs font-medium" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Live</span>
            </div>
          </motion.div>

          {/* ── Two-column layout ── */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* ═══════════════════════════════
                LEFT — CreatePost + PostList
            ═══════════════════════════════ */}
            <div className="flex-1 min-w-0 space-y-5">

              {/* CreatePost wrapper with glow */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative"
              >
                <div className="absolute -inset-2 bg-gradient-to-br from-purple-600/20 via-pink-600/10 to-indigo-600/20 rounded-3xl blur-[24px] opacity-60 pointer-events-none" />
                <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                  <div className="h-0.5 w-full bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600" />
                  <CreatePost addPost={addPost} />
                </div>
              </motion.div>

              {/* Section separator */}
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-purple-500 to-pink-500 flex-shrink-0" />
                <span className="text-white text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Latest Posts
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-slate-700/50 to-transparent" />
                {posts.length > 0 && (
                  <span
                    className="text-[10px] text-slate-600 bg-slate-800/50 border border-slate-700/40 px-2 py-0.5 rounded-full"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {posts.length} post{posts.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Empty state */}
              <AnimatePresence>
                {posts.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="relative bg-slate-900/50 backdrop-blur-xl border border-slate-700/40 border-dashed rounded-2xl py-16 flex flex-col items-center gap-4 overflow-hidden"
                  >
                    {/* Radial shimmer */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(147,51,234,0.07)_0%,transparent_65%)]" />

                    {/* Animated icon */}
                    <motion.div
                      animate={{ y: [0, -8, 0], scale: [1, 1.08, 1] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="w-14 h-14 rounded-2xl bg-purple-600/15 border border-purple-500/20 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(147,51,234,0.15)]"
                    >
                      👀
                    </motion.div>

                    <div className="text-center relative">
                      <p className="text-slate-300 text-base font-semibold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        Nothing here yet
                      </p>
                      <p className="text-slate-600 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        Follow developers to see their posts
                      </p>
                    </div>

                    <motion.p
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="text-slate-700 text-xs"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      ↗ Check suggested devs on the right
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* PostList — pass all original props */}
              {posts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <PostList
                    posts={posts}
                    deletePost={deletePost}
                    likePost={likePost}
                    addComment={addComment}
                    deleteComment={deleteComment}
                    likeComment={likeComment}
                  />
                </motion.div>
              )}
            </div>

            {/* ═══════════════════════════════
                RIGHT — Sidebar
            ═══════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.18 }}
              className="w-full lg:w-72 flex-shrink-0"
            >
              <div className="sticky top-6 space-y-4">

                {/* Suggested Developers card */}
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-br from-purple-600/15 via-transparent to-indigo-600/10 rounded-3xl blur-[20px] pointer-events-none" />

                  <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                    <div className="h-0.5 w-full bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600" />

                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-4 rounded-full bg-gradient-to-b from-purple-500 to-pink-500 flex-shrink-0" />
                        <h3
                          className="text-white text-sm font-semibold"
                          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          Suggested Devs
                        </h3>
                        <span
                          className="ml-auto text-[10px] text-slate-600 bg-slate-800/50 border border-slate-700/40 px-2 py-0.5 rounded-full"
                          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          {suggestedUsers.length}
                        </span>
                      </div>

                      {suggestedUsers.length === 0 ? (
                        <div className="py-6 text-center">
                          <span className="text-2xl block mb-2">🎉</span>
                          <p className="text-slate-500 text-xs" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            You're all caught up!
                          </p>
                        </div>
                      ) : (
                        suggestedUsers.map((u, i) => (
                          <SuggestedUserRow
                            key={u.id}
                            u={u}
                            onFollow={followUser}
                            delay={i * 0.07}
                          />
                        ))
                      )}

                      {suggestedUsers.length > 0 && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          className="w-full mt-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-300 bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/40 transition-all duration-300"
                          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          Explore all developers →
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Activity mini card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="relative bg-slate-900/50 backdrop-blur-xl border border-slate-700/40 rounded-2xl p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 rounded-full bg-gradient-to-b from-indigo-500 to-pink-500 flex-shrink-0" />
                    <span className="text-white text-xs font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      Your Activity
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Following",   value: following.length, icon: "🔭" },
                      { label: "Feed Posts",  value: posts.length,     icon: "📬" },
                    ].map(({ label, value, icon }) => (
                      <motion.div
                        key={label}
                        whileHover={{ y: -3, borderColor: "rgba(147,51,234,0.35)" }}
                        className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-2.5 text-center transition-all duration-300 cursor-default"
                      >
                        <span className="text-base block mb-0.5">{icon}</span>
                        <p className="text-white font-bold text-sm leading-none mb-0.5"
                          style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                          {value}
                        </p>
                        <p className="text-slate-600 text-[10px] uppercase tracking-wide"
                          style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                          {label}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Feed;