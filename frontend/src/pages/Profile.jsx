import { useContext, useEffect, useState } from "react";
import ProfileHeader from "../components/profile/ProfileHeader";
import UserPosts from "../components/profile/UserPosts";
import { AuthContext } from "../context/AuthContext";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { collection, query, where, getDocs, onSnapshot  } from "firebase/firestore";


const Profile = ({
  posts,
  likePost,
  deletePost,
  addComment,
  deleteComment,
  likeComment
}) => {
  const { user } = useContext(AuthContext); 
  // 🔥 Logged-in user from Firebase Auth

  const { id } = useParams(); 
  // 🔥 If visiting another profile → /profile/:id

  const [profileData, setProfileData] = useState(null); 
  // 🔥 This will store Firestore user data

  const [loading, setLoading] = useState(true);

  const [userPosts, setUserPosts] = useState([]);
 


useEffect(() => {
  const fetchUser = async () => {
    try {
      const uid = id || user?.uid;
      if (!uid) return;

      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        setProfileData(snap.data());
        
      } else {
        console.log("User not found");
      }
    } catch (error) {
      console.log("Error:", error);
    }

    setLoading(false);
  };

  fetchUser();
}, [id, user]);

useEffect(() => {
  const uid = id || user?.uid;
  if (!uid) return;

  const q = query(
    collection(db, "posts"),
    where("userId", "==", uid)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    let postsData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      comments: [],
    }));

    setUserPosts(postsData);

    // 🔥 Load comments (same as Feed)
    postsData.forEach((post) => {
      onSnapshot(
        collection(db, "posts", post.id, "comments"),
        (commentSnap) => {
          const comments = commentSnap.docs.map((c) => ({
            id: c.id,
            ...c.data(),
          }));

          setUserPosts((prev) =>
            prev.map((p) =>
              p.id === post.id ? { ...p, comments } : p
            )
          );
        }
      );
    });
  });

  return () => unsubscribe();
}, [id, user]);

  if (loading) return <p>Loading profile...</p>;

  return (
    <div>
   <ProfileHeader 
  user={profileData} 
  userId={id || user.uid} 
/>
  <UserPosts 
    posts={userPosts} 
  likePost={likePost}
  deletePost={deletePost}
  addComment={addComment}
  deleteComment={deleteComment}
  likeComment={likeComment}
/>
    </div>
  );
};

export default Profile;