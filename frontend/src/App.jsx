import "./firebase";
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

import { useState } from "react";

function App() {
  // 🔥 Global posts state (used in Feed + Profile)
  const [posts, setPosts] = useState([]);

  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* ✅ Feed */}
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <Feed posts={posts} setPosts={setPosts} />
            </ProtectedRoute>
          }
        />

        {/* ✅ Chat */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat/:id"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* ✅ Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile posts={posts} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/:id"
          element={
            <ProtectedRoute>
              <Profile posts={posts} />
            </ProtectedRoute>
          }
        />
<Route
  path="/edit-profile"
  element={
    <ProtectedRoute>
      <EditProfile />
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