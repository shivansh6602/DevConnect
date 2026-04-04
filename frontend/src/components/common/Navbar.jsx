import { Link } from 'react-router-dom';

import React, { useContext } from 'react'
import { AuthContext } from '../../context/AuthContext';

const Navbar = () => {

const { user, logout} = useContext(AuthContext)


  return (
    <nav style={{ padding: "15px", borderBottom: "1px solid #ccc" }}>
<h2>DevConnect</h2>
<div>
    <Link to="/">Home</Link>
    <Link to="/chat">Chat</Link>
    <Link to="/developers">Developers</Link>
    <Link to="/feed">Feed</Link>
    <Link to="/profile">Profile</Link>
    {user ?  (
      <>
      <button onClick={logout}>Logout</button>
      </>
    ) : (
     <> <Link to="/login">Login</Link>
    <Link to="/register">Register</Link></>)}
  
    
</div>
    </nav>
  )
}

export default Navbar