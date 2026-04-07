import "./firebase";
import { Routes, Route } from "react-router-dom"; 
import Home from "./pages/Home";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Developers from "./pages/Developers";
import Navbar from './components/common/Navbar'
import ProtectedRoute from './components/common/ProtectedRoute'
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Chat from './pages/Chat';
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import Register from './pages/Register'
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

function App() {
  const [posts, setPosts] = useState([]);

  // ✅ Profile state (EMPTY INIT)
  const [profile, setProfile] = useState(null);
const { user } = useContext(AuthContext);

useEffect(() => {
  const setupUserProfile = async () => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    let snap = await getDoc(userRef);

    // ✅ IF NEW STRUCTURE EXISTS → use it
    if (snap.exists()) {
      setProfile(snap.data());
      return;
    }

    // 🔥 CHECK OLD STRUCTURE (email-based)
    const oldRef = doc(db, "users", user.email);
    const oldSnap = await getDoc(oldRef);

    if (oldSnap.exists()) {
      console.log("Migrating old user...");

      // ✅ COPY old data to new uid doc
      await setDoc(userRef, oldSnap.data());

      // ❌ optional: delete old doc
      // await deleteDoc(oldRef);

      const newSnap = await getDoc(userRef);
      setProfile(newSnap.data());
    } else {
      // ✅ completely new user
      console.log("Creating new user...");

      await setDoc(userRef, {
        email: user.email,
        name: user.displayName || user.email.split("@")[0],
        avatar: `https://i.pravatar.cc/150?u=${user.email}`,
        bio: "New Developer 🚀",
        github: "",
        linkedin: "",
        followers: 0,
        following: 0,
      });

      const newSnap = await getDoc(userRef);
      setProfile(newSnap.data());
    }
  };

  setupUserProfile();
}, [user]);

  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <Feed posts={posts} setPosts={setPosts} />
            </ProtectedRoute>
          }
        />

        <Route path="/chat" element={<Chat />} />
        <Route path="/chat/:email" element={<Chat />} />

      
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
           { profile ? (
              <Profile
                posts={posts}
                profile={profile}
              /> ) : (
                <h2>Loading Profile...</h2>
              
            )}
            </ProtectedRoute>
          }
        />

        <Route path="/developers" element={<Developers />} />
         <Route path="/register" element={<Register />} />
      </Routes>
     
    </>
  );
}

export default App;