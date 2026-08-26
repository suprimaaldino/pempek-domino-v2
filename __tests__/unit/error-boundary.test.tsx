import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

function Bomb(): React.ReactElement | null {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  it('renders a fallback message when a child throws', () => {
    render(
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <Bomb />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
