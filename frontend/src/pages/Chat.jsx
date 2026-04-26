import { useParams } from "react-router-dom";
import { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import ChatBox from '../components/chat/ChatBox'
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useState } from "react";

const Chat = () => {
    const {id} = useParams();
    const {user} = useContext(AuthContext);
    const [otherUser, setOtherUser] = useState(null);

if (!user || !id) return <p>Loading...</p>

const chatId = [user.uid, id].sort().join("_");

console.log("Logged-in:", user.email);
console.log("CHat with:", id);
console.log("Chat ID", chatId);

useEffect(() => {
    const createChatIfNotExists = async () => {
        if (!chatId || !user || !id) return;

        const chatRef = doc(db, "chats", chatId);

        const snap = await getDoc(chatRef);

        if (snap.exists()) {
            console.log("Chat already exists");
            return;
        }

        await setDoc(chatRef, {
            users: [user.uid, id],
            createdAt: new Date(),
        });
        console.log("New Chat created");
    }
    createChatIfNotExists();
}, [chatId])

useEffect(() => {
  const fetchUser = async () => {
    if (!id) return;

    const snap = await getDoc(doc(db, "users", id));
    if (snap.exists()) {
      setOtherUser(snap.data());
    }
  };

  fetchUser();
}, [id]);
  return (
   <div className="flex flex-col h-screen">

  {/* 🔥 HEADER */}
  <div className="flex items-center gap-3 p-3 border-b shadow-sm">

    {otherUser?.avatar ? (
      <img
        src={otherUser.avatar}
        className="w-10 h-10 rounded-full"
        alt="user"
      />
    ) : (
      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
        {otherUser?.name?.[0] || "U"}
      </div>
    )}

    <div>
      <p className="font-semibold">{otherUser?.name || "User"}</p>
      <p className="text-xs text-gray-500">Online</p>
    </div>

  </div>

  {/* 🔥 CHAT BODY */}
  <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
    <ChatBox chatId={chatId} otherUserId={id} />
  </div>

</div>
  )
}

export default Chat