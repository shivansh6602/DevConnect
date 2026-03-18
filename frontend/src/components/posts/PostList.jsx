
import Post from './Post'

const PostList = ({posts, deletePost, likePost}) => {
  return (
    <div>
        {posts.map((post) => (
            <Post key={post.id} post={post} deletePost={deletePost} likePost={likePost}/>
        ))}
    </div>
  )
}

export default PostList