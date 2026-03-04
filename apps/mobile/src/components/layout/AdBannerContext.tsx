import React, { createContext, useContext, useState } from 'react';

const AdBannerHeightContext = createContext<{
    height: number;
    setHeight: (h: number) => void;
}>({ height: 0, setHeight: () => {} });

export const AdBannerHeightProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [height, setHeight] = useState(0);
    return (
        <AdBannerHeightContext.Provider value={{ height, setHeight }}>
            {children}
        </AdBannerHeightContext.Provider>
    );
};

export const useAdBannerHeight = () => useContext(AdBannerHeightContext);
