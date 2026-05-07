import React, { useState, useRef, useContext, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../../context/AuthContext";

// ─── tiny floating particles — same as Feed/ProfileHeader atmosphere ──────────
function CardParticles() {
  const particles = useRef(
    Array.from({ length: 10 }, (_, i) => ({
      x: 8 + i * 9,
      delay: i * 0.7,
      dur: 4 + (i % 4),
    }))
  );
  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
      {particles.current.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-purple-400/25"
          style={{ left: `${p.x}%`, bottom: 0 }}
          animate={{ y: [0, -80, -140], opacity: [0, 0.5, 0], scale: [0.5, 1.1, 0.3] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

// ─── animated shimmer sweep ───────────────────────────────────────────────────
function ShimmerLine() {
  return (
    <motion.div
      className="absolute top-0 left-0 right-0 h-0.5 rounded-full pointer-events-none"
      style={{
        background:
          "linear-gradient(90deg, transparent 0%, rgba(216,180,254,0.7) 40%, rgba(244,114,182,0.6) 60%, transparent 100%)",
        backgroundSize: "200% 100%",
      }}
      animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
    />
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const CreatePost = ({ addPost }) => {
  const [title, setTitle]       = useState("");
  const [text, setText]         = useState("");
  const [focused, setFocused]   = useState(null); // "title" | "text" | null
  const [posting, setPosting]   = useState(false);
  const [done, setDone]         = useState(false);
  const [hovered, setHovered]   = useState(false);
  const textareaRef             = useRef(null);
  const { user }                = useContext(AuthContext);

  // auto-expand textarea
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [text]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;
    setPosting(true);
    await addPost({ title, text });
    setDone(true);
    setTimeout(() => {
      setTitle(""); setText(""); setPosting(false); setDone(false);
    }, 1000);
  };

  const charLeft   = 280 - text.length;
  const isReady    = title.trim() && text.trim();
  const isFocused  = focused !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative mb-0"
    >
      {/* ── Outer glow aura — same as ProfileHeader card ── */}
      <motion.div
        animate={{
          opacity: isFocused ? 0.85 : hovered ? 0.6 : 0.35,
          scale:   isFocused ? 1.01 : 1,
        }}
        transition={{ duration: 0.4 }}
        className="absolute -inset-3 bg-gradient-to-br from-purple-600/25 via-pink-600/12 to-indigo-600/20 rounded-3xl blur-[28px] pointer-events-none"
      />

      {/* ── Glass card ── */}
      <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden transition-all duration-300 hover:border-purple-500/30">

        {/* animated shimmer top line */}
        <ShimmerLine />

        {/* floating particles */}
        <CardParticles />

        {/* ── User avatar row ── */}
        <div className="relative flex items-center gap-3 px-5 pt-5 pb-3 border-b border-slate-800/50">
          <div className="relative flex-shrink-0">
            {/* avatar glow */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-purple-600/40 via-pink-500/30 to-indigo-600/40 blur-[8px] opacity-70" />
            {/* gradient ring */}
            <div className="relative p-[2px] rounded-full bg-gradient-to-br from-purple-500 via-pink-400 to-indigo-500">
              {user?.photoURL ? (
                <motion.img
                  src={user.photoURL}
                  alt="avatar"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-9 h-9 rounded-full block bg-slate-900 object-cover"
                />
              ) : (
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-700 to-indigo-700 flex items-center justify-center text-white text-sm font-bold"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {user?.displayName?.[0]?.toUpperCase() || "D"}
                </motion.div>
              )}
            </div>
            {/* online dot */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900 shadow-[0_0_7px_rgba(74,222,128,0.75)]" />
          </div>

          <div>
            <p className="text-white text-sm font-semibold leading-none mb-0.5"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {user?.displayName || "Developer"}
            </p>
            <p className="text-slate-500 text-[11px]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Share something with the community
            </p>
          </div>

          {/* section label */}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-purple-500 to-pink-500" />
            <span className="text-slate-500 text-[11px] font-semibold tracking-wide"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              New Post
            </span>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="relative px-5 pt-4 pb-5 space-y-3">

          {/* Title input */}
          <motion.div
            animate={{ opacity: 1 }}
            className={`relative transition-all duration-300 ${
              focused === "title" ? "drop-shadow-[0_0_12px_rgba(147,51,234,0.28)]" : ""
            }`}
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => setFocused("title")}
              onBlur={() => setFocused(null)}
              placeholder="Post title…"
              maxLength={100}
              className={`w-full bg-slate-800/50 text-white placeholder-slate-600 text-sm font-semibold px-4 py-2.5 rounded-xl border outline-none transition-all duration-300 ${
                focused === "title"
                  ? "border-purple-500/55 bg-slate-800/75 placeholder-slate-500"
                  : "border-slate-700/40 hover:border-slate-600/55"
              }`}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            />
            {/* focus ring glow strip */}
            <AnimatePresence>
              {focused === "title" && (
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  exit={{ scaleX: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-purple-500 via-pink-400 to-indigo-500 rounded-full origin-left"
                />
              )}
            </AnimatePresence>
          </motion.div>

          {/* Textarea */}
          <motion.div
            animate={{ opacity: 1 }}
            className={`relative transition-all duration-300 ${
              focused === "text" ? "drop-shadow-[0_0_12px_rgba(147,51,234,0.25)]" : ""
            }`}
          >
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 280))}
              onFocus={() => setFocused("text")}
              onBlur={() => setFocused(null)}
              placeholder="What's on your mind? Share a thought, discovery, or update…"
              rows={2}
              className={`w-full bg-slate-800/50 text-slate-200 placeholder-slate-600 text-sm px-4 py-3 rounded-xl border outline-none resize-none transition-all duration-300 overflow-hidden ${
                focused === "text"
                  ? "border-purple-500/55 bg-slate-800/75 placeholder-slate-500"
                  : "border-slate-700/40 hover:border-slate-600/55"
              }`}
              style={{ fontFamily: "'Space Grotesk', sans-serif", minHeight: "72px" }}
            />
            <AnimatePresence>
              {focused === "text" && (
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  exit={{ scaleX: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-purple-500 via-pink-400 to-indigo-500 rounded-full origin-left"
                />
              )}
            </AnimatePresence>
            {/* char counter */}
            <AnimatePresence>
              {focused === "text" && (
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`absolute bottom-2.5 right-3 text-[10px] pointer-events-none transition-colors ${
                    charLeft < 40 ? "text-pink-500" : "text-slate-700"
                  }`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {charLeft}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Action row ── */}
          <div className="flex items-center justify-between pt-1">

            {/* emoji shortcuts */}
            <div className="flex gap-1.5">
              {["💡", "🛠️", "🚀", "🔥"].map((emoji) => (
                <motion.button
                  key={emoji}
                  type="button"
                  whileHover={{ scale: 1.2, y: -3, boxShadow: "0 4px 14px rgba(147,51,234,0.3)" }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setText((t) => t + emoji)}
                  className="w-7 h-7 rounded-lg bg-slate-800/60 border border-slate-700/40 hover:border-purple-500/35 hover:bg-slate-800/90 text-sm flex items-center justify-center transition-all duration-200"
                >
                  {emoji}
                </motion.button>
              ))}
            </div>

            {/* Post button */}
            <motion.button
              type="submit"
              disabled={posting || !isReady}
              whileHover={isReady && !posting ? {
                scale: 1.05,
                boxShadow: "0 0 22px rgba(147,51,234,0.5)",
              } : {}}
              whileTap={isReady && !posting ? { scale: 0.96 } : {}}
              className={`relative flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold overflow-hidden transition-all duration-300 ${
                posting || !isReady
                  ? "bg-slate-800/50 text-slate-600 border border-slate-700/30 cursor-not-allowed"
                  : "text-white bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40"
              }`}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {/* shine sweep */}
              {isReady && !posting && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/12 to-transparent -skew-x-12 pointer-events-none"
                  animate={{ x: ["-150%", "200%"] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                />
              )}

              <AnimatePresence mode="wait">
                {done ? (
                  <motion.span key="done"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="flex items-center gap-1.5">
                    <span className="text-green-300">✓</span> Posted!
                  </motion.span>
                ) : posting ? (
                  <motion.span key="loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Posting…
                  </motion.span>
                ) : (
                  <motion.span key="idle"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" />
                    </svg>
                    Post
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default CreatePost;