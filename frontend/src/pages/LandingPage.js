import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import mojlogo from "../assets/mojlogo.png";

const MemoraLogo = ({ className = "" }) => (
  <img
    src={mojlogo}
    alt="Memora logo"
    className={className}
  />
);

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Paper texture */}
      <div className="paper-texture" />
      
      {/* Admin button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={() => navigate('/admin')}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all z-20"
        data-testid="admin-button"
        aria-label="Admin settings"
      >
        <Settings className="w-5 h-5 text-stone-600" />
      </motion.button>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center z-10 px-6"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 text-stone-900"
        >
          <MemoraLogo />
        </motion.div>

        {/* Brand name */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="font-serif text-4xl tracking-[0.3em] text-stone-900 mb-4"
          data-testid="brand-name"
        >
          MEMORA
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="font-accent text-xl italic text-stone-600 mb-16"
          data-testid="tagline"
        >
          Moments made into memories.
        </motion.p>

        {/* Begin button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/name')}
          className="memora-btn px-16 py-4 text-lg"
          data-testid="begin-button"
        >
          Begin
        </motion.button>
      </motion.div>
    </div>
  );
};

export default LandingPage;
