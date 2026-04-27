import { useEffect, useState, useContext } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Developers = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  // ✅ SINGLE EFFECT FOR BOTH NORMAL + SEARCH
  useEffect(() => {
    const fetchUsers = async () => {
      let q;

      if (search) {
        // 🔍 SEARCH MODE
        q = query(
          collection(db, "users"),
          where("username", ">=", search),
          where("username", "<=", search + "\uf8ff")
        );
      } else {
        // 👥 NORMAL MODE
        q = collection(db, "users");
      }

      const snapshot = await getDocs(q);

      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUsers(usersData);
    };

    fetchUsers();
  }, [search]);

  // ✅ NOW safe to return
  if (!currentUser) {
    return <h2>Loading user...</h2>;
  }

  return (
    <div>
      <h2>Developers</h2>

      {/* 🔍 SEARCH */}
  <input
  type="text"
  placeholder="Search developers by username..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="border p-2 rounded w-full mb-4"
/>

      {/* 👥 USER LIST */}
      {users.map((u) => (
        <div
          key={u.id}
          className="flex items-center gap-3 p-3 border rounded mb-2"
        >
          {/* Avatar Fix */}
          {u.avatar ? (
            <img
              src={u.avatar}
              className="w-10 h-10 rounded-full"
              alt="avatar"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              {u.name?.[0] || "U"}
            </div>
          )}

          <div className="flex-1">
            <p>{u.name}</p>
            <small>@{u.username}</small>
          </div>

          <button onClick={() => navigate(`/profile/${u.id}`)}>
            View
          </button>

          {u.id !== currentUser.uid && (
            <button onClick={() => navigate(`/chat/${u.id}`)}>
              Chat
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default Developers;