import React from 'react';
import { render } from '@testing-library/react-native';
import { SimpleHeader } from '../SimpleHeader';

describe('SimpleHeader', () => {
    it('renders correctly', () => {
        const { getByText } = render(<SimpleHeader />);

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
