import React from 'react';
import { X, Star, FileText, CheckSquare, Users } from 'lucide-react';
import { Tab } from '../types';

interface TopTabsBarProps {
    tabs: Tab[];
    activeTabId: string | null;
    onSelectTab: (tab: Tab) => void;
    onCloseTab: (tabId: string) => void;
    onTogglePin: (tabId: string) => void;
}

const TopTabsBar: React.FC<TopTabsBarProps> = ({
    tabs, activeTabId, onSelectTab, onCloseTab, onTogglePin
}) => {
    if (tabs.length === 0) return null;

    // Helper to get icon
    const getIcon = (type: string) => {
        switch (type) {
            case 'project': return '🚀';
            case 'note': return <FileText size={12} />;
            case 'task': return <CheckSquare size={12} />;
            case 'contact': return <Users size={12} />;
            case 'view': return '📑';
            default: return '⚡';
        }
    };

    return (
        <div className="flex items-end gap-0 px-2 pt-2 bg-gray-200/50 border-b border-gray-300 overflow-x-auto scrollbar-hide scroll-smooth shrink-0 h-10 select-none">
            {tabs.map((tab) => {
                const isActive = activeTabId === tab.id;
                // Chrome-like shape magic using clip-path or clever bordering
                // Using a simpler "rounded-t-lg" approach with negative margins for overlap

                return (
                    <div
                        key={tab.id}
                        onClick={() => onSelectTab(tab)}
                        className={`
                            group relative flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-t-xl text-xs font-medium cursor-pointer transition-all min-w-[120px] sm:min-w-[140px] max-w-[200px]
                            mr-[-8px] z-0 hover:z-10
                            ${isActive
                                ? 'bg-white text-gray-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-20 pb-2.5 mb-[-1px] border-t border-x border-gray-100' // Active tab connects to content
                                : 'bg-gray-300/50 text-gray-600 hover:bg-gray-300 hover:text-gray-800 border-t border-x border-transparent'
                            }
                        `}
                    >
                        {/* Favicon / Type Icon */}
                        <span className={`text-[10px] ${isActive ? 'opacity-100' : 'opacity-70'} shrink-0`}>
                            {getIcon(tab.type)}
                        </span>

                        <span className="truncate flex-1">{tab.label}</span>

                        {/* Actions (Always visible on hover or active) */}
                        <div className={`flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 ${isActive ? 'opacity-100' : ''} transition-opacity`}>
                            {/* Star Icon Indicating Favorite */}
                            <div className="text-yellow-400">
                                <Star size={10} fill="currentColor" />
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id); }}
                                className="p-0.5 rounded-full hover:bg-gray-200 hover:text-red-500 text-gray-400"
                            >
                                <X size={12} />
                            </button>
                        </div>

                        {/* Separator for inactive tabs (pseudo-element simulation) */}
                        {!isActive && (
                            <div className="absolute right-0 top-1.5 bottom-1.5 w-[1px] bg-gray-400/30 group-hover:hidden"></div>
                        )}
                    </div>
                );
            })}

            {/* New Tab Button visual cue (Optional) */}
            <div className="ml-4 p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                {/* <Plus size={16} /> */}
            </div>
        </div>
    );
};

export default TopTabsBar;
