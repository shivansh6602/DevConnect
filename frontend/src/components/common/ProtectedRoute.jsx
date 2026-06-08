import React, { useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  
  if (loading) {
    return <h2>Loading...</h2>; 
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  
  return children;
};

export default ProtectedRoute;