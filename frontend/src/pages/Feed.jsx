import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useContext, useEffect } from "react";
import CreatePost from "../components/posts/CreatePost";
import PostList from "../components/posts/PostList";
import { AuthContext } from "../context/AuthContext";

const Feed = ({ posts, setPosts }) => {

  const { user } = useContext(AuthContext);

  
  const addPost = async (data) => {
  try {  const newPost = {
      id: Date.now(),
      title: data.title,
      content: data.text,
      likes: 0,

      
      user: {
        email: user?.email || "guest@gmail.com",
        name: user?.email?.split("@")[0] || "Guest",
        avatar: `https://i.pravatar.cc/150?u=${user?.email}`
      },

      time: new Date().toLocaleString(),
      comments: [],
    };

    await addDoc(collection(db, "posts"), newPost);
  } catch (error){
console.log("Error adding post:", error);
  }
   
  };

  
  const deletePost = (id) => {
    setPosts(posts.filter((post) => post.id !== id));
  };

 
  const likePost = (id) => {
    setPosts(
      posts.map((post) =>
        post.id === id
          ? { ...post, likes: post.likes + 1 }
          : post
      )
    );
  };


  const addComment = (postId, text) => {
    if (!text.trim()) return;

    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                {
                  id: Date.now(),
                  text,
                  likes: 0
                }
              ]
            }
          : post
      )
    );
  };

  
  const deleteComment = (postId, commentId) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.filter(
                (c) => c.id !== commentId
              )
            }
          : post
      )
    );
  };


  const likeComment = (postId, commentId) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.map((c) =>
                c.id === commentId
                  ? { ...c, likes: c.likes + 1 }
                  : c
              )
            }
          : post
      )
    );
  };

  const fetchPosts = async () => {
    try {
      const snapshot = await getDocs(collection(db, "posts"));

      const postsData = snapshot.docs.map((doc) => ({
id: doc.id,
...doc.data(),
      }));
      setPosts(postsData);
    } catch (error) {
      console.log("Error fetching posts:", error);
      
    }
    }
    useEffect(() => {
      fetchPosts();
    }, [])
  }
  
  return (
    <div>
      <h2>Developer Feed</h2>

      <CreatePost addPost={addPost} />

      <PostList
        posts={posts}
        deletePost={deletePost}
        likePost={likePost}
        addComment={addComment}
        deleteComment={deleteComment}
        likeComment={likeComment}
      />
    </div>
  );
};

export default Feed;