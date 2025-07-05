import React from "react";
import "./AvatarCard.css";

export const AvatarCard = ({ avatar, isSelected, onClick }) => {
  return (
    <div
      className={`avatar-card ${isSelected ? "selected" : ""}`}
      onClick={() => onClick(avatar.id)}
    >
      <div className="avatar-card-image">
        <img
          src={`/avatars/thumbnails/${avatar.id}.png`}
          alt={avatar.name}
          onError={(e) => {
            e.target.src = "/images/placeholder-avatar.png";
          }}
        />
      </div>
      <div className="avatar-card-info">
        <h3>{avatar.name}</h3>
      </div>
      {isSelected && (
        <div className="avatar-card-selected-indicator">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M8 12L11 15L16 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
};
