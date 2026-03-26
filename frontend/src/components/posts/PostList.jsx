import Post from "./Post";

const PostList = ({
  posts,
  deletePost,
  likePost,
  addComment,
  deleteComment,
  likeComment
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
          likeComment={likeComment}
        />
      ))}
    </div>
  );
};

export default PostList;
