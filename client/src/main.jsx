import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Register PWA Service Worker for offline support and standalone app installation
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  // Listen for new service worker taking control and reload to show latest UI instantly
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        reg.update();
        console.log('AniCart Service Worker registered successfully, scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('AniCart Service Worker registration failed:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
