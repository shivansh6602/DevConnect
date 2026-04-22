import React, { useContext, useState } from 'react'
import { AuthContext } from '../../context/AuthContext';
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";

const MessageInput = ({ chatId }) => {
  const [text, setText] = useState("");
  const { user } = useContext(AuthContext);

  const sendMessage = async () => {
    if (!text.trim() || !user || !chatId) return; // ✅ safety

    try {
      await addDoc(
        collection(db, "chats", chatId, "messages"),
        {
          text: text,
          senderId: user.uid,
          createdAt: serverTimestamp(), // ✅ correct
          seen: false,                  // ✅ for seen system
        }
      );

      setText(""); 
    } catch (error) {
      console.log("Error sending message:", error);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={text}
        placeholder="Type message..."
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()} // ⌨️ enter send
      />

      <button disabled={!text.trim()} onClick={sendMessage}>
        Send
      </button>
    </div>
  );
};

export default MessageInput;