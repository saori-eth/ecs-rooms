export class IdentityManager {
  constructor(availableAvatars = []) {
    this.storageKey = "playerIdentity";
    this.availableAvatars = availableAvatars;
    this.identity = this.loadIdentity();
  }

  loadIdentity() {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        const identity = JSON.parse(stored);
        // Validate avatarId
        if (
          this.availableAvatars.length > 0 &&
          !this.availableAvatars.find((a) => a.id === identity.avatarId)
        ) {
          identity.avatarId = this.availableAvatars[0].id;
          localStorage.setItem(this.storageKey, JSON.stringify(identity));
        }
        return identity;
      } catch (e) {
        console.error("Failed to parse stored identity:", e);
      }
    }

    const defaultIdentity = {
      name: "Anon",
      avatarId:
        this.availableAvatars.length > 0 ? this.availableAvatars[0].id : "lain",
    };
    localStorage.setItem(this.storageKey, JSON.stringify(defaultIdentity));
    return defaultIdentity;
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
