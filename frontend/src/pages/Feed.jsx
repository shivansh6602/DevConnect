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
import { useContext, useEffect } from "react";
import CreatePost from "../components/posts/CreatePost";
import PostList from "../components/posts/PostList";
import { AuthContext } from "../context/AuthContext";
import { onSnapshot } from "firebase/firestore";


const Feed = ({ posts, setPosts }) => {
  const { user } = useContext(AuthContext);

  const addPost = async (data) => {
    try {
      const newPost = {
        title: data.title,
        content: data.text,
        likes: 0,
        likedBy: [],
        user: {
          email: user?.email || "guest@gmail.com",
          name:
            user?.email?.split("@")[0] || "Guest",
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
        },
        time: new Date().toLocaleString(),
        comments: [],
      };

      await addDoc(
        collection(db, "posts"),
        newPost,
      );
    } catch (error) {
      console.log("Error adding post:", error);
    }
    console.log(data);
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

  const likePost = async (id, currentLikes) => {
    try {
      const postRef = doc(db, "posts", id);
const snapshot = await getDocs(collection(db, "posts"));
const postDoc = snapshot.docs.find((d) => d.id === id);

if (!postDoc) return;
const data = postDoc.data();
if (data.likedBy?.includes(user.email)) {
  console.log("Already Liked");
  return;
}
await updateDoc(postRef, {
  likes: increment(1),
  likedBy: [...(data.likedBy || []), user.email],
});
   }   catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const addComment = async (postId, text) => {
    if (!text.trim()) return;

    try {
      const commentRef = collection(
        db,
        "posts",
        postId,
        "comments",
      );

      await addDoc(commentRef, {
        text,
        likes: 0,
        likedBy: [],
        createdAt: new Date(),
        user: {
          name: user?.email?.split("@")[0] || "Guest",
          email: user?.email,
           avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`,
        }
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

    if (data.likedBy?.includes(user.email)) {
      console.log("Already liked comment");
      return;
    }

    await updateDoc(commentRef, {
      likes: increment(1),
      likedBy: [...(data.likedBy || []), user.email],
    });

  } catch (error) {
    console.log("Error liking comment:", error);
  }
};



  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "posts"),
      (snapshot) => {
        snapshot.docs.forEach((docSnap) => {
          const postId = docSnap.id;

          onSnapshot(
            collection(
              db,
              "posts",
              postId,
              "comments",
            ),
            (commentSnap) => {
              const comments =
                commentSnap.docs.map((c) => ({
                  id: c.id,
                  ...c.data(),
                }));

              setPosts((prevPosts) =>
                prevPosts.map((p) =>
                  p.id === postId
                    ? { ...p, comments }
                    : p,
                ),
              );
            },
          );
        });

        const postsData = snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          }),
        );

        setPosts(postsData);
      },
    );

    return () => unsubscribe();
  }, []);

  return (
    <div>
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
