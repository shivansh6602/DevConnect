import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { motion, AnimatePresence } from "framer-motion";

const MessageInput = ({ chatId }) => {
  const [text, setText]       = useState("");
  const [focused, setFocused] = useState(false);
  const [sending, setSending] = useState(false);
  const { user }              = useContext(AuthContext);

  // ── ORIGINAL LOGIC — UNCHANGED ──────────────────────────────────────────────
  const sendMessage = async () => {
    if (!text.trim() || !user || !chatId) return;
    setSending(true);
    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: text,
        senderId: user.uid,
        createdAt: serverTimestamp(),
        seen: false,
      });
      setText("");
    } catch (error) {
      console.log("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };
  // ── END ORIGINAL LOGIC ───────────────────────────────────────────────────────

  const canSend = text.trim() && !sending;

  return (
    <div className="relative px-4 py-4">
      {/* input glow aura */}
      <motion.div
        animate={{ opacity: focused ? 0.75 : 0.2 }}
        transition={{ duration: 0.35 }}
        className="absolute -inset-1 bg-gradient-to-r from-purple-600/18 via-pink-600/8 to-indigo-600/18 rounded-2xl blur-[14px] pointer-events-none"
      />

      <div
        className="relative flex items-center gap-3 px-4 py-3 rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: focused ? "rgba(15,12,41,0.82)" : "rgba(15,12,41,0.65)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: focused
            ? "1px solid rgba(168,85,247,0.42)"
            : "1px solid rgba(148,163,184,0.10)",
          boxShadow: focused
            ? "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 18px rgba(147,51,234,0.12)"
            : "inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        {/* focus gradient underline */}
        <AnimatePresence>
          {focused && (
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              exit={{ scaleX: 0, opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-purple-500 via-pink-400 to-indigo-500 rounded-full origin-left pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* original input — untouched */}
        <input
          type="text"
          value={text}
          placeholder="Type message…"
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
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
              className="text-sm w-7 h-7 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-purple-500/30 flex items-center justify-center transition-all duration-200"
            >
              {e}
            </motion.button>
          ))}
        </div>

        {/* Send button — original onClick preserved */}
        <motion.button
          whileHover={canSend ? { scale: 1.1, boxShadow: "0 0 18px rgba(147,51,234,0.5)" } : {}}
          whileTap={canSend ? { scale: 0.9 } : {}}
          disabled={!canSend}
          onClick={sendMessage}
          className={`relative flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 overflow-hidden transition-all duration-300 ${
            canSend
              ? "bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 shadow-md shadow-purple-500/30 text-white"
              : "bg-slate-800/50 border border-slate-700/30 text-slate-600 cursor-not-allowed"
          }`}
        >
          {/* shine sweep */}
          {canSend && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/14 to-transparent -skew-x-12 pointer-events-none"
              animate={{ x: ["-150%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
            />
          )}
          {sending ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
              className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" />
            </svg>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default MessageInput;