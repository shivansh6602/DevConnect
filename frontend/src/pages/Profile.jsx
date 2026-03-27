import ProfileHeader from '../components/profile/ProfileHeader'
import UserPosts from '../components/profile/UserPosts'



const Profile = ({ posts, profile }) => {

  const userPosts = posts.filter(
    (post) => post.user.email === profile.email
  );

  return (
    <div>
      <ProfileHeader user={profile} />
      <UserPosts posts={userPosts} />
    </div>
  );
};

export default Profile