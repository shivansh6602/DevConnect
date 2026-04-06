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

import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

function App() {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);

  // ✅ Profile state (EMPTY INIT)
  const [profile, setProfile] = useState(null);

  // 🧠 1. AUTH LISTENER (runs once)
  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userRef = doc(db, "users", currentUser.email);

        const userSnap = await getDoc(userRef);

        // 🔥 Create user if not exists
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email: currentUser.email,
            name: currentUser.email.split("@")[0],
            avatar: `https://i.pravatar.cc/150?u=${currentUser.email}`,
            bio: "New Developer 🚀",
            github: "",
            linkedin: "",
            followers: 0,
            following: 0
          });
        }
      }
    });

    return () => unsubscribe(); // cleanup
  }, []);

  // 🧠 2. FETCH PROFILE (runs when user changes)
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const userRef = doc(db, "users", user.email);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        setProfile(snap.data());
      }
    };

    fetchProfile();
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
      </Routes>
    </>
  );
}

export default App;