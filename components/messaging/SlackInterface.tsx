/**
 * Slack-like Messaging Interface
 * Built with Next.js, TypeScript, and Firebase
 * Adapted from proven Slack clone patterns
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  Timestamp,
  getDocs,
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { getUsers } from '@/lib/firebase/firestore';
import { User } from '@/lib/firebase/types';
import { useToast } from '@/contexts/ToastContext';

interface Message {
  id: string;
  message: string;
  user: string;
  userImage: string;
  userName?: string;
  timestamp: any;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: {
    message: string;
    timestamp: any;
  };
}

export default function SlackInterface() {
  const { user } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showUserList, setShowUserList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    loadUsers();
  }, [user]);

  useEffect(() => {
    if (selectedUser && user) {
      let unsubscribe: (() => void) | undefined;
      
      const setupMessages = async () => {
        try {
          console.log('Setting up messages for user:', selectedUser.uid);
          const conversationId = await getOrCreateConversation(selectedUser.uid);
          console.log('Conversation ID:', conversationId);
          
          const messagesRef = collection(db, 'messages');
          
          // Try with orderBy first, fallback to without if index missing
          let q = query(
            messagesRef,
            where('conversationId', '==', conversationId),
            orderBy('timestamp', 'asc')
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                message: data.message || '',
                user: data.user || '',
                userImage: data.userImage || '',
                userName: data.userName || '',
                timestamp: data.timestamp,
              } as Message;
            });
            console.log('Messages loaded:', msgs.length);
            setMessages(msgs);
            // Scroll to bottom after messages load
            setTimeout(() => scrollToBottom(), 100);
          }, (error: any) => {
            console.error('Snapshot error:', error);
            // If index error, try without orderBy
            if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
              console.log('Index missing, trying without orderBy');
              const qNoOrder = query(
                messagesRef,
                where('conversationId', '==', conversationId)
              );
              unsubscribe = onSnapshot(qNoOrder, (snapshot) => {
                const msgs = snapshot.docs
                  .map(doc => {
                    const data = doc.data();
                    return {
                      id: doc.id,
                      message: data.message || '',
                      user: data.user || '',
                      userImage: data.userImage || '',
                      userName: data.userName || '',
                      timestamp: data.timestamp,
                    } as Message;
                  })
                  .sort((a, b) => {
                    const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
                    const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
                    return aTime - bTime;
                  });
                console.log('Messages loaded (no orderBy):', msgs.length);
                setMessages(msgs);
                setTimeout(() => scrollToBottom(), 100);
              }, (fallbackError) => {
                console.error('Fallback query error:', fallbackError);
                toast.showError('Error loading messages');
              });
            } else {
              toast.showError('Error loading messages: ' + (error?.message || 'Unknown error'));
            }
          });
        } catch (error) {
          console.error('Error loading messages:', error);
          toast.showError('Error loading messages: ' + (error instanceof Error ? error.message : 'Unknown'));
        }
      };

      setupMessages();

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } else {
      // Clear messages when no user selected
      setMessages([]);
    }
  }, [selectedUser, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadUsers = async () => {
    try {
      const users = await getUsers();
      const teamMembers = users.filter(u => 
        (u.role === 'admin' || u.role === 'employee') && u.uid !== user?.uid
      );
      setAllUsers(teamMembers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    const loadConversations = () => {
      try {
        const conversationsRef = collection(db, 'conversations');
        const q = query(
          conversationsRef,
          where('participants', 'array-contains', user.uid),
          orderBy('lastActivity', 'desc')
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const convs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Conversation[];
          setConversations(convs);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    };

    const unsubscribe = loadConversations();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const getOrCreateConversation = async (otherUserId: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    
    const participants = [user.uid, otherUserId].sort();
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', '==', participants)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }
    
    // Create new conversation
    const docRef = await addDoc(conversationsRef, {
      participants,
      lastActivity: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    
    return docRef.id;
  };


  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedUser || !user) {
      console.log('Cannot send - missing:', { 
        hasInput: !!input.trim(), 
        hasSelectedUser: !!selectedUser, 
        hasUser: !!user 
      });
      return;
    }

    const messageText = input.trim();
    setInput(''); // Clear input immediately for better UX

    try {
      console.log('Sending message to:', selectedUser.uid);
      const conversationId = await getOrCreateConversation(selectedUser.uid);
      console.log('Got conversation ID:', conversationId);
      
      const messagesRef = collection(db, 'messages');
      
      await addDoc(messagesRef, {
        message: messageText,
        user: user.uid,
        userImage: user.customPhotoURL || user.photoURL || '',
        userName: user.displayName || user.email,
        conversationId,
        timestamp: serverTimestamp(),
      });

      console.log('Message sent successfully');

      // Update conversation
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastActivity: serverTimestamp(),
        lastMessage: {
          message: messageText,
          timestamp: serverTimestamp(),
        }
      });

      // Focus input again
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.showError('Error sending message: ' + (error instanceof Error ? error.message : 'Unknown error'));
      // Restore input on error
      setInput(messageText);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <p className="text-gray-500">Please log in to access messages.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Team Messages</h1>
            <button
              onClick={() => setShowUserList(!showUserList)}
              className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
            >
              + New
            </button>
          </div>
        </div>

        {/* Conversations/Users List */}
        <div className="flex-1 overflow-y-auto">
          {showUserList ? (
            <div className="p-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase px-2">
                Start Conversation
              </h3>
              {allUsers.map((otherUser) => (
                <button
                  key={otherUser.uid}
                  onClick={async () => {
                    console.log('Selecting user:', otherUser.uid);
                    setSelectedUser(otherUser);
                    setShowUserList(false);
                    // Clear messages first, they'll load in useEffect
                    setMessages([]);
                    // Focus input after a delay
                    setTimeout(() => {
                      inputRef.current?.focus();
                    }, 300);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                >
                  <img
                    src={otherUser.customPhotoURL || otherUser.photoURL || '/default-avatar.png'}
                    alt={otherUser.displayName || otherUser.email}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {otherUser.displayName || otherUser.email}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div>
              {conversations.map((conv) => {
                const otherUserId = conv.participants.find(id => id !== user.uid);
                const otherUser = allUsers.find(u => u.uid === otherUserId);
                return (
                  <button
                    key={conv.id}
                    onClick={() => otherUser && setSelectedUser(otherUser)}
                    className={`w-full flex items-center gap-2 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      selectedUser?.uid === otherUserId ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                    }`}
                  >
                    <img
                      src={otherUser?.customPhotoURL || otherUser?.photoURL || '/default-avatar.png'}
                      alt={otherUser?.displayName || otherUser?.email}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {otherUser?.displayName || otherUser?.email}
                      </p>
                      {conv.lastMessage && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {conv.lastMessage.message}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4">
              <img
                src={selectedUser.customPhotoURL || selectedUser.photoURL || '/default-avatar.png'}
                alt={selectedUser.displayName || selectedUser.email}
                className="w-8 h-8 rounded-full mr-3"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedUser.displayName || selectedUser.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedUser.isOnline ? 'Active' : 'Offline'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <p className="text-lg mb-2">💬</p>
                    <p className="text-sm">No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.user === user.uid;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      {!isOwn && (
                        <img
                          src={msg.userImage || '/default-avatar.png'}
                          alt=""
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                      )}
                      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                        {!isOwn && (
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            {msg.userName || 'User'}
                          </p>
                        )}
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            isOwn
                              ? 'bg-purple-600 text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Message ${selectedUser.displayName || selectedUser.email}`}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p className="text-2xl mb-2">💬</p>
              <p>Select a conversation or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

