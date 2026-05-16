import React, { useState, useEffect, useContext } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

// ─────────────────────────────────────────────────────────────────────────────
// ROOT CAUSE OF WHITE LINE
// The issue is border-b with a visible border colour (even rgba) combined with
// the page content starting immediately under the navbar. At 0 scroll the
// border shows as a bright strip because:
//   1. The border is painted ABOVE the page background
//   2. When the page bg is dark but the border color differs, it pops as white
// FIX: Use a SINGLE bottom-border that transitions opacity 0→1 on scroll.
//      When unscrolled opacity is 0 so there is literally NO line drawn.
//      When scrolled it fades in as a soft purple glow line.
// ─────────────────────────────────────────────────────────────────────────────

// ─── ANIMATED SWEEP LINE (bottom edge, inside navbar) ────────────────────────
function SweepLine({ visible }) {
  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background:
          "linear-gradient(90deg, transparent 0%, rgba(147,51,234,0.6) 30%, rgba(244,114,182,0.5) 55%, rgba(99,102,241,0.4) 75%, transparent 100%)",
        backgroundSize: "200% 100%",
      }}
    >
      {/* sweep animation only when visible */}
      {visible && (
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(216,180,254,0.7) 50%, transparent 100%)",
            backgroundSize: "60% 100%",
          }}
          animate={{ backgroundPosition: ["-60% 0", "160% 0"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      )}
    </motion.div>
  );
}

// ─── LOGO MARK ────────────────────────────────────────────────────────────────
function NavLogo({ onClick }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className="flex items-center gap-2.5 cursor-pointer select-none flex-shrink-0"
    >
      <motion.div
        animate={{
          boxShadow: [
            "0 0 10px rgba(147,51,234,0.35)",
            "0 0 22px rgba(147,51,234,0.65)",
            "0 0 10px rgba(147,51,234,0.35)",
          ],
        }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, #9333ea, #c026d3, #6366f1)",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z"
            stroke="white"
            strokeWidth="1.4"
            fill="rgba(255,255,255,0.1)"
          />
          <circle cx="8" cy="8" r="2.2" fill="white" />
        </svg>
      </motion.div>

      <span
        className="text-white font-bold text-[17px] tracking-tight"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Dev
        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
          Connect
        </span>
      </span>
    </motion.div>
  );
}

