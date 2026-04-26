import Post from "./Post";

const PostList = ({
  posts,
  deletePost,
  likePost,
  addComment,
  deleteComment,
  likeComment
}) => {
  // 🔥 safety check (prevents crash)
  if (!posts || posts.length === 0) {
    return <p className="text-center text-gray-500 mt-4">No posts yet</p>;
  }

  return (
    <div className="flex flex-col gap-4 mt-4">
      {posts.map((post) => (
        <Post 
        key={post.id}
        post={post} />
      ))}
    </div>
  );
};

export default PostList;