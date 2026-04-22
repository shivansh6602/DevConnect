import React, { useEffect, useState, useContext, useRef } from "react";
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { AuthContext } from "../../context/AuthContext";

const MessageList = ({ chatId }) => {
  const [messages, setMessages] = useState([]);
  const { user } = useContext(AuthContext);
  const bottomRef = useRef(null);

  // 🔁 listen messages
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatId]);

  // 👁️ mark as seen (only messages from OTHER user)
  useEffect(() => {
    if (!chatId || !user) return;

    const markSeen = async () => {
      // iterate current messages (already in state)
      for (const msg of messages) {
        // if message is from other user AND not seen yet
        if (msg.senderId !== user.uid && msg.seen === false) {
          try {
            await updateDoc(
              doc(db, "chats", chatId, "messages", msg.id),
              { seen: true }
            );
          } catch (e) {
            // avoid spamming console in loops; keep it minimal
          }
        }
      }
    };

    markSeen();
  }, [messages, chatId, user]);

  // 🔽 auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div>
      {messages.map((msg) => (
        <div
          key={msg.id}
          style={{
            textAlign: msg.senderId === user?.uid ? "right" : "left",
            margin: "10px",
          }}
        >
          <p
            style={{
              display: "inline-block",
              padding: "8px",
              background: msg.senderId === user?.uid ? "#acf2bd" : "#eee",
            }}
          >
            {msg.text}
            <br />
            <small>
              {msg.createdAt?.toDate().toLocaleTimeString()}
            </small>

            {/* ✅ show status only for MY messages */}
            {msg.senderId === user?.uid && (
              <span style={{ marginLeft: "8px", fontSize: "12px" }}>
                {msg.seen ? "Seen ✔✔" : "Delivered ✔"}
              </span>
            )}
          </p>
        </div>
      ))}
      <div ref={bottomRef}></div>
    </div>
  );
};

export default MessageList;