import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const EditProfile = () => {
  const { user } = useContext(AuthContext); // current logged user
  const navigate = useNavigate();
  const [file, setFile] = useState(null);

  // 🧠 state = form data
  const [form, setForm] = useState({
    name: "",
    bio: "",
    github: "",
    linkedin: "",
    avatar: "",
  });

  // 🔥 fetch existing data
useEffect(() => {
  if (!user) return; // ✅ WAIT until user loads

  const fetchUser = async () => {
    const docRef = doc(db, "users", user.uid);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      setForm({
        name: snap.data().name || "",
        bio: snap.data().bio || "",
        github: snap.data().github || "",
        linkedin: snap.data().linkedin || "",
        avatar: snap.data().avatar || "",
      });
    }
  };

  fetchUser();
}, [user]);

  // 🔥 update firestore
  const handleUpdate = async () => {
  try {
    const docRef = doc(db, "users", user.uid);

    let avatarUrl = form.avatar; // default

    // 🔥 if user selected file → upload
    if (file) {
      const storageRef = ref(storage, `avatars/${user.uid}`);

      // upload file
      await uploadBytes(storageRef, file);

      // get URL
      avatarUrl = await getDownloadURL(storageRef);
    }

    // 🔥 update firestore
    await updateDoc(docRef, {
      name: form.name,
      bio: form.bio,
      github: form.github,
      linkedin: form.linkedin,
      avatar: avatarUrl, // ✅ uploaded URL
    });

    alert("Profile Updated ✅");
    navigate("/profile");

  } catch (error) {
    console.log("Upload Error:", error);
  }
};

  return (
    <div>
      <h2>Edit Profile</h2>

      <input
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Name"
      />

      <input
        value={form.bio}
        onChange={(e) => setForm({ ...form, bio: e.target.value })}
        placeholder="Bio"
      />

      <input
        value={form.github}
        onChange={(e) => setForm({ ...form, github: e.target.value })}
        placeholder="GitHub"
      />

      <input
        value={form.linkedin}
        onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
        placeholder="LinkedIn"
      />
<input
  type="file"
  onChange={(e) => setFile(e.target.files[0])}
/>
      {/* <input
        value={form.avatar}
        onChange={(e) => setForm({ ...form, avatar: e.target.value })}
        placeholder="Avatar URL"
      /> */}
{file && (
  <img
    src={URL.createObjectURL(file)}
    alt="preview"
    style={{ width: "80px", borderRadius: "50%" }}
  />
)}

{form.avatar && !file && (
  <img
    src={form.avatar}
    alt="current"
    style={{ width: "80px", borderRadius: "50%" }}
  />
)}
      <button onClick={handleUpdate}>Save</button>
    </div>
  );
};

export default EditProfile;