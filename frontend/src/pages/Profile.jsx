import ProfileHeader from '../components/profile/ProfileHeader'
import UserPosts from '../components/profile/UserPosts'


const Profile = ({posts, currentUser }) => {

  const userPosts = posts.filter(
    (post) => post.user.id == currentUser.id
);
  return (
    <div>
      <ProfileHeader user={currentUser}/>
      <UserPosts posts={userPosts}/>
    </div>
  )
}

export default Profile