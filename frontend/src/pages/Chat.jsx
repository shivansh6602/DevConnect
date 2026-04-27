import { useParams } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import ChatBox from "../components/chat/ChatBox";
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const Chat = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [otherUser, setOtherUser] = useState(null);

  if (!user || !id) return <p>Loading...</p>;

  const chatId = [user.uid, id].sort().join("_");

  // 🔥 Create chat if not exists
  useEffect(() => {
    const createChatIfNotExists = async () => {
      const chatRef = doc(db, "chats", chatId);
      const snap = await getDoc(chatRef);

      if (!snap.exists()) {
        await setDoc(chatRef, {
          users: [user.uid, id],
          createdAt: new Date(),
        });
      }
    };

    createChatIfNotExists();
  }, [chatId, user, id]);

  // 🔥 Fetch other user
  useEffect(() => {
    const fetchUser = async () => {
      const snap = await getDoc(doc(db, "users", id));
      if (snap.exists()) setOtherUser(snap.data());
    };

    fetchUser();
  }, [id]);

  // 🔥 Mark notifications as read
  useEffect(() => {
    const markAsRead = async () => {
      const q = query(
        collection(db, "notifications"),
        where("to", "==", user.uid),
        where("from", "==", id),
        where("read", "==", false)
      );

      const snap = await getDocs(q);

      snap.forEach(async (docSnap) => {
        await updateDoc(docSnap.ref, { read: true });
      });
    };

    markAsRead();
  }, [id, user]);

  return (
    <div className="flex flex-col h-screen">

      {/* 🔥 HEADER */}
      <div className="flex items-center gap-3 p-3 border-b bg-white">
        {otherUser?.avatar ? (
          <img
            src={otherUser.avatar}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            {otherUser?.name?.[0] || "U"}
          </div>
        )}

        <h3 className="font-semibold text-lg">
          {otherUser?.name || "User"}
        </h3>
      </div>

      {/* 🔥 CHAT BODY */}
      <div className="flex-1">
        <ChatBox chatId={chatId} otherUserId={id} />
      </div>

    </div>
  );
};

export default Chat;