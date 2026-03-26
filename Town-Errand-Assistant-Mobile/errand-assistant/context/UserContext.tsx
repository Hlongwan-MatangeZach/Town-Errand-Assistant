import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const USER_NAME_KEY = 'ea_user_name_v1';
const IS_GUEST_KEY = 'ea_is_guest_v1';

interface UserContextType {
  username: string;
  isGuest: boolean;
  updateUsername: (name: string) => Promise<void>;
  setGuestMode: (isGuest: boolean) => Promise<void>;
  clearUserData: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string>('User');
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const [storedName, storedGuest] = await Promise.all([
          AsyncStorage.getItem(USER_NAME_KEY),
          AsyncStorage.getItem(IS_GUEST_KEY)
        ]);

        if (storedName) {
          setUsername(storedName);
        }
        if (storedGuest === 'true') {
          setIsGuest(true);
        }
      } catch (error) {
        console.error('Error loading user data from AsyncStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const updateUsername = async (name: string) => {
    try {
      await AsyncStorage.setItem(USER_NAME_KEY, name);
      setUsername(name);
    } catch (error) {
      console.error('Error saving username to AsyncStorage:', error);
    }
  };

  const setGuestMode = async (guest: boolean) => {
    try {
      await AsyncStorage.setItem(IS_GUEST_KEY, guest ? 'true' : 'false');
      setIsGuest(guest);
    } catch (error) {
      console.error('Error saving guest mode to AsyncStorage:', error);
    }
  };

  const clearUserData = async () => {
    try {
      // Clear all AsyncStorage data
      await AsyncStorage.clear();

      // Clear sensitive wallet data from SecureStore
      try {
        await SecureStore.deleteItemAsync('user_cards');
      } catch (e) {
        console.error('Error clearing SecureStore:', e);
      }

      setUsername('User');
      setIsGuest(false);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  };

  return (
    <UserContext.Provider value={{ username, isGuest, updateUsername, setGuestMode, clearUserData, isLoading }}>
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
