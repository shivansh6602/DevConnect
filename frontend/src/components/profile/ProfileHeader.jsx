import { updateDoc, doc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../../firebase";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const ProfileHeader = ({ user, userId }) => {
  const navigate = useNavigate(); // ✅ fix

  const { user: currentUser } = useContext(AuthContext);

  if (!user || !currentUser) return <p>Loading...</p>;

  // 🔥 check follow status
const followers = Array.isArray(user.followers)
  ? user.followers
  : [];

const following = Array.isArray(user.following)
  ? user.following
  : [];

const isFollowing = followers.includes(currentUser.uid);

  const handleFollow = async () => {
    const currentUserRef = doc(db, "users", currentUser.uid);
    const profileRef = doc(db, "users", userId); // ✅ FIXED

    if (isFollowing) {
      // ❌ Unfollow
      await updateDoc(profileRef, {
        followers: arrayRemove(currentUser.uid),
      });

      await updateDoc(currentUserRef, {
        following: arrayRemove(userId),
      });
    } else {
      // ✅ Follow
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

      {/* Avatar */}
      <img
        src={user.avatar}
        alt="avatar"
        className="w-20 h-20 rounded-full border"
      />

      <div>
        <h2 className="text-xl font-semibold">{user.name}</h2>
        <p className="text-gray-600">{user.bio}</p>

        {/* Links */}
        <div className="flex gap-3 mt-2">
          {user.github && (
            <a href={user.github} target="_blank" className="text-blue-500">
              GitHub
            </a>
          )}

          {user.linkedin && (
            <a href={user.linkedin} target="_blank" className="text-blue-500">
              LinkedIn
            </a>
          )}
        </div>

        {/* Followers */}
        <div className="flex gap-4 mt-2 text-sm text-gray-600">
          <p><strong>{followers.length}</strong> Followers</p>
          <p><strong>{user.following?.length || 0}</strong> Following</p>
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