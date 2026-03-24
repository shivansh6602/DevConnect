
import Post from './Post'

const PostList = ({posts, deletePost, likePost, addComment}) => {
  return (
    <div>
        {posts.map((post) => (
            <Post key={post.id} post={post} deletePost={deletePost} likePost={likePost} addComment={addComment}/>
        ))}
    </div>
  )
}

export default PostList