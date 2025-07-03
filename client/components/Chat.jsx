import React, { useState, useEffect, useRef } from "react";
import "./Chat.css";

function Chat({ gameManager }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.matchMedia("(max-width: 767px)").matches ||
          "ontouchstart" in window
      );
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Set up chat message handler
    if (gameManager) {
      gameManager.onChatMessage = (message) => {
        setMessages((prev) => [...prev, message]);
      };
    }
  }, [gameManager]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedMessage = inputValue.trim();
    if (trimmedMessage && gameManager && gameManager.sendChatMessage) {
      gameManager.sendChatMessage(trimmedMessage);
      setInputValue("");
    } else {
      console.error(
        "[Chat] Cannot send message - missing gameManager or sendChatMessage"
      );
    }
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
  };

  const handleKeyDown = (e) => {
    // Prevent game controls from triggering while typing
    e.stopPropagation();
  };

  return (
    <div
      className={`chat-container ${isMobile ? "mobile" : "desktop"} ${
        isInputFocused && isMobile ? "input-focused" : ""
      }`}
    >
      {isInputFocused && isMobile && (
        <div className="chat-header" onClick={() => inputRef.current?.blur()}>
          <span>Tap to close</span>
        </div>
      )}
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className="chat-message">
            <span className="chat-author">{msg.author}:</span>
            <span className="chat-text">{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="chat-input"
          maxLength={200}
        />
        <button
          type="button"
          onClick={handleSubmit}
          className="chat-send-button"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
}

export default Chat;
