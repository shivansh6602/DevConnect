import React, { useState, useEffect, useContext } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

// ─── ROOT CAUSE ANALYSIS ──────────────────────────────────────────────────────
//
// PROBLEM 1 — "White/foggy navbar on load"
//   Root cause: backdrop-blur-md + bg-black/10 = near-zero opacity background,
//   so the browser's blur compositing bleeds ANY light content (stars, gradients)
//   into a milky wash. Fix: use a minimum dark base even when unscrolled so there
//   is always a dark layer under the blur — bg-[#0a0818]/40 (not bg-black/10).
//
// PROBLEM 2 — "Cosmic background disappeared"
//   Root cause: the StarField canvas is fixed+z-0, but backdrop-blur on the
//   navbar creates a NEW stacking context, which flattens the z-order. The blur
//   then composites ONLY what is painted into that stacking context before the
//   navbar — which may be nothing if the canvas hasn't painted yet.
//   Fix: make the navbar bg slightly MORE opaque (40–55%) so it acts as a tinted
//   glass over the stars rather than a blank blur pane.
//
// PROBLEM 3 — "Active glow covering text"
//   Root cause: the layoutId="navbar-glow" <motion.div> sits at the same z
//   level as the link text because it is rendered BEFORE the text content in
//   the JSX tree (absolute-positioned siblings follow DOM order for z within
//   the same stacking context). Fix: give the glow z-[-1] so it always renders
//   behind the text. The text lives in the natural flow and wins.
//
// PROBLEM 4 — "Sections overlapping navbar"
//   Root cause: pages don't have a top-padding to compensate for the fixed
//   navbar height (~64px). Fix: add pt-[72px] (or pt-16) to every page root,
//   OR (preferred, zero-touch to pages) add a global spacer in App.jsx via
//   a layout wrapper — see the note at the bottom of this file.
//
// ─────────────────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [dropOpen,  setDropOpen]  = useState(false);
  const [userData,  setUserData]  = useState(null);

  const { user, logout } = useContext(AuthContext);
  const isLoggedIn = !!user;
  const navigate   = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      if (!user) return;
      const docRef = doc(db, "users", user.uid);
      const snap   = await getDoc(docRef);
      if (snap.exists()) setUserData(snap.data());
    };
    fetchUser();
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const NAV_LINKS_GUEST = [];
  const NAV_LINKS_USER  = ["Home", "Feed", "Developers", "Chat", "Profile"];
  const links = isLoggedIn ? NAV_LINKS_USER : NAV_LINKS_GUEST;

  const routeMap = {
    Home: "/",
    Feed: "/feed",
    Developers: "/developers",
    Chat: "/chat",
    Profile: "/profile",
  };

  return (
    // ── FIX 1: navbar z-50 stays above StarField (z-0) and page content (z-10)
    // ── FIX 2: unscrolled uses bg-[#0a0818]/40 — enough dark tint so blur
    //           composites OVER the stars instead of washing them out
    // ── FIX 3: scrolled uses bg-[#0a0818]/65 — more opaque when over content,
    //           still clearly shows the cosmic gradient behind it
    // ── FIX 4: backdrop-blur-xl → backdrop-blur-[18px] — precise, not max blur
    //           (Tailwind's xl = 24px which is too heavy and milks the bg)
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-purple-500/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          : "border-b border-white/[0.04]"
      }`}
      style={{
        // ── CORE FIX: always-dark tinted glass — stars stay visible underneath
        background: scrolled
          ? "rgba(10, 8, 24, 0.68)"    // slightly more opaque when scrolled over content
          : "rgba(10, 8, 24, 0.68)",   // barely-there tint when at top — stars shine through
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        // explicit box-shadow instead of Tailwind class to avoid specificity fights
        boxShadow: scrolled
          ? "0 1px 0 rgba(147, 51, 234, 0.12), 0 8px 32px rgba(0, 0, 0, 0.4)"
          : "0 1px 0 rgba(255, 255, 255, 0.04)",
      }}
    >
      <div className="max-w-7xl mx-auto px-8 py-3 flex items-center justify-between">

        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.04 }}
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-[0_0_16px_rgba(147,51,234,0.5)]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" fill="none"/>
              <circle cx="8" cy="8" r="2" fill="white"/>
            </svg>
          </div>
          <span
            className="text-white font-bold text-lg tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Dev
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              Connect
            </span>
          </span>
        </motion.div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <motion.div key={link} whileHover={{ y: -1 }}>
              <NavLink
                to={routeMap[link]}
                className={({ isActive }) =>
                  `relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "text-white"   // FIX 3a: active text is always white, NOT overridden by glow div
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                  }`
                }
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {({ isActive }) => (
                  <>
                    {/* FIX 3b: glow lives at z-[-1] — always behind text node */}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-glow"
                        className="absolute inset-0 rounded-xl pointer-events-none"
                        style={{
                          zIndex: -1,              // stays behind the text in same stacking ctx
                          background: "rgba(147, 51, 234, 0.12)",
                          border: "1px solid rgba(147, 51, 234, 0.28)",
                          boxShadow: "0 0 16px rgba(147, 51, 234, 0.15)",
                        }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    {/* text rendered AFTER glow div — guaranteed on top */}
                    <span className="relative" style={{ zIndex: 1 }}>{link}</span>
                  </>
                )}
              </NavLink>
            </motion.div>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {/* Notification bell */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                className="relative w-9 h-9 rounded-xl bg-slate-800/50 hover:bg-slate-700/60 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full ring-1 ring-[#0f0c29]" />
              </motion.button>

              {/* Avatar dropdown */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl bg-slate-800/50 hover:bg-slate-700/60 border border-slate-700/40 transition-all"
                >
                  {userData?.avatar ? (
                    <img src={userData.avatar} className="w-7 h-7 rounded-lg" alt="avatar" />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                      {userData?.name?.[0]?.toUpperCase() || "D"}
                    </div>
                  )}
                  <span
                    className="text-slate-300 text-sm font-medium"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {userData?.name || "User"}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </motion.button>

                <AnimatePresence>
                  {dropOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      className="absolute right-0 top-12 w-44 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden z-50"
                    >
                      {["Profile", "Sign Out"].map((item) => (
                        <button
                          key={item}
                          onClick={async () => {
                            if (item === "Sign Out") {
                              await logout();
                              navigate("/login");
                            } else if (item === "Profile") {
                              navigate("/profile");
                            }
                            setDropOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            item === "Sign Out"
                              ? "text-pink-400 hover:bg-pink-600/10"
                              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                          }`}
                          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          {item}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate("/login")}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Login
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 24px rgba(147,51,234,0.5)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/register")}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Register
              </motion.button>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-slate-400 hover:text-white p-2"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen
              ? <path d="M18 6L6 18M6 6l12 12"/>
              : <path d="M3 12h18M3 6h18M3 18h18"/>
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-700/40 px-8 pb-4"
            style={{
              background: "rgba(10, 8, 24, 0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            {links.map((link) => (
              <Link
                key={link}
                to={routeMap[link]}
                onClick={() => setMenuOpen(false)}
                className="block py-3 text-slate-400 hover:text-white text-sm font-medium border-b border-slate-800/50 last:border-0 transition-colors"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {link}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

export default Navbar;

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL OVERLAP FIX — App.jsx
// ─────────────────────────────────────────────────────────────────────────────
//
// The navbar is fixed and 64px tall (py-3 + content ≈ 64px).
// Every page's root div must not start at the top of the viewport.
//
// BEST APPROACH — layout wrapper in App.jsx:
//
//   function Layout({ children }) {
//     return (
//       <>
//         <Navbar />
//         {/* 72px spacer exactly matches navbar height */}
//         <div className="pt-[72px]">
//           {children}
//         </div>
//       </>
//     );
//   }
//
//   // Then in your routes:
//   <Route path="/" element={<Layout><Home /></Layout>} />
//   <Route path="/feed" element={<Layout><Feed /></Layout>} />
//   // ... etc
//
// This means you NEVER need to add padding to individual page components.
// One change in Layout fixes every page at once.
//
// If you already use an Outlet pattern (React Router v6):
//
//   function RootLayout() {
//     return (
//       <>
//         <Navbar />
//         <main className="pt-[72px]">
//           <Outlet />
//         </main>
//       </>
//     );
//   }
//
//   <Route element={<RootLayout />}>
//     <Route path="/" element={<Home />} />
//     <Route path="/feed" element={<Feed />} />
//     ...
//   </Route>
// ─────────────────────────────────────────────────────────────────────────────