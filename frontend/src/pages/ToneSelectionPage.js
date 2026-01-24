import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMemora } from '../context/MemoraContext';

const toneOptions = [
  { id: 'wise', label: 'Wise', icon: '🕊️' },
  { id: 'funny', label: 'Funny', icon: '😊' },
  { id: 'advice', label: 'Advice', icon: '✨' },
  { id: 'emotional', label: 'Emotional', icon: '🕊️' }
];

const ToneSelectionPage = () => {
  const navigate = useNavigate();
  const { guestName, settings, setSelectedTone } = useMemora();
  const [selectedOption, setSelectedOption] = useState(null);

  // Redirect if no name entered or tone page disabled
  useEffect(() => {
    if (!guestName) {
      navigate('/name');
    } else if (!settings.tone_page_enabled) {
      navigate('/message');
    }
  }, [guestName, settings.tone_page_enabled, navigate]);

  const handleSelect = (toneId) => {
    setSelectedOption(toneId);
  };

  const handleContinue = () => {
    if (selectedOption) {
      setSelectedTone(selectedOption);
      navigate('/message');
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
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="font-serif text-2xl md:text-3xl text-stone-800 text-center mb-8"
          data-testid="page-title"
        >
          Choose a tone
        </motion.h1>

        {/* Tone options grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          {toneOptions.map((tone, index) => (
            <motion.button
              key={tone.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(tone.id)}
              className={`glass-card rounded-2xl p-6 flex items-center gap-3 transition-all ${
                selectedOption === tone.id 
                  ? 'ring-2 ring-stone-800 bg-white/60' 
                  : 'hover:bg-white/50'
              }`}
              data-testid={`tone-${tone.id}`}
            >
              <span className="text-2xl">{tone.icon}</span>
              <span className="font-serif text-lg text-stone-800">{tone.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Continue button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleContinue}
          disabled={!selectedOption}
          className="memora-btn w-full disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="save-memory-button"
        >
          Save memory
        </motion.button>
      </motion.div>
    </div>
  );
};

export default ToneSelectionPage;
