import React from 'react';

const LOGOS = [
  // Google - Circle
  { 
    path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z", 
    color: "#4285F4",
    name: "Google"
  },
  // Microsoft - 4 Squares
  {
    path: "M1 1h10v10H1V1zm12 0h10v10H13V1zM1 13h10v10H1v-10zm12 0h10v10H13v-10z",
    color: "#737373",
    name: "Microsoft"
  },
  // Amazon - Arrow
  {
    path: "M15.3 15.3c-2.4 1.8-5.7 2.8-9 2.8-4.5 0-8.5-1.7-11.5-4.5-.4-.4-.1-.9.4-.7 3.5 1.5 7.5 2.4 11.7 2.4 3 0 5.8-.5 8.4-1.4.6-.2 1 .4.5.8z",
    color: "#FF9900",
    name: "Amazon"
  },
  // Apple - Simplified
  {
    path: "M17.06 5.61c.47-.58.79-1.38.7-2.19-.7.03-1.54.46-2.03 1.03-.43.5-.81 1.28-.7 2.08.77.06 1.56-.34 2.03-.92zm-1.12 2.1c-1.15 0-2.12.71-2.68.71-.57 0-1.37-.69-2.3-.69-2.22 0-3.8 2.33-3.8 5.48 0 3.19 1.41 6.31 3.2 6.31.84 0 1.55-.54 2.6-.54 1.05 0 1.7.54 2.6.54 1.48 0 3.16-3.13 3.16-3.13-2.93-1.36-2.58-6.13.32-7.39-1-1.09-2.25-1.29-3.1-1.29z",
    color: "#a1a1aa",
    name: "Apple"
  },
  // Meta - Loop
  {
    path: "M16.5 6.5s-2.5-4-6.5-4c-4.5 0-8 3.5-8 8s3.5 8 8 8c4 0 6.5-4 6.5-4s2.5 4 6.5 4c4.5 0 8-3.5 8-8s-3.5-8-8-8c-4 0-6.5 4-6.5 4z",
    color: "#0668E1",
    name: "Meta"
  }
];

export default function FloatingLogos() {
  const [elements, setElements] = React.useState([]);

  React.useEffect(() => {
    const newElements = Array.from({ length: 25 }).map((_, i) => {
      const logo = LOGOS[Math.floor(Math.random() * LOGOS.length)];
      return {
        id: i,
        logo: logo,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.floor(Math.random() * 40) + 30, // Increased size
        translateX: (Math.random() - 0.5) * 800,
        translateY: (Math.random() - 0.5) * 800,
        rotate: (Math.random() - 0.5) * 360,
        duration: Math.floor(Math.random() * 20) + 25,
        delay: Math.random() * -30,
      };
    });
    setElements(newElements);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-transparent">
      {elements.map((el) => (
        <div
          key={el.id}
          className="absolute animate-float opacity-0"
          style={{
            left: el.left,
            top: el.top,
            '--tw-translate-x': `${el.translateX}px`,
            '--tw-translate-y': `${el.translateY}px`,
            '--tw-rotate': `${el.rotate}deg`,
            '--float-duration': `${el.duration}s`,
            '--float-delay': `${el.delay}s`,
          }}
        >
          <svg
            width={el.size}
            height={el.size}
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ color: el.logo.color }}
            className="opacity-80 transition-all duration-700"
          >
            <path d={el.logo.path} />
          </svg>
        </div>
      ))}
    </div>
  );
}
