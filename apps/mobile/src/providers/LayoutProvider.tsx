import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LayoutMode = 'default' | 'simple';

interface LayoutContextType {
    layoutMode: LayoutMode;
    setLayoutMode: (mode: LayoutMode) => Promise<void>;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const LAYOUT_STORAGE_KEY = '@pomarc_layout_mode';

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [layoutMode, setLayoutModeState] = useState<LayoutMode>('default');

    useEffect(() => {
        // Load persisted layout
        const loadLayout = async () => {
            try {
                const stored = await AsyncStorage.getItem(LAYOUT_STORAGE_KEY);
                if (stored === 'default' || stored === 'simple') {
                    setLayoutModeState(stored);
                }
            } catch (error) {
                console.error('Failed to load layout mode:', error);
            }
        };
        loadLayout();
    }, []);

    const setLayoutMode = async (mode: LayoutMode) => {
        try {
            setLayoutModeState(mode);
            await AsyncStorage.setItem(LAYOUT_STORAGE_KEY, mode);
        } catch (error) {
            console.error('Failed to save layout mode:', error);
        }
    };

    return (
        <LayoutContext.Provider value={{ layoutMode, setLayoutMode }}>
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};
