import { useContext } from 'react';
import ProfileHeader from '../components/profile/ProfileHeader'
import UserPosts from '../components/profile/UserPosts'
import { AuthContext } from '../context/AuthContext';
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";


const Profile = ({ posts, profile }) => {
  const { user } = useContext(AuthContext);
  const { id } = useParams();

  const [profileData, setProfileData] = useState(profile);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;

      const userRef = doc(db, "users", id);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        setProfileData(snap.data());
      }
    };

    fetchUser();
  }, [id]);

  // 🔥 KEY LOGIC
  const userPosts = posts.filter(
    (post) => post.userId === (id || user.uid)
  );

  if (!profileData) return <p>Loading...</p>;

  return (
    <div>
      <ProfileHeader user={profileData} />
      <UserPosts posts={userPosts} />
    </div>
  );
};

export default Profile