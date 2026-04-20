import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Developers = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
  
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));

      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,       
        ...doc.data(),    
      }));

      setUsers(usersData);
    };

    fetchUsers();
  }, []);
  const navigate = useNavigate();

  const { user: currentUser } = useContext(AuthContext)
  return (
    <div>
      <h2>Developers</h2>

      {users.map((user) => (
        <div
          key={user.id}
          style={{
            border: "1px solid gray",
            padding: "10px",
            margin: "10px 0",
          }}
        >
          <img
            src={user.avatar}
            width="50"
            style={{ borderRadius: "50%" }}
            alt="avatar"
          />
<button onClick={() => navigate(`/profile/${user.id}`)}>
  View Profile
</button>
{user.id !== currentUser.uid && (
<button onClick={() => navigate(`/chat/${user.id}`)}>
  Start Chat
</button>
)}
          <h3>{user.name}</h3>
          <p>{user.bio}</p>
          
        </div>
      ))}
    </div>
  );
};

export default Developers;