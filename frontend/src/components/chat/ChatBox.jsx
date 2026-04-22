import React from 'react'
import MessageInput from './MessageInput' 
import MessageList from './MessageList'

const ChatBox = ({ chatId, otherUserId }) => {
  return (
    <div>
      <h3>Chat ID: {chatId}</h3>
      <p>Talking to: {otherUserId}</p>

      
      <MessageInput chatId={chatId} />
      <MessageList chatId={chatId} />
    </div>
  );
};

export default ChatBox;