import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import './v05-live.css';
import { App } from './App';
import { LiveSearchPage } from './LiveSearchPage';
import { LiveRadarPage } from './LiveRadarPage';

const pathname = window.location.pathname;

function Root() {
  if (pathname === '/live') return <LiveSearchPage />;
  if (pathname === '/radar-live') return <LiveRadarPage />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
