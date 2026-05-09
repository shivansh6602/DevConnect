import React, { useEffect, useState, useContext, useRef } from "react";
import {
  collection, query, where, onSnapshot,
  doc, getDoc, orderBy, limit, getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// STARFIELD — same as ProfileHeader / Feed / Chat
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
      canvas.height = window.innerHeight * 2;
    };
    resize();
    window.addEventListener("resize", resize);

    starsRef.current = Array.from({ length: 220 }, () => {
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

    const mkShooter = (s) => ({
      x: 0, y: 0,
      angle: (Math.PI / 180) * (30 + Math.random() * 12),
      speed: 8 + Math.random() * 6,
      len: 80, alpha: 0, phase: "wait",
      waitFrames: Math.floor((4 + Math.random() * 3) * 60),
      waitCounter: Math.floor(s),
    });
    shootRef.current = Array.from({ length: 4 }, (_, i) => mkShooter(i * 85));

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
        const sc = 1 + 0.3 * Math.abs(Math.sin(s.scaleT));
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = "#fff";
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
            sh.waitCounter = 0;
            return;
          }
        }
        const tx = sh.x - Math.cos(sh.angle) * sh.len;
        const ty = sh.y - Math.sin(sh.angle) * sh.len;
        const g = ctx.createLinearGradient(tx, ty, sh.x, sh.y);
        g.addColorStop(0,   "rgba(255,255,255,0)");
        g.addColorStop(0.5, `rgba(216,180,254,${sh.alpha * 0.6})`);
        g.addColorStop(1,   `rgba(216,180,254,${sh.alpha})`);
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
    Array.from({ length: 14 }, (_, i) => ({ x: 3 + i * 7, delay: i * 0.65, dur: 5 + (i % 4) }))
  );
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {pts.current.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-purple-400/20"
          style={{ left: `${p.x}%`, bottom: 0 }}
          animate={{ y: [0, -100, -180], opacity: [0, 0.4, 0], scale: [0.5, 1.1, 0.3] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED SWEEP TOP LINE
// ─────────────────────────────────────────────────────────────────────────────
function SweepLine() {
  return (
    <motion.div
      className="absolute top-0 left-0 right-0 h-[1.5px] pointer-events-none z-10"
      style={{
        background:
          "linear-gradient(90deg,transparent 0%,rgba(147,51,234,0.7) 35%,rgba(244,114,182,0.65) 55%,rgba(99,102,241,0.55) 75%,transparent 100%)",
        backgroundSize: "200% 100%",
      }}
      animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT ROW
// ─────────────────────────────────────────────────────────────────────────────
function ChatRow({ chat, index, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.38, delay: index * 0.06, ease: "easeOut" }}
      whileHover={{ x: 5 }}
      onClick={onClick}
      className="relative flex items-center gap-4 px-5 py-4 border-b border-white/[0.05] last:border-0 cursor-pointer group transition-all duration-300"
    >
      {/* row hover glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        style={{
          background:
            "linear-gradient(90deg,rgba(147,51,234,0.07) 0%,rgba(244,114,182,0.04) 60%,transparent 100%)",
        }}
      />
      {/* subtle left accent on hover */}
      <motion.div
        className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full pointer-events-none"
        initial={{ opacity: 0, scaleY: 0 }}
        whileHover={{ opacity: 1, scaleY: 1 }}
        transition={{ duration: 0.2 }}
        style={{ background: "linear-gradient(to bottom,#a855f7,#ec4899)" }}
      />

      {/* ── Avatar ── */}
      <div className="relative flex-shrink-0">
        {/* hover glow ring */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-purple-600/30 to-indigo-600/30 blur-[6px] opacity-0 group-hover:opacity-80 transition-opacity duration-300" />
        {/* gradient ring — fades in on hover */}
        <div className="relative p-[2.5px] rounded-full transition-all duration-400"
          style={{
            background: "linear-gradient(135deg,#475569,#475569)",
          }}
        >
          <motion.div
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-400"
            style={{ background: "linear-gradient(135deg,#a855f7,#ec4899,#6366f1)" }}
          />
          <div className="relative rounded-full overflow-hidden">
            {chat.otherUser?.avatar ? (
              <img
                src={chat.otherUser.avatar}
                alt=""
                className="w-11 h-11 rounded-full object-cover bg-slate-900 block"
              />
            ) : (
              <div
                className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-700 to-indigo-700 flex items-center justify-center text-white font-bold text-sm"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {chat.otherUser?.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
          </div>
        </div>
        {/* online dot */}
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0b0b1a] shadow-[0_0_7px_rgba(74,222,128,0.75)]" />
      </div>

      {/* ── Info ── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p
            className="text-white text-sm font-semibold truncate group-hover:text-purple-200 transition-colors duration-200"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {chat.otherUser?.name || "User"}
          </p>
          <span
            className="text-slate-600 text-[10px] flex-shrink-0 ml-2 group-hover:text-slate-500 transition-colors"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {chat.lastMessage?.createdAt
              ?.toDate?.()
              ?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ?? ""}
          </span>
        </div>
        <p
          className="text-slate-500 text-xs truncate group-hover:text-slate-400 transition-colors duration-200"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {chat.lastMessage?.text || "No messages yet"}
        </p>
      </div>

      {/* ── Chevron ── */}
      <motion.svg
        className="text-slate-700 group-hover:text-purple-400 flex-shrink-0 transition-colors duration-200"
        animate={{ x: 0 }}
        whileHover={{ x: 3 }}
        width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2"
      >
        <path d="M9 18l6-6-6-6" />
      </motion.svg>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const ChatList = () => {
  const [chats, setChats] = useState([]);
  const { user }          = useContext(AuthContext);
  const navigate          = useNavigate();

  // ── ALL ORIGINAL FIREBASE LOGIC — UNCHANGED ─────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "chats"),
      where("users", "array-contains", user.uid)
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatPromises = snapshot.docs.map(async (docSnap) => {
        const chatData    = docSnap.data();
        const otherUserId = chatData.users.find((id) => id !== user.uid);
        const userRef     = doc(db, "users", otherUserId);
        const userSnap    = await getDoc(userRef);
        const otherUser   = userSnap.exists() ? userSnap.data() : {};
        const messagesRef = collection(db, "chats", docSnap.id, "messages");
        const msgQuery    = query(messagesRef, orderBy("createdAt", "desc"), limit(1));
        const msgSnap     = await getDocs(msgQuery);
        let lastMessage   = null;
        msgSnap.forEach((m) => { lastMessage = m.data(); });
        return { id: docSnap.id, otherUserId, otherUser, lastMessage };
      });
      const resolvedChats = await Promise.all(chatPromises);
      setChats(resolvedChats);
    });
    return () => unsubscribe();
  }, [user]);
  // ── END ORIGINAL LOGIC ───────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .chat-scroll::-webkit-scrollbar { width: 3px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(147,51,234,0.25); border-radius: 999px; }
        .chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(168,85,247,0.45); }
      `}</style>

      {/* ── Cosmic page shell — same bg as every other page ── */}
      <div
        className="min-h-screen relative overflow-x-hidden flex items-start justify-center py-12 px-4"
        style={{ background: "linear-gradient(to bottom right, #0f0c29, #302b63, #24243e)" }}
      >
        <StarField />
        <FloatingParticles />

        {/* Ambient glow blobs */}
        <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] animate-pulse pointer-events-none z-0" />
        <div
          className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[100px] animate-pulse pointer-events-none z-0"
          style={{ animationDelay: "2s" }}
        />

        {/* ════════════════════════════════════════════════════════
            THE CENTERED GLASSMORPHISM CONTAINER
        ════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10 w-full max-w-md"
        >
          {/* ── Multi-layer outer glow aura ── */}
          <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-purple-600/20 via-pink-600/10 to-indigo-600/18 blur-[40px] pointer-events-none" />
          <div className="absolute -inset-3 rounded-[2.5rem] bg-gradient-to-br from-purple-600/12 via-transparent to-indigo-600/10 blur-[20px] pointer-events-none" />

          {/* ── Glass card ── */}
          <div
            className="relative overflow-hidden"
            style={{
              borderRadius: "28px",
              background: "rgba(11,11,26,0.72)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              border: "1px solid rgba(148,163,184,0.10)",
              boxShadow:
                "0 0 0 1px rgba(147,51,234,0.08), 0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* animated sweep top line */}
            <SweepLine />

            {/* inner top shimmer highlight */}
            <div
              className="absolute top-0 left-0 right-0 h-24 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(147,51,234,0.06) 0%, transparent 100%)",
              }}
            />

            {/* ── HEADER ── */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="relative flex items-center justify-between px-6 pt-6 pb-5"
            >
              <div>
                <h1
                  className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent leading-none mb-1"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Messages
                </h1>
                <p
                  className="text-slate-500 text-xs"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {chats.length} conversation{chats.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* live indicator */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
                style={{
                  background: "rgba(15,12,41,0.60)",
                  borderColor: "rgba(148,163,184,0.10)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_6px_rgba(74,222,128,0.8)] animate-pulse" />
                <span
                  className="text-slate-400 text-xs font-medium"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Live
                </span>
              </div>
            </motion.div>

            {/* header separator */}
            <div className="mx-5 h-px bg-gradient-to-r from-transparent via-slate-700/40 to-transparent" />

            {/* ── CHAT LIST — scrollable ── */}
            <div
              className="chat-scroll overflow-y-auto"
              style={{ maxHeight: "min(520px, 60vh)" }}
            >
              {/* Empty state */}
              <AnimatePresence>
                {chats.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, delay: 0.2 }}
                    className="relative flex flex-col items-center gap-4 py-16 overflow-hidden"
                  >
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(ellipse at 50% 40%, rgba(147,51,234,0.06) 0%, transparent 65%)",
                      }}
                    />
                    <motion.div
                      animate={{ y: [0, -8, 0], scale: [1, 1.07, 1] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                      style={{
                        background: "rgba(147,51,234,0.10)",
                        border: "1px solid rgba(147,51,234,0.18)",
                        boxShadow: "0 0 20px rgba(147,51,234,0.12)",
                      }}
                    >
                      💬
                    </motion.div>
                    <div className="text-center">
                      <p
                        className="text-slate-300 text-sm font-semibold mb-1"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        No conversations yet
                      </p>
                      <p
                        className="text-slate-600 text-xs"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        Start chatting with a developer
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat rows */}
              <AnimatePresence>
                {chats.map((chat, i) => (
                  <ChatRow
                    key={chat.id}
                    chat={chat}
                    index={i}
                    onClick={() => navigate(`/chat/${chat.otherUserId}`)}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* ── FOOTER ── */}
            {chats.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="px-5 py-3 flex items-center justify-center border-t"
                style={{ borderColor: "rgba(148,163,184,0.07)" }}
              >
                <p
                  className="text-slate-700 text-[11px]"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {chats.length} active thread{chats.length !== 1 ? "s" : ""}
                </p>
              </motion.div>
            )}

            {/* ── bottom inner glow ── */}
            <div
              className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top, rgba(147,51,234,0.05) 0%, transparent 100%)",
              }}
            />
          </div>
        </motion.div>

      </div>
    </>
  );
};

export default ChatList;