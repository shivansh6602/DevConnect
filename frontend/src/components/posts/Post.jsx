import React, { useState, useContext } from "react";
import { formatDistanceToNow } from "date-fns";
import { AuthContext } from "../../context/AuthContext";

const Post = ({
  post,
  deletePost,
  likePost,
  addComment,
  deleteComment,
  likeComment,
}) => {

  const [commentText, setCommentText] = useState("");
  const { user } = useContext(AuthContext);

  return (
    <div className="bg-white p-4 rounded-xl shadow-md border">

      {/* 🔥 Header */}
      <div className="flex items-center gap-3 mb-2">
        <img
          src={post.user?.avatar}
          alt="avatar"
          className="w-10 h-10 rounded-full border"
        />

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
          onClick={() => likePost(post.id)}
          className="text-blue-500"
        >
          👍 Like ({post.likes})
        </button>

        {post.userId === user.uid && (
          <button
            onClick={() => deletePost(post.id)}
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

          <img
            src={c.user?.avatar}
            className="w-8 h-8 rounded-full"
            alt="user"
          />

          <div className="bg-gray-100 p-2 rounded-lg w-full">
            <p className="font-semibold">{c.user?.name}</p>
            <p>{c.text}</p>

            <div className="flex gap-2 text-sm mt-1">
              <button onClick={() => likeComment(post.id, c.id)}>
                👍 {c.likes}
              </button>

              {c.user?.userId === user.uid && (
                <button
                  onClick={() => deleteComment(post.id, c.id)}
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
            addComment(post.id, commentText);
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