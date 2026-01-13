import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    compact = false
}) => {
    return (
        <div className={`flex flex-col items-center justify-center text-center p-6 ${compact ? 'py-8' : 'py-12'} animate-fade-in`}>
            <div className={`rounded-full bg-white/5 flex items-center justify-center mb-4 ${compact ? 'w-12 h-12' : 'w-16 h-16'}`}>
                <Icon size={compact ? 24 : 32} className="text-gray-500" />
            </div>
            <h3 className={`font-bold text-white mb-1 ${compact ? 'text-sm' : 'text-lg'}`}>{title}</h3>
            {description && (
                <p className={`text-gray-500 max-w-xs mx-auto mb-4 ${compact ? 'text-xs' : 'text-sm'}`}>
                    {description}
                </p>
            )}
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};
