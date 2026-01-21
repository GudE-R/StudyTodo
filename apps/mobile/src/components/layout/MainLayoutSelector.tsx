import React from 'react';
import { MainLayout as MainLayoutDefault } from './MainLayout_Safe';
import { MainLayoutSimple } from './MainLayoutSimple';
import { useLayout } from '../../providers/LayoutProvider';

export const MainLayoutSelector = () => {
    const { layoutMode } = useLayout();

    if (layoutMode === 'simple') {
        return <MainLayoutSimple />;
    }

    return <MainLayoutDefault />;
};
