import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const auth = getAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/feed");
    } catch (error) {
      alert("Invalid email or password");
    }
  };

  const handleGoogleLogin = async () => {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // 🔥 Check if user already exists in Firestore
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // 🆕 New user → create profile
      await setDoc(userRef, {
        name: user.displayName,
        email: user.email,
        username: user.email.split("@")[0],
        avatar: user.photoURL,
        bio: "",
        skills: [],
        github: "",
        linkedin: "",
        followers: [],
        following: [],
        postCount: 0,
      });
    }

    navigate("/feed");

  } catch (error) {
    console.error(error);
    alert("Google sign-in failed");
  }
};
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">

      <div className="bg-white rounded-2xl shadow-xl p-8 w-[380px]">
        <h2 className="text-2xl font-bold text-center mb-6">Welcome Back 👋</h2>

        <form onSubmit={handleSubmit}>
          <input
            className="w-full p-3 mb-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
            type="submit"
          >
            Login
          </button>
<button
  onClick={handleGoogleLogin}
  type="button"
  className="w-full mt-3 flex items-center justify-center gap-2 border py-3 rounded-lg hover:bg-gray-100 transition"
>
  <img 
    src="https://www.svgrepo.com/show/475656/google-color.svg" 
    alt="google" 
    className="w-5 h-5"
  />
  Continue with Google
</button>
          <p className="text-sm text-center mt-4">
            Don’t have an account?{" "}
            <Link to="/register" className="text-blue-600 font-semibold">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;