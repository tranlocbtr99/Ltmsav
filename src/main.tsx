import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { LanguageProvider } from './contexts/LanguageContext';

// Register PWA service worker for offline support and installation
registerSW({ immediate: true });

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </React.StrictMode>
  );
}
