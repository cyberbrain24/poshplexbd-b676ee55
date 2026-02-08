import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

const SprayCursor = () => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const [isPointer, setIsPointer] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const springConfig = { damping: 25, stiffness: 250 };
  const x = useSpring(cursorX, springConfig);
  const y = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      const target = e.target as HTMLElement;
      setIsPointer(window.getComputedStyle(target).cursor === 'pointer');
    };

    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className="fixed top-0 left-0 z-[9999] pointer-events-none"
      style={{ x, y }}
      animate={{ scale: isPressed ? 0.85 : 1 }}
      transition={{ duration: 0.1 }}
    >
      {/* Offset container to position cursor tip at actual mouse position */}
      <div className="relative -translate-x-1 -translate-y-1">
        {/* The 3 Spray Lines (Upper Left) */}
        <div className="absolute -top-4 -left-3 flex gap-0.5">
          <motion.div 
            className="w-0.5 h-3 bg-white/60 rotate-[-30deg] origin-bottom"
            animate={{ 
              opacity: isPressed ? 1 : 0.6,
              boxShadow: isPressed ? '0 0 8px 2px rgba(255,255,255,0.5)' : 'none'
            }}
          />
          <motion.div 
            className="w-0.5 h-4 bg-white/70 rotate-[-15deg] origin-bottom"
            animate={{ 
              opacity: isPressed ? 1 : 0.7,
              boxShadow: isPressed ? '0 0 8px 2px rgba(255,255,255,0.5)' : 'none'
            }}
          />
          <motion.div 
            className="w-0.5 h-3 bg-white/60 rotate-[0deg] origin-bottom"
            animate={{ 
              opacity: isPressed ? 1 : 0.6,
              boxShadow: isPressed ? '0 0 8px 2px rgba(255,255,255,0.5)' : 'none'
            }}
          />
        </div>

        {/* The Nozzle */}
        <div className="w-4 h-3 bg-zinc-400 rounded-t-sm border-b border-zinc-600 ml-1" />

        {/* The Can Body with V-notch */}
        <div 
          className="w-6 h-8 bg-zinc-900 border-l border-white/20 ml-0.5"
          style={{ 
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%)'
          }}
        />

        {/* Pointer indicator dot */}
        {isPointer && (
          <motion.div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          />
        )}
      </div>
    </motion.div>
  );
};

export default SprayCursor;
