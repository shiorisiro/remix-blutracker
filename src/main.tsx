import React, {StrictMode, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './ThemeContext.tsx';
import './index.css';

class ErrorBoundary extends React.Component<{children: ReactNode}, {hasError: boolean}> {
  public state = { hasError: false };

  constructor(props: {children: ReactNode}) {
    super(props);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 p-6 flex-col">
          <h1 className="text-xl font-bold mb-2">Oops! Terjadi Kesalahan.</h1>
          <p className="text-center text-sm text-gray-500 mb-6">Silakan refresh halaman untuk melanjutkan.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg"
          >
            Refresh Halaman
          </button>
        </div>
      );
    }
    // @ts-ignore
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
);
