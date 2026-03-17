import React, { useState } from 'react'

const CreatePost = ({addPost}) => {

const [text, setText] = useState("")

const handleSubmit = (e) => {
    e.preventDefault();

    addPost(text)
    setText("");
}

  return (

<form onSubmit={handleSubmit}>
    <input type="text" placeholder='Share something with developers...' value={text} onChange={(e) => setText(e.target.value)} />

    <button>Create Post</button>
</form>

  );
}

export default CreatePost;