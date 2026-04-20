import React from 'react'


const ChatBox = ({ chatId, otherUserId }) => {
  return (
    <div>
      <h3>Chat ID: {chatId}</h3>
      <p>Talking to: {otherUserId}</p>
    </div>
  );
};

export default ChatBox;

