import { useState } from "react";


import CreatePost from "../components/posts/CreatePost";
import PostList from "../components/posts/PostList";

function Feed() {

 
  const [posts, setPosts] = useState([]);

  function addPost(text) {

    const newPost = {
      id: Date.now(),
      content: text
    };

    setPosts([newPost, ...posts]);

  }

  return (

    <div>

      <h2>Developer Feed</h2>

      <CreatePost addPost={addPost} />

      
      <PostList posts={posts} />

    </div>

  );
}

export default Feed;