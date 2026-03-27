const ProfileHeader = ({ user }) => {

  
  if (!user) return <p>Loading...</p>;


  const seed = user.username || user.name || "defaultUser";

  const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  return (
    <div className="flex items-center gap-4 p-4 border rounded-xl shadow-sm">

      
      <img
        src={avatarUrl}
        alt="avatar"
        className="w-20 h-20 rounded-full border"
      />

     
      <div>
        <h2 className="text-xl font-semibold">{user.name}</h2>
        <p className="text-gray-600">{user.bio}</p>

       
        <div className="flex gap-3 mt-2">
          <a 
            href={user.github} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500"
          >
            GitHub
          </a>

          <a 
            href={user.linkedin} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500"
          >
            LinkedIn
          </a>
        </div>
        <div className="flex gap-4 mt-2 text-sm text-gray-600">
  <p><strong>{user.followers}</strong> Followers</p>
  <p><strong>{user.following}</strong> Following</p>
</div>
      </div>

    </div>
  );
};

export default ProfileHeader;