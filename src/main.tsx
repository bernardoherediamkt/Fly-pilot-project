import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { App } from './App';
import { LiveSearchPage } from './LiveSearchPage';

const isLiveSearch = window.location.pathname === '/live';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isLiveSearch ? <LiveSearchPage /> : <App />}
  </React.StrictMode>
);
