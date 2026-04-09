import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Logo from './Logo.jsx';

export default function SplashScreen() {
  useEffect(() => {
    // Sound effects removed
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }} // Background just fades out cleanly
      className="fixed inset-0 z-[9999] bg-white/90 dark:bg-[#020617]/90 backdrop-blur-md flex items-center justify-center overflow-hidden"
      style={{ perspective: 1200 }}
    >
      <motion.div
        initial={{ rotateY: -180, scale: 0, opacity: 0, z: -500 }}
        animate={{ rotateY: 0, scale: 1, opacity: 1, z: 0 }}
        exit={{ 
          rotateY: 75, 
          scale: 3, 
          x: '150vw', 
          z: 500,
          opacity: 0, 
          transition: { duration: 0.5, ease: "backIn" } 
        }}
        transition={{ 
          type: "spring", 
          stiffness: 250, 
          damping: 20, 
          mass: 1 
        }}
        className="flex flex-col items-center gap-8 relative"
        style={{ transformStyle: "preserve-3d" }}
      >
        <Logo layout="col" title="DSA" highlight="Tracker" />
        
        {/* Futuristic glowing core underneath the logo */}
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
          className="absolute top-0 -z-10 w-32 h-32 bg-brand-500/20 rounded-full blur-2xl"
        />

        {/* Premium 3D Atom Loading Rings */}
        <div className="relative w-16 h-16">
          <motion.div 
            animate={{ rotateX: 360, rotateZ: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="absolute inset-0 border-2 border-brand-500/30 border-t-brand-500 rounded-full"
            style={{ transformStyle: "preserve-3d" }}
          />
          <motion.div 
            animate={{ rotateY: 360, rotateZ: -360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="absolute inset-1 border-2 border-amber-400/30 border-b-amber-400 rounded-full"
            style={{ transformStyle: "preserve-3d" }}
          />
        </div>

      </motion.div>
    </motion.div>
  );
}
