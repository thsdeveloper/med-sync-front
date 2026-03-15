import React from 'react';

export const Logo: React.FC = () => {
    return (
        <a href="#" className="flex items-center gap-2.5 group select-none">
            {/* ── Icon ── */}
            <div className="relative w-9 h-9 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                <svg
                    viewBox="0 0 36 36"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full drop-shadow-md"
                    aria-hidden="true"
                >
                    <defs>
                        {/* Main gradient: deep teal → vivid cyan */}
                        <linearGradient id="mf-bg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                            <stop offset="0%"   stopColor="#0f766e" />
                            <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>

                        {/* Soft glow filter for the ECG line */}
                        <filter id="mf-glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="1.2" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Background pill */}
                    <rect width="36" height="36" rx="10" fill="url(#mf-bg)" />

                    {/* Subtle inner highlight (top edge) */}
                    <rect
                        x="1" y="1"
                        width="34" height="16"
                        rx="9"
                        fill="white"
                        fillOpacity="0.06"
                    />

                    {/*
                        ECG / Flow line:
                        flat → heartbeat spike → smooth sinusoidal tail
                        Viewport 36×36, baseline at y=20
                    */}
                    <path
                        d="M3,20 L9,20 L12,7 L15,30 L18,20 C20.5,20 21.5,11 25.5,11 C29.5,11 30.5,29 34,29"
                        stroke="white"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        filter="url(#mf-glow)"
                    />

                    {/* Pulse dot — trailing end of the wave */}
                    <circle cx="34" cy="29" r="1.6" fill="white" fillOpacity="0.85" />

                    {/* Tiny accent ring around the dot */}
                    <circle cx="34" cy="29" r="3" stroke="white" strokeOpacity="0.25" strokeWidth="1" fill="none" />
                </svg>
            </div>

            {/* ── Wordmark ── */}
            <span className="font-heading font-bold text-[1.35rem] leading-none tracking-tight">
                <span className="text-teal-900">Med</span>
                <span className="text-cyan-500">Flow</span>
            </span>
        </a>
    );
};
