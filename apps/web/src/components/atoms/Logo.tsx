import React from 'react';

export const Logo: React.FC = () => {
    return (
        <a href="#" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10">
                <svg className="w-full h-full text-blue-600 transform group-hover:rotate-180 transition-transform duration-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <path d="M18 8L21 5M21 5L17 5M21 5L21 9" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6 16L3 19M3 19L7 19M3 19L3 15" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <span className="font-heading font-bold text-2xl text-slate-800 tracking-tight">Med<span className="text-blue-600">Sync</span></span>
        </a>
    );
};
