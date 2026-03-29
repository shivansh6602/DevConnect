import "./firebase"; // 🔥 THIS LINE FIXES YOUR ERROR
import { Routes, Route } from "react-router-dom"; // Router components
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Developers from "./pages/Developers";
import Navbar from './components/common/Navbar'
import ProtectedRoute from './components/common/ProtectedRoute'
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

function App() {
const [posts, setPosts] = useState([])
const [user, setUser] = useState(null);

const [profile, setProfile] = useState({
  email: "", 
  name: user?.email?.split("@")[0] || "Guest",
  bio: "React Developer 🚀",
  github: "https://github.com/",
  linkedin: "https://linkedin.com/",
  followers: 120,
  following: 80
});

const addFollowers = () => {
  setProfile({
    ...profile,
    followers: profile.followers + 1
  });
}

useEffect(() => {
  const auth = getAuth();

  // ✅ Listen user
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
  });

  return () => unsubscribe();
}, []);

  return (
    <>
     <Navbar />
      <Routes>

        
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

       
        <Route path="/register" element={<Register />} />

       
        <Route path="/feed" element={
          <ProtectedRoute> <Feed posts={posts} setPosts={setPosts} /></ProtectedRoute>
         } />

       
        <Route path="/profile" element={<Profile posts={posts} profile={profile}  addFollowers={addFollowers}/>} />

      
        <Route path="/developers" element={<Developers />} />

      </Routes>
    </>
  );
}

export default App;
