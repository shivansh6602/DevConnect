import React, {
  useContext,
  useState,
} from "react";
import CreatePost from "../components/posts/CreatePost";
import PostList from "../components/posts/PostList";
import { AuthContext } from "../context/AuthContext";

const Feed = () => {
  const [posts, setPosts] = useState([]);

  const { user } = useContext(AuthContext);

  const addPost = (data) => {
    const newPost = {
      id: Date.now(),
      title: data.title,
      content: data.text,

      likes: 0,
      user: user?.email || "Guest",
      time: new Date().toLocaleString(),
      comments: [],
    };

    setPosts([newPost, ...posts]);
  };

  const deletePost = (id) => {
    const updatedPosts = posts.filter(
      (post) => post.id !== id,
    );
    setPosts(updatedPosts);
  };

  const likePost = (id) => {
    const updatedPosts = posts.map((post) => {
      if (post.id === id) {
        return { ...post, likes: post.likes + 1 };
      }
      return post;
    });
    setPosts(updatedPosts);
  };
  
  const addComment = (postId, text) => {
 const updatedPosts = posts.map((post) => {
  if (post.id === postId) {
    return {
      ...post,
      comments: [
        ...post.comments,{
          id: Date.now(),
          text: text
        }
      ]
    }
  }
  return post
 })
 setPosts(updatedPosts)
  }

  return (
    <div>
      <h2>Devloper Feed</h2>

      <CreatePost addPost={addPost} />

      <PostList
        posts={posts}
        deletePost={deletePost}
        likePost={likePost}
        addComment={addComment}
      />
    </div>
  );
};

export default Feed;
