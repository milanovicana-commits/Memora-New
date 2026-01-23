import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMemora } from '../context/MemoraContext';

const NameEntryPage = () => {
  const navigate = useNavigate();
  const { guestName, setGuestName, settings } = useMemora();
  const [inputValue, setInputValue] = useState(guestName);

  const handleContinue = () => {
    if (inputValue.trim()) {
      setGuestName(inputValue.trim());
      navigate('/capture');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleContinue();
    }
  };

  const backgroundImage = settings.background_image || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background image with blur */}
      <div 
        className="bg-cover-blur"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      
      {/* Light overlay */}
      <div className="fixed inset-0 bg-white/40 z-[1]" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="z-10 w-full max-w-md px-6"
      >
        {/* Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="font-serif text-3xl md:text-4xl text-stone-800 leading-tight" data-testid="page-title">
            {settings.welcome_text}
          </h1>
          <h2 className="font-serif text-3xl md:text-4xl text-stone-800 mt-2" data-testid="couple-names">
            {settings.couple_names}
          </h2>
        </motion.div>

        {/* Glass card form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-8"
        >
          <label 
            htmlFor="guest-name" 
            className="block text-stone-600 mb-4 font-sans"
          >
            Your name or nickname
          </label>
          
          <input
            id="guest-name"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your name"
            className="memora-input mb-6"
            autoFocus
            data-testid="name-input"
          />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleContinue}
            disabled={!inputValue.trim()}
            className="memora-btn w-full disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="continue-button"
          >
            Continue
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NameEntryPage;
