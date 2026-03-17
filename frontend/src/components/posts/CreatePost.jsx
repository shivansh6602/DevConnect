import { useState } from "react";

function CreatePost({ addPost }) {


  const [text, setText] = useState("");


  function handleSubmit(e) {

    e.preventDefault();

    addPost(text);

   
    setText("");

  }

  return (

    <form onSubmit={handleSubmit}>

      <textarea
        placeholder="Share something with developers..."

        value={text}

        onChange={(e) => setText(e.target.value)}
      />

      <br />

      <button>Create Post</button>

    </form>

  );
}

export default CreatePost;