import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
const Post = ({
  post,
  deletePost,
  likePost,
  addComment,
  deleteComment,
  likeComment,
}) => {

  const [commentText, setCommentText] = useState("");

  return (
  <div
  style={{
    border: "1px solid gray",
    padding: "10px",
    margin: "10px 0",
  }}
>

  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    <img
      src={post.user?.avatar}
      alt="avatar"
      width="30"
      height="30"
      style={{ borderRadius: "50%" }}
    />
    <small>
      {post.user?.name} • {formatDistanceToNow(new Date(post.time), { addSuffix: true })}
    </small>
  </div>

 
  <h3>{post.title}</h3>
  <p>{post.content}</p>

  <br />

  <button onClick={() => likePost(post.id, post.likes)}>
    Like ({post.likes})
  </button>

  <button onClick={() => deletePost(post.id)}>
    Delete
  </button>

  <hr />

  <h4>Comments:</h4>

  {post.comments.map((c) => (
  <div key={c.id} style={{ marginBottom: "8px" }}>
    
    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      
     
      <img
        src={c.user?.avatar}
        width="25"
        height="25"
        style={{ borderRadius: "50%" }}
        alt="user"
      />

      
      <div>
        <strong>{c.user?.name}</strong>
        <p>{c.text}</p>

        <button onClick={() => likeComment(post.id, c.id)}>
          Like ({c.likes})
        </button>

        <button onClick={() => deleteComment(post.id, c.id)}>
          Delete
        </button>
      </div>

    </div>

  </div>
))}

  <input
    type="text"
    placeholder="Write a Comment..."
    value={commentText}
    onChange={(e) => setCommentText(e.target.value)}
  />

  <button
    onClick={() => {
      if (!commentText.trim()) return;
      addComment(post.id, commentText);
      setCommentText("");
    }}
  >
    Comment
  </button>
</div>
  );
};

export default Post;