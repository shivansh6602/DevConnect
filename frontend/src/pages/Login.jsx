import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");


  const {login} = useContext(AuthContext)
const navigate = useNavigate();

  const handleSubmit = (e) => {
e.preventDefault();

const userData = {
  email: email
};

login(userData)

navigate("/feed")
  }
  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Enter Your Mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Enter Your Password"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
        }
      />
      <button>Login</button>
      </form>
    </div>
  );
};

export default Login;
