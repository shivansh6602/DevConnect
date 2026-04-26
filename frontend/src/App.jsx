import { db } from "./firebase";
import {
  doc,
  updateDoc,
    getDoc,   
  deleteDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Developers from "./pages/Developers";
import Navbar from "./components/common/Navbar";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Chat from "./pages/Chat";
import Register from "./pages/Register";
import ChatList from "./pages/ChatList";
import EditProfile from "./pages/EditProfile";
import { increment } from "firebase/firestore";

import { useState } from "react";

function App() {
  const [posts, setPosts] = useState([]);

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

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/:id"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="/chat" element={<ProtectedRoute><ChatList /></ProtectedRoute>} />
        <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

        <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />

        <Route path="/developers" element={<Developers />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </>
  );
}

export default App;