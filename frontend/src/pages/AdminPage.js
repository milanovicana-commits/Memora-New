import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Download, Trash2, Lock, Image, Users, FileText, Eye, X, MessageSquare, ToggleLeft, ToggleRight } from 'lucide-react';
import { useMemora } from '../context/MemoraContext';
import axios from 'axios';
import { Toaster, toast } from 'sonner';

const toneLabels = {
  wise: 'Wise',
  funny: 'Funny',
  advice: 'Advice',
  emotional: 'Emotional'
};

const defaultQuestions = {
  wise: [
    "What wisdom would you share with them?",
    "What life lesson do you hope they remember?",
    "What truth about love would you tell them?",
    "What would you want them to never forget?",
    "What wise words would you give to them?"
  ],
  funny: [
    "What's a funny memory or joke for them?",
    "What always makes you laugh about them?",
    "What's the funniest thing you remember?",
    "What would make them smile today?",
    "What's your most hilarious memory together?"
  ],
  advice: [
    "What advice would you give them?",
    "What tip would help their journey?",
    "What suggestion do you have for them?",
    "What would you recommend they do?",
    "What guidance would you share?"
  ],
  emotional: [
    "What heartfelt message do you have for them?",
    "What touches your heart about them?",
    "What do you love most about them?",
    "What makes them special to you?",
    "What would you want them to feel?"
  ]
};

const AdminPage = () => {
  const navigate = useNavigate();
  const { isAdmin, adminLogin, settings, updateSettings, API, fetchSettings } = useMemora();
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
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
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isAdmin) {
      fetchMemories();
      // Initialize tone_questions with arrays of 5 questions each
      const toneQuestions = {};
      Object.keys(toneLabels).forEach(toneId => {
        const existing = settings.tone_questions?.[toneId];
        if (Array.isArray(existing)) {
          // Ensure we have 5 slots
          toneQuestions[toneId] = [...existing, '', '', '', '', ''].slice(0, 5);
        } else if (typeof existing === 'string') {
          // Convert old single string format to array
          toneQuestions[toneId] = [existing, '', '', '', ''];
        } else {
          toneQuestions[toneId] = defaultQuestions[toneId] || ['', '', '', '', ''];
        }
      });
      
      setLocalSettings({
        couple_names: settings.couple_names || '',
        welcome_text: settings.welcome_text || '',
        tone_page_enabled: settings.tone_page_enabled !== false,
        tone_questions: toneQuestions
      });
    }
  }, [isAdmin, settings]);

  const fetchMemories = async () => {
    try {
      const response = await axios.get(`${API}/memories`);
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

  const handleSettingsUpdate = async () => {
    try {
      await updateSettings({
        couple_names: localSettings.couple_names,
        welcome_text: localSettings.welcome_text
      });
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const handleToneToggle = async () => {
    const newValue = !localSettings.tone_page_enabled;
    setLocalSettings({ ...localSettings, tone_page_enabled: newValue });
    try {
      await updateSettings({ tone_page_enabled: newValue });
      toast.success(`Tone selection page ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update setting');
      setLocalSettings({ ...localSettings, tone_page_enabled: !newValue });
    }
  };

  const handleQuestionChange = (toneId, index, value) => {
    const newQuestions = [...(localSettings.tone_questions[toneId] || ['', '', '', '', ''])];
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
    try {
      await updateSettings({ tone_questions: localSettings.tone_questions });
      toast.success('Questions updated successfully');
    } catch (error) {
      toast.error('Failed to update questions');
    }
  };

  const handleBackgroundUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API}/admin/background`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchSettings();
      toast.success('Background updated successfully');
    } catch (error) {
      toast.error('Failed to upload background');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const response = await axios.get(`${API}/memories/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `memora_${settings.couple_names?.replace(/\s+/g, '_') || 'memories'}.pdf`);
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
                  className="w-24 h-24 object-cover mx-auto mb-4"
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

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
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

          {/* Settings Section */}
          <div className="glass-card rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-stone-600" />
              <h2 className="font-serif text-xl text-stone-800">Event Settings</h2>
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
              Edit up to 5 questions per tone. A random question will be shown to guests.
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
                      {[0, 1, 2, 3, 4].map((index) => (
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
              {settings.background_image && (
                <div className="w-32 h-32 rounded-lg overflow-hidden border border-stone-200">
                  <img 
                    src={settings.background_image} 
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
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPage;
