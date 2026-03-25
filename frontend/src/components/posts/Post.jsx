import React, { useState } from 'react'

const Post = ({post, deletePost, likePost, addComment, deleteComment}) => {

  const [commentText, setCommentText] = useState("")

  return (

    <div style={{
      border: "1px solid gray",
      padding: "10px",
      margin: "10px 0"
    }}>

     
      <h3>{post.title}</h3>
<p>{post.content}</p>
<small>{post.user} • {post.time}</small>

    
      <button onClick={() => likePost(post.id)}>
        Like ({post.likes})
      </button>

      <button onClick={() => deletePost(post.id)}>
        Delete
      </button>

<hr />
<h4>Comments:</h4>

{post.comments.map((c)=> (
  <div key={c.id}>
  <p key={c.id}>{c.text}</p>
   <button onClick={() => deleteComment(post.id , c.id)}>Delete</button>
</div>
))}
<input type="text" placeholder='Write a Comment...' value={commentText} onChange={(e) => setCommentText(e.target.value)} />
 
 <button onClick={() => {
  addComment(post.id, commentText)
  setCommentText("")
 }}>
  Comment
 </button>
    </div>

  );
}

export default Post;