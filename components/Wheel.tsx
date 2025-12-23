
import React, { useEffect, useRef, useState } from 'react';
import { WheelProps, Game } from '../types';

const Wheel: React.FC<WheelProps> = ({ items, onResult, isSpinning, setIsSpinning }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicTimerRef = useRef<number | null>(null);
  const rotationRef = useRef(0);
  const lastSegmentRef = useRef(-1);
  const [rotation, setRotation] = useState(0);
  const [isPointerTicking, setIsPointerTicking] = useState(false);

  // Constants for physics
  const BASE_DECELERATION = 0.993; // Normal coasting
  const SLOW_DECELERATION = 0.97;  // Faster stop when crawling
  const VERY_SLOW_DECELERATION = 0.92; // Final snap to stop
  const MIN_VELOCITY = 0.0015;

  // 8-bit Melody sequence (frequencies for a fun arpeggio)
  const MELODY = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63]; // C4, E4, G4, C5, G4, E4
  const melodyIndexRef = useRef(0);

  // Initialize Audio Context
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  // Play a procedural 8-bit music note
  const play8BitNote = () => {
    if (!audioCtxRef.current || !isSpinning) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square'; // Classic 8-bit sound
    const freq = MELODY[melodyIndexRef.current];
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    // Quick decay for that "plucky" 8-bit feel
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);

    melodyIndexRef.current = (melodyIndexRef.current + 1) % MELODY.length;
  };

  // Play a procedural "click" sound for the pointer
  const playTickSound = (velocity: number) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150 + velocity * 200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.08 * Math.min(velocity * 5, 1), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);

    setIsPointerTicking(true);
    setTimeout(() => setIsPointerTicking(false), 50);
  };

  useEffect(() => {
    if (isSpinning) {
      initAudio();
      const initialVelocity = 0.45 + Math.random() * 0.45;
      let velocity = initialVelocity;
      let currentRotation = rotationRef.current;

      // Start the music loop immediately when spinning starts
      const startMusic = () => {
        if (musicTimerRef.current) clearInterval(musicTimerRef.current);
        musicTimerRef.current = window.setInterval(() => {
          play8BitNote();
        }, 140);
      };
      
      startMusic();

      const spin = () => {
        if (velocity < MIN_VELOCITY) {
          setIsSpinning(false);
          // Stop music only when the wheel truly stops
          if (musicTimerRef.current) {
            clearInterval(musicTimerRef.current);
            musicTimerRef.current = null;
          }
          const totalAngle = (currentRotation * (180 / Math.PI)) % 360;
          const normalizedAngle = (360 - (totalAngle % 360)) % 360;
          const segmentAngleDeg = 360 / items.length;
          const winnerIndex = Math.floor(((normalizedAngle + 270) % 360) / segmentAngleDeg);
          onResult(items[winnerIndex]);
          return;
        }

        currentRotation += velocity;
        
        // Dynamic deceleration to prevent long tails
        let currentDecel = BASE_DECELERATION;
        if (velocity < 0.08) currentDecel = SLOW_DECELERATION;
        if (velocity < 0.03) currentDecel = VERY_SLOW_DECELERATION;
        
        velocity *= currentDecel;
        
        const segmentAngleRad = (2 * Math.PI) / items.length;
        const currentSegment = Math.floor((currentRotation + Math.PI/2) / segmentAngleRad);
        if (currentSegment !== lastSegmentRef.current) {
          playTickSound(velocity);
          lastSegmentRef.current = currentSegment;
        }

        rotationRef.current = currentRotation;
        setRotation(currentRotation);
        requestAnimationFrame(spin);
      };

      spin();
    }

    return () => {
      if (musicTimerRef.current) {
        clearInterval(musicTimerRef.current);
        musicTimerRef.current = null;
      }
    };
  }, [isSpinning, items, onResult, setIsSpinning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawWheel = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 40;
      const segmentAngle = (2 * Math.PI) / items.length;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Outer Shadow/Glow
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
      ctx.shadowBlur = 40;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.restore();

      // 2. Draw Segments
      items.forEach((item, i) => {
        const startAngle = i * segmentAngle + rotation;
        const endAngle = (i + 1) * segmentAngle + rotation;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        
        const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        grad.addColorStop(0, item.color);
        grad.addColorStop(1, adjustColor(item.color, -30));
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + segmentAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'black';
        ctx.font = 'bold 24px Inter';
        const displayName = item.name.length > 15 ? item.name.substring(0, 12) + '...' : item.name;
        ctx.fillText(displayName, radius - 40, 10);
        ctx.restore();
      });

      // 3. Draw Rim Pegs
      items.forEach((_, i) => {
        const angle = i * segmentAngle + rotation;
        const pegX = centerX + Math.cos(angle) * (radius + 5);
        const pegY = centerY + Math.sin(angle) * (radius + 5);

        ctx.beginPath();
        ctx.arc(pegX, pegY, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#e2e8f0';
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'black';
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // 4. Center Cap
      ctx.save();
      const capGrad = ctx.createLinearGradient(centerX - 30, centerY - 30, centerX + 30, centerY + 30);
      capGrad.addColorStop(0, '#475569');
      capGrad.addColorStop(1, '#0f172a');
      ctx.beginPath();
      ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
      ctx.fillStyle = capGrad;
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
      ctx.fillStyle = '#f472b6';
      ctx.fill();
      ctx.restore();
    };

    drawWheel();
  }, [items, rotation]);

  function adjustColor(color: string, amount: number) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div 
        className={`absolute top-0 left-1/2 -translate-x-1/2 z-20 transition-transform duration-75 origin-top ${isPointerTicking ? 'rotate-[-15deg]' : 'rotate-0'}`}
        style={{ top: '10px' }}
      >
        <svg width="40" height="60" viewBox="0 0 40 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
          <path d="M20 60L0 0H40L20 60Z" fill="url(#pointerGrad)" stroke="#1e1b4b" strokeWidth="2"/>
          <defs>
            <linearGradient id="pointerGrad" x1="20" y1="0" x2="20" y2="60" gradientUnits="userSpaceOnUse">
              <stop stopColor="white"/>
              <stop offset="1" stopColor="#cbd5e1"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      <canvas 
        ref={canvasRef} 
        width={1000} 
        height={1000} 
        className="w-full h-full rounded-full"
      />
    </div>
  );
};

export default Wheel;
