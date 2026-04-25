import React, { useState } from "react";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const Register = () => {
  const [name, setName] = useState(""); // user name
  const [email, setEmail] = useState(""); // user email
  const [password, setPassword] = useState(""); // password
const [avatar, setAvatar] = useState("");
  // 🔥 Avatar options
  const avatars = [
    "https://api.dicebear.com/7.x/adventurer/svg?seed=1",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=2",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=3",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=4",
  ];

  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]); // default avatar

  const auth = getAuth();

  const handleRegister = async () => {
    // ✅ validation
    if (!name || !email || !password) {
      alert("All fields are required");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCred.user;

      // ✅ Save user in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        avatar: avatar || selectedAvatar,// 🔥 store selected avatar
        bio: "New Developer 🚀",
        github: "",
        linkedin: "",
        followers: [], // ✅ FIXED
        following: [], // ✅ FIXED
      });

      console.log("User Created + Profile Saved");

    } catch (error) {
      console.log("Signup Error:", error.message);

      if (error.code === "auth/email-already-in-use") {
        alert("Email already registered");
      } else if (error.code === "auth/invalid-email") {
        alert("Invalid email format");
      } else {
        alert(error.message);
      }
    }
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