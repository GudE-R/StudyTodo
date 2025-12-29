import React from 'react';
import { render } from '@testing-library/react-native';
import { Header } from '../Header';

describe('Header', () => {
    it('renders correctly', () => {
        const { getByText } = render(<Header />);

        // Check if the current date is rendered (roughly)
        // Since it depends on the current date, we just check if it exists
        const today = new Date().toLocaleDateString('ja-JP', {
            month: 'long',
            day: 'numeric',
            weekday: 'short',
        });

        expect(getByText(today)).toBeTruthy();
    });
});
