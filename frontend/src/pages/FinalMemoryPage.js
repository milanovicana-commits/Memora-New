import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMemora } from '../context/MemoraContext';
import { User } from 'lucide-react';

const FinalMemoryPage = () => {
  const navigate = useNavigate();
  const { guestName, photo, message, selectedTone, settings, submitMemory } = useMemora();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Redirect if no name entered
  useEffect(() => {
    if (!guestName) {
      navigate('/');
      return;
    }

    // Submit memory when page loads (only once)
    if (!hasSubmitted && !isSubmitting) {
      setIsSubmitting(true);
      submitMemory()
        .then(() => {
          setHasSubmitted(true);
          setIsSubmitting(false);
        })
        .catch((error) => {
          console.error('Error submitting memory:', error);
          setIsSubmitting(false);
        });
    }
  }, [guestName, navigate, submitMemory, hasSubmitted, isSubmitting]);

  const handleFinish = () => {
    navigate('/thankyou');
  };

  // Get the question based on selected tone
  const getQuestion = () => {
    if (selectedTone && settings.tone_questions && settings.tone_questions[selectedTone]) {
      const questions = settings.tone_questions[selectedTone];
      if (Array.isArray(questions)) {
        const validQuestions = questions.filter(q => q && q.trim());
        if (validQuestions.length > 0) {
          return validQuestions[0]; // Show first question on final page
        }
      } else if (typeof questions === 'string') {
        return questions;
      }
    }
    return "What do you wish them never to forget?";
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center relative overflow-hidden py-8">
      {/* Paper texture */}
      <div className="paper-texture" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="z-10 w-full max-w-md px-6"
      >
        {/* Memory frame */}
        <div className="memory-frame memory-frame-bottom bg-[#FDFCF8] rounded-sm">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <h1 className="font-serif text-xl md:text-2xl text-stone-800 italic" data-testid="page-title">
              This is your page in<br />their book of memories.
            </h1>
          </motion.div>

          {/* Decorative line */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-12 bg-stone-300" />
            <div className="w-2 h-2 border border-stone-300 rotate-45" />
            <div className="h-px w-12 bg-stone-300" />
          </div>

          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center mb-4"
          >
            <div className="relative">
              {/* Decorative frame around photo */}
              <div className="absolute -inset-2 border border-stone-200" />
              <div className="absolute -inset-3 border border-stone-100" />
              
              {photo ? (
                <img 
                  src={photo} 
                  alt={guestName}
                  className="w-32 h-32 object-cover"
                  data-testid="memory-photo"
                />
              ) : (
                <div 
                  className="w-32 h-32 bg-stone-100 flex items-center justify-center"
                  data-testid="memory-photo-placeholder"
                >
                  <User className="w-12 h-12 text-stone-400" />
                </div>
              )}
            </div>
          </motion.div>

          {/* Name */}
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="font-serif text-2xl text-stone-800 text-center mb-6"
            data-testid="guest-name"
          >
            {guestName}
          </motion.h2>

          {/* Decorative line */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-16 bg-stone-200" />
            <div className="h-px w-16 bg-stone-200" />
          </div>

          {/* Question */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="font-accent text-lg italic text-stone-600 text-center mb-4"
          >
            {getQuestion()}
          </motion.p>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-stone-100/50 rounded-lg p-6 min-h-[120px]"
          >
            <p 
              className="font-sans text-stone-700 text-center leading-relaxed"
              data-testid="memory-message"
            >
              {message}
            </p>
          </motion.div>
        </div>

        {/* Finish button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleFinish}
          disabled={isSubmitting}
          className="memora-btn w-full mt-8 disabled:opacity-50"
          data-testid="finish-button"
        >
          {isSubmitting ? 'Saving...' : 'Finish'}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default FinalMemoryPage;
