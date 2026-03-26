import React, { useState } from "react";

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

     
      <h3>{post.title}</h3>
      <p>{post.content}</p>
      <small>
        {post.user} • {post.time}
      </small>

      <br /><br />

   
      <button onClick={() => likePost(post.id)}>
        Like ({post.likes})
      </button>

      <button onClick={() => deletePost(post.id)}>
        Delete
      </button>

      <hr />

    
      <h4>Comments:</h4>

      {post.comments.map((c) => (
        <div key={c.id} style={{ marginBottom: "8px" }}>

          <p>{c.text}</p>

         
          <button onClick={() => likeComment(post.id, c.id)}>
            Like ({c.likes})
          </button>

         
          <button onClick={() => deleteComment(post.id, c.id)}>
            Delete
          </button>

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