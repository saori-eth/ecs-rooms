import React from 'react';
import './MenuTabs.css';

export const MenuTabs = ({ activeTab, onTabClick }) => {
    const tabs = [
        { id: 'lobby', label: 'LOBBY', icon: '🎮' },
        { id: 'inventory', label: 'INVENTORY', icon: '👤' }
    ];

    return (
        <div className="menu-tabs-container">
            <div className="menu-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`menu-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => onTabClick(tab.id)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};