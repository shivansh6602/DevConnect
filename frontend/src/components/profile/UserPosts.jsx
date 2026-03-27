import Post from '../posts/Post'

import React from 'react'

const UserPosts = ({ posts }) => {
  return (
    <div>
        <h3>User Posts</h3>
        {posts.length === 0 ? (
            <p>No Posts Yet</p>
        ) : (
            posts.map((post) => (
                <Post key={post.id} post={post}/>
            ))
        )
        
        }
    </div>
  )
}

export default UserPosts