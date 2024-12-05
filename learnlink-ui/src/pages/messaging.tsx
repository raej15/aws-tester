

import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './messaging.css';
import Navbar from '../components/Navbar';
import CopyrightFooter from '../components/CopyrightFooter';
import './LandingPage.css';
import axios from 'axios';

interface Chat {
  id: number;
  name: string;
  messages: Message[];
  users: User[]; 
  createdAt: string;
  updatedAt: string;
}

interface Message{
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  chatId: number;
  
}
interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
}
const API_URL = 'https://learnlinkserverhost.zapto.org';

const socket = io(API_URL);





const Messaging: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]); // Store users
  const [searchTerm, setSearchTerm] = useState<string>(''); // Store search term
  const [showDropdown, setShowDropdown] = useState<boolean>(false); // Control dropdown visibility
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null); // Track selected user
  const [customChatName, setCustomChatName] = useState<string>(''); // Track custom chat name
  const [showGroupNameInput, setShowGroupNameInput] = useState<boolean>(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatWindowRef = React.useRef<HTMLDivElement | null>(null);
  const API_URL = 'https://learnlinkserverhost.zapto.org';



  useEffect(() => {
    // Fetch users and chats from the API when the component mounts
    axios.get(`${API_URL}/api/users`)
      .then((response) => setUsers(response.data))
      .catch((error) => console.error('Error fetching users:', error));


    // Make the API request to fetch chats for the user
  
    const token = localStorage.getItem('token');
    console.log(token);
    axios.get(`${API_URL}/api/chats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        const chatsWithMessages = response.data.map((chat: Chat) => ({
          ...chat,
          messages: chat.messages || [], // Ensure messages is always an array
        }));
        setChats(chatsWithMessages);
      })
      .catch((error) => console.error('Error fetching chats:', error));
    

     

    if (token) {
      axios.get(`${API_URL}/api/currentUser`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => setCurrentUserId(response.data.id))
        .catch((error) => console.error('Error fetching current user:', error));
    }

    
    

    /*
    socket.on('newMessage', (message) => {
      console.log('New message received!!!:', message);
      
      
      setChats((prevChats) => {
        const updatedChats = prevChats.map((chat) =>
          chat.id === message.chatId
            ? { ...chat, messages: [...(chat.messages || []), message] }
            : chat
        );
        console.log('Updated Chats:', updatedChats);
        return updatedChats;
      });
      
      
      console.log('Incoming Message Chat ID:', message.chatId);
      console.log('Existing Chat IDs:', chats.map((chat) => chat.id));


      console.log('Selected Chat:', selectedChat);
      console.log('Messages:', selectedChat?.messages);
      // Automatically scroll if the message belongs to the selected chat
      if (selectedChat?.id === message.chatId && chatWindowRef.current) {
        setTimeout(() => {
          chatWindowRef.current?.scrollTo({
            top: chatWindowRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }, 100);
      }
    });
    
    
    */
   
    
    

    

    
    
  }, []);

  
  useEffect(() =>{
    socket.on('connect', () => {
      console.log('Connected to server');
    });
    
    socket.on('newMessage', (message) => {
      console.log('New message received from server:', message);
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
    return () => {
      socket.off('connect');
      socket.off('newMessage');
    };
  },[]);
  
  // Scroll logic in a separate useEffect
  useEffect(() => {
    if (chatWindowRef.current && selectedChat?.id) {
      setTimeout(() => {
        chatWindowRef.current?.scrollTo({
          top: chatWindowRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100); // Slight delay to ensure DOM updates
    }
  }, [selectedChat?.messages]); // Runs when messages update
  

  //TODO fix this 
  const handleSendMessage = async () => {
    const token = localStorage.getItem('token');
    if (currentMessage.trim() && selectedChat) {
      try {
        const messageData: Message = {
          id: Date.now(), // Use a unique ID generator
          content: currentMessage.trim(),
          createdAt: new Date().toISOString(),
          userId: currentUserId || 0, // Add a fallback for currentUserId
          chatId: selectedChat.id,
        };
  
        
        socket.emit(
          'message',
          { chatId: selectedChat.id, content: currentMessage, userId: currentUserId, token },
          (response: { success: boolean; message?: string; error?: string }) => {
            //console.log('Received response:', response);
            if (response.success) {
              console.log('Message sent from client successfully:', response.message);
            } else {
              console.log('Message send from client failed:', response.error);
            }
          }
        );
        setCurrentMessage('');
        
        
  
        // Update the chat's messages in state
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === selectedChat.id
              ? { ...chat, messages: [...(chat.messages || []), messageData] }
              : chat
          )
        );
  
        setCurrentMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };
  


  const createNewChat = async (user: User, chatName: string) => {
    try {
      // Ensure user and chatName are properly passed to the function
      if (!user || !chatName.trim()) {
        alert('Please provide both a user and a chat name!');
        return;
      }
  
      // Check if a chat already exists with this user
      const existingChat = chats.find(chat => 
        chat.users.some(u => u.id === user.id)
      );
  
      if (existingChat) {
        alert('A chat with this user already exists!');
        return; // Prevent creating a duplicate chat
      }
  
      const payload = {
        recipientUserId: user.id,
        chatName, // Use the custom chat name
      };
  
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in again.');
        return;
      }
  
      const response = await axios.post(
        `${API_URL}/api/chats/${user.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      const newChat = response.data;
      setChats((prevChats) => [...prevChats, newChat]);
      setSelectedChat(newChat);


      // adding to study groups too eventually separate

      // Then, create the study group
      const studyGroupPayload = {
        chatId: newChat.id, // Use the created chat ID
        name: chatName, // Same name as the chat
        subject: '',
        description: '',
        users: [user.id, currentUserId], // Include both users in the study group
      };

      // const studyGroupResponse = await axios.post(
      //   `${API_URL}/api/study-groups`, // Endpoint for study groups
      //   studyGroupPayload,
      //   { headers: { Authorization: `Bearer ${token}` }}
      // );

      // // Optionally, handle the response from the study group creation, e.g., update UI
      // console.log('Study group created:', studyGroupResponse.data);

    } catch (error) {
      console.error('Error creating new chat and study group:', error);
      if (axios.isAxiosError(error) && error.response) {
        alert(`Error: ${error.response.status} - ${error.response.data.error}`);
      } else {
        alert('An unexpected error occurred.');
      }
    
    }
  };
  
  
  const getChatName = (chat: Chat): string => {
  
    if (currentUserId) {
      const otherUser = chat.users?.find((user) => user.id !== currentUserId);
      
      if (otherUser) {
        if (chat.name && chat.name.trim() !== '') {
          return chat.name + " with " +  `${otherUser.firstName} ${otherUser.lastName}` ;
        }
        else{
          return `${otherUser.firstName} ${otherUser.lastName}`;
        }
      }
    }
    if (chat.name && chat.name.trim() !== '') {
      return chat.name ;
    }
  
    return " ";
  };
  
  


  const handleDeleteChat = async (chatId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You need to be logged in to delete a chat.');
        return;
      }

      await axios.delete(`${API_URL}/api/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Server responded with:', error.response.data);
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  const filteredUsers = users.filter((user) =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="Messaging">
      <Navbar />
      <div className="Chat">
        <div className="ChatOptions">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="NewChatButton"
          >
            + New Group
          </button>
          {showDropdown && (
            <div className="Dropdown">
              <input className = "SearchBox"
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <ul className="UserList">
                {filteredUsers.map((user) => (
                  <li
                    key={user.id}
                    className="UserItem"
                    onClick={() => {
                      setSelectedUser(user); // Store the selected user
                      setShowDropdown(false); // Hide the dropdown
                      setShowGroupNameInput(true); // Show the group name input
                      setSearchTerm(''); // Clear search term
                    }}
                  >
                    {user.firstName} {user.lastName}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Show the group name input */}
          {showGroupNameInput && selectedUser && (
            <div className="ChatNameInput">
              <p>Creating group with: {selectedUser.firstName} {selectedUser.lastName}</p>
              <input className = "GroupNameInput"
                type="text"
                placeholder="Enter a group name..."
                value={customChatName}
                onChange={(e) => setCustomChatName(e.target.value)}
              />
              <div className="ChatNameActions">
                <button
                  onClick={() => {
                    if (customChatName.trim()) {
                      createNewChat(selectedUser, customChatName.trim()); // Pass the chat name
                      setSelectedUser(null); // Clear selected user
                      setCustomChatName(''); // Clear custom chat name
                      setShowGroupNameInput(false); // Hide group name input
                    } else {
                      alert('Please enter a chat name!');
                    }
                  }}
                >
                  Create Group
                </button>
                <button
                  onClick={() => {
                    setShowGroupNameInput(false); // Hide group name input
                    setSelectedUser(null); // Clear selected user
                    setCustomChatName(''); // Clear custom chat name
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <ul className="ChatList">
          <li className="ChatListHeader">
            Groups
          </li>
            {chats
              .slice()
              .sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
                const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
                return dateB - dateA; // Sort in descending order
              })
              .map((chat) => (
                <li
                  key={chat.id}
                  className={`ChatListItem ${selectedChat?.id === chat.id ? 'active' : ''}`}
                >
                  <span onClick={() => setSelectedChat(chat)}>{getChatName(chat)}</span>
                  <button
                    className="DeleteButton"
                    onClick={() => handleDeleteChat(chat.id)}
                  >
                    X
                  </button>
                </li>
              ))}
          </ul>
        </div>
        <div className="ChatSection">
          {selectedChat ? (
            <>
              <h2 className="ChatHeader">{getChatName(selectedChat)}</h2>
              <div className="ChatWindow">
                {selectedChat && Array.isArray(selectedChat.messages) ? (
                  selectedChat.messages.length > 0 ? (
                    selectedChat.messages.map((message, index) => (
                      <div
                        key={index}
                        className={`MessageBubble ${
                          message.userId === currentUserId ? 'MyMessage' : 'OtherMessage'
                        }`}
                      >
                         {typeof message === 'string'
                          ? message
                          : typeof message.content === 'string'
                          ? message.content
                          : JSON.stringify(message)}
                      </div>
                    ))
                  ) : (
                    <div className="NoMessages">No messages to display.</div>
                  )
                ) : (
                  <div className="NoChatSelected">Please select a chat.</div>
                )}
              </div>




              <div className="ChatInput">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button onClick={handleSendMessage}>Send</button>
              </div>
              
            </>
          ) : (
            <div className="NoChatSelected">Select a chat to start messaging</div>
          )}
        </div>
      </div>
      <footer>
        <CopyrightFooter />
      </footer>
    </div>
  );
};

export default Messaging;


