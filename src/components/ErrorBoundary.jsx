import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import './ErrorBoundary.css';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary__card">
            <div className="error-boundary__icon">
              <AlertTriangle size={32} />
            </div>
            <h2 className="error-boundary__title">Something went wrong</h2>
            <p className="error-boundary__message">
              Something went wrong loading this dashboard. Please try again.
            </p>
            {this.state.error && (
              <code className="error-boundary__detail">
                {this.state.error.message}
              </code>
            )}
            <button className="error-boundary__btn" onClick={this.handleReset}>
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
