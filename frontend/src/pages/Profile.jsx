import { useContext, useEffect, useState } from "react";
import ProfileHeader from "../components/profile/ProfileHeader";
import UserPosts from "../components/profile/UserPosts";
import { AuthContext } from "../context/AuthContext";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const Profile = ({ posts }) => {
  const { user } = useContext(AuthContext); 
  // 🔥 Logged-in user from Firebase Auth

  const { id } = useParams(); 
  // 🔥 If visiting another profile → /profile/:id

  const [profileData, setProfileData] = useState(null); 
  // 🔥 This will store Firestore user data

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // 🔥 If no id → load current user profile
        const uid = id || user?.uid;

        if (!uid) return;

        const userRef = doc(db, "users", uid); // 🔥 Firestore reference
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          setProfileData(snap.data()); // ✅ Set profile data
        } else {
          console.log("User not found");
        }
      } catch (error) {
        console.log("Error fetching user:", error);
      }

      setLoading(false);
    };

    fetchUser();
  }, [id, user]);

  // 🔥 Filter posts of that user
  const userPosts = posts?.filter(
    (post) => post.userId === (id || user?.uid)
  );

  if (loading) return <p>Loading profile...</p>;

  return (
    <div>
   <ProfileHeader 
  user={profileData} 
  userId={id || user.uid} 
/>
      <UserPosts posts={userPosts} />
    </div>
  );
};

export default Profile;