import { Component, ReactNode } from 'react';
import './ErrorBoundary.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <div className="error-icon">☭</div>
            <h1 className="error-title">
              A COUNTER-REVOLUTIONARY ERROR HAS OCCURRED
            </h1>
            <p className="error-subtitle">
              The Party has been notified of this disruption.
            </p>

            <div className="error-details">
              <p className="error-message">
                {this.state.error?.message || 'An unknown error occurred'}
              </p>
              {process.env.NODE_ENV === 'development' && (
                <pre className="error-stack">
                  {this.state.error?.stack}
                </pre>
              )}
            </div>

            <div className="error-actions">
              <button className="reload-button" onClick={this.handleReload}>
                ☭ RESTART THE REVOLUTION ☭
              </button>
            </div>

            <div className="error-footer">
              <p>All progress may be lost. The State apologizes for the inconvenience.</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
