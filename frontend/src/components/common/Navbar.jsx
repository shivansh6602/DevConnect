import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../../context/AuthContext";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const { user, logout } = useContext(AuthContext);
const isLoggedIn = !!user;
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

const NAV_LINKS_GUEST = ["Home"];
const NAV_LINKS_USER = ["Feed", "Developers", "Chat", "Profile"];

const links = isLoggedIn ? NAV_LINKS_USER : NAV_LINKS_GUEST;
        const routeMap = {
  Home: "/",
  Feed: "/feed",
  Developers: "/developers",
  Chat: "/chat",
  Profile: "/profile",
};
  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 shadow-lg shadow-purple-500/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <motion.div whileHover={{ scale: 1.04 }} className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-[0_0_16px_rgba(147,51,234,0.5)]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" fill="none"/>
              <circle cx="8" cy="8" r="2" fill="white"/>
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Dev<span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">Connect</span>
          </span>
        </motion.div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
 

{links.map((link) => (
  <motion.div key={link} whileHover={{ scale: 1.05 }}>
    <Link
      to={routeMap[link]}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
        link === "Feed" || link === "Home"
          ? "text-purple-300 bg-purple-600/10 border border-purple-500/20"
          : "text-slate-400 hover:text-white hover:bg-slate-800/60"
      }`}
    >
      {link}
    </Link>
  </motion.div>
))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <motion.button whileHover={{ scale: 1.1 }} className="relative w-9 h-9 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full ring-1 ring-[#0f0c29]" />
              </motion.button>

              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 transition-all"
                >
                  <img src="https://api.dicebear.com/7.x/bottts/svg?seed=me&backgroundColor=1a1a3e" className="w-7 h-7 rounded-lg" alt="avatar" />
                  <span className="text-slate-300 text-sm font-medium" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Shivansh</span>
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
                      className="absolute right-0 top-12 w-44 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden"
                    >
                      {["Profile", "Settings", "Sign Out"].map((item) => (
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
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
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

        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-slate-400 hover:text-white p-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? <path d="M18 6L6 18M6 6l12 12"/> : <path d="M3 12h18M3 6h18M3 18h18"/>}
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 px-8 pb-4"
          >
            {links.map((link) => (
              <a key={link} href="#" className="block py-3 text-slate-400 hover:text-white text-sm font-medium border-b border-slate-800/60" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {link}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

export default Navbar;