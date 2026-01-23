import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const MemoraContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const MemoraProvider = ({ children }) => {
  const [guestName, setGuestName] = useState('');
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState({
    couple_names: 'Anna & Nemanja',
    welcome_text: 'Leave a memory for',
    background_image: null
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const response = await axios.put(`${API}/admin/settings`, newSettings);
      setSettings(response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  const adminLogin = async (password) => {
    try {
      const response = await axios.post(`${API}/admin/login`, { password });
      if (response.data.success) {
        setIsAdmin(true);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const submitMemory = async () => {
    try {
      const response = await axios.post(`${API}/memories`, {
        guest_name: guestName,
        photo: photo,
        message: message
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting memory:', error);
      throw error;
    }
  };

  const resetMemory = () => {
    setGuestName('');
    setPhoto(null);
    setMessage('');
  };

  const value = {
    guestName,
    setGuestName,
    photo,
    setPhoto,
    message,
    setMessage,
    settings,
    setSettings,
    fetchSettings,
    updateSettings,
    isAdmin,
    setIsAdmin,
    adminLogin,
    submitMemory,
    resetMemory,
    loading,
    API
  };

  return (
    <MemoraContext.Provider value={value}>
      {children}
    </MemoraContext.Provider>
  );
};

export const useMemora = () => {
  const context = useContext(MemoraContext);
  if (!context) {
    throw new Error('useMemora must be used within a MemoraProvider');
  }
  return context;
};
