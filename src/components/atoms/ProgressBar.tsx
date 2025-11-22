import React from 'react';

interface ProgressBarProps {
    current: number;
    total: number;
    labels?: {
        current?: string;
        step?: string;
    };
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    current,
    total,
    labels
}) => {
    const percentage = (current / total) * 100;

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-600">
                    {labels?.current || `Passo ${current} de ${total}`}
                </span>
                <span className="text-xs font-medium text-slate-600">
                    {labels?.step || ''}
                </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                    className="bg-gradient-to-r from-blue-600 to-teal-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