// ─── NAV LINK ─────────────────────────────────────────────────────────────────
function NavItem({ to, label }) {
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <motion.div whileHover={{ y: -1 }} className="relative">
          {/* active pill — z-[-1] so NEVER covers text */}
          {isActive && (
            <motion.div
              layoutId="nav-active-pill"
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                zIndex: -1,
                background: "rgba(139, 92, 246, 0.13)",
                border: "1px solid rgba(139, 92, 246, 0.25)",
                boxShadow:
                  "0 0 12px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}

          <span
            className={`relative block px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 ${
              isActive
                ? "text-white"
                : "text-slate-400 hover:text-slate-100"
            }`}
            style={{ zIndex: 1, fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {label}
          </span>
        </motion.div>
      )}
    </NavLink>
  );
}

// ─── MAIN NAVBAR ──────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [userData, setUserData] = useState(null);

  const { user, logout } = useContext(AuthContext);
  const isLoggedIn = !!user;
  const navigate   = useNavigate();

  // ── ALL ORIGINAL LOGIC — UNCHANGED ──────────────────────────────────────────
  useEffect(() => {
    const fetchUser = async () => {
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setUserData(snap.data());
    };
    fetchUser();
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const NAV_LINKS_USER  = ["Home", "Feed", "Developers", "Chat", "Profile"];
  const NAV_LINKS_GUEST = [];
  const links = isLoggedIn ? NAV_LINKS_USER : NAV_LINKS_GUEST;

  const routeMap = {
    Home: "/",
    Feed: "/feed",
    Developers: "/developers",
    Chat: "/chat",
    Profile: "/profile",
  };
  // ── END ORIGINAL LOGIC ───────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&display=swap');
      `}</style>

      <motion.nav
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          // ── KEY FIX: smooth rgba transition via style prop not Tailwind classes
          // At top:     rgba(9,7,22, 0.30) — barely-there tint, stars visible
          // Scrolled:   rgba(9,7,22, 0.82) — rich dark glass over content
          // NO border-b class here — we handle it with SweepLine below
          background: scrolled
  ? "rgba(9, 7, 22, 0.92)"
  : "rgba(9, 7, 22, 0.92)",
          backdropFilter: "blur(10px)",
WebkitBackdropFilter: "blur(10px)",
          
          // box-shadow only when scrolled — zero shadow at top = NO white line
          boxShadow: scrolled
            ? "0 1px 0 rgba(139,92,246,0.12), 0 8px 36px rgba(0,0,0,0.45)"
            : "none",
          // ── CRITICAL: no border shorthand here — border creates white pixel ──
          // We use SweepLine (an absolutely positioned child) instead
       
        }}
      >
        {/* bottom sweep line — opacity 0 when at top, fades in on scroll */}
        <SweepLine visible={scrolled} />

        {/* ── INNER WRAPPER ── */}
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between"
          style={{ height: "64px" }}>

          {/* Logo */}
          <NavLogo onClick={() => navigate("/")} />

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5">
            {links.map((link) => (
              <NavItem key={link} to={routeMap[link]} label={link} />
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-2">
            {isLoggedIn ? (
              <>
               

                {/* Avatar dropdown */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setDropOpen((v) => !v)}
                    className="flex items-center gap-2.5 pl-1.5 pr-3.5 rounded-xl transition-all duration-300"
                    style={{
                      height: "38px",
                      background: dropOpen
                        ? "rgba(15,12,41,0.85)"
                        : "rgba(15,12,41,0.50)",
                      border: dropOpen
                        ? "1px solid rgba(139,92,246,0.40)"
                        : "1px solid rgba(148,163,184,0.09)",
                      backdropFilter: "blur(14px)",
                    }}
                  >
                    {/* gradient avatar ring */}
                    <div
                      className="p-[2px] rounded-lg flex-shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg, #9333ea, #ec4899, #6366f1)",
                      }}
                    >
                      {userData?.avatar ? (
                        <img
                          src={userData.avatar}
                          alt=""
                          className="w-6 h-6 rounded-[6px] block object-cover bg-slate-900"
                        />
                      ) : (
                        <div
                          className="w-6 h-6 rounded-[6px] flex items-center justify-center text-white text-[11px] font-bold bg-gradient-to-br from-purple-700 to-indigo-700"
                          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          {userData?.name?.[0]?.toUpperCase() || "D"}
                        </div>
                      )}
                    </div>

                    <span
                      className="text-slate-200 text-sm font-medium"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {userData?.name?.split(" ")[0] || "Dev"}
                    </span>

                    <motion.svg
                      animate={{ rotate: dropOpen ? 180 : 0 }}
                      transition={{ duration: 0.22 }}
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="text-slate-500"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </motion.svg>
                  </motion.button>

                  {/* Dropdown menu */}
                  <AnimatePresence>
                    {dropOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.94 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className="absolute right-0 w-52 rounded-2xl overflow-hidden z-50"
                        style={{
                          top: "calc(100% + 10px)",
                          background: "rgba(8, 6, 20, 0.96)",
                          backdropFilter: "blur(28px)",
                          WebkitBackdropFilter: "blur(28px)",
                          border: "1px solid rgba(148,163,184,0.09)",
                          boxShadow:
                            "0 0 0 1px rgba(139,92,246,0.10), 0 20px 60px rgba(0,0,0,0.65)",
                        }}
                      >
                        {/* user info header */}
                        <div
                          className="px-4 py-3.5 border-b"
                          style={{ borderColor: "rgba(148,163,184,0.07)" }}
                        >
                          <p
                            className="text-white text-sm font-semibold truncate leading-none mb-1"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                          >
                            {userData?.name || "Developer"}
                          </p>
                          <p
                            className="text-slate-600 text-[11px] truncate"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                          >
                            @{userData?.username || user?.email?.split("@")[0] || ""}
                          </p>
                        </div>

                        {/* menu items */}
                        {[
                          {
                            label: "Profile",
                            icon: (
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
                            ),
                            action: () => { navigate("/profile"); setDropOpen(false); },
                            danger: false,
                          },
                          {
                            label: "Edit Profile",
                            icon: (
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            ),
                            action: () => { navigate("/edit-profile"); setDropOpen(false); },
                            danger: false,
                          },
                        ].map((item) => (
                          <motion.button
                            key={item.label}
                            whileHover={{ x: 3 }}
                            onClick={item.action}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all duration-200"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="flex-shrink-0 text-slate-600"
                            >
                              {item.icon}
                            </svg>
                            {item.label}
                          </motion.button>
                        ))}

                        {/* divider */}
                        <div
                          className="mx-4 my-1 h-px"
                          style={{ background: "rgba(148,163,184,0.07)" }}
                        />

                        {/* sign out */}
                        <motion.button
                          whileHover={{ x: 3 }}
                          onClick={async () => {
                            await logout();
                            navigate("/login");
                            setDropOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 mb-1 text-sm text-pink-400 hover:text-pink-300 hover:bg-pink-500/6 transition-all duration-200"
                          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="flex-shrink-0"
                          >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                          </svg>
                          Sign Out
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/login")}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-all duration-300"
                  style={{
                    background: "rgba(15,12,41,0.40)",
                    border: "1px solid rgba(148,163,184,0.08)",
                    backdropFilter: "blur(10px)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  Login
                </motion.button>

                <motion.button
                  whileHover={{
                    scale: 1.06,
                    boxShadow: "0 0 28px rgba(147,51,234,0.55)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/register")}
                  className="relative px-5 py-2 rounded-xl text-sm font-semibold text-white overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, #9333ea 0%, #ec4899 50%, #6366f1 100%)",
                    boxShadow:
                      "0 4px 18px rgba(147,51,234,0.30), inset 0 1px 0 rgba(255,255,255,0.12)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {/* shine sweep */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 pointer-events-none"
                    animate={{ x: ["-150%", "200%"] }}
                    transition={{
                      duration: 2.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      repeatDelay: 2,
                    }}
                  />
                  <span className="relative">Get Started</span>
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile burger */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all"
            style={{
              background: "rgba(15,12,41,0.50)",
              border: "1px solid rgba(148,163,184,0.08)",
            }}
          >
            <AnimatePresence mode="wait">
              {menuOpen ? (
                <motion.svg
                  key="x"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="burger"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="md:hidden overflow-hidden"
              style={{
                background: "rgba(8, 6, 20, 0.94)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderTop: "1px solid rgba(148,163,184,0.06)",
              }}
            >
              <div className="px-5 py-4 space-y-1">
                {links.map((link, i) => (
                  <motion.div
                    key={link}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.045, duration: 0.28 }}
                  >
                    <Link
                      to={routeMap[link]}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.04] text-sm font-medium transition-all duration-200"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {link}
                    </Link>
                  </motion.div>
                ))}

                {!isLoggedIn && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex gap-2 pt-3"
                  >
                    <button
                      onClick={() => { navigate("/login"); setMenuOpen(false); }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-all"
                      style={{
                        border: "1px solid rgba(148,163,184,0.10)",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      Login
                    </button>
                    <button
                      onClick={() => { navigate("/register"); setMenuOpen(false); }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                      style={{
                        background:
                          "linear-gradient(135deg, #9333ea, #ec4899, #6366f1)",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      Register
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}

export default Navbar;

