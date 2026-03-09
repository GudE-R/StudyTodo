import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingSpinner, LoadingOverlay } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
    it('renders with default props', () => {
        render(<LoadingSpinner />);
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('applies custom size', () => {
        render(<LoadingSpinner size={50} />);
        const spinner = screen.getByRole('status');
        expect(spinner).toHaveStyle({ width: '50px', height: '50px' });
    });
});

describe('LoadingOverlay', () => {
    it('renders when isLoading is true', () => {
        render(<LoadingOverlay isLoading={true} message="Please wait" />);
        expect(screen.getByText('Please wait')).toBeInTheDocument();
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('does not render when isLoading is false', () => {
        const { container } = render(<LoadingOverlay isLoading={false} />);
        expect(container).toBeEmptyDOMElement();
    });
});