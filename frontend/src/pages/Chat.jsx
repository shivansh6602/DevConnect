import { useParams } from "react-router-dom";
import { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import ChatBox from "../components/chat/ChatBox";
import {
  doc, getDoc, setDoc,
  collection, query, where,
  getDocs, updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { motion, useScroll, useTransform } from "framer-motion";

// ─── STARFIELD ────────────────────────────────────────────────────────────────
function StarField() {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const starsRef  = useRef([]);
  const shootRef  = useRef([]);
  const { scrollYProgress } = useScroll();
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, -120]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight * 2;
    };
    resize();
    window.addEventListener("resize", resize);

    starsRef.current = Array.from({ length: 260 }, () => {
      const dur = Math.random() * 3 + 1.5;
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight * 2,
        r: (Math.random() * 2 + 0.5) / 2,
        alpha: Math.random(),
        dAlpha: (0.005 / dur) * (Math.random() > 0.5 ? 1 : -1),
        scaleT: Math.random() * Math.PI * 2,
        scaleDelta: (2 * Math.PI) / (dur * 60),
        delayFrames: Math.floor(Math.random() * 180),
      };
    });

    const mkShooter = (delay) => ({
      x: 0, y: 0,
      angle: (Math.PI / 180) * (30 + Math.random() * 12),
      speed: 8 + Math.random() * 6,
      len: 90, alpha: 0, phase: "wait",
      waitFrames: Math.floor((4 + Math.random() * 3) * 60),
      waitCounter: delay,
    });
    shootRef.current = Array.from({ length: 5 }, (_, i) => mkShooter(i * 90));

    const respawn = (sh) => {
      sh.x = Math.random() * canvas.width * 0.7;
      sh.y = Math.random() * canvas.height * 0.35;
      sh.alpha = 0; sh.phase = "shoot";
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
        ctx.globalAlpha = s.alpha; ctx.fillStyle = "#fff";
        if (s.r > 0.7) { ctx.shadowBlur = 4; ctx.shadowColor = "rgba(255,255,255,0.6)"; }
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * scale, 0, Math.PI * 2); ctx.fill();
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
          if (sh.alpha <= 0) { sh.phase = "wait"; sh.waitFrames = Math.floor((4 + Math.random() * 3) * 60); sh.waitCounter = 0; return; }
        }
        const tx = sh.x - Math.cos(sh.angle) * sh.len;
        const ty = sh.y - Math.sin(sh.angle) * sh.len;
        const g = ctx.createLinearGradient(tx, ty, sh.x, sh.y);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(0.5, `rgba(216,180,254,${sh.alpha * 0.6})`);
        g.addColorStop(1, `rgba(216,180,254,${sh.alpha})`);
        ctx.save();
        ctx.strokeStyle = g; ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10; ctx.shadowColor = "rgba(192,132,252,0.6)";
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(sh.x, sh.y); ctx.stroke();
        ctx.restore();
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <motion.div style={{ y: yParallax }} className="fixed inset-0 pointer-events-none z-0">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </motion.div>
  );
}

// ─── SHIMMER LINE ─────────────────────────────────────────────────────────────
function ShimmerLine() {
  return (
    <motion.div
      className="absolute top-0 left-0 right-0 h-px pointer-events-none"
      style={{
        background: "linear-gradient(90deg,transparent 0%,rgba(216,180,254,0.7) 40%,rgba(244,114,182,0.6) 60%,transparent 100%)",
        backgroundSize: "200% 100%",
      }}
      animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
    />
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const Chat = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [otherUser, setOtherUser] = useState(null);

  if (!user || !id) return null;

  const chatId = [user.uid, id].sort().join("_");

  // ── ALL ORIGINAL LOGIC — UNCHANGED ──────────────────────────────────────────
  useEffect(() => {
    const createChatIfNotExists = async () => {
      const chatRef = doc(db, "chats", chatId);
      const snap = await getDoc(chatRef);
      if (!snap.exists()) {
        await setDoc(chatRef, { users: [user.uid, id], createdAt: new Date() });
      }
    };
    createChatIfNotExists();
  }, [chatId, user, id]);

  useEffect(() => {
    const fetchUser = async () => {
      const snap = await getDoc(doc(db, "users", id));
      if (snap.exists()) setOtherUser(snap.data());
    };
    fetchUser();
  }, [id]);

  useEffect(() => {
    const markAsRead = async () => {
      const q = query(
        collection(db, "notifications"),
        where("to", "==", user.uid),
        where("from", "==", id),
        where("read", "==", false)
      );
      const snap = await getDocs(q);
      snap.forEach(async (docSnap) => { await updateDoc(docSnap.ref, { read: true }); });
    };
    markAsRead();
  }, [id, user]);
  // ── END ORIGINAL LOGIC ───────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Space Grotesk', sans-serif; box-sizing: border-box; }
      `}</style>

      <div
        className="relative min-h-screen overflow-hidden"
        style={{ background: "linear-gradient(to bottom right, #0f0c29, #302b63, #24243e)" }}
      >
        <StarField />

        {/* Ambient glow blobs */}
        <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] animate-pulse pointer-events-none z-0" />
        <div className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[100px] animate-pulse pointer-events-none z-0" style={{ animationDelay: "2s" }} />

<div className="relative z-10 h-screen flex flex-col items-center px-6 pt-20 pb-4">
  {/* MAIN CENTER WRAPPER */}
  <div className="w-full max-w-[1500px] flex flex-col flex-1">

    {/* ── HEADER ── */}
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="
        relative
        overflow-hidden
        backdrop-blur-2xl
        bg-slate-900/50
        border border-slate-700/40
        rounded-t-[28px]
border-b-0
        shrink-0
      "
    >
      <ShimmerLine />

      <div className="flex items-center justify-between px-5 py-4">

        {/* LEFT */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-purple-600/40 via-pink-500/30 to-indigo-600/40 blur-[8px]" />

            <div className="relative p-[2px] rounded-full bg-gradient-to-br from-purple-500 via-pink-400 to-indigo-500">
              {otherUser?.avatar ? (
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  src={otherUser.avatar}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover bg-slate-900"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-700 to-indigo-700 flex items-center justify-center text-white font-bold text-lg">
                  {otherUser?.name?.[0] || "U"}
                </div>
              )}
            </div>

            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-slate-900 shadow-[0_0_10px_rgba(74,222,128,0.9)] animate-pulse" />
          </div>

          <div>
            <h2 className="text-white font-bold text-lg leading-none mb-1">
              {otherUser?.name || "User"}
            </h2>

            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <p className="text-xs text-slate-400">
                Active now
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-purple-300 transition-all duration-300"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="19" cy="12" r="1"/>
              <circle cx="5" cy="12" r="1"/>
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>

    {/* ── CHAT BODY ── */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="
        relative
        flex-1
        overflow-hidden
       rounded-b-[28px]
        border border-white/10
        bg-[#0b0b1a]/40
        shadow-[0_0_40px_rgba(0,0,0,0.35)]
        backdrop-blur-xl
      "
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(147,51,234,0.06)_0%,transparent_40%)] pointer-events-none z-0" />

      <ChatBox
        chatId={chatId}
        otherUserId={id}
      />
    </motion.div>

  </div>
</div>
      </div>
    </>
  );
};

export default Chat;