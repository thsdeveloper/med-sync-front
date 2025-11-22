import React from 'react';

interface AlertProps {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    icon?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
    type,
    title,
    message,
    icon
}) => {
    const styles = {
        success: {
            container: 'bg-green-50 border-green-200',
            title: 'text-green-800',
            message: 'text-green-700',
            iconColor: 'text-green-600'
        },
        error: {
            container: 'bg-red-50 border-red-200',
            title: 'text-red-800',
            message: 'text-red-700',
            iconColor: 'text-red-600'
        },
        warning: {
            container: 'bg-yellow-50 border-yellow-200',
            title: 'text-yellow-800',
            message: 'text-yellow-700',
            iconColor: 'text-yellow-600'
        },
        info: {
            container: 'bg-blue-50 border-blue-200',
            title: 'text-blue-800',
            message: 'text-blue-700',
            iconColor: 'text-blue-600'
        }
    };

    const style = styles[type];

    return (
        <div className={`rounded-lg border p-4 animate-fade-in ${style.container}`}>
            <div className="flex items-center gap-3">
                {icon && (
                    <div className={`flex-shrink-0 ${style.iconColor}`}>
                        {icon}
                    </div>
                )}
                <div>
                    <h3 className={`text-sm font-semibold ${style.title}`}>
                        {title}
                    </h3>
                    {message && (
                        <p className={`text-sm mt-1 ${style.message}`}>
                            {message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

