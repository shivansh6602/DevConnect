import { useState, useEffect, useRef, useContext } from "react";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { AuthContext } from "../../context/AuthContext";

const ChatBox = ({ chatId, otherUserId }) => {
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]); // ✅ FIXED
  const [text, setText] = useState(""); // ✅ FIXED

  const bottomRef = useRef(null);

  // 🔥 Fetch messages realtime
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatId]);

  // 🔥 Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔥 Send message
  const sendMessage = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      senderId: user.uid,
      createdAt: new Date(),
    });

    setText("");
  };

  return (
    <div className="flex flex-col h-[80vh] border rounded-xl">

      {/* 🔥 Messages */}
      <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-2 flex ${
              msg.senderId === user.uid
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`px-3 py-2 rounded-lg max-w-xs ${
                msg.senderId === user.uid
                  ? "bg-blue-500 text-white"
                  : "bg-gray-300"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        <div ref={bottomRef}></div>
      </div>

      {/* 🔥 Input */}
      <div className="flex gap-2 border-t p-2 bg-white">
        <input
          type="text"
          placeholder="Type message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border p-2 rounded-full"
        />

        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 rounded-full"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;