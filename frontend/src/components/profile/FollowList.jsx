import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const FollowList = ({ ids, title, onClose }) => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const userData = [];

      for (let id of ids) {
        const snap = await getDoc(doc(db, "users", id));
        if (snap.exists()) {
          userData.push({ id, ...snap.data() });
        }
      }

      setUsers(userData);
    };

    fetchUsers();
  }, [ids]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-4 rounded-lg w-80 max-h-[400px] overflow-y-auto">
        
        <h3 className="text-lg font-semibold mb-3">{title}</h3>

        {users.map((u) => (
          <div
            key={u.id}
            className="flex items-center gap-3 p-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              navigate(`/profile/${u.id}`);
              onClose();
            }}
          >
          {u.avatar ? (
  <img src={u.avatar} className="w-8 h-8 rounded-full" />
) : (
  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs">
    {u.name?.[0]}
  </div>
)}
          </div>
        ))}

        {users.length === 0 && <p>No users found</p>}

        <button
          onClick={onClose}
          className="mt-3 w-full bg-gray-200 py-1 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default FollowList;