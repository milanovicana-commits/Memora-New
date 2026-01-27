import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Download, Trash2, Lock, Image, Users, FileText, Eye, X, MessageSquare, ToggleLeft, ToggleRight, Plus, QrCode, Copy, Check } from 'lucide-react';
import { useMemora } from '../context/MemoraContext';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { Toaster, toast } from 'sonner';

const toneLabels = {
  wise: 'Wise',
  funny: 'Funny',
  advice: 'Advice',
  emotional: 'Emotional'
};

const defaultQuestions = {
  wise: ["What wisdom would you share with them?", "", "", "", "", "", "", "", "", ""],
  funny: ["What's a funny memory or joke for them?", "", "", "", "", "", "", "", "", ""],
  advice: ["What advice would you give them?", "", "", "", "", "", "", "", "", ""],
  emotional: ["What heartfelt message do you have for them?", "", "", "", "", "", "", "", "", ""]
};

// M Logo for QR Code
const MemoraLogoSVG = () => (
  <svg width="40" height="40" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="90" fill="white" rx="8"/>
    <path d="M15 70V30L32 50L50 25L68 50L85 30V70" stroke="#1C1917" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M32 50V70" stroke="#1C1917" strokeWidth="4" strokeLinecap="round"/>
    <path d="M68 50V70" stroke="#1C1917" strokeWidth="4" strokeLinecap="round"/>
    <path d="M42 15L50 7L58 15" stroke="#1C1917" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AdminPage = () => {
  const navigate = useNavigate();
  const { isAdmin, adminLogin, settings, updateSettings, API, fetchSettings } = useMemora();
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [memories, setMemories] = useState([]);
  const [localSettings, setLocalSettings] = useState({
    couple_names: '',
    welcome_text: '',
    tone_page_enabled: true,
    tone_questions: {}
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewMemory, setPreviewMemory] = useState(null);
  const [expandedTone, setExpandedTone] = useState(null);
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [newEventData, setNewEventData] = useState({ name: '', couple_names: '', welcome_text: 'Leave a memory for' });
  const [showQRModal, setShowQRModal] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isAdmin) {
      fetchEvents();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedEvent) {
      fetchEventMemories(selectedEvent.id);
      initializeLocalSettings(selectedEvent);
    }
  }, [selectedEvent]);

  const initializeLocalSettings = (event) => {
    const toneQuestions = {};
    Object.keys(toneLabels).forEach(toneId => {
      const existing = event.tone_questions?.[toneId];
      if (Array.isArray(existing)) {
        toneQuestions[toneId] = [...existing, '', '', '', '', '', '', '', '', '', ''].slice(0, 10);
      } else if (typeof existing === 'string') {
        toneQuestions[toneId] = [existing, '', '', '', '', '', '', '', '', ''];
      } else {
        toneQuestions[toneId] = defaultQuestions[toneId] || ['', '', '', '', '', '', '', '', '', ''];
      }
    });
    
    setLocalSettings({
      couple_names: event.couple_names || '',
      welcome_text: event.welcome_text || 'Leave a memory for',
      tone_page_enabled: event.tone_page_enabled !== false,
      tone_questions: toneQuestions
    });
  };

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`);
      setEvents(response.data);
      if (response.data.length > 0 && !selectedEvent) {
        setSelectedEvent(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchEventMemories = async (eventId) => {
    try {
      const response = await axios.get(`${API}/events/${eventId}/memories`);
      setMemories(response.data);
    } catch (error) {
      console.error('Error fetching memories:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const success = await adminLogin(password);
    if (!success) {
      setLoginError('Invalid password');
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/events`, newEventData);
      toast.success(`Event created! Code: ${response.data.code}`);
      setShowNewEventForm(false);
      setNewEventData({ name: '', couple_names: '', welcome_text: 'Leave a memory for' });
      fetchEvents();
      // Select the new event
      const eventsResponse = await axios.get(`${API}/events`);
      const newEvent = eventsResponse.data.find(e => e.code === response.data.code);
      if (newEvent) setSelectedEvent(newEvent);
    } catch (error) {
      toast.error('Failed to create event');
    }
  };

  const handleSettingsUpdate = async () => {
    if (!selectedEvent) return;
    try {
      await axios.put(`${API}/events/${selectedEvent.id}`, {
        couple_names: localSettings.couple_names,
        welcome_text: localSettings.welcome_text
      });
      toast.success('Settings updated successfully');
      fetchEvents();
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const handleToneToggle = async () => {
    if (!selectedEvent) return;
    const newValue = !localSettings.tone_page_enabled;
    setLocalSettings({ ...localSettings, tone_page_enabled: newValue });
    try {
      await axios.put(`${API}/events/${selectedEvent.id}`, { tone_page_enabled: newValue });
      toast.success(`Tone selection page ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update setting');
      setLocalSettings({ ...localSettings, tone_page_enabled: !newValue });
    }
  };

  const handleQuestionChange = (toneId, index, value) => {
    const newQuestions = [...(localSettings.tone_questions[toneId] || Array(10).fill(''))];
    newQuestions[index] = value;
    setLocalSettings({
      ...localSettings,
      tone_questions: {
        ...localSettings.tone_questions,
        [toneId]: newQuestions
      }
    });
  };

  const handleSaveToneQuestions = async () => {
    if (!selectedEvent) return;
    try {
      await axios.put(`${API}/events/${selectedEvent.id}`, { tone_questions: localSettings.tone_questions });
      toast.success('Questions updated successfully');
    } catch (error) {
      toast.error('Failed to update questions');
    }
  };

  const handleBackgroundUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedEvent) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('event_id', selectedEvent.id);

    try {
      await axios.post(`${API}/admin/background`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Background updated successfully');
      fetchEvents();
    } catch (error) {
      toast.error('Failed to upload background');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedEvent) return;
    setIsDownloading(true);
    try {
      const response = await axios.get(`${API}/events/${selectedEvent.id}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `memora_${selectedEvent.couple_names?.replace(/\s+/g, '_') || 'memories'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteMemory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this memory?')) return;
    
    try {
      await axios.delete(`${API}/memories/${id}`);
      setMemories(memories.filter(m => m.id !== id));
      toast.success('Memory deleted');
    } catch (error) {
      toast.error('Failed to delete memory');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? All memories will be preserved but the QR code will stop working.')) return;
    
    try {
      await axios.delete(`${API}/events/${eventId}`);
      toast.success('Event deactivated');
      fetchEvents();
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(null);
      }
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const getEventUrl = (code) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?event=${code}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast.success('Copied to clipboard!');
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="paper-texture" />
        <Toaster position="top-center" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10 w-full max-w-sm px-6"
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-800 mb-8"
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="glass-card rounded-2xl p-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-stone-100">
                <Lock className="w-8 h-8 text-stone-600" />
              </div>
            </div>

            <h1 className="font-serif text-2xl text-stone-800 text-center mb-6">
              Admin Access
            </h1>

            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginError('');
                }}
                placeholder="Enter password"
                className="memora-input mb-4"
                autoFocus
                data-testid="password-input"
              />

              {loginError && (
                <p className="text-red-500 text-sm text-center mb-4" data-testid="login-error">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                className="memora-btn memora-btn-primary w-full"
                data-testid="login-button"
              >
                Login
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] relative overflow-hidden">
      <div className="paper-texture" />
      <Toaster position="top-center" />

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#FDFCF8] rounded-2xl p-8 max-w-sm w-full text-center"
          >
            <button 
              onClick={() => setShowQRModal(null)}
              className="absolute top-4 right-4 p-2 hover:bg-stone-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="font-serif text-xl mb-2">{showQRModal.couple_names}</h3>
            <p className="text-stone-500 text-sm mb-6">Event Code: <span className="font-mono font-bold">{showQRModal.code}</span></p>
            
            <div className="flex justify-center mb-6 p-4 bg-white rounded-xl">
              <QRCodeSVG 
                value={getEventUrl(showQRModal.code)}
                size={200}
                level="H"
                includeMargin={true}
                imageSettings={{
                  src: "data:image/svg+xml;base64," + btoa('<svg width="40" height="40" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="90" fill="white" rx="8"/><path d="M15 70V30L32 50L50 25L68 50L85 30V70" stroke="#1C1917" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M32 50V70" stroke="#1C1917" strokeWidth="4" strokeLinecap="round"/><path d="M68 50V70" stroke="#1C1917" strokeWidth="4" strokeLinecap="round"/><path d="M42 15L50 7L58 15" stroke="#1C1917" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>'),
                  x: undefined,
                  y: undefined,
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => copyToClipboard(getEventUrl(showQRModal.code))}
                className="memora-btn w-full flex items-center justify-center gap-2"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? 'Copied!' : 'Copy Link'}
              </button>
              <p className="text-xs text-stone-400 break-all">{getEventUrl(showQRModal.code)}</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Preview Modal */}
      {previewMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#FDFCF8] rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-xl">Memory Preview</h3>
              <button 
                onClick={() => setPreviewMemory(null)}
                className="p-2 hover:bg-stone-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="memory-frame memory-frame-bottom p-4">
              {previewMemory.photo && (
                <img 
                  src={previewMemory.photo} 
                  alt={previewMemory.guest_name}
                  className="w-32 h-32 object-cover mx-auto mb-4"
                />
              )}
              <h4 className="font-serif text-xl text-center mb-2">{previewMemory.guest_name}</h4>
              {previewMemory.tone && (
                <p className="text-stone-500 text-sm text-center mb-2">Tone: {toneLabels[previewMemory.tone] || previewMemory.tone}</p>
              )}
              <p className="text-stone-600 text-center">{previewMemory.message}</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* New Event Form Modal */}
      {showNewEventForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#FDFCF8] rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif text-xl">Create New Event</h3>
              <button 
                onClick={() => setShowNewEventForm(false)}
                className="p-2 hover:bg-stone-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-stone-600 mb-2 text-sm">Event Name</label>
                <input
                  type="text"
                  value={newEventData.name}
                  onChange={(e) => setNewEventData({ ...newEventData, name: e.target.value })}
                  className="memora-input text-left"
                  placeholder="Wedding Reception"
                  required
                />
              </div>
              <div>
                <label className="block text-stone-600 mb-2 text-sm">Couple Names</label>
                <input
                  type="text"
                  value={newEventData.couple_names}
                  onChange={(e) => setNewEventData({ ...newEventData, couple_names: e.target.value })}
                  className="memora-input text-left"
                  placeholder="Anna & Nemanja"
                  required
                />
              </div>
              <div>
                <label className="block text-stone-600 mb-2 text-sm">Welcome Text</label>
                <input
                  type="text"
                  value={newEventData.welcome_text}
                  onChange={(e) => setNewEventData({ ...newEventData, welcome_text: e.target.value })}
                  className="memora-input text-left"
                  placeholder="Leave a memory for"
                />
              </div>
              <button
                type="submit"
                className="memora-btn memora-btn-primary w-full"
              >
                Create Event
              </button>
            </form>
          </motion.div>
        </div>
      )}

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-stone-600 hover:text-stone-800"
              data-testid="back-button"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to app
            </button>

            <h1 className="font-serif text-2xl text-stone-800">Admin Panel</h1>
          </div>

          {/* Events Section */}
          <div className="glass-card rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <QrCode className="w-5 h-5 text-stone-600" />
                <h2 className="font-serif text-xl text-stone-800">Events</h2>
              </div>
              <button
                onClick={() => setShowNewEventForm(true)}
                className="memora-btn flex items-center gap-2"
                data-testid="create-event-button"
              >
                <Plus className="w-4 h-4" />
                New Event
              </button>
            </div>

            {events.length === 0 ? (
              <p className="text-stone-500 text-center py-4">No events yet. Create your first event!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedEvent?.id === event.id 
                        ? 'border-stone-800 bg-stone-50' 
                        : 'border-stone-200 hover:border-stone-400'
                    }`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-serif text-lg">{event.couple_names}</h3>
                        <p className="text-stone-500 text-sm">{event.name}</p>
                      </div>
                      <span className="font-mono text-xs bg-stone-100 px-2 py-1 rounded">{event.code}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-stone-500">{event.memory_count || 0} memories</span>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowQRModal(event); }}
                          className="p-2 hover:bg-stone-100 rounded-full"
                          data-testid={`qr-button-${event.id}`}
                        >
                          <QrCode className="w-4 h-4 text-stone-600" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}
                          className="p-2 hover:bg-red-50 rounded-full"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedEvent && (
            <>
              {/* Event Settings */}
              <div className="glass-card rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="w-5 h-5 text-stone-600" />
                  <h2 className="font-serif text-xl text-stone-800">Event Settings: {selectedEvent.couple_names}</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-stone-600 mb-2 text-sm">Welcome Text</label>
                    <input
                      type="text"
                      value={localSettings.welcome_text}
                      onChange={(e) => setLocalSettings({ ...localSettings, welcome_text: e.target.value })}
                      className="memora-input text-left"
                      placeholder="Leave a memory for"
                      data-testid="welcome-text-input"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 mb-2 text-sm">Couple Names</label>
                    <input
                      type="text"
                      value={localSettings.couple_names}
                      onChange={(e) => setLocalSettings({ ...localSettings, couple_names: e.target.value })}
                      className="memora-input text-left"
                      placeholder="Anna & Nemanja"
                      data-testid="couple-names-input"
                    />
                  </div>

                  <button
                    onClick={handleSettingsUpdate}
                    className="memora-btn memora-btn-primary"
                    data-testid="save-settings-button"
                  >
                    Save Settings
                  </button>
                </div>
              </div>

              {/* Tone Selection Settings */}
              <div className="glass-card rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-stone-600" />
                    <h2 className="font-serif text-xl text-stone-800">Tone Selection Page</h2>
                  </div>
                  <button
                    onClick={handleToneToggle}
                    className="flex items-center gap-2 text-stone-600 hover:text-stone-800"
                    data-testid="tone-toggle"
                  >
                    {localSettings.tone_page_enabled ? (
                      <>
                        <ToggleRight className="w-8 h-8 text-green-600" />
                        <span className="text-green-600 text-sm">Enabled</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-8 h-8 text-stone-400" />
                        <span className="text-stone-400 text-sm">Disabled</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-stone-500 text-sm mb-4">
                  Edit up to 10 questions per tone. A random question will be shown to guests.
                </p>

                <div className="space-y-4">
                  {Object.entries(toneLabels).map(([toneId, label]) => (
                    <div key={toneId} className="border border-stone-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedTone(expandedTone === toneId ? null : toneId)}
                        className="w-full p-4 flex items-center justify-between bg-stone-50 hover:bg-stone-100 transition-colors"
                        data-testid={`tone-expand-${toneId}`}
                      >
                        <span className="font-serif text-lg text-stone-800">{label} Questions</span>
                        <span className="text-stone-500">{expandedTone === toneId ? '−' : '+'}</span>
                      </button>
                      
                      {expandedTone === toneId && (
                        <div className="p-4 space-y-3 bg-white">
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
                            <div key={index}>
                              <label className="block text-stone-500 mb-1 text-xs">Question {index + 1}</label>
                              <input
                                type="text"
                                value={localSettings.tone_questions?.[toneId]?.[index] || ''}
                                onChange={(e) => handleQuestionChange(toneId, index, e.target.value)}
                                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-400"
                                placeholder={`Enter question ${index + 1}...`}
                                data-testid={`tone-question-${toneId}-${index}`}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={handleSaveToneQuestions}
                    className="memora-btn memora-btn-primary"
                    data-testid="save-tone-settings-button"
                  >
                    Save All Questions
                  </button>
                </div>
              </div>

              {/* Background Section */}
              <div className="glass-card rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <Image className="w-5 h-5 text-stone-600" />
                  <h2 className="font-serif text-xl text-stone-800">Background Image</h2>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  {selectedEvent.background_image && (
                    <div className="w-32 h-32 rounded-lg overflow-hidden border border-stone-200">
                      <img 
                        src={selectedEvent.background_image} 
                        alt="Current background"
                        className="w-full h-full object-cover"
                        data-testid="current-background"
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundUpload}
                      className="hidden"
                      data-testid="background-file-input"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="memora-btn flex items-center gap-2"
                      data-testid="upload-background-button"
                    >
                      <Upload className="w-4 h-4" />
                      {isUploading ? 'Uploading...' : 'Upload New Background'}
                    </button>
                    <p className="text-stone-500 text-sm mt-2">
                      Recommended: High quality photo of the couple
                    </p>
                  </div>
                </div>
              </div>

              {/* Download Section */}
              <div className="glass-card rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-5 h-5 text-stone-600" />
                  <h2 className="font-serif text-xl text-stone-800">Download Memories</h2>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-stone-600">
                    {memories.length} {memories.length === 1 ? 'memory' : 'memories'} collected
                  </p>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isDownloading || memories.length === 0}
                    className="memora-btn memora-btn-primary flex items-center gap-2 disabled:opacity-50"
                    data-testid="download-pdf-button"
                  >
                    <Download className="w-4 h-4" />
                    {isDownloading ? 'Generating...' : 'Download PDF'}
                  </button>
                </div>
              </div>

              {/* Memories List */}
              <div className="glass-card rounded-2xl p-6">
                <h2 className="font-serif text-xl text-stone-800 mb-6">All Memories</h2>

                {memories.length === 0 ? (
                  <p className="text-stone-500 text-center py-8">No memories yet</p>
                ) : (
                  <div className="space-y-4">
                    {memories.map((memory, index) => (
                      <motion.div
                        key={memory.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-4 p-4 bg-white/50 rounded-xl"
                        data-testid={`memory-item-${memory.id}`}
                      >
                        {memory.photo ? (
                          <img 
                            src={memory.photo} 
                            alt={memory.guest_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center">
                            <span className="text-stone-500 font-serif text-lg">
                              {memory.guest_name.charAt(0)}
                            </span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h3 className="font-serif text-lg text-stone-800">{memory.guest_name}</h3>
                          <p className="text-stone-500 text-sm truncate">{memory.message}</p>
                          {memory.tone && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-stone-100 rounded text-xs text-stone-600">
                              {toneLabels[memory.tone] || memory.tone}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setPreviewMemory(memory)}
                            className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                            data-testid={`preview-memory-${memory.id}`}
                            aria-label="Preview memory"
                          >
                            <Eye className="w-5 h-5 text-stone-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteMemory(memory.id)}
                            className="p-2 hover:bg-red-50 rounded-full transition-colors"
                            data-testid={`delete-memory-${memory.id}`}
                            aria-label="Delete memory"
                          >
                            <Trash2 className="w-5 h-5 text-red-500" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPage;
