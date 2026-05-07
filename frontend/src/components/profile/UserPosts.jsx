import React from "react";
import Post from "../posts/Post";
import { motion, AnimatePresence } from "framer-motion";

const UserPosts = ({
  posts,
  likePost,
  deletePost,
  addComment,
  deleteComment,
  likeComment,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* ── Section header ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-0.5 h-5 rounded-full bg-gradient-to-b from-purple-500 to-pink-500 flex-shrink-0" />
          <h3
            className="text-white font-semibold text-sm"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Posts
          </h3>
          <span
            className="text-[11px] text-slate-600 bg-slate-800/50 border border-slate-700/40 px-2 py-0.5 rounded-full"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {posts.length}
          </span>
        </div>

        {posts.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[11px] text-slate-600"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Most recent first
          </motion.p>
        )}
      </div>

      {/* ── Empty state ── */}
      <AnimatePresence>
        {posts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45 }}
            className="relative bg-slate-900/40 backdrop-blur-md border border-slate-800/50 border-dashed rounded-2xl py-14 flex flex-col items-center gap-3 overflow-hidden"
          >
            {/* radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(147,51,234,0.06)_0%,transparent_65%)] pointer-events-none" />

            <motion.div
              animate={{ y: [0, -7, 0], scale: [1, 1.06, 1] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-12 h-12 rounded-2xl bg-purple-600/12 border border-purple-500/18 flex items-center justify-center text-2xl shadow-[0_0_18px_rgba(147,51,234,0.12)]"
            >
              🛸
            </motion.div>

            <div className="text-center relative">
              <p
                className="text-slate-400 text-sm font-semibold mb-1"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                No posts yet
              </p>
              <p
                className="text-slate-600 text-xs"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                When this developer posts, it'll show here.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Post list ── */}
      <AnimatePresence>
        {posts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="space-y-0"
          >
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.4, delay: i * 0.07, ease: "easeOut" }}
              >
                <Post
                  post={post}
                  likePost={likePost}
                  deletePost={deletePost}
                  addComment={addComment}
                  deleteComment={deleteComment}
                  likeComment={likeComment}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UserPosts;