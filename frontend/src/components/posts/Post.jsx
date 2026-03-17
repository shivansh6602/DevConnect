import React from 'react'

const Post = ({post}) => {
  return (
       <div style={{border:"1px solid gray", padding:"10px", margin:"10px 0"}}>
        <p>{post.content}</p>
       </div>
  )
}

export default Post