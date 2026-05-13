import React, { useState, useContext } from "react";
import { formatDistanceToNow } from "date-fns";
import { AuthContext } from "../../context/AuthContext";
import { db } from "../../firebase";
import {
  doc, updateDoc, getDoc, deleteDoc, collection, addDoc,
} from "firebase/firestore";
import { increment, arrayUnion } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

// ─── AVATAR — gradient ring + glow, identical to ProfileHeader ────────────────
function PostAvatar({ src, name, size = "md" }) {
  const dim = size === "sm" ? "w-7 h-7" : "w-10 h-10";
  return (
    <div className="relative flex-shrink-0">
      <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-purple-600/40 via-pink-500/30 to-indigo-600/40 blur-[5px] opacity-70" />
      <div className="relative p-[2px] rounded-full bg-gradient-to-br from-purple-500 via-pink-400 to-indigo-500">
        {src ? (
          <img src={src} alt={name} className={`${dim} rounded-full block bg-slate-900 object-cover`} />
        ) : (
          <div
            className={`${dim} rounded-full bg-gradient-to-br from-purple-700 to-indigo-700 flex items-center justify-center text-white font-bold ${size === "sm" ? "text-[10px]" : "text-sm"}`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {name?.[0]?.toUpperCase() || "U"}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COMMENT CARD ─────────────────────────────────────────────────────────────
function CommentCard({ c, onLike, onDelete, currentUid, index }) {
  const [liked, setLiked] = useState(false);

  const handleLike = () => {
    if (liked) return;
    setLiked(true);
    onLike(c.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex gap-2.5 group/comment"
    >
      <PostAvatar src={c.user?.avatar} name={c.user?.name} size="sm" />

      <div className="flex-1 min-w-0 bg-slate-800/50 border border-slate-700/35 hover:border-purple-500/25 rounded-xl px-3.5 py-2.5 transition-all duration-300">
        <div className="flex items-center justify-between mb-1">
          <p className="text-white text-xs font-semibold leading-none"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {c.user?.name}
          </p>
          <p className="text-slate-600 text-[10px]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {c.createdAt
              ? formatDistanceToNow(c.createdAt.toDate?.() ?? c.createdAt, { addSuffix: true })
              : "just now"}
          </p>
        </div>

        <p className="text-slate-300 text-xs leading-relaxed mb-2"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {c.text}
        </p>

        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.82 }}
            onClick={handleLike}
            className={`flex items-center gap-1 text-[11px] font-medium transition-all duration-200 ${
              liked ? "text-pink-400" : "text-slate-500 hover:text-pink-400"
            }`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <motion.span animate={{ scale: liked ? [1, 1.5, 1] : 1 }} transition={{ duration: 0.25 }}>
              {liked ? "❤️" : "🤍"}
            </motion.span>
            {(c.likes || 0) + (liked ? 1 : 0)}
          </motion.button>

          {c.user?.userId === currentUid && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(c.id)}
              className="text-[11px] text-slate-600 hover:text-red-400 transition-colors duration-200 ml-auto opacity-0 group-hover/comment:opacity-100"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Delete
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── MAIN POST COMPONENT ──────────────────────────────────────────────────────
const Post = ({ post }) => {
  const [commentText, setCommentText]       = useState("");
  const [showComments, setShowComments]     = useState(false);
  const [localLiked, setLocalLiked]         = useState(false);
  const [commentFocused, setCommentFocused] = useState(false);
  const { user } = useContext(AuthContext);

  // ── ALL ORIGINAL FIREBASE HANDLERS — UNCHANGED ──────────────────────────────
  const likePostHandler = async () => {
    const postRef = doc(db, "posts", post.id);
    const snap    = await getDoc(postRef);
    const data    = snap.data();
    if (data.likedBy?.includes(user.uid)) return;
    setLocalLiked(true);
    await updateDoc(postRef, {
      likes: increment(1),
      likedBy: arrayUnion(user.uid),
    });
  };

  const deletePostHandler = async () => {
    await deleteDoc(doc(db, "posts", post.id));
  };

  const addCommentHandler = async () => {
    if (!commentText.trim()) return;
    try {
      const commentRef = collection(db, "posts", post.id, "comments");
      const userDoc    = await getDoc(doc(db, "users", user.uid));
      const userData   = userDoc.data();
      await addDoc(commentRef, {
        text: commentText,
        likes: 0,
        likedBy: [],
        createdAt: new Date(),
        user: {
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar,
          userId: user.uid,
        },
      });
      setCommentText("");
    } catch (error) {
      console.log("Error adding comment:", error);
    }
  };

  const deleteCommentHandler = async (commentId) => {
    await deleteDoc(doc(db, "posts", post.id, "comments", commentId));
  };

  const likeCommentHandler = async (commentId) => {
    const ref  = doc(db, "posts", post.id, "comments", commentId);
    const snap = await getDoc(ref);
    const data = snap.data();
    if (data.likedBy?.includes(user.uid)) return;
    await updateDoc(ref, {
      likes: increment(1),
      likedBy: arrayUnion(user.uid),
    });
  };
  // ── END ORIGINAL HANDLERS ────────────────────────────────────────────────────

  const alreadyLiked   = post.likedBy?.includes(user.uid) || localLiked;
  const commentCount   = post.comments?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="relative group/post mb-4"
    >
      {/* ── Hover glow aura — same as ProfileHeader card ── */}
      <div className="absolute -inset-2 bg-gradient-to-br from-purple-600/15 via-pink-600/8 to-indigo-600/15 rounded-3xl blur-[22px] opacity-0 group-hover/post:opacity-100 transition-opacity duration-400 pointer-events-none" />

      {/* ── Glass card ── */}
      <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 group-hover/post:border-purple-500/30 rounded-2xl overflow-hidden transition-all duration-300">

        {/* animated top gradient line */}
        <motion.div
          className="h-0.5 w-full pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(147,51,234,0.6) 35%, rgba(244,114,182,0.5) 65%, transparent 100%)",
            backgroundSize: "200% 100%",
          }}
          animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />

        {/* ── Inner shimmer overlay ── */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(147,51,234,0.04)_0%,transparent_60%)] pointer-events-none" />

        <div className="relative p-5">

          {/* ── Header ── */}
          <div className="flex items-start gap-3 mb-4">
            <PostAvatar src={post.user?.avatar} name={post.user?.name} />

            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold leading-none mb-0.5"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {post.user?.name}
              </p>
              <p className="text-slate-500 text-[11px]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {post.createdAt
                  ? formatDistanceToNow(post.createdAt.toDate?.() ?? post.createdAt, { addSuffix: true })
                  : "Just now"}
              </p>
            </div>

            {/* owner delete — top-right, revealed on hover */}
            {post.userId === user.uid && (
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                onClick={deletePostHandler}
                className="opacity-0 group-hover/post:opacity-100 transition-opacity duration-300 flex items-center gap-1 text-[11px] text-slate-600 hover:text-red-400 px-2.5 py-1 rounded-lg hover:bg-red-500/8 border border-transparent hover:border-red-500/20"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
                Delete
              </motion.button>
            )}
          </div>

          {/* ── Content ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <h3 className="text-white text-base font-bold mb-1.5 leading-snug"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {post.title}
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {post.content}
            </p>
          </motion.div>

          {/* ── Divider ── */}
          <div className="h-px mb-3.5 bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />

          {/* ── Action row ── */}
          <div className="flex items-center gap-1">

            {/* Like */}
            <motion.button
              whileHover={!alreadyLiked ? { scale: 1.05, boxShadow: "0 0 16px rgba(244,114,182,0.3)" } : {}}
              whileTap={!alreadyLiked ? { scale: 0.88 } : {}}
              onClick={likePostHandler}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-300 ${
                alreadyLiked
                  ? "text-pink-400 bg-pink-500/10 border-pink-500/25"
                  : "text-slate-400 bg-slate-800/50 border-slate-700/40 hover:text-pink-400 hover:bg-pink-500/8 hover:border-pink-500/20"
              }`}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <motion.span animate={{ scale: alreadyLiked ? [1, 1.5, 1] : 1 }} transition={{ duration: 0.3 }}>
                {alreadyLiked ? "❤️" : "🤍"}
              </motion.span>
              <span>{(post.likes ?? 0) + (localLiked && !post.likedBy?.includes(user.uid) ? 1 : 0)}</span>
            </motion.button>

            {/* Comments toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowComments((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-300 ${
                showComments
                  ? "text-indigo-400 bg-indigo-500/10 border-indigo-500/25"
                  : "text-slate-400 bg-slate-800/50 border-slate-700/40 hover:text-indigo-400 hover:bg-indigo-500/8 hover:border-indigo-500/20"
              }`}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {commentCount}
            </motion.button>

          
          </div>

          {/* ── Comments section ── */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-2.5">

                  {/* Comment list */}
                  {post.comments?.length > 0 && (
                    <AnimatePresence>
                      {post.comments.map((c, idx) => (
                        <CommentCard
                          key={c.id}
                          c={c}
                          index={idx}
                          onLike={likeCommentHandler}
                          onDelete={deleteCommentHandler}
                          currentUid={user.uid}
                        />
                      ))}
                    </AnimatePresence>
                  )}

                  {post.comments?.length === 0 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-slate-600 text-xs text-center py-2"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      No comments yet. Be the first.
                    </motion.p>
                  )}

                  {/* Add comment input */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`flex gap-2 mt-1 transition-all duration-300 ${
                      commentFocused ? "drop-shadow-[0_0_10px_rgba(147,51,234,0.22)]" : ""
                    }`}
                  >
                    <input
                      type="text"
                      placeholder="Write a comment…"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onFocus={() => setCommentFocused(true)}
                      onBlur={() => setCommentFocused(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (!commentText.trim()) return;
                          addCommentHandler();
                        }
                      }}
                      className={`flex-1 bg-slate-800/50 text-slate-200 placeholder-slate-600 text-xs px-3.5 py-2.5 rounded-xl border outline-none transition-all duration-300 ${
                        commentFocused
                          ? "border-purple-500/50 bg-slate-800/70"
                          : "border-slate-700/40 hover:border-slate-600/55"
                      }`}
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    />

                    <motion.button
                      whileHover={{ scale: 1.07, boxShadow: "0 0 14px rgba(147,51,234,0.4)" }}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => {
                        if (!commentText.trim()) return;
                        addCommentHandler();
                        setCommentText("");
                      }}
                      className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl text-white transition-all duration-300 ${
                        commentText.trim()
                          ? "bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 shadow-md shadow-purple-500/25"
                          : "bg-slate-800/60 border border-slate-700/40 text-slate-600 cursor-not-allowed"
                      }`}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" />
                      </svg>
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </motion.div>
  );
};

export default Post;