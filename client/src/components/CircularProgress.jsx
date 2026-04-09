import { motion, useSpring, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function CircularProgress({ 
  value, 
  max = 100, 
  size = 100, 
  strokeWidth = 8, 
  color = '#3b82f6', 
  label,
  icon,
  noCard = false
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / max) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    // Reset to 0 then animate to value
    setDisplayValue(0);
    const controls = animate(0, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(Math.floor(latest))
    });
    return () => controls.stop();
  }, [value]);

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 group transition-all duration-300 ${noCard ? 'p-0' : 'p-4 glass-card hover:scale-105'}`}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background Circle */}
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-slate-100 dark:text-white/[0.04]"
          />
          {/* Progress Circle */}
          <motion.circle
            key={value} // Force re-animation if value changes and on mount
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]"
            style={{ filter: `drop-shadow(0 0 4px ${color}44)` }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-black font-outfit text-slate-900 dark:text-white leading-none"
            style={{ fontSize: `${Math.round(size * 0.32)}px` }}
          >
            {displayValue}
          </motion.div>
          {icon && (
            <div className="mt-1 text-slate-400 group-hover:scale-110 transition-transform duration-300">
              {icon}
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">
          {label}
        </span>
      </div>
    </div>
  );
}
