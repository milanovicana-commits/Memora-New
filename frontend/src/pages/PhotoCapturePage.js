import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, RotateCcw, Check, Upload, ChevronRight } from 'lucide-react';
import { useMemora } from '../context/MemoraContext';

const PhotoCapturePage = () => {
  const navigate = useNavigate();
  const { setPhoto, guestName, settings } = useMemora();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cameraError, setCameraError] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [photoConfirmed, setPhotoConfirmed] = useState(false);

  // Redirect if no name entered
  useEffect(() => {
    if (!guestName) {
      navigate('/name');
    }
  }, [guestName, navigate]);

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraError(false);
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError(true);
    }
  }, [facingMode, stream]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const switchCamera = async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newMode, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera switch error:', error);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw and flip if using front camera
      if (facingMode === 'user') {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
      }
      context.drawImage(video, 0, 0);
      
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedPhoto(photoData);
      setPhotoConfirmed(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedPhoto(event.target.result);
        setPhotoConfirmed(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const retake = () => {
    setCapturedPhoto(null);
    setPhotoConfirmed(false);
    startCamera();
  };

  const confirmPhoto = () => {
  setPhotoConfirmed(true);

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
};

const goToNext = () => {
  if (capturedPhoto) {
    setPhoto(capturedPhoto);
  }

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  navigate('/tone');
};
  const skipPhoto = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    navigate('/tone');
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Paper texture */}
      <div className="paper-texture" />

      {/* Decorative frame */}
      <div className="fixed inset-4 border border-stone-200/50 pointer-events-none z-0" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="z-10 w-full max-w-md px-6 py-8"
      >
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="font-serif text-2xl md:text-3xl text-stone-800 text-center mb-8"
          data-testid="page-title"
        >
          Take a photo to go with<br />your memory
        </motion.h1>

        {/* Camera view or captured photo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative mx-auto"
        >
          <div className="camera-frame aspect-[3/4] max-h-[60vh] mx-auto">
            {capturedPhoto ? (
              <img 
                src={capturedPhoto} 
                alt="Captured" 
                className="w-full h-full object-cover"
                data-testid="captured-photo"
              />
            ) : cameraError ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 p-6 text-center">
                <Camera className="w-12 h-12 text-stone-400 mb-4" />
                <p className="text-stone-600 mb-4">Camera not available</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="memora-btn flex items-center gap-2"
                  data-testid="upload-button"
                >
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </button>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                data-testid="camera-video"
              />
            )}
          </div>
          
          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            data-testid="file-input"
          />
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-6 mt-8"
        >{capturedPhoto ? (
  <>
    <button
      onClick={retake}
      className="p-4 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-all"
      data-testid="retake-button"
      aria-label="Retake photo"
    >
      <RotateCcw className="w-6 h-6 text-stone-700" />
    </button>

    <button
      onClick={goToNext}
      className="memora-btn memora-btn-primary flex items-center gap-2 px-8"
      data-testid="next-button"
    >
      Next
      <ChevronRight className="w-5 h-5" />
    </button>
  </>
          ) : (
            <>
              {!cameraError && (
                <>
                  <button
                    onClick={switchCamera}
                    className="p-4 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-all"
                    data-testid="switch-camera-button"
                    aria-label="Switch camera"
                  >
                    <RotateCcw className="w-6 h-6 text-stone-700" />
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="capture-btn"
                    data-testid="capture-button"
                    aria-label="Take photo"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-all"
                    data-testid="upload-trigger-button"
                    aria-label="Upload photo"
                  >
                    <Upload className="w-6 h-6 text-stone-700" />
                  </button>
                </>
              )}
            </>
          )}
        </motion.div>

        {/* Skip option - only show when no photo taken or not confirmed */}
        {(!capturedPhoto || !photoConfirmed) && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            onClick={skipPhoto}
            className="block mx-auto mt-6 text-stone-500 hover:text-stone-700 transition-colors text-sm"
            data-testid="skip-button"
          >
            Skip photo
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};

export default PhotoCapturePage;
