import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMemora } from '../context/MemoraContext';

// SVG Logo component matching the original design
const MemoraLogo = ({ className = "" }) => (
  <svg 
    width="80" 
    height="72" 
    viewBox="0 0 100 90" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* M shape with crown-like top */}
    <path 
      d="M10 75V25L30 50L50 20L70 50L90 25V75" 
      stroke="currentColor" 
      strokeWidth="3" 
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Left vertical line */}
    <path 
      d="M30 50V75" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round"
    />
    {/* Right vertical line */}
    <path 
      d="M70 50V75" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round"
    />
    {/* Top crown detail */}
    <path 
      d="M42 12L50 4L58 12" 
      stroke="currentColor" 
      strokeWidth="2" 
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Horizontal line under crown */}
    <path 
      d="M35 18L65 18" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
  </svg>
);

const ThankYouPage = () => {
  const navigate = useNavigate();
  const { resetMemory, settings } = useMemora();

  const handleClose = () => {
    resetMemory();
    navigate('/');
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
      <div className="fixed inset-0 bg-white/30 z-[1]" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 w-full max-w-md px-6 flex flex-col items-center"
      >
        {/* Glass card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="glass-card rounded-3xl p-10 text-center w-full"
        >
          {/* Thank you message */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="font-serif text-2xl md:text-3xl text-stone-800 leading-relaxed mb-6"
            data-testid="thank-you-title"
          >
            Thank you for being a<br />part of our day!
          </motion.h1>

          {/* Dove emoji */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-5xl mb-6"
          >
            🕊️
          </motion.div>

          {/* Confirmation message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-stone-600 mb-8"
            data-testid="confirmation-message"
          >
            Your memory has been recorded.
          </motion.p>

          {/* Close button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClose}
            className="memora-btn w-full"
            data-testid="close-button"
          >
            Close
          </motion.button>
        </motion.div>

        {/* Logo at bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8 flex flex-col items-center text-stone-800"
        >
          <MemoraLogo />
          <span className="font-serif text-xl tracking-[0.2em] mt-2">MEMORA</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ThankYouPage;
