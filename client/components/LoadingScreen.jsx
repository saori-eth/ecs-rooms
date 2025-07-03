import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <h2>Loading...</h2>
        <div className="loading-spinner"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;