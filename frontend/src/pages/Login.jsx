import React, { useState } from "react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div>
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
    </div>
  );
};

export default Login;
