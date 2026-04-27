import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { AuthContext } from "../../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);

  const navigate = useNavigate();

  // 🔔 Fetch notifications
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("to", "==", user.uid),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setNotifications(data);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <nav className="flex justify-between items-center px-6 py-3 border-b">

      {/* 🔥 Logo */}
      <h2 className="font-bold text-xl">DevConnect</h2>

      {/* 🔥 Links */}
      <div className="flex items-center gap-4">

        <Link to="/">Home</Link>
        <Link to="/chat">Chat</Link>
        <Link to="/developers">Developers</Link>
        <Link to="/feed">Feed</Link>
        <Link to="/profile">Profile</Link>

        {/* 🔔 Notification Bell */}
        {user && (
          <div
            className="relative cursor-pointer"
            onClick={() => navigate("/chat")}
          >
            <span className="text-xl">🔔</span>

            {notifications.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 rounded-full">
                {notifications.length}
              </span>
            )}
          </div>
        )}

        {/* 🔐 Auth */}
        {user ? (
          <button onClick={logout} className="ml-2 text-red-500">
            Logout
          </button>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;