import Post from "./Post";

const PostList = ({
  posts,
  deletePost,
  likePost,
  addComment,
  deleteComment,
}) => {
  return (
    <div>
      {posts.map((post) => (
        <Post
          key={post.id}
          post={post}
          deletePost={deletePost}
          likePost={likePost}
          addComment={addComment}
          deleteComment={deleteComment}
        />
      ))}
    </div>
  );
};

export default PostList;
