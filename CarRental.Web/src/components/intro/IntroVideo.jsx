import React, { useRef, useState, useEffect } from 'react';
import './IntroVideo.css';

const IntroVideo = ({ onComplete }) => {
  const videoRef = useRef(null);
  const [isExiting, setIsExiting] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Clean up any timeouts to prevent memory leaks
  const exitTimeoutRef = useRef(null);

  const startExitTransition = () => {
    if (isExiting) return;
    setIsExiting(true);
    
    // The CSS transition takes 1.5s, wait before unmounting
    exitTimeoutRef.current = setTimeout(() => {
      onComplete();
    }, 1500);
  };

  useEffect(() => {
    // Attempt to play the video programmatically as a fallback for some browsers
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.warn('Autoplay blocked or failed:', error);
        // If it totally fails, we show fallback or just skip
        setHasError(true);
      });
    }
    
    return () => {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }
    };
  }, []);

  const handleVideoEnd = () => {
    startExitTransition();
  };

  const handleSkip = () => {
    startExitTransition();
  };

  const handleError = () => {
    console.error('Video failed to load or play.');
    setHasError(true);
  };

  // If there's an error loading the video (or autoplay is hard blocked without fallback)
  // We provide a quick way out or just auto-skip after a small delay.
  useEffect(() => {
    if (hasError) {
      // If video can't play, let's just skip the intro automatically after a short delay
      // to avoid infinite loading, but long enough for the user to read the logo.
      const errorTimeout = setTimeout(() => {
        startExitTransition();
      }, 2000);
      return () => clearTimeout(errorTimeout);
    }
  }, [hasError]);

  return (
    <div className={`intro-overlay ${isExiting ? 'exiting' : ''}`} aria-hidden={isExiting}>
      {!hasError && (
        <video
          ref={videoRef}
          className="intro-video"
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={handleVideoEnd}
          onError={handleError}
          aria-hidden="true"
          // We do not use loop! We want it to stop at the last frame.
        >
          <source src="/videos/Intro_Velora.mp4" type="video/mp4" />
          <source src="/videos/Intro_Velora.mov" type="video/quicktime" />
          <source src="/videos/velora-intro.mp4" type="video/mp4" />
          {/* Fallback text */}
          Your browser does not support the video tag.
        </video>
      )}

      <div className="intro-logo-overlay">
        <h1 className="intro-logo-text">VELORA</h1>
      </div>

      <button 
        className="skip-intro-btn" 
        onClick={handleSkip}
        aria-label="Bỏ qua video giới thiệu"
        tabIndex={isExiting ? -1 : 0}
      >
        Bỏ qua
      </button>
    </div>
  );
};

export default IntroVideo;
