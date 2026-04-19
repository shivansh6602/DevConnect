import React, { useState } from "react";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const auth = getAuth();

 const handleRegister = async () => {

  // ✅ Basic validation
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

    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      avatar: `https://i.pravatar.cc/150?u=${email}`,
      bio: "New Developer 🚀",
      github: "",
      linkedin: "",
      followers: 0,
      following: 0,
    });

    console.log("User Created + Profile Saved");

  } catch (error) {
    console.log("Signup Error:", error.message);

    // ✅ Better error handling
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

      <button onClick={handleRegister}>Register</button>
    </div>
  );
};

export default Register;