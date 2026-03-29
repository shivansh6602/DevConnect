import ProfileHeader from '../components/profile/ProfileHeader'
import UserPosts from '../components/profile/UserPosts'



const Profile = ({ posts, profile, addFollowers }) => {

  const userPosts = posts.filter(
    (post) => post.user.email === profile.email
  );

  return (
    <div>
      <ProfileHeader user={profile} addFollowers={addFollowers} />
      <UserPosts posts={userPosts} />
    </div>
  );
};

export default Profile