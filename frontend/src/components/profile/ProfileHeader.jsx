import { useContext, useEffect, useState } from "react";
import { updateDoc, doc, arrayUnion, arrayRemove, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import FollowList from "./FollowList";

const ProfileHeader = ({ user, userId }) => {
  const [liveUser, setLiveUser] = useState(user);

  const [showFollowers, setShowFollowers] = useState(false);
const [showFollowing, setShowFollowing] = useState(false);
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);

  // 🔥 Real-time listener
  useEffect(() => {
    const userRef = doc(db, "users", userId);

    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setLiveUser(snap.data());
      }
    });

    return () => unsubscribe();
  }, [userId]);

  if (!liveUser || !currentUser) return <p>Loading...</p>;

  // ✅ ALWAYS use liveUser now
  const followers = Array.isArray(liveUser.followers)
    ? liveUser.followers
    : [];

  const following = Array.isArray(liveUser.following)
    ? liveUser.following
    : [];

  const isFollowing = followers.includes(currentUser.uid);

  const handleFollow = async () => {
    const currentUserRef = doc(db, "users", currentUser.uid);
    const profileRef = doc(db, "users", userId);

    if (isFollowing) {
      await updateDoc(profileRef, {
        followers: arrayRemove(currentUser.uid),
      });

      await updateDoc(currentUserRef, {
        following: arrayRemove(userId),
      });
    } else {
      await updateDoc(profileRef, {
        followers: arrayUnion(currentUser.uid),
      });

      await updateDoc(currentUserRef, {
        following: arrayUnion(userId),
      });
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 border rounded-xl shadow-sm">

    {showFollowers && (
  <FollowList
    ids={followers}
    title="Followers"
    onClose={() => setShowFollowers(false)}
  />
)}

{showFollowing && (
  <FollowList
    ids={following}
    title="Following"
    onClose={() => setShowFollowing(false)}
  />
)}  
      {/* Avatar */}
      <img
        src={
          liveUser.avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${liveUser.name || "User"}`
        }
        alt="avatar"
        className="w-20 h-20 rounded-full border"
      />

      <div>
        <h2 className="text-xl font-semibold">{liveUser.name}</h2>
        <p className="text-gray-500">@{liveUser.username}</p>
        <p className="text-gray-600">{liveUser.bio}</p>

        {/* Links */}
        <div className="flex gap-3 mt-2">
          {liveUser.github && (
            <a href={liveUser.github} target="_blank" className="text-blue-500">
              GitHub
            </a>
          )}

          {liveUser.linkedin && (
            <a href={liveUser.linkedin} target="_blank" className="text-blue-500">
              LinkedIn
            </a>
          )}
        </div>

        {/* Followers */}
        <div className="flex gap-4 mt-2 text-sm text-gray-600">
          <p
  onClick={() => setShowFollowers(true)}
  className="cursor-pointer"
>
  <strong>{followers.length}</strong> Followers
</p>
          <p
  onClick={() => setShowFollowing(true)}
  className="cursor-pointer"
>
  <strong>{following.length}</strong> Following
</p>
        </div>

        {/* Follow Button */}
        {currentUser.uid !== userId && (
          <button
            onClick={handleFollow}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </button>
        )}

        {/* Edit Button */}
        {currentUser.uid === userId && (
          <button
            onClick={() => navigate("/edit-profile")}
            className="mt-2 ml-2 px-3 py-1 bg-gray-300 rounded"
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;