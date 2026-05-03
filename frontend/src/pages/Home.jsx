import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const SAMPLE_POSTS = [
  {
    id: 1,
    avatar: "https://api.dicebear.com/9.x/toon-head/svg?seed=ananya&backgroundColor=b6e3f4&mouth=smile&eyes=happy",
    name: "Felix Richter",
    handle: "@felixdev",
    time: "2m ago",
    content: "Just shipped a real-time collaborative editor using CRDTs and WebSockets. The diff-merge algorithm alone took 3 weeks 😅 — but SO worth it. OSS drop coming soon 🚀",
    tag: "WebSockets",
    likes: 142,
    comments: 38,
    liked: false,
  },
  {
    id: 2,
    avatar: "https://api.dicebear.com/9.x/toon-head/svg?seed=alex&backgroundColor=b6e3f4&mouth=smile&eyes=happy",
    name: "Alexa",
    handle: "@alexabuilds",
    time: "14m ago",
    content: "Hot take: Most devs over-engineer auth. 95% of apps just need email + magic link. Save the OAuth complexity for when you actually need it 🔑",
    tag: "Architecture",
    likes: 89,
    comments: 61,
    liked: true,
  },
  {
    id: 3,
    avatar: "https://api.dicebear.com/9.x/toon-head/svg?seed=rahul&backgroundColor=d1d4f9&mouth=smile&eyes=happy",
    name: "Marco Liu",
    handle: "@marco_io",
    time: "1h ago",
    content: "3 months into building in public. Revenue: $0. Followers: 2.1k. Lessons learned: priceless. Building something real takes longer than every guru says it does.",
    tag: "IndieHacker",
    likes: 311,
    comments: 92,
    liked: false,
  },
];

const SAMPLE_DEVS = [
  {
    id: 1,
    avatar: "https://api.dicebear.com/9.x/toon-head/svg?seed=rul&backgroundColor=d1d4f9&mouth=smile&eyes=happy",
    name: "Nataliya Kim",
    role: "Full Stack Engineer",
    skills: ["React", "Node.js", "PostgreSQL"],
    followers: "4.2k",
  },
  {
    id: 2,
    avatar: "https://api.dicebear.com/9.x/toon-head/svg?seed=abcr&backgroundColor=0f172a&mouth=smile&eyes=happy",
    name: "Axel Torres",
    role: "ML Engineer",
    skills: ["Python", "PyTorch", "Rust"],
    followers: "8.1k",
  },
  {
    id: 3,
    avatar: "https://api.dicebear.com/9.x/toon-head/svg?seed=abckr&backgroundColor=0f172a&mouth=smile&eyes=happy",
    name: "Tim Cook",
    role: "DevOps Architect",
    skills: ["Kubernetes", "Terraform", "Go"],
    followers: "3.7k",
  },
];

const CHAT_MESSAGES = [
  {
    id: 1,
    sender: "Nova Kim",
avatar: "https://api.dicebear.com/9.x/toon-head/svg?seed=rujjjjjjjjjjjjjjjjjpl&mouth=smile&eyes=happy",    text: "Hey! Saw your post about CRDTs — super interesting 👀",
    time: "10:42",
    own: false
  },
  {
    id: 2,
    sender: "You",
    avatar: "https://api.dicebear.com/9.x/toon-head/svg?seed=me&eyes=happy&mouth=smile",
    text: "Thanks! I'm planning to open-source it next week.",
    time: "10:43",
    own: true
  },
  {
    id: 3,
    sender: "Nova Kim",
avatar: "https://api.dicebear.com/9.x/toon-head/svg?seed=rujjjjjjjjjjjjjjjjjpl&mouth=smile&eyes=happy",    text: "Would love to contribute. Can we hop on a call?",
    time: "10:44",
    own: false
  }
];

const NAV_LINKS_GUEST = ["Home", "Explore", "Login", "Register"];
const NAV_LINKS_USER = ["Feed", "Developers", "Chat", "Profile"];
const ANIMATED_LINES = [
  "Share your thoughts 💬",
  "Connect with developers 🌍",
  "Build your dev identity 🚀",
  "Chat. Post. Grow.",
];

// ─── STAR FIELD ───────────────────────────────────────────────────────────────
// Design system spec:
//   Stars: 300, size 0.5–3px, white, opacity [0.1→1→0.1], scale [1→1.3→1], 1.5–4.5s, delay 0–3s
//   Shooting stars: 5, 80px wide, 1.5px tall, purple-300 (#d8b4fe) centre gradient,
//                   30–40° angle, 2–3s duration, 4–6s repeat-delay
//   Parallax: star container moves y 0 → -100 on scroll
function StarField() {
  const canvasRef = useRef(null);
  const animFrame = useRef(null);
  const starsRef = useRef([]);
  const shootersRef = useRef([]);
  const { scrollYProgress } = useScroll();
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, -100]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 2;
    };
    resize();
    window.addEventListener("resize", resize);

    // 300 stars — white, opacity/scale twinkle per design system
    starsRef.current = Array.from({ length: 300 }, () => {
      const dur = Math.random() * 3 + 1.5;           // 1.5–4.5s
      const delay = Math.random() * 3;                // 0–3s
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight * 2,
        r: (Math.random() * 2.5 + 0.5) / 2,          // radius from 0.5–3px diameter
        alpha: Math.random(),
        dAlpha: 0.006 / dur * (Math.random() > 0.5 ? 1 : -1),
        scaleT: Math.random() * Math.PI * 2,
        scaleDelta: (2 * Math.PI) / (dur * 60),
        delayFrames: Math.floor(delay * 60),
      };
    });

    // 5 shooting stars per design system
    const mkShooter = (stagger = 0) => {
      const angle = Math.PI / 180 * (30 + Math.random() * 10); // 30–40°
      const waitFrames = Math.floor((4 + Math.random() * 2) * 60); // 4–6s
      return {
        x: 0, y: 0,
        angle,
        speed: 8 + Math.random() * 5,
        len: 80,
        alpha: 0,
        phase: "wait",
        waitFrames,
        waitCounter: Math.floor(stagger),
      };
    };
    shootersRef.current = Array.from({ length: 5 }, (_, i) => mkShooter(i * 72));

    const respawn = (sh) => {
      sh.x = Math.random() * canvas.width * 0.65;
      sh.y = Math.random() * (canvas.height * 0.4);
      sh.alpha = 0;
      sh.phase = "shoot";
      sh.angle = Math.PI / 180 * (30 + Math.random() * 10);
      sh.speed = 8 + Math.random() * 5;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ── Stars
      starsRef.current.forEach((s) => {
        if (s.delayFrames > 0) { s.delayFrames--; return; }
        // opacity cycle [0.1 → 1 → 0.1]
        s.alpha += s.dAlpha;
        if (s.alpha >= 1)   { s.alpha = 1;   s.dAlpha *= -1; }
        if (s.alpha <= 0.1) { s.alpha = 0.1; s.dAlpha *= -1; }
        // scale cycle [1 → 1.3 → 1]
        s.scaleT += s.scaleDelta;
        const scale = 1 + 0.3 * Math.abs(Math.sin(s.scaleT));
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = "#ffffff";
        if (s.r > 0.7) { ctx.shadowBlur = 3; ctx.shadowColor = "rgba(255,255,255,0.5)"; }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // ── Shooting stars
      shootersRef.current.forEach((sh) => {
        if (sh.phase === "wait") {
          sh.waitCounter++;
          if (sh.waitCounter >= sh.waitFrames) {
            sh.waitCounter = 0;
            respawn(sh);
          }
          return;
        }

        sh.x += Math.cos(sh.angle) * sh.speed;
        sh.y += Math.sin(sh.angle) * sh.speed;
        sh.alpha = Math.min(1, sh.alpha + 0.12);

        if (sh.x > canvas.width || sh.y > canvas.height * 0.6) {
          sh.alpha -= 0.07;
          if (sh.alpha <= 0) {
            sh.phase = "wait";
            sh.waitFrames = Math.floor((4 + Math.random() * 2) * 60);
            sh.waitCounter = 0;
            return;
          }
        }

        const tailX = sh.x - Math.cos(sh.angle) * sh.len;
        const tailY = sh.y - Math.sin(sh.angle) * sh.len;

        // Design system gradient: transparent → #d8b4fe (purple-300) → transparent
        const grad = ctx.createLinearGradient(tailX, tailY, sh.x, sh.y);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(0.45, `rgba(216,180,254,${sh.alpha * 0.6})`);  // purple-300
        grad.addColorStop(0.75, `rgba(216,180,254,${sh.alpha})`);
        grad.addColorStop(1,    `rgba(216,180,254,${sh.alpha * 0.2})`);

        ctx.save();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;                          // design system: 1.5px
        ctx.shadowBlur = 12;
        ctx.shadowColor = "rgba(192,132,252,0.5)";   // purple-400/50 per design system
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(sh.x, sh.y);
        ctx.stroke();
        ctx.restore();
      });

      animFrame.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animFrame.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <motion.div style={{ y: yParallax }} className="fixed inset-0 pointer-events-none z-0">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </motion.div>
  );
}

// // ─── NAVBAR ───────────────────────────────────────────────────────────────────
// function Navbar() {
//   const [scrolled, setScrolled] = useState(false);
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [dropOpen, setDropOpen] = useState(false);

//   const { user, logout } = useContext(AuthContext);
// const isLoggedIn = !!user;
//   const navigate = useNavigate();

//   useEffect(() => {
//     const onScroll = () => setScrolled(window.scrollY > 20);
//     window.addEventListener("scroll", onScroll);
//     return () => window.removeEventListener("scroll", onScroll);
//   }, []);

// const NAV_LINKS_GUEST = ["Home"];
// const NAV_LINKS_USER = ["Feed", "Developers", "Chat", "Profile"];

// const links = isLoggedIn ? NAV_LINKS_USER : NAV_LINKS_GUEST;
//         const routeMap = {
//   Home: "/",
//   Feed: "/feed",
//   Developers: "/developers",
//   Chat: "/chat",
//   Profile: "/profile",
// };
//   return (
//     <motion.nav
//       initial={{ y: -80, opacity: 0 }}
//       animate={{ y: 0, opacity: 1 }}
//       transition={{ duration: 0.7, ease: "easeOut" }}
//       className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
//         scrolled
//           ? "bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 shadow-lg shadow-purple-500/10"
//           : "bg-transparent"
//       }`}
//     >
//       <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
//         {/* Logo */}
//         <motion.div whileHover={{ scale: 1.04 }} className="flex items-center gap-2.5 cursor-pointer">
//           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-[0_0_16px_rgba(147,51,234,0.5)]">
//             <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
//               <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" fill="none"/>
//               <circle cx="8" cy="8" r="2" fill="white"/>
//             </svg>
//           </div>
//           <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
//             Dev<span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">Connect</span>
//           </span>
//         </motion.div>

//         {/* Desktop links */}
//         <div className="hidden md:flex items-center gap-1">
 

// {links.map((link) => (
//   <motion.div key={link} whileHover={{ scale: 1.05 }}>
//     <Link
//       to={routeMap[link]}
//       className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
//         link === "Feed" || link === "Home"
//           ? "text-purple-300 bg-purple-600/10 border border-purple-500/20"
//           : "text-slate-400 hover:text-white hover:bg-slate-800/60"
//       }`}
//     >
//       {link}
//     </Link>
//   </motion.div>
// ))}
//         </div>

//         {/* Right side */}
//         <div className="hidden md:flex items-center gap-3">
//           {isLoggedIn ? (
//             <>
//               <motion.button whileHover={{ scale: 1.1 }} className="relative w-9 h-9 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-all">
//                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
//                   <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
//                   <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
//                 </svg>
//                 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full ring-1 ring-[#0f0c29]" />
//               </motion.button>

//               <div className="relative">
//                 <motion.button
//                   whileHover={{ scale: 1.05 }}
//                   onClick={() => setDropOpen(!dropOpen)}
//                   className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 transition-all"
//                 >
//                   <img src="https://api.dicebear.com/7.x/bottts/svg?seed=me&backgroundColor=1a1a3e" className="w-7 h-7 rounded-lg" alt="avatar" />
//                   <span className="text-slate-300 text-sm font-medium" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Shivansh</span>
//                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
//                     <path d="M6 9l6 6 6-6"/>
//                   </svg>
//                 </motion.button>
//                 <AnimatePresence>
//                   {dropOpen && (
//                     <motion.div
//                       initial={{ opacity: 0, y: 8, scale: 0.96 }}
//                       animate={{ opacity: 1, y: 0, scale: 1 }}
//                       exit={{ opacity: 0, y: 8, scale: 0.96 }}
//                       className="absolute right-0 top-12 w-44 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden"
//                     >
//                       {["Profile", "Settings", "Sign Out"].map((item) => (
//                         <button
//                           key={item}
//                           onClick={() => { if (item === "Sign Out") {
//   logout();
// navigate("/login");
// }
// if (item === "Profile") navigate("/profile"); setDropOpen(false); }}
//                           className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${item === "Sign Out" ? "text-pink-400 hover:bg-pink-600/10" : "text-slate-400 hover:text-white hover:bg-slate-800/60"}`}
//                           style={{ fontFamily: "'Space Grotesk', sans-serif" }}
//                         >
//                           {item}
//                         </button>
//                       ))}
//                     </motion.div>
//                   )}
//                 </AnimatePresence>
//               </div>
//             </>
//           ) : (
//             <>
//               <motion.button
//                 whileHover={{ scale: 1.05 }}
//                onClick={() => navigate("/login")}
//                 className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
//                 style={{ fontFamily: "'Space Grotesk', sans-serif" }}
//               >
//                 Login
//               </motion.button>
//               <motion.button
//                 whileHover={{ scale: 1.05, boxShadow: "0 0 24px rgba(147,51,234,0.5)" }}
//                 whileTap={{ scale: 0.98 }}
//                 onClick={() => navigate("/register")}
//                 className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300"
//                 style={{ fontFamily: "'Space Grotesk', sans-serif" }}
//               >
//                 Register
//               </motion.button>
//             </>
//           )}
//         </div>

//         <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-slate-400 hover:text-white p-2">
//           <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//             {menuOpen ? <path d="M18 6L6 18M6 6l12 12"/> : <path d="M3 12h18M3 6h18M3 18h18"/>}
//           </svg>
//         </button>
//       </div>

//       <AnimatePresence>
//         {menuOpen && (
//           <motion.div
//             initial={{ opacity: 0, height: 0 }}
//             animate={{ opacity: 1, height: "auto" }}
//             exit={{ opacity: 0, height: 0 }}
//             className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 px-8 pb-4"
//           >
//             {links.map((link) => (
//               <a key={link} href="#" className="block py-3 text-slate-400 hover:text-white text-sm font-medium border-b border-slate-800/60" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
//                 {link}
//               </a>
//             ))}
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.nav>
//   );
// }

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  const [lineIdx, setLineIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(true);
const navigate = useNavigate();
const { user } = useContext(AuthContext);

  useEffect(() => {
    const line = ANIMATED_LINES[lineIdx];
    if (typing) {
      if (displayed.length < line.length) {
        const t = setTimeout(() => setDisplayed(line.slice(0, displayed.length + 1)), 45);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setTyping(false), 1800);
        return () => clearTimeout(t);
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 22);
        return () => clearTimeout(t);
      } else {
        setLineIdx((i) => (i + 1) % ANIMATED_LINES.length);
        setTyping(true);
      }
    }
  }, [displayed, typing, lineIdx]);

  return (
    <section className="relative min-h-screen flex items-center pt-20 pb-12 overflow-hidden">
      {/* Ambient glows — design system: purple-600/20 600×600 blur-[120px] pulse, pink-600/15 500×500 blur-[100px] pulse 2s delay */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-[100px] animate-pulse pointer-events-none" style={{ animationDelay: "2s" }} />

      <div className="max-w-7xl mx-auto px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* LEFT */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/30 bg-purple-600/10 text-purple-300 text-xs font-semibold mb-6 tracking-wide"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
            The Social Platform for Developers
          </motion.div>

          {/* Heading — design system: text-7xl md:text-8xl, font-bold */}
          <h1
            className="text-7xl md:text-8xl font-bold text-white leading-[1.0] tracking-tight mb-6"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Dev
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              Connect
            </span>
          </h1>

          {/* Typewriter — design system: text-xl md:text-2xl, text-slate-300 */}
          <div className="h-12 mb-6 flex items-center">
            <span
              className="text-xl md:text-2xl font-semibold text-slate-300"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {displayed}
              <span className="inline-block w-0.5 h-6 bg-purple-400 ml-1 animate-pulse align-middle" />
            </span>
          </div>

          {/* Subtext — design system: text-xl, text-slate-300 */}
          <p
            className="text-slate-300 text-xl leading-relaxed mb-10 max-w-lg"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Where developers share ideas, grow their network, and build a presence — all in one premium community built by devs, for devs.
          </p>

          {/* Buttons — design system: from-purple-600 via-pink-600 to-indigo-600, px-8 py-4, rounded-2xl */}
          <div className="flex flex-wrap gap-4">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(147,51,234,0.5)" }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-2xl font-semibold text-white text-lg bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Get Started
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-2xl font-semibold text-slate-300 text-lg bg-slate-900/60 backdrop-blur-md border border-slate-700/50 hover:border-purple-500/50 hover:text-white transition-all duration-300"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Explore Feed
            </motion.button>
          </div>

          {/* Social proof */}
          <div className="mt-10 flex items-center gap-4">
    <div className="flex -space-x-2">
  {["axel", "nova", "priya", "marco", "zara"].map((s) => (
    <img
      key={s}
      src={`https://api.dicebear.com/9.x/toon-head/svg?seed=${s}&eyes=happy&mouth=smile`}
      className="w-8 h-8 rounded-full border-2 border-[#0f0c29]"
      alt="avatar"
    />
  ))}
</div>
            <span className="text-slate-400 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <span className="text-slate-200 font-semibold">12,400+</span> developers already connected
            </span>
          </div>
        </motion.div>

        {/* RIGHT — Video, glow container — design system: -inset-6, purple/pink/indigo 50%, blur-[50px], opacity-80 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="relative z-10 flex justify-center"
        >
          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-to-r from-purple-600/50 via-pink-600/50 to-indigo-600/50 rounded-3xl blur-[50px] opacity-80 pointer-events-none" />

            {/* Floating — design system: y [0,-15,0], 5s, infinite, easeInOut */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full max-w-[560px]"
            >
              <div className="relative rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/10 via-transparent to-indigo-600/10 z-10 pointer-events-none rounded-3xl" />
                <video
                  src="/Animated_video.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover block"
                  style={{ aspectRatio: "16/10", maxHeight: "480px" }}
                />
              </div>

              {/* Floating stat cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="absolute -bottom-5 -left-6 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl px-4 py-3 shadow-2xl"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm">🔥</div>
                  <div>
                    <p className="text-white font-bold text-sm leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>1,247</p>
                    <p className="text-slate-400 text-xs mt-0.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Posts today</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
                className="absolute -top-5 -right-6 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl px-4 py-3 shadow-2xl"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-slate-400 text-xs font-medium" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>340 online now</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-slate-600"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 5v14M5 12l7 7 7-7"/>
        </svg>
      </motion.div>
    </section>
  );
}

// ─── FEED PREVIEW ─────────────────────────────────────────────────────────────
function PostCard({ post, delay }) {
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -4 }}
      className="relative bg-slate-900/60 backdrop-blur-md border border-slate-700/50 hover:border-purple-500/50 rounded-2xl p-6 transition-all duration-300 cursor-pointer group"
    >
      {/* Hover glow — design system: purple-600/20 to pink-600/20, blur-xl */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative flex items-start gap-3 mb-4">
        <img src={post.avatar} className="w-10 h-10 rounded-xl border border-slate-700/50 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" alt={post.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{post.name}</p>
              <p className="text-slate-500 text-xs" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{post.handle} · {post.time}</p>
            </div>
            <span className="text-xs text-purple-300 bg-purple-600/10 px-2.5 py-1 rounded-full border border-purple-500/20" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              #{post.tag}
            </span>
          </div>
        </div>
      </div>

      <p className="relative text-slate-300 text-sm leading-relaxed mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {post.content}
      </p>

      <div className="relative flex items-center gap-5 pt-3 border-t border-slate-700/50">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => { setLiked(!liked); setLikes(l => liked ? l - 1 : l + 1); }}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${liked ? "text-pink-400" : "text-slate-500 hover:text-pink-400"}`}
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <motion.svg animate={{ scale: liked ? [1, 1.35, 1] : 1 }} transition={{ duration: 0.25 }} width="15" height="15" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </motion.svg>
          {likes}
        </motion.button>

        <button className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-400 transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {post.comments}
        </button>

        <button className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-purple-300 transition-colors ml-auto" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>
          </svg>
          Share
        </button>
      </div>
    </motion.div>
  );
}

function FeedSection() {
  return (
    <section className="relative py-24 z-10">
      <div className="max-w-7xl mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-semibold text-purple-300 tracking-widest uppercase mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Live Feed
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            What devs are talking about
          </h2>
          <p className="text-slate-400 text-xl max-w-xl mx-auto" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Real posts from your community — unfiltered, technical, and always relevant.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAMPLE_POSTS.map((post, i) => (
            <PostCard key={post.id} post={post} delay={i * 0.15} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 rounded-2xl text-sm font-semibold text-slate-400 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 hover:border-purple-500/50 hover:text-white transition-all duration-300"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            View Full Feed →
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

// ─── DEVELOPERS SECTION ───────────────────────────────────────────────────────
function DevCard({ dev, delay }) {
  const [following, setFollowing] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8 }}
      className="relative bg-slate-900/60 backdrop-blur-md border border-slate-700/50 hover:border-purple-500/50 rounded-2xl p-8 text-center group transition-all duration-300"
    >
      {/* Hover glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative mb-4">
        <img src={dev.avatar} className="w-16 h-16 rounded-2xl mx-auto border border-slate-700/50 shadow-2xl group-hover:scale-110 transition-transform duration-300" alt={dev.name} />
        <span className="absolute -bottom-1 right-[calc(50%-2.25rem)] w-4 h-4 bg-green-400 rounded-full border-2 border-[#0f0c29]" />
      </div>

      <h3 className="relative text-white font-bold text-base mb-0.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{dev.name}</h3>
      <p className="relative text-slate-500 text-xs mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{dev.role}</p>

      <div className="relative flex flex-wrap justify-center gap-1.5 mb-5">
        {dev.skills.map((sk) => (
          <span key={sk} className="text-xs text-indigo-400 bg-indigo-600/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {sk}
          </span>
        ))}
      </div>

      <div className="relative flex items-center justify-center gap-2 mb-5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <span className="text-slate-500 text-xs" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{dev.followers} followers</span>
      </div>

      <div className="relative flex gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setFollowing(!following)}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
            following
              ? "bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:border-pink-500/30 hover:text-pink-400"
              : "bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/40"
          }`}
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {following ? "Unfollow" : "Follow"}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800/60 border border-slate-700/50 hover:text-white hover:border-purple-500/30 transition-all duration-300"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          View Profile
        </motion.button>
      </div>
    </motion.div>
  );
}

function DevelopersSection() {
  return (
    <section className="relative py-24 z-10">
      <div className="max-w-7xl mx-auto px-8">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent mb-24" />

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-semibold text-indigo-400 tracking-widest uppercase mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Discover Developers
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Find your kind of dev
          </h2>
          <p className="text-slate-400 text-xl max-w-xl mx-auto" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Browse and follow developers who are building exciting things in your stack.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SAMPLE_DEVS.map((dev, i) => (
            <DevCard key={dev.id} dev={dev} delay={i * 0.15} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CHAT PREVIEW ─────────────────────────────────────────────────────────────
function ChatSection() {
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setTyping(p => !p), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative py-24 z-10">
      <div className="max-w-7xl mx-auto px-8">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-pink-500/20 to-transparent mb-24" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-block text-xs font-semibold text-pink-400 tracking-widest uppercase mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Real-time Chat
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              DMs that<br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">actually matter</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Reach out to any developer in the community. Collaborate, ask questions, build together — in real time.
            </p>

            <div className="space-y-3">
              {[
                { icon: "⚡", text: "Real-time messaging powered by Firestore" },
                { icon: "🔐", text: "Private DMs, end-to-end" },
                { icon: "📎", text: "Share code snippets and links" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-pink-600/10 border border-pink-500/20 flex items-center justify-center text-sm">{icon}</span>
                  <span className="text-slate-400 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Chat UI mock — glow container design system */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute -inset-6 bg-gradient-to-r from-purple-600/50 via-pink-600/50 to-indigo-600/50 rounded-3xl blur-[50px] opacity-80 pointer-events-none" />

            <div className="relative bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700/50 bg-slate-900/40">
                <img src="https://api.dicebear.com/9.x/toon-head/svg?seed=rujjjjjjjjjjjjjjjjjpl&mouth=smile&eyes=happy&backgroundColor=111827" className="w-14  h-15 rounded-xl border border-slate-700/50" alt="" />
                <div>
                  <p className="text-white font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Nova Kim</p>
                  <p className="text-green-400 text-xs" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>● Online</p>
                </div>
                <div className="ml-auto flex gap-2">
                  <button className="w-7 h-7 rounded-lg bg-slate-800/60 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="p-5 space-y-4 min-h-[220px]">
                {CHAT_MESSAGES.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className={`flex items-end gap-2 ${msg.own ? "flex-row-reverse" : ""}`}
                  >
                    {!msg.own && <img src={msg.avatar} className="w-12 h-12 rounded-lg border border-slate-700/50 flex-shrink-0" alt="" />}
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-snug ${
                      msg.own
                        ? "bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white rounded-br-sm shadow-lg shadow-purple-500/25"
                        : "bg-slate-800/60 text-slate-300 rounded-bl-sm border border-slate-700/50"
                    }`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {msg.text}
                      <span className={`block text-[10px] mt-1 ${msg.own ? "text-white/50 text-right" : "text-slate-600"}`}>{msg.time}</span>
                    </div>
                  </motion.div>
                ))}

                {/* Typing indicator */}
                <AnimatePresence>
                  {typing && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-end gap-2"
                    >
                      <img src="https://api.dicebear.com/9.x/toon-head/svg?seed=rujjjjjjjjjjjjjjjjjpl&mouth=smile&eyes=happy" className="w-7 h-7 rounded-lg border border-slate-700/50" alt="" />
                      <div className="bg-slate-800/60 border border-slate-700/50 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                        {[0, 0.2, 0.4].map((d) => (
                          <motion.span key={d} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: d }}
                            className="w-1.5 h-1.5 bg-slate-500 rounded-full block" />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input */}
              <div className="px-5 pb-5">
                <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3">
                  <span className="text-slate-600 text-sm flex-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Reply to Nova…</span>
                  <button className="w-7 h-7 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="relative py-28 z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-8">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent mb-24" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* CTA glow — design system: layer1 -inset-8 blur-[80px], layer2 inset-0 blur-3xl */}
          <div className="absolute -inset-8 bg-gradient-to-r from-purple-600/50 via-pink-600/50 to-indigo-600/50 rounded-3xl blur-[80px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/40 via-pink-600/40 to-indigo-600/40 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-900/90" />
          <div className="absolute inset-0 border-2 border-purple-500/30 rounded-3xl" />

          {/* Pulsing orbs */}
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 5, repeat: Infinity }}
            className="absolute top-0 left-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl" />
          <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 6, repeat: Infinity }}
            className="absolute bottom-0 right-1/4 w-72 h-72 bg-pink-600/15 rounded-full blur-3xl" />

          {/* Rotating ring — design system: rotate 360, 25s, linear */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -right-16 -top-16 w-48 h-48 border border-purple-500/10 rounded-full"
          />

          <div className="relative z-10 text-center py-20 px-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <span className="inline-block text-xs font-semibold text-purple-300 tracking-widest uppercase mb-5 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-600/10" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Ready to join?
              </span>
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-5 leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Join the Developer<br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                  Community
                </span>
              </h2>
              <p className="text-slate-300 text-xl max-w-lg mx-auto mb-10" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Post. Connect. Chat. Grow your network with 12,000+ developers who are building the future.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(147,51,234,0.6)" }}
                  whileTap={{ scale: 0.98 }}
                  className="px-10 py-5 rounded-2xl font-semibold text-white text-lg bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Get Started — It's Free
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-10 py-5 rounded-2xl font-semibold text-slate-300 text-lg bg-slate-900/60 backdrop-blur-md border border-slate-700/50 hover:border-purple-500/50 hover:text-white transition-all duration-300"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  View Demo
                </motion.button>
              </div>

              <div className="mt-10 flex items-center justify-center gap-8 text-slate-500 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {["No credit card", "Open source", "Free forever"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-purple-400">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="relative z-10 py-12 border-t border-slate-800/60">
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" fill="none"/><circle cx="8" cy="8" r="2" fill="white"/></svg>
          </div>
          <span className="text-slate-500 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>DevConnect</span>
        </div>
        <p className="text-slate-600 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          © 2025 DevConnect. Built for developers, by developers.
        </p>
        <div className="flex gap-6 text-slate-600 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {["Privacy", "Terms", "GitHub"].map((l) => (
            <a key={l} href="#" className="hover:text-slate-300 transition-colors">{l}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function Home() {
  
const { user } = useContext(AuthContext);
const isLoggedIn = !!user;

  return (
    <>
      {/* Design system font: Space Grotesk */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* Design system background: from-[#0f0c29] via-[#302b63] to-[#24243e], to-br */}
      <div
        className="min-h-screen relative"
        style={{ background: "linear-gradient(to bottom right, #0f0c29, #302b63, #24243e)" }}
      >
        <StarField />
        
        <Hero />
        <FeedSection />
        <DevelopersSection />
        <ChatSection />
        <CTASection />
        <Footer />
      </div>
    </>
  );
}