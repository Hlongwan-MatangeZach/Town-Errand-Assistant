import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_NAME_KEY = 'ea_user_name_v1';

interface UserContextType {
  username: string;
  isGuest: boolean;
  updateUsername: (name: string) => Promise<void>;
  setGuestMode: (isGuest: boolean) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string>('User');
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUsername = async () => {
      try {
        const storedName = await AsyncStorage.getItem(USER_NAME_KEY);
        if (storedName) {
          setUsername(storedName);
        }
      } catch (error) {
        console.error('Error loading username from AsyncStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsername();
  }, []);

  const updateUsername = async (name: string) => {
    try {
      await AsyncStorage.setItem(USER_NAME_KEY, name);
      setUsername(name);
    } catch (error) {
      console.error('Error saving username to AsyncStorage:', error);
    }
  };

  const setGuestMode = (guest: boolean) => {
    setIsGuest(guest);
  };

  return (
    <UserContext.Provider value={{ username, isGuest, updateUsername, setGuestMode, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
