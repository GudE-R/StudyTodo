import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TodoTitle } from '../TodoTitle';
import React from 'react';

describe('TodoTitle', () => {
    it('renders fixed title correctly', () => {
        render(<TodoTitle title="Buy milk" />);
        expect(screen.getByText('Buy milk')).toBeInTheDocument();
    });

    it('renders title with suffix separately', () => {
        render(<TodoTitle title="Study math(2回目)" />);

        // "Study math" and "(2回目)" should be present
        expect(screen.getByText('Study math')).toBeInTheDocument();
        expect(screen.getByText('(2回目)')).toBeInTheDocument();
    });

    it('applies custom className', () => {
        const { container } = render(<TodoTitle title="Test" className="custom-class" />);
        expect(container.firstChild).toHaveClass('custom-class');
    });
});
