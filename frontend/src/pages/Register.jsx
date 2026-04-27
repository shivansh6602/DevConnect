import React, { useState } from "react";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const Register = () => {
  const [name, setName] = useState(""); // user name
  const [email, setEmail] = useState(""); // user email
  const [password, setPassword] = useState(""); // password
const [avatar, setAvatar] = useState("");
const [username, setUsername] = useState("");
  // 🔥 Avatar options
  const avatars = [
    "https://api.dicebear.com/7.x/adventurer/svg?seed=1",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=2",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=3",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=4",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=5",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=344455",
  ];

  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]); // default avatar

  const auth = getAuth();

  const handleRegister = async () => {
  try {
    const isAvailable = await checkUsername();

    if (!isAvailable) {
      alert("Username already taken!");
      return;
    }

    // 1. Create Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

  await setDoc(doc(db, "users", user.uid), {
  name,
  email,

  // ✅ FORCE CLEAN USERNAME
  username: username.toLowerCase().trim(),

  // ✅ USE SELECTED OR INPUT AVATAR
  avatar: avatar || selectedAvatar,

  bio: "",
  followers: [],
  following: [],
  createdAt: new Date(),
});
  } catch (error) {
    console.log(error.message);
  }
};
const checkUsername = async () => {
  const cleanUsername = username.toLowerCase().trim();

  const q = query(
    collection(db, "users"),
    where("username", "==", cleanUsername)
  );

  const snap = await getDocs(q);

  return snap.empty; // true = available
};

 

  return (
    <div>
      <h2>Register</h2>

      {/* Inputs */}
      <input
        type="text"
        placeholder="Enter Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="email"
        placeholder="Enter Your Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Enter Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
{/* Avatar URL input */}
<input
  type="text"
  placeholder="Paste Avatar URL (optional)"
  value={avatar}
  onChange={(e) => setAvatar(e.target.value)}
/>

{/* Preview */}
{avatar && (
  <img
    src={avatar}
    alt="preview"
    style={{ width: "80px", borderRadius: "50%", marginTop: "10px" }}
  />
)}
<input
  type="text"
  placeholder="Username (unique)"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>
{/* Avatar Picker */}
<h3>Select Avatar</h3>
<div style={{ display: "flex", gap: "10px" }}>
  {avatars.map((img, index) => (
    <img
      key={index}
      src={img}
      alt="avatar"
      width={60}
      style={{
        border:
          selectedAvatar === img
            ? "3px solid blue"
            : "1px solid gray",
        cursor: "pointer",
        borderRadius: "50%",
      }}
      onClick={() => setSelectedAvatar(img)}
    />
  ))}
</div>

      <button onClick={handleRegister}>Register</button>
    </div>
  );
};

export default Register;