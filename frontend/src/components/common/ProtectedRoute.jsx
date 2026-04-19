import React, { useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  // ⏳ Step 1: Wait until Firebase finishes checking auth
  if (loading) {
    return <h2>Loading...</h2>; // you can replace with spinner later
  }

  // ❌ Step 2: If no user → redirect
  if (!user) {
    return <Navigate to="/login" />;
  }

  // ✅ Step 3: If user exists → allow access
  return children;
};

export default ProtectedRoute;