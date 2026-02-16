import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const MemoraContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
;
const defaultToneQuestions = {
  wise: ["What wisdom would you share with them?", "", "", "", "", "", "", "", "", ""],
  funny: ["What's a funny memory or joke for them?", "", "", "", "", "", "", "", "", ""],
  advice: ["What advice would you give them?", "", "", "", "", "", "", "", "", ""],
  emotional: ["What heartfelt message do you have for them?", "", "", "", "", "", "", "", "", ""]
};

export const MemoraProvider = ({ children }) => {
  const [guestName, setGuestName] = useState('');
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState('');
  const [selectedTone, setSelectedTone] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventCode, setEventCode] = useState(null);
  const [settings, setSettings] = useState({
    couple_names: 'Anna & Nemanja',
    welcome_text: 'Leave a memory for',
    background_image: null,
    tone_page_enabled: true,
    tone_questions: defaultToneQuestions
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we have an event code in URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('event');
    if (code) {
      setEventCode(code);
      fetchEventByCode(code);
    } else {
      fetchSettings();
    }
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setSettings(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventByCode = async (code) => {
    try {
      const response = await axios.get(`${API}/events/code/${code}`);
      setCurrentEvent(response.data);
      // Use event settings
      setSettings(prev => ({
        ...prev,
        couple_names: response.data.couple_names,
        welcome_text: response.data.welcome_text || prev.welcome_text,
        background_image: response.data.background_image,
        tone_page_enabled: response.data.tone_page_enabled !== false,
        tone_questions: response.data.tone_questions || defaultToneQuestions
      }));
    } catch (error) {
      console.error('Error fetching event:', error);
      // Event not found or expired
      setCurrentEvent(null);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      if (currentEvent) {
        const response = await axios.put(`${API}/events/${currentEvent.id}`, newSettings);
        setCurrentEvent(response.data);
        setSettings(prev => ({ ...prev, ...response.data }));
        return response.data;
      } else {
        const response = await axios.put(`${API}/admin/settings`, newSettings);
        setSettings(prev => ({ ...prev, ...response.data }));
        return response.data;
      }
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
        event_code: eventCode || null,
        guest_name: guestName,
        photo: photo,
        message: message,
        tone: selectedTone
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
    setSelectedTone(null);
  };

  const value = {
    guestName,
    setGuestName,
    photo,
    setPhoto,
    message,
    setMessage,
    selectedTone,
    setSelectedTone,
    currentEvent,
    setCurrentEvent,
    eventCode,
    setEventCode,
    settings,
    setSettings,
    fetchSettings,
    fetchEventByCode,
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
