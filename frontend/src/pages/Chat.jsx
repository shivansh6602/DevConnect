import { useParams } from "react-router-dom";
import { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import ChatBox from '../components/chat/ChatBox'
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const Chat = () => {
    const {id} = useParams();
    const {user} = useContext(AuthContext);

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


  return (
    <div>
        <h2>Chat Page</h2>
<ChatBox chatId={chatId} otherUserId={id} />
    </div>
  )
}

export default Chat