import React, { useState, useContext } from "react";
import { formatDistanceToNow } from "date-fns";
import { AuthContext } from "../../context/AuthContext";
import { db } from "../../firebase";
import {
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
  collection,
  addDoc,
} from "firebase/firestore";
import { increment, arrayUnion } from "firebase/firestore";

const Post = ({ post }) => {

  const [commentText, setCommentText] = useState("");
  const { user } = useContext(AuthContext);

  const likePostHandler = async () => {
  const postRef = doc(db, "posts", post.id);
  const snap = await getDoc(postRef);
  const data = snap.data();

  if (data.likedBy?.includes(user.uid)) return;

  await updateDoc(postRef, {
    likes: increment(1),
    likedBy: arrayUnion(user.uid),
  });
};

const deletePostHandler = async () => {
  await deleteDoc(doc(db, "posts", post.id));
};

const addCommentHandler = async () => {
  if (!commentText.trim()) return;

  try {
    const commentRef = collection(db, "posts", post.id, "comments");

    // 🔥 fetch user from Firestore (NOT auth)
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();

    await addDoc(commentRef, {
      text: commentText,
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

    setCommentText("");
  } catch (error) {
    console.log("Error adding comment:", error);
  }
};

const deleteCommentHandler = async (commentId) => {
  await deleteDoc(doc(db, "posts", post.id, "comments", commentId));
};

const likeCommentHandler = async (commentId) => {
  const ref = doc(db, "posts", post.id, "comments", commentId);
  const snap = await getDoc(ref);
  const data = snap.data();

  if (data.likedBy?.includes(user.uid)) return;

  await updateDoc(ref, {
    likes: increment(1),
    likedBy: arrayUnion(user.uid),
  });
};
  return (
    <div className="bg-white p-4 rounded-xl shadow-md border">

      {/* 🔥 Header */}
      <div className="flex items-center gap-3 mb-2">
 {post.user?.avatar ? (
  <img
    src={post.user.avatar}
    alt="avatar"
    className="w-10 h-10 rounded-full border"
  />
) : (
  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold">
    {post.user?.name?.[0] || "U"}
  </div>
)}

        <div>
          <p className="font-semibold">{post.user?.name}</p>
          <small className="text-gray-500">
            {post.createdAt
              ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true })
              : "Just now"}
          </small>
        </div>
      </div>

      {/* 🔥 Content */}
      <h3 className="text-lg font-bold">{post.title}</h3>
      <p className="text-gray-700">{post.content}</p>

      {/* 🔥 Actions */}
      <div className="flex gap-3 mt-3">
        <button
          onClick={likePostHandler}
          className="text-blue-500"
        >
          👍 Like ({post.likes})
        </button>

        {post.userId === user.uid && (
          <button
            onClick={deletePostHandler}
            className="text-red-500"
          >
            Delete
          </button>
        )}
      </div>

      <hr className="my-3" />

      {/* 🔥 Comments */}
      <h4 className="font-semibold mb-2">Comments</h4>

      {post.comments?.map((c) => (
        <div key={c.id} className="flex gap-3 mb-3">

   {c.user?.avatar ? (
  <img
    src={c.user.avatar}
    className="w-8 h-8 rounded-full"
    alt="user"
  />
) : (
  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold">
    {c.user?.name?.[0] || "U"}
  </div>
)}

          <div className="bg-gray-100 p-2 rounded-lg w-full">
            <p className="font-semibold">{c.user?.name}</p>
            <p>{c.text}</p>

            <div className="flex gap-2 text-sm mt-1">
              <button onClick={() => likeCommentHandler(c.id)}>
                👍 {c.likes}
              </button>

              {c.user?.userId === user.uid && (
                <button
                  onClick={() => deleteCommentHandler(c.id)}
                  className="text-red-500"
                >
                  Delete
                </button>
              )}
            </div>
          </div>

        </div>
      ))}

      {/* 🔥 Add Comment */}
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          placeholder="Write a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="border p-2 rounded w-full"
        />

        <button
          onClick={() => {
            if (!commentText.trim()) return;
            addCommentHandler();
            setCommentText("");
          }}
          className="bg-blue-500 text-white px-3 rounded"
        >
          Post
        </button>
      </div>

    </div>
  );
};

export default Post;