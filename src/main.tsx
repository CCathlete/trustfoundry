import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
// import './index.css'; // In case we would add a global CSS file

// Get the root DOM element
const rootElement = document.getElementById('root');

if (rootElement) {
    // Create a React root and render the App component
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    );
}