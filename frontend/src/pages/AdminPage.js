import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Download, Trash2, Lock, Image, Users, FileText, Eye, X } from 'lucide-react';
import { useMemora } from '../context/MemoraContext';
import axios from 'axios';
import { Toaster, toast } from 'sonner';

const AdminPage = () => {
  const navigate = useNavigate();
  const { isAdmin, adminLogin, settings, updateSettings, API, fetchSettings } = useMemora();
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [memories, setMemories] = useState([]);
  const [localSettings, setLocalSettings] = useState({
    couple_names: '',
    welcome_text: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewMemory, setPreviewMemory] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isAdmin) {
      fetchMemories();
      setLocalSettings({
        couple_names: settings.couple_names || '',
        welcome_text: settings.welcome_text || ''
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
      await updateSettings(localSettings);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
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
