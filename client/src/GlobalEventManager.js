class GlobalEventManager {
  constructor() {
    this.listeners = new Map();
  }

  _getKey(target, eventType, handler) {
    return `${target === window ? 'window' : target === document ? 'document' : 'other'}_${eventType}_${handler.toString()}`;
  }

  add(target, eventType, handler, options) {
    const key = this._getKey(target, eventType, handler);
    
    if (this.listeners.has(key)) {
      console.warn(`Listener already exists for ${eventType} on target`);
      return;
    }

    this.listeners.set(key, {
      target,
      eventType,
      handler,
      options
    });

    target.addEventListener(eventType, handler, options);
  }

  remove(target, eventType, handler) {
    const key = this._getKey(target, eventType, handler);
    
    const listener = this.listeners.get(key);
    if (!listener) {
      console.warn(`No listener found for ${eventType} on target`);
      return;
    }

    target.removeEventListener(eventType, handler, listener.options);
    this.listeners.delete(key);
  }

  removeAll() {
    this.listeners.forEach((listener) => {
      listener.target.removeEventListener(
        listener.eventType,
        listener.handler,
        listener.options
      );
    });
    
    this.listeners.clear();
  }
}

export default new GlobalEventManager();