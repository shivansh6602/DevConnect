import React from 'react'

const Post = ({post, deletePost, likePost}) => {
  return (
       <div style={{border:"1px solid gray", padding:"10px", margin:"10px 0"}}>
        <p>{post.content}</p>
                <button onClick={() => likePost(post.id)}>Like({post.likes})</button>
        <button onClick={() => deletePost(post.id)} >Delete</button>
       </div>
  )
}

export default Post