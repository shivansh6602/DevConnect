import { Routes, Route } from "react-router-dom"; // Router components

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Developers from "./pages/Developers";
import Navbar from './components/common/Navbar'
import ProtectedRoute from './components/common/ProtectedRoute'

function App() {
  return (
    <>
     <Navbar />
      <Routes>

        
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

       
        <Route path="/register" element={<Register />} />

       
        <Route path="/feed" element={
          <ProtectedRoute> <Feed /></ProtectedRoute>
         } />

       
        <Route path="/profile/:id" element={<Profile />} />

      
        <Route path="/developers" element={<Developers />} />

      </Routes>
    </>
  );
}

export default App;
