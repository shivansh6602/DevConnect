import { Routes, Route } from "react-router-dom"; // Router components

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Developers from "./pages/Developers";
import Navbar from './components/common/Navbar'
import ProtectedRoute from './components/common/ProtectedRoute'
import { useState } from "react";

function App() {
const [posts, setPosts] = useState([])

const [profile, setProfile] = useState({
  email: "abc@gmail.com", 
  name: "Shivansh",
  bio: "React Developer 🚀",
  github: "https://github.com/",
  linkedin: "https://linkedin.com/",
  followers: 120,
  following: 80
});
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

       
        <Route path="/profile" element={<Profile posts={posts} profile={profile} />} />

      
        <Route path="/developers" element={<Developers />} />

      </Routes>
    </>
  );
}

export default App;
