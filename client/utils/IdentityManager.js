export class IdentityManager {
  constructor() {
    this.storageKey = "playerIdentity";
    this.identity = this.loadIdentity();
  }

  loadIdentity() {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse stored identity:", e);
      }
    }

    return {
      name: `Player${Math.floor(Math.random() * 1000)}`,
      avatarId: "killua",
    };
  }

  saveIdentity(name, avatarId) {
    this.identity = { name, avatarId };
    localStorage.setItem(this.storageKey, JSON.stringify(this.identity));
  }

  getName() {
    return this.identity.name;
  }

  getAvatarId() {
    return this.identity.avatarId;
  }

  getIdentity() {
    return { ...this.identity };
  }
}
