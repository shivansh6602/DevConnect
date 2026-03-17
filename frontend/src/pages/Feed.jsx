import React, { useState } from 'react'
import CreatePost from '../components/posts/CreatePost'
import PostList from '../components/posts/PostList'

const Feed = () => {

  const [posts, setPost] = useState([])

  const addPost = (text) => {
    const newPost = {
      id: Date.now(),
      content: text
    };

    setPost([newPost, ...posts]);

  }

  return (
    <div>
     <h2>Devloper Feed</h2> 
     
     <CreatePost addPost={addPost}/>

     <PostList posts={posts}/>
     </div>
  )
}

export default Feed