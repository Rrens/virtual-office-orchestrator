'use client';

import { useEffect, useState } from 'react';

interface Props {
  onFinish?: () => void;
}

export function SplashScreen({ onFinish }: Props) {
  const [progress, setProgress] = useState(0);
  const [phaseText, setPhaseText] = useState('Memuat Mesin 3D & Kantor Terpadu...');
  const [fadeOut, setFadeOut] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const startTime = performance.now();
    const duration = 1400; // 1.4 seconds smooth boot sequence

    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 35) {
        setPhaseText('Memuat Mesin 3D & Kantor Terpadu (30 FPS Mode)...');
      } else if (pct < 75) {
        setPhaseText('Menghubungkan 30 Agen AI & Multi-Agent Engine...');
      } else {
        setPhaseText('Membuka Executive Command Center...');
      }

      if (pct >= 100) {
        clearInterval(interval);
        setFadeOut(true);
        setTimeout(() => {
          setVisible(false);
          onFinish?.();
        }, 500);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [onFinish]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'radial-gradient(ellipse at center, #111827 0%, #030712 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: fadeOut ? 'none' : 'auto',
        userSelect: 'none',
      }}
    >
      {/* Central Brand Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 420,
          width: '90%',
          padding: 24,
          borderRadius: 24,
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(56, 189, 248, 0.1)',
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
        }}
      >
        {/* Glowing Logo Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18" />
            <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
            <path d="M9 7h1" />
            <path d="M9 11h1" />
            <path d="M9 15h1" />
            <path d="M14 7h1" />
            <path d="M14 11h1" />
            <path d="M14 15h1" />
          </svg>
        </div>

        {/* Title & Description */}
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '0.04em',
            margin: '0 0 6px 0',
            background: 'linear-gradient(to right, #f8fafc, #93c5fd)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          VIRTUAL OFFICE OS
        </h1>
        <p
          style={{
            fontSize: 12,
            color: '#94a3b8',
            margin: '0 0 24px 0',
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}
        >
          Autonomous Multi-Agent Enterprise Engine
        </p>

        {/* Progress Bar Container */}
        <div
          style={{
            width: '100%',
            height: 6,
            borderRadius: 99,
            background: 'rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
            marginBottom: 14,
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)',
              borderRadius: 99,
              transition: 'width 0.1s linear',
              boxShadow: '0 0 12px rgba(56, 189, 248, 0.6)',
            }}
          />
        </div>

        {/* Dynamic Status Text */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            fontSize: 11,
            color: '#64748b',
            fontFamily: 'monospace',
          }}
        >
          <span style={{ color: '#cbd5e1' }}>{phaseText}</span>
          <span style={{ fontWeight: 700, color: '#38bdf8' }}>{progress}%</span>
        </div>
      </div>
    </div>
  );
}
