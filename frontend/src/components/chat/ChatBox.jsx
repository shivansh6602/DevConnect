import { useState, useEffect, useRef, useContext } from "react";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import { AuthContext } from "../../context/AuthContext";
import { serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import chatBg from "../../assets/videos/devconnect-chat-bg.mp4";

// ─── FLOATING PARTICLES ───────────────────────────────────────────────────────
function ChatParticles() {
  const particles = useRef(
    Array.from({ length: 12 }, (_, i) => ({
      x: 4 + i * 8.5,
      delay: i * 0.8,
      dur: 6 + (i % 4),
    }))
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
      {particles.current.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-purple-400/20"
          style={{ left: `${p.x}%`, bottom: 0 }}
          animate={{ y: [0, -100, -180], opacity: [0, 0.4, 0], scale: [0.5, 1, 0.3] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

// ─── MESSAGE BUBBLE ───────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3), ease: [0.23, 1, 0.32, 1] }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2.5 group`}
    >
      <motion.div
        whileHover={{ y: -2, scale: 1.015 }}
        transition={{ duration: 0.2 }}
        className="relative max-w-[72%]"
      >
        {isOwn ? (
          // ── SENDER bubble: purple→pink gradient glass ──
          <div className="relative">
            {/* glow aura */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/35 via-pink-500/25 to-indigo-600/35 rounded-2xl blur-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div
              className="relative px-4 py-2.5 rounded-2xl rounded-br-sm overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(147,51,234,0.85) 0%, rgba(236,72,153,0.75) 50%, rgba(99,102,241,0.80) 100%)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(216,180,254,0.25)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 24px rgba(147,51,234,0.25)",
              }}
            >
              {/* inner shimmer */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none rounded-2xl" />
              <p className="relative text-white text-sm leading-relaxed font-medium"
                style={{ fontFamily: "'Space Grotesk', sans-serif", textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
                {msg.text}
              </p>

              {/* timestamp + status */}
              <div className="flex items-center justify-end gap-1.5 mt-1.5">
                <span className="text-[10px] text-white/50" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ?? ""}
                </span>
                {/* seen/delivered indicator */}
                <motion.div
                  className="flex items-center gap-0.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {msg.seen ? (
                    // SEEN — dual cyan checks
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className="flex items-center gap-0.5"
                      title="Seen"
                    >
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3 5.5L8 1" stroke="rgba(103,232,249,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none" style={{ marginLeft: "-4px" }}>
                        <path d="M1 3.5L3 5.5L8 1" stroke="rgba(103,232,249,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.div>
                  ) : (
                    // DELIVERED — single white check
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none" title="Delivered">
                      <path d="M1 3.5L3 5.5L8 1" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        ) : (
          // ── RECEIVER bubble: dark translucent glass ──
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-slate-600/15 to-purple-600/10 rounded-2xl blur-[8px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div
              className="relative px-4 py-2.5 rounded-2xl rounded-bl-sm overflow-hidden"
              style={{
                background: "rgba(15,12,41,0.70)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(148,163,184,0.15)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 20px rgba(0,0,0,0.35)",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/4 via-transparent to-transparent pointer-events-none rounded-2xl" />
              <p className="relative text-slate-200 text-sm leading-relaxed"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {msg.text}
              </p>
              <div className="mt-1.5">
                <span className="text-[10px] text-slate-600"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ?? ""}
                </span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── MAIN CHATBOX ─────────────────────────────────────────────────────────────
const ChatBox = ({ chatId, otherUserId }) => {
  const { user }    = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState("");
  const [focused, setFocused]   = useState(false);
  const [sending, setSending]   = useState(false);
  const bottomRef               = useRef(null);


  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    if (!user || !chatId || messages.length === 0) return;
    const unseen = messages.filter((msg) => msg.senderId !== user.uid && !msg.seen);
    if (unseen.length === 0) return;
    unseen.forEach(async (msg) => {
      const ref = doc(db, "chats", chatId, "messages", msg.id);
      await updateDoc(ref, { seen: true });
    });
  }, [messages, user, chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    setSending(true);
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      senderId: user.uid,
      createdAt: serverTimestamp(),
      seen: false,
    });
    await addDoc(collection(db, "notifications"), {
      to: otherUserId,
      from: user.uid,
      type: "message",
      read: false,
      createdAt: serverTimestamp(),
    });
    setText("");
    setSending(false);
  };
  // ── END ORIGINAL LOGIC ───────────────────────────────────────────────────────

  return (
   <div className="flex flex-col h-full relative overflow-hidden rounded-[28px]">

     {/* ═══════════════════════════════════════════
    🌌 VIDEO BACKGROUND LAYER
═══════════════════════════════════════════ */}
<div className="absolute inset-0 z-0 overflow-hidden">

  {/* VIDEO */}
  <video
    src={chatBg}
    autoPlay
    muted
    loop
    playsInline
   className="
  absolute
  inset-0
  w-full
  h-full
  object-cover
"
    style={{
      opacity: 0.55,
      filter: "blur(0px) saturate(1.15) brightness(0.9)",
    }}
  />

  {/* DARK OVERLAY */}
  <div className="absolute inset-0 bg-[#050816]/35" />

  {/* SOFT PURPLE SPACE TINT */}
  <div
    className="
      absolute inset-0
      bg-gradient-to-b
      from-purple-950/20
      via-transparent
      to-indigo-950/30
    "
  />

  {/* CINEMATIC VIGNETTE */}
  <div
    className="absolute inset-0"
    style={{
      background:
        "radial-gradient(circle at center, transparent 45%, rgba(3,2,12,0.55) 100%)",
    }}
  />

  {/* LEFT GLOW */}
  <div
    className="
      absolute
      -top-24
      -left-24
      w-[420px]
      h-[420px]
      bg-purple-600/10
      rounded-full
      blur-[120px]
      pointer-events-none
    "
  />

  {/* RIGHT GLOW */}
  <div
    className="
      absolute
      -bottom-24
      -right-24
      w-[380px]
      h-[380px]
      bg-pink-600/10
      rounded-full
      blur-[100px]
      pointer-events-none
    "
  />
</div>

      {/* floating particles */}
      <ChatParticles />

      {/* ═══════════════════════════════════════════
          📜 MESSAGES SCROLL AREA
      ═══════════════════════════════════════════ */}
      <div
        className="relative z-10 flex-1 overflow-y-auto px-5 py-4"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`.chat-scroll::-webkit-scrollbar { display: none; }`}</style>

        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center justify-center h-full gap-3 py-16"
          >
            <motion.div
              animate={{ y: [0, -8, 0], scale: [1, 1.06, 1] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-14 h-14 rounded-2xl bg-purple-600/15 border border-purple-500/20 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(147,51,234,0.15)]"
            >
              💬
            </motion.div>
            <p className="text-slate-500 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Start the conversation
            </p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isOwn={msg.senderId === user.uid}
              index={i}
            />
          ))}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* ═══════════════════════════════════════════
          ⌨️ INPUT AREA — "spaceship console"
      ═══════════════════════════════════════════ */}
      <div className="relative z-10 px-4 py-4">
        {/* input card glow aura */}
        <motion.div
          animate={{ opacity: focused ? 0.8 : 0.25 }}
          transition={{ duration: 0.35 }}
          className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-pink-600/10 to-indigo-600/20 rounded-2xl blur-[16px] pointer-events-none"
        />

        <div
          className="relative flex items-center gap-3 px-4 py-3 rounded-2xl overflow-hidden transition-all duration-300"
          style={{
            background: focused
              ? "rgba(15,12,41,0.82)"
              : "rgba(15,12,41,0.70)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: focused
              ? "1px solid rgba(168,85,247,0.45)"
              : "1px solid rgba(148,163,184,0.12)",
            boxShadow: focused
              ? "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 20px rgba(147,51,234,0.15)"
              : "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* animated top gradient line on focus */}
          <AnimatePresence>
            {focused && (
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                exit={{ scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-purple-500 via-pink-400 to-indigo-500 rounded-full origin-left pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* original input — untouched */}
          <input
            type="text"
            placeholder="Type message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
            className="flex-1 bg-transparent text-slate-200 text-sm placeholder-slate-600 outline-none border-none"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          />

          {/* emoji quick-insert */}
          <div className="flex gap-1 flex-shrink-0">
            {["⚡", "🚀"].map((e) => (
              <motion.button
                key={e}
                type="button"
                whileHover={{ scale: 1.2, y: -2 }}
                whileTap={{ scale: 0.85 }}
                onClick={() => setText((t) => t + e)}
                className="text-sm w-7 h-7 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-purple-500/30 flex items-center justify-center transition-all"
              >
                {e}
              </motion.button>
            ))}
          </div>

          {/* Send button — original onClick preserved */}
          <motion.button
            whileHover={text.trim() ? { scale: 1.08, boxShadow: "0 0 18px rgba(147,51,234,0.5)" } : {}}
            whileTap={text.trim() ? { scale: 0.92 } : {}}
            onClick={sendMessage}
            disabled={!text.trim()}
            className={`relative flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 overflow-hidden transition-all duration-300 ${
              text.trim()
                ? "bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 shadow-md shadow-purple-500/30 text-white"
                : "bg-slate-800/50 border border-slate-700/30 text-slate-600 cursor-not-allowed"
            }`}
          >
            {/* shine sweep on active */}
            {text.trim() && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 pointer-events-none"
                animate={{ x: ["-150%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
              />
            )}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" />
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;