import React, { useState } from 'react'
import CreatePost from '../components/posts/CreatePost'
import PostList from '../components/posts/PostList'

const Feed = () => {

  const [posts, setPost] = useState([])

  const addPost = (text) => {
    const newPost = {
      id: Date.now(),
      content: text,
      likes: 0
    };

    setPost([newPost, ...posts]);

  }

  const deletePost = (id) => {
    const updatedPosts = posts.filter((post) => 
       post.id !== id
    )
    setPost(updatedPosts);
  }

const likePost = (id) => {
  const updatedPosts = posts.map((post) => {
    if(post.id === id) {
      return {...post, likes: post.likes + 1 };
    }
    return post;
  })
   setPost(updatedPosts);
}

  return (
    <div>
     <h2>Devloper Feed</h2> 
     
     <CreatePost addPost={addPost}/>

     <PostList posts={posts} deletePost={deletePost} likePost={likePost}/>
     </div>
  )
}

export default Feed