import React from 'react';
import ReactDOM from 'react-dom/client';
import { DashboardProvider } from './context/DashboardContext.js';
import { AppContent } from './App.js';
import './styles/index.css';
import './styles/cyber.scss';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <DashboardProvider>
      <AppContent />
    </DashboardProvider>
  </React.StrictMode>
);
