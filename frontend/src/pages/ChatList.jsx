import React, { useEffect, useState, useContext } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  orderBy,
  limit,
  getDocs
} from "firebase/firestore";
import { db } from "../firebase";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "chats"),
      where("users", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatPromises = snapshot.docs.map(async (docSnap) => {
        const chatData = docSnap.data();

        // 🔥 STEP 1: find other user
        const otherUserId = chatData.users.find(
          (id) => id !== user.uid
        );

        // 🔥 STEP 2: get user info
        const userRef = doc(db, "users", otherUserId);
        const userSnap = await getDoc(userRef);

        const otherUser = userSnap.exists() ? userSnap.data() : {};

        // 🔥 STEP 3: get last message
        const messagesRef = collection(
          db,
          "chats",
          docSnap.id,
          "messages"
        );

        const msgQuery = query(
          messagesRef,
          orderBy("createdAt", "desc"),
          limit(1)
        );

        const msgSnap = await getDocs(msgQuery);

        let lastMessage = null;
        msgSnap.forEach((m) => {
          lastMessage = m.data();
        });

        return {
          id: docSnap.id,
          otherUserId,
          otherUser,
          lastMessage,
        };
      });

      const resolvedChats = await Promise.all(chatPromises);
      setChats(resolvedChats);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div>
      <h2>Your Chats</h2>

      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => navigate(`/chat/${chat.otherUserId}`)}
          style={{
            border: "1px solid gray",
            padding: "10px",
            margin: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {/* 👤 Avatar */}
          <img
            src={chat.otherUser?.avatar}
            width="40"
            style={{ borderRadius: "50%" }}
          />

          <div>
            {/* 👤 Name */}
            <h4>{chat.otherUser?.name || "User"}</h4>

            {/* 💬 Last Message */}
            <p>
              {chat.lastMessage?.text || "No messages yet"}
            </p>

            {/* ⏰ Time */}
            <small>
              {chat.lastMessage?.createdAt?.toDate().toLocaleTimeString()}
            </small>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatList;