import React, { useState } from "react";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const Register = () => {
  const auth = getAuth();

  // 🔥 Basic fields
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 💼 New fields
  const [occupation, setOccupation] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");

  // 🧠 Skills
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");

  // 🎨 Toon avatars (DiceBear toon-head)
  const avatars = [
    "https://api.dicebear.com/7.x/toon/svg?seed=dev1",
    "https://api.dicebear.com/7.x/toon/svg?seed=dev2",
    "https://api.dicebear.com/7.x/toon/svg?seed=dev3",
    "https://api.dicebear.com/7.x/toon/svg?seed=dev4",
    "https://api.dicebear.com/7.x/toon/svg?seed=dev5",
  ];

  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);

  // 🔍 Username check
  const checkUsername = async () => {
    const clean = username.toLowerCase().trim();
    const q = query(collection(db, "users"), where("username", "==", clean));
    const snap = await getDocs(q);
    return snap.empty;
  };

  // 🧠 Add skill on Enter
  const addSkill = (e) => {
    if (e.key === "Enter" && skillInput.trim()) {
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput("");
    }
  };

  // ❌ Remove skill
  const removeSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  // 🚀 Register
  const handleRegister = async () => {
    try {
      const available = await checkUsername();
      if (!available) {
        alert("Username already taken!");
        return;
      }

      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      await setDoc(doc(db, "users", user.uid), {
        name,
        username: username.toLowerCase().trim(),
        email,
        avatar: selectedAvatar,

        // 🔥 NEW DATA
        occupation,
        skills,
        github,
        linkedin,

        // default fields
        bio: "",
        followers: [],
        following: [],
        createdAt: new Date(),
      });

    } catch (err) {
      console.log(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-[420px]">
        <h2 className="text-2xl font-bold text-center mb-6">Create Account 🚀</h2>

        {/* 🔥 ORDER FIXED (important UX) */}

        {/* Name */}
        <input className="input" placeholder="Full Name"
          value={name} onChange={(e) => setName(e.target.value)} />

        {/* Username */}
        <input className="input" placeholder="Username"
          value={username} onChange={(e) => setUsername(e.target.value)} />

        {/* Email */}
        <input className="input" type="email" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)} />

        {/* Password */}
        <input className="input" type="password" placeholder="Password"
          value={password} onChange={(e) => setPassword(e.target.value)} />

        {/* 💼 Occupation */}
        <select className="input" value={occupation} onChange={(e) => setOccupation(e.target.value)}>
          <option value="">Select Occupation</option>
          <option>Student</option>
          <option>Frontend Developer</option>
          <option>Backend Developer</option>
          <option>Full Stack Developer</option>
          <option>Designer</option>
        </select>

        {/* 🧠 Skills */}
        <input
          className="input"
          placeholder="Add skill & press Enter"
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          onKeyDown={addSkill}
        />

        <div className="flex flex-wrap gap-2 mb-3">
          {skills.map((skill, i) => (
            <span
              key={i}
              onClick={() => removeSkill(skill)}
              className="px-3 py-1 bg-purple-600 text-white rounded-full text-xs cursor-pointer"
            >
              {skill} ✕
            </span>
          ))}
        </div>

        {/* 🔗 Optional links */}
        <input className="input" placeholder="GitHub URL (optional)"
          value={github} onChange={(e) => setGithub(e.target.value)} />

        <input className="input" placeholder="LinkedIn URL (optional)"
          value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />

        {/* 🎨 Avatar picker */}
        <p className="text-sm font-semibold mb-2">Choose Avatar</p>
        <div className="flex gap-3 mb-4 justify-center">
          {avatars.map((img, i) => (
            <img
              key={i}
              src={img}
              className={`w-12 h-12 rounded-full cursor-pointer border-2 ${
                selectedAvatar === img ? "border-indigo-500" : "border-gray-300"
              }`}
              onClick={() => setSelectedAvatar(img)}
            />
          ))}
        </div>

        {/* Button */}
        <button
          onClick={handleRegister}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700"
        >
          Register
        </button>
      </div>
    </div>
  );
};

export default Register;