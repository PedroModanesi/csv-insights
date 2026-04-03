import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: 'var(--void)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⚠ SYSTEM ERROR</div>
            <div style={{ opacity: 0.6, fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {this.state.error?.message ?? 'Erro inesperado'}
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ border: '1px solid var(--amber)', color: 'var(--amber)', background: 'transparent', padding: '0.5rem 1.5rem', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
            >
              REINICIAR
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
