import React, { useContext, useState } from 'react'

const MessageInput = ({chatId }) => {
    const [text, setText] = useState("");
    const {user} = useContext(AuthContext);

    const sendMessage = async () => {
        if(!text.trim()) return;
        try {
            await addDoc(
                collection(db, "chats", chatId, "messages"),
            {
                text: text,
                senderId: user.uid,
                createdAt: new Date(),
            })
            setText("")
        } catch (error) {
            console.log("Error sending message:", error);
            
        }
    }
  return (
    <div>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder='Type message...' />
  <button onClick={sendMessage}>Send</button>
    </div>
  )
}

export default MessageInput