import React from "react";
import Post from "../posts/Post"; 

const UserPosts = ({
  posts,
  likePost,
  deletePost,
  addComment,
  deleteComment,
  likeComment,
}) => {
  return (
    <div>
      <h3>User Posts</h3>

      {posts.length === 0 ? (
        <p>No Posts Yet</p>
      ) : (
        posts.map((post) => (
          <Post
            key={post.id}
            post={post}
          
          />
        ))
      )}
    </div>
  );
};

export default UserPosts;