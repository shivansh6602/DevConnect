import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { increment } from "firebase/firestore";
import { db } from "../firebase";
import { useContext, useEffect, useState } from "react";
import CreatePost from "../components/posts/CreatePost";
import PostList from "../components/posts/PostList";
import { AuthContext } from "../context/AuthContext";
import { onSnapshot } from "firebase/firestore";



const Feed = ({ posts, setPosts }) => {
  const { user } = useContext(AuthContext);
const [following, setFollowing] = useState([]);
const addPost = async (data) => {
  try {
    // 🔥 get user profile from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();

    if (!userData) {
      console.log("User data not found");
      return;
    }

    const newPost = {
      title: data.title,
      content: data.text,
      likes: 0,
      likedBy: [],
      userId: user.uid,

      user: {
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar, // ✅ SAME avatar everywhere
        userId: user.uid,
      },

      createdAt: new Date(),
    };

    await addDoc(collection(db, "posts"), newPost);

  } catch (error) {
    console.log("Error adding post:", error);
  }
};

  const deletePost = async (id) => {
    try {
      const postRef = doc(db, "posts", id);
      await deleteDoc(postRef);
    } catch (error) {
      console.error(
        "Error deleting post:",
        error,
      );
    }
  };

const likePost = async (id) => {
  try {
    const postRef = doc(db, "posts", id);
    const postSnap = await getDoc(postRef);
    const data = postSnap.data();

    if (data.likedBy?.includes(user.uid)) {
      console.log("Already Liked");
      return;
    }

    await updateDoc(postRef, {
      likes: increment(1),
      likedBy: [...(data.likedBy || []), user.uid],
    });

  } catch (error) {
    console.error("Error liking post:", error);
  }
};

 const addComment = async (postId, text) => {
  if (!text.trim()) return;

  try {
    const commentRef = collection(db, "posts", postId, "comments");

    // 🔥 fetch user profile
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();

    await addDoc(commentRef, {
      text,
      likes: 0,
      likedBy: [],
      createdAt: new Date(),

      user: {
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar, // ✅ FIXED
        userId: user.uid,
      },
    });

  } catch (error) {
    console.log("Error adding comment:", error);
  }
};

  const deleteComment = async (
    postId,
    commentId,
  ) => {
    try {
      const commentRef = doc(
        db,
        "posts",
        postId,
        "comments",
        commentId,
      );
      await deleteDoc(commentRef);
    } catch (error) {
      console.log("Error deleting", error);
    }
  };

 const likeComment = async (postId, commentId) => {
  try {
    const commentRef = doc(
      db,
      "posts",
      postId,
      "comments",
      commentId
    );

    const commentSnap = await getDoc(commentRef);
    const data = commentSnap.data();

    if (data.likedBy?.includes(user.uid)) {
      console.log("Already liked comment");
      return;
    }

    await updateDoc(commentRef, {
      likes: increment(1),
      likedBy: [...(data.likedBy || []), user.uid],
    });

  } catch (error) {
    console.log("Error liking comment:", error);
  }
};

useEffect(() => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);

  const unsubscribe = onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      setFollowing(data.following || []);
    }
  });

  return () => unsubscribe();
}, [user]);

useEffect(() => {
  if (!user) return;

  const unsubscribe = onSnapshot(collection(db, "posts"), (snapshot) => {
    let postsData = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
      comments: [],
    }));

    // 🔥 FILTER POSTS
    const filteredPosts = postsData.filter(
      (post) =>
        following.includes(post.userId) || post.userId === user.uid
    );

    setPosts(filteredPosts);

    // 🔥 Load comments (same as before)
    filteredPosts.forEach((post) => {
      onSnapshot(
        collection(db, "posts", post.id, "comments"),
        (commentSnap) => {
          const comments = commentSnap.docs.map((c) => ({
            id: c.id,
            ...c.data(),
          }));

          setPosts((prev) =>
            prev.map((p) =>
              p.id === post.id ? { ...p, comments } : p
            )
          );
        }
      );
    });
  });

  return () => unsubscribe();
}, [user, following]);
   
  return (
    <div>
      {posts.length === 0 && (
  <p className="text-gray-500 mt-4">
    Follow users to see their posts 👀
  </p>
)}
      <h2>Developer Feed</h2>

      <CreatePost addPost={addPost} />

      <PostList
        posts={posts}
        deletePost={deletePost}
        likePost={likePost}
        addComment={addComment}
        deleteComment={deleteComment}
        likeComment={likeComment}
      />
    </div>
  );
};

export default Feed;
