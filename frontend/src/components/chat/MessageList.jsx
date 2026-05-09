import React, { useEffect, useState, useContext, useRef } from "react";
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { AuthContext } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

// ─── SINGLE MESSAGE BUBBLE — same style as ChatBox ───────────────────────────
function MessageBubble({ msg, isOwn, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.32, delay: Math.min(index * 0.04, 0.25), ease: [0.23, 1, 0.32, 1] }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2.5 group`}
    >
      <motion.div
        whileHover={{ y: -2, scale: 1.012 }}
        transition={{ duration: 0.18 }}
        className="relative max-w-[72%]"
      >
        {isOwn ? (
          // Sender — gradient glass
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/30 via-pink-500/20 to-indigo-600/30 rounded-2xl blur-[8px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div
              className="relative px-4 py-2.5 rounded-2xl rounded-br-sm overflow-hidden"
              style={{
                background: "linear-gradient(135deg,rgba(147,51,234,0.85) 0%,rgba(236,72,153,0.75) 50%,rgba(99,102,241,0.80) 100%)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(216,180,254,0.22)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 20px rgba(147,51,234,0.22)",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/7 via-transparent to-transparent pointer-events-none rounded-2xl" />
              <p className="relative text-white text-sm leading-relaxed font-medium"
                style={{ fontFamily: "'Space Grotesk', sans-serif", textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
                {msg.text}
              </p>
              <div className="flex items-center justify-end gap-1.5 mt-1.5">
                <span className="text-[10px] text-white/45"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ?? ""}
                </span>
                {/* seen / delivered */}
                {msg.seen ? (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="flex items-center" title="Seen"
                  >
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3 5.5L8 1" stroke="rgba(103,232,249,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none" style={{ marginLeft: "-4px" }}>
                      <path d="M1 3.5L3 5.5L8 1" stroke="rgba(103,232,249,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
                ) : (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none" title="Delivered">
                    <path d="M1 3.5L3 5.5L8 1" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Receiver — dark translucent glass
          <div className="relative">
            <div className="absolute -inset-1 bg-slate-600/10 rounded-2xl blur-[6px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div
              className="relative px-4 py-2.5 rounded-2xl rounded-bl-sm overflow-hidden"
              style={{
                background: "rgba(15,12,41,0.68)",
                backdropFilter: "blur(22px)",
                WebkitBackdropFilter: "blur(22px)",
                border: "1px solid rgba(148,163,184,0.13)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 16px rgba(0,0,0,0.3)",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/4 via-transparent to-transparent pointer-events-none rounded-2xl" />
              <p className="relative text-slate-200 text-sm leading-relaxed"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {msg.text}
              </p>
              <span className="text-[10px] text-slate-600 mt-1 block"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ?? ""}
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const MessageList = ({ chatId }) => {
  const [messages, setMessages] = useState([]);
  const { user }                = useContext(AuthContext);
  const bottomRef               = useRef(null);

  // ── ALL ORIGINAL LOGIC — UNCHANGED ──────────────────────────────────────────
  useEffect(() => {
    if (!chatId) return;
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    if (!chatId || !user) return;
    const markSeen = async () => {
      for (const msg of messages) {
        if (msg.senderId !== user.uid && msg.seen === false) {
          try {
            await updateDoc(doc(db, "chats", chatId, "messages", msg.id), { seen: true });
          } catch (e) {}
        }
      }
    };
    markSeen();
  }, [messages, chatId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  // ── END ORIGINAL LOGIC ───────────────────────────────────────────────────────

  return (
    <div
      className="flex-1 overflow-y-auto px-5 py-4"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {messages.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center justify-center py-16 gap-3"
        >
          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-3xl"
          >
            💬
          </motion.div>
          <p className="text-slate-600 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Start the conversation
          </p>
        </motion.div>
      )}

      <AnimatePresence initial={false}>
        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isOwn={msg.senderId === user?.uid}
            index={i}
          />
        ))}
      </AnimatePresence>

      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;