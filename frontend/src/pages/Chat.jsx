import { useParams } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Chat = () => {
    const {email} = useParams();
    const {user} = useContext(AuthContext);

     console.log("Logged-in:", user?.email);
  console.log("Chat with:", email);
  return (
    <div>
        <h2>Chat Page</h2>

        {email ? (
            <p>Chatting with : {email}</p>
        ) : (
            <p>No chat selected (indox coming)</p>
        )}
    </div>
  )
}

export default Chat