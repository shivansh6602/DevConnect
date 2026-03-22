import React, { useState } from 'react'

const CreatePost = ({addPost}) => {

const [title, setTitle] = useState("");

  
  const [text, setText] = useState("");

  function handleSubmit(e) {

    e.preventDefault();

    
    if (!title || !text) {
      alert("All fields are required");
      return;
    }

  
    addPost({ title, text });

    
    setTitle("");
    setText("");
  }

  return (

    <form onSubmit={handleSubmit}>

      <input
        type="text"
        placeholder="Post Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <br /><br />

      <textarea
        placeholder="Write your thoughts..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <br />

      <button>Create Post</button>

    </form>
  );
}

export default CreatePost;