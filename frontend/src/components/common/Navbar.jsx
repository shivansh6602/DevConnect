import { Link } from 'react-router-dom';

import React from 'react'

const Navbar = () => {
  return (
    <nav style={{ padding: "15px", borderBottom: "1px solid #ccc" }}>
<h2>DevConnect</h2>
<div>
    <Link to="/">Home</Link>
    <Link to="/developers">Developers</Link>
    <Link to="/feed">Feed</Link>
    <Link to="/login">Login</Link>
    <Link to="/register">Register</Link>
</div>
    </nav>
  )
}

export default Navbar