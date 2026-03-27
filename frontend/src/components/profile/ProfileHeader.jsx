import React from 'react'

const ProfileHeader = ({user}) => {
  return (
    <div>
        <img src={user.avatar} width="80"/>
        <h2>{user.name}</h2>
        <p>{user.bio}</p>
        <a href={user.github}>GitHub</a>
        <br />
        <a href={user.linkedin}>LinkedIn</a>
    </div>
  )
}

export default ProfileHeader