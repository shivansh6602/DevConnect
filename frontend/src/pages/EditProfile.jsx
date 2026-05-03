import { useEffect, useRef, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

// ─── STAR FIELD ───────────────────────────────────────────────────────────────
function StarField() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const starsRef = useRef([]);
  const shootersRef = useRef([]);
  const { scrollYProgress } = useScroll();
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, -80]);

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

    starsRef.current = Array.from({ length: 240 }, () => {
      const dur = Math.random() * 3 + 1.5;
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight * 2,
        r: (Math.random() * 2.5 + 0.5) / 2,
        alpha: Math.random(),
        dAlpha: (0.005 / dur) * (Math.random() > 0.5 ? 1 : -1),
        scaleT: Math.random() * Math.PI * 2,
        scaleDelta: (2 * Math.PI) / (dur * 60),
        delayFrames: Math.floor(Math.random() * 180),
      };
    });

    const mkShooter = (stagger) => ({
      x: 0, y: 0,
      angle: Math.PI / 180 * (28 + Math.random() * 14),
      speed: 7 + Math.random() * 6,
      len: 80, alpha: 0, phase: "wait",
      waitFrames: Math.floor((4 + Math.random() * 3) * 60),
      waitCounter: Math.floor(stagger),
    });
    shootersRef.current = Array.from({ length: 5 }, (_, i) => mkShooter(i * 85));

    const respawn = (sh) => {
      sh.x = Math.random() * canvas.width * 0.7;
      sh.y = Math.random() * canvas.height * 0.3;
      sh.alpha = 0; sh.phase = "shoot";
      sh.angle = Math.PI / 180 * (28 + Math.random() * 14);
      sh.speed = 7 + Math.random() * 6;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      starsRef.current.forEach((s) => {
        if (s.delayFrames > 0) { s.delayFrames--; return; }
        s.alpha += s.dAlpha;
        if (s.alpha >= 1) { s.alpha = 1; s.dAlpha *= -1; }
        if (s.alpha <= 0.1) { s.alpha = 0.1; s.dAlpha *= -1; }
        s.scaleT += s.scaleDelta;
        const sc = 1 + 0.3 * Math.abs(Math.sin(s.scaleT));
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = "#ffffff";
        if (s.r > 0.7) { ctx.shadowBlur = 3; ctx.shadowColor = "rgba(255,255,255,0.5)"; }
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * sc, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
      shootersRef.current.forEach((sh) => {
        if (sh.phase === "wait") {
          if (++sh.waitCounter >= sh.waitFrames) { sh.waitCounter = 0; respawn(sh); }
          return;
        }
        sh.x += Math.cos(sh.angle) * sh.speed;
        sh.y += Math.sin(sh.angle) * sh.speed;
        sh.alpha = Math.min(1, sh.alpha + 0.12);
        if (sh.x > canvas.width || sh.y > canvas.height * 0.6) {
          sh.alpha -= 0.07;
          if (sh.alpha <= 0) { sh.phase = "wait"; sh.waitFrames = Math.floor((4 + Math.random() * 3) * 60); sh.waitCounter = 0; return; }
        }
        const tx = sh.x - Math.cos(sh.angle) * sh.len;
        const ty = sh.y - Math.sin(sh.angle) * sh.len;
        const g = ctx.createLinearGradient(tx, ty, sh.x, sh.y);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(0.5, `rgba(216,180,254,${sh.alpha * 0.6})`);
        g.addColorStop(0.85, `rgba(216,180,254,${sh.alpha})`);
        g.addColorStop(1, `rgba(216,180,254,${sh.alpha * 0.15})`);
        ctx.save();
        ctx.strokeStyle = g; ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10; ctx.shadowColor = "rgba(192,132,252,0.5)";
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(sh.x, sh.y); ctx.stroke();
        ctx.restore();
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <motion.div style={{ y: yParallax }} className="fixed inset-0 pointer-events-none z-0">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </motion.div>
  );
}

// ─── STYLED INPUT ─────────────────────────────────────────────────────────────
function Field({ label, icon, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-1.5"
    >
      <label
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 tracking-widest uppercase"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {icon && <span className="text-purple-400">{icon}</span>}
        {label}
      </label>
      {children}
    </motion.div>
  );
}

function Input({ value, onChange, placeholder, type = "text", onKeyDown }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={`relative transition-all duration-300 ${focused ? "drop-shadow-[0_0_12px_rgba(147,51,234,0.35)]" : ""}`}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={`w-full bg-slate-900/70 backdrop-blur-md text-slate-200 placeholder-slate-600 text-sm px-4 py-3 rounded-xl border transition-all duration-300 outline-none ${
          focused
            ? "border-purple-500/60 bg-slate-900/80"
            : "border-slate-700/50 hover:border-slate-600/60"
        }`}
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      />
    </div>
  );
}

// ─── SECTION DIVIDER ──────────────────────────────────────────────────────────
function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="w-1 h-5 rounded-full bg-gradient-to-b from-purple-500 to-pink-500 flex-shrink-0" />
      <h3
        className="text-white font-semibold text-sm tracking-wide"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {icon} {title}
      </h3>
      <div className="flex-1 h-px bg-slate-800/80" />
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const EditProfile = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: "",
    bio: "",
    github: "",
    linkedin: "",
    occupation: "",
    skills: [],
    avatar: "",
  });

  const getAvatar = (seed) =>
    `https://api.dicebear.com/9.x/toon-head/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9&eyes=wide&mouth=smile&eyebrows=neutral,happy&hair=bun,sideComed,spiky,undercut&rearHair=longStraight,longWavy,shoulderHigh&clothes=shirt,tShirt,openJacket&skinColor=f1c3a5,c68e7a&beardProbability=10`;

  const avatarSeeds = ["acclex", "emma", "john", "sophia", "liam", "olivia", "noah", "avaxx"];

  useEffect(() => {
    if (!user) return;
    const fetchUser = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const d = snap.data();
        setForm({
          name: d.name || "",
          bio: d.bio || "",
          github: d.github || "",
          linkedin: d.linkedin || "",
          occupation: d.occupation || "",
          skills: d.skills || [],
          avatar: d.avatar || "",
        });
        setSelectedAvatar(d.avatar || "");
      }
    };
    fetchUser();
  }, [user]);

  const addSkill = (e) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      if (!form.skills.includes(skillInput.trim())) {
        setForm((prev) => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
      }
      setSkillInput("");
    }
  };

  const removeSkill = (skill) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));
  };

  const handleUpdate = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { ...form });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        navigate("/profile");
      }, 1200);
    } catch (err) {
      console.error("Update error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #0f172a inset !important;
          -webkit-text-fill-color: #e2e8f0 !important;
        }
      `}</style>

      <div
        className="min-h-screen relative overflow-x-hidden"
        style={{ background: "linear-gradient(to bottom right, #0f0c29, #302b63, #24243e)" }}
      >
        <StarField />

        {/* Ambient glows */}
        <div className="fixed top-1/4 left-1/3 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] animate-pulse pointer-events-none z-0" />
        <div className="fixed bottom-1/3 right-1/4 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[100px] animate-pulse pointer-events-none z-0" style={{ animationDelay: "2s" }} />

        <div className="relative z-10 max-w-2xl mx-auto px-5 py-16">

          {/* ── PAGE HEADER ── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm mb-3 transition-colors group"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                <motion.span whileHover={{ x: -3 }} className="inline-block transition-transform">←</motion.span>
                Back
              </button>
              <h1
                className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Edit Profile
              </h1>
              <p className="text-slate-500 text-sm mt-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Keep your dev identity sharp.
              </p>
            </div>

            {/* Live avatar preview */}
            {selectedAvatar && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative flex-shrink-0"
              >
                <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 blur-[8px] opacity-70" />
                <div className="p-[2.5px] rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 relative">
                  <motion.img
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    src={selectedAvatar}
                    alt="preview"
                    className="w-16 h-16 rounded-full block bg-slate-900 object-cover"
                    onError={(e) => { e.target.src = getAvatar("fallback"); }}
                  />
                </div>
                <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0f0c29] shadow-[0_0_6px_rgba(74,222,128,0.7)]" />
              </motion.div>
            )}
          </motion.div>

          {/* ── MAIN CARD ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="relative"
          >
            {/* Card glow */}
            <div className="absolute -inset-3 bg-gradient-to-r from-purple-600/25 via-pink-600/15 to-indigo-600/25 rounded-3xl blur-[32px] opacity-60 pointer-events-none" />

            <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden">

              {/* Decorative top bar */}
              <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600" />

              <div className="p-7 space-y-8">

                {/* ─ IDENTITY ─ */}
                <div>
                  <SectionTitle icon="👤" title="Identity" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Display Name" icon="✦">
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Your name"
                      />
                    </Field>
                    <Field label="Occupation" icon="💼">
                      <Input
                        value={form.occupation}
                        onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                        placeholder="e.g. Full Stack Engineer"
                      />
                    </Field>
                  </div>
                  <div className="mt-4">
                    <Field label="Bio" icon="✍️">
                      <div className={`relative`}>
                        <textarea
                          value={form.bio}
                          onChange={(e) => setForm({ ...form, bio: e.target.value })}
                          placeholder="A short, punchy bio. What are you building?"
                          rows={3}
                          maxLength={180}
                          className="w-full bg-slate-900/70 backdrop-blur-md text-slate-200 placeholder-slate-600 text-sm px-4 py-3 rounded-xl border border-slate-700/50 hover:border-slate-600/60 focus:border-purple-500/60 focus:bg-slate-900/80 outline-none resize-none transition-all duration-300 focus:drop-shadow-[0_0_12px_rgba(147,51,234,0.35)]"
                          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                        />
                        <span
                          className="absolute bottom-2.5 right-3 text-slate-700 text-[10px]"
                          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          {form.bio.length}/180
                        </span>
                      </div>
                    </Field>
                  </div>
                </div>

                {/* ─ SKILLS ─ */}
                <div>
                  <SectionTitle icon="🛠️" title="Skills" />
                  <Field label="Add skills" icon="⌨️">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={addSkill}
                      placeholder="Type a skill and press Enter…"
                    />
                  </Field>

                  <AnimatePresence>
                    {form.skills.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-2 mt-3"
                      >
                        {form.skills.map((skill, i) => (
                          <motion.button
                            key={skill}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ delay: i * 0.04 }}
                            whileHover={{ scale: 1.06, boxShadow: "0 0 12px rgba(147,51,234,0.4)" }}
                            onClick={() => removeSkill(skill)}
                            className="flex items-center gap-1.5 px-3 py-1 bg-purple-600/15 text-purple-300 border border-purple-500/25 rounded-full text-xs font-medium hover:bg-red-600/15 hover:text-red-400 hover:border-red-500/25 transition-all duration-200 group"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                          >
                            {skill}
                            <span className="text-purple-500 group-hover:text-red-400 transition-colors text-[10px]">✕</span>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {form.skills.length === 0 && (
                    <p className="text-slate-700 text-xs mt-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      No skills added yet. Type above and press Enter.
                    </p>
                  )}
                </div>

                {/* ─ LINKS ─ */}
                <div>
                  <SectionTitle icon="🔗" title="Links" />
                  <div className="space-y-4">
                    <Field label="GitHub" icon={
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.79-.26.79-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.01 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.19.7.8.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>
                    }>
                      <Input
                        value={form.github}
                        onChange={(e) => setForm({ ...form, github: e.target.value })}
                        placeholder="https://github.com/username"
                      />
                    </Field>
                    <Field label="LinkedIn" icon={
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.94v5.67H9.37V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.59 0 4.26 2.36 4.26 5.44v6.3zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45C23.21 24 24 23.23 24 22.27V1.73C24 .77 23.21 0 22.22 0z"/></svg>
                    }>
                      <Input
                        value={form.linkedin}
                        onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                        placeholder="https://linkedin.com/in/username"
                      />
                    </Field>
                  </div>
                </div>

                {/* ─ AVATAR ─ */}
                <div>
                  <SectionTitle icon="🎨" title="Choose Avatar" />
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                    {avatarSeeds.map((seed, idx) => {
                      const url = getAvatar(seed);
                      const isSelected = selectedAvatar === url;
                      return (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.1, y: -3 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedAvatar(url);
                            setForm((prev) => ({ ...prev, avatar: url }));
                          }}
                          className="relative group"
                        >
                          {/* Selection glow */}
                          {isSelected && (
                            <motion.div
                              layoutId="avatar-glow"
                              className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 blur-[6px] opacity-80"
                            />
                          )}
                          {/* Ring */}
                          <div
                            className={`relative p-[2px] rounded-full transition-all duration-300 ${
                              isSelected
                                ? "bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500"
                                : "bg-slate-700/50 group-hover:bg-gradient-to-br group-hover:from-purple-500/50 group-hover:to-indigo-500/50"
                            }`}
                          >
                            <img
                              src={url}
                              alt={`avatar-${seed}`}
                              onError={(e) => { e.target.src = getAvatar("fallback"); }}
                              className="w-full aspect-square rounded-full bg-slate-900 object-cover block"
                            />
                          </div>
                          {/* Selected tick */}
                          {isSelected && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-[8px] text-white border border-[#0f0c29] shadow"
                            >
                              ✓
                            </motion.span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* ─ SAVE BUTTON ─ */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-between pt-2 border-t border-slate-800/60"
                >
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    onClick={() => navigate(-1)}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-slate-800/50 border border-slate-700/50 hover:text-white hover:border-slate-600/60 transition-all duration-300"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Cancel
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.04, boxShadow: "0 0 28px rgba(147,51,234,0.5)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleUpdate}
                    disabled={saving}
                    className={`relative px-7 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 overflow-hidden ${
                      saving || saved
                        ? "bg-slate-700/60 cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/40"
                    }`}
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    <AnimatePresence mode="wait">
                      {saved ? (
                        <motion.span
                          key="saved"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="flex items-center gap-1.5"
                        >
                          <span className="text-green-300">✓</span> Saved!
                        </motion.span>
                      ) : saving ? (
                        <motion.span
                          key="saving"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2"
                        >
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                            className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full"
                          />
                          Saving…
                        </motion.span>
                      ) : (
                        <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          Save Changes →
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.div>

              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </>
  );
};

export default EditProfile;
