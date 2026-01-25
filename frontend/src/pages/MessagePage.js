import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMemora } from '../context/MemoraContext';

const MAX_CHARS = 200;

const MessagePage = () => {
  const navigate = useNavigate();
  const { message, setMessage, guestName, selectedTone, settings } = useMemora();
  const [inputValue, setInputValue] = useState(message);

  // Redirect if no name entered
  useEffect(() => {
    if (!guestName) {
      navigate('/name');
    }
  }, [guestName, navigate]);

  const handleChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setInputValue(value);
    }
  };

  const handleContinue = () => {
    if (inputValue.trim()) {
      setMessage(inputValue.trim());
      navigate('/memory');
    }
  };

  // Get random question based on selected tone
  const getQuestion = () => {
    if (selectedTone && settings.tone_questions && settings.tone_questions[selectedTone]) {
      const questions = settings.tone_questions[selectedTone];
      // If it's an array, pick a random one from non-empty questions
      if (Array.isArray(questions)) {
        const validQuestions = questions.filter(q => q && q.trim());
        if (validQuestions.length > 0) {
          const randomIndex = Math.floor(Math.random() * validQuestions.length);
          return validQuestions[randomIndex];
        }
      } else if (typeof questions === 'string') {
        return questions;
      }
    }
    return "What do you wish them never to forget?";
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
          {getQuestion()}
        </motion.h1>

        {/* Glass card form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="relative">
            <textarea
              value={inputValue}
              onChange={handleChange}
              placeholder="Type your message here..."
              rows={5}
              className="w-full bg-transparent border-none outline-none resize-none font-sans text-stone-800 placeholder:text-stone-400"
              autoFocus
              data-testid="message-input"
            />
            
            {/* Character count */}
            <div className="text-right text-sm text-stone-400" data-testid="char-count">
              {inputValue.length}/{MAX_CHARS}
            </div>
          </div>
        </motion.div>

        {/* Submit button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleContinue}
          disabled={!inputValue.trim()}
          className="memora-btn w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="save-button"
        >
          Save memory
        </motion.button>
      </motion.div>
    </div>
  );
};

export default MessagePage;
