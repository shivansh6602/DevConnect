import { useState, useEffect, useRef, useContext } from "react";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import { AuthContext } from "../../context/AuthContext";
import { serverTimestamp } from "firebase/firestore";

const ChatBox = ({ chatId, otherUserId }) => {
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

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

  // 🔥 Mark messages as seen
 useEffect(() => {
  if (!user || !chatId || messages.length === 0) return;

  const unseenMessages = messages.filter(
    (msg) => msg.senderId !== user.uid && !msg.seen
  );

  if (unseenMessages.length === 0) return;

  unseenMessages.forEach(async (msg) => {
    const ref = doc(db, "chats", chatId, "messages", msg.id);
    await updateDoc(ref, { seen: true });
  });

}, [messages, user, chatId]);

  // 🔥 Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔥 Send message (FINAL CLEAN VERSION)
  const sendMessage = async () => {
    if (!text.trim()) return;

    // 1. Save message
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      senderId: user.uid,
      createdAt: serverTimestamp(),
      seen: false,
    });

    // 2. Create notification
    await addDoc(collection(db, "notifications"), {
      to: otherUserId,
      from: user.uid,
      type: "message",
      read: false,
      createdAt: serverTimestamp(),
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
  className={`px-4 py-2 rounded-2xl max-w-xs shadow ${
    msg.senderId === user.uid
      ? "bg-blue-500 text-white rounded-br-none"
      : "bg-white border rounded-bl-none"
  }`}
>
              {msg.text}

              {/* ✅ Seen / Delivered */}
              {msg.senderId === user.uid && (
                <p className="text-xs mt-1 opacity-70">
                  {msg.seen ? "Seen ✅" : "Delivered ✔"}
                </p>
              )}
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
          onKeyDown={(e) => {
  if (e.key === "Enter") sendMessage();
}}
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