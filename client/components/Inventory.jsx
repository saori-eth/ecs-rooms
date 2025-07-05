import React from "react";
import { AvatarCard } from "./AvatarCard.jsx";
import "./Inventory.css";

export const Inventory = ({ currentAvatarId, onAvatarSelect, vrmManager }) => {
  const avatars = vrmManager.getAvailableAvatars();

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <p>Choose your avatar</p>
      </div>
      <div className="inventory-grid">
        {avatars.map((avatar) => (
          <AvatarCard
            key={avatar.id}
            avatar={avatar}
            isSelected={avatar.id === currentAvatarId}
            onClick={onAvatarSelect}
          />
        ))}
      </div>
    </div>
  );
};
