import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";



const EditProfile = () => {
const avatarSeeds = [
  "Shivansh",
  "Dev",
  "Coder",
  "Ninja",
  "Knight",
  "Alpha",
  "Beta",
  "Gamma"
];

const [selectedAvatar, setSelectedAvatar] = useState("");
  const { user } = useContext(AuthContext); // current logged user
  const navigate = useNavigate();

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
  if (!user) return; // wait for user

  const fetchUser = async () => {
    const docRef = doc(db, "users", user.uid);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();

      setForm({
        name: data.name || "",
        bio: data.bio || "",
        github: data.github || "",
        linkedin: data.linkedin || "",
        avatar: data.avatar || "",
      });

      // ✅ FIXED: now snap exists here
      setSelectedAvatar(data.avatar || "");
    }
  };

  fetchUser();
}, [user]);

  // 🔥 update firestore
const handleUpdate = async () => {
  try {
    const docRef = doc(db, "users", user.uid);

    await updateDoc(docRef, {
      name: form.name,
      bio: form.bio,
      github: form.github,
      linkedin: form.linkedin,
      avatar: form.avatar, // ✅ direct save
    });

    alert("Profile Updated ✅");
    navigate("/profile");

  } catch (error) {
    console.log("Error:", error);
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
<h3>Select Avatar</h3>

<div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
  {avatarSeeds.map((seed, index) => {
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

    return (
      <img
        key={index}
        src={avatarUrl}
        alt="avatar"
        width="80"
        style={{
          cursor: "pointer",
          border:
            selectedAvatar === avatarUrl
              ? "3px solid blue"
              : "2px solid gray",
          borderRadius: "50%",
        }}
       onClick={() => {
  setSelectedAvatar(avatarUrl);
  setForm({ ...form, avatar: avatarUrl }); // 🔥 sync with form
}}
      />
    );
  })}
</div>

{form.avatar && (
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