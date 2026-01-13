import { ViewLayout, GroupBy, SortBy, Priority } from '../types';
import { storage } from './storage';

export interface ViewConfig {
    layout: ViewLayout;
    groupBy: GroupBy;
    sortBy: SortBy;
    filters: {
        status?: string[];
        priority?: Priority[];
        projectIds?: string[];
    };
    visibleColumns?: string[];
}

const DEFAULT_CONFIGS: Record<string, ViewConfig> = {
    hoy: {
        layout: 'list',
        groupBy: 'none',
        sortBy: 'priority',
        filters: {}
    },
    todas: {
        layout: 'list',
        groupBy: 'none',
        sortBy: 'date',
        filters: {}
    }
};

/**
 * Get the configuration for a specific view
 */
export function getViewConfig(viewId: string): ViewConfig {
    const key = `view_config_${viewId}`;
    const defaultConfig = DEFAULT_CONFIGS[viewId] || DEFAULT_CONFIGS.todas;
    return storage.get<ViewConfig>(key, defaultConfig);
}

/**
 * Save the configuration for a specific view
 */
export function saveViewConfig(viewId: string, config: ViewConfig): void {
    const key = `view_config_${viewId}`;
    storage.set(key, config);
}

/**
 * Update a specific property of a view configuration
 */
export function updateViewConfigProperty<K extends keyof ViewConfig>(
    viewId: string,
    property: K,
    value: ViewConfig[K]
): void {
    const currentConfig = getViewConfig(viewId);
    const updatedConfig = { ...currentConfig, [property]: value };
    saveViewConfig(viewId, updatedConfig);
}

/**
 * Reset a view configuration to its default
 */
export function resetViewConfig(viewId: string): void {
    const key = `view_config_${viewId}`;
    const defaultConfig = DEFAULT_CONFIGS[viewId] || DEFAULT_CONFIGS.todas;
    storage.set(key, defaultConfig);
}
