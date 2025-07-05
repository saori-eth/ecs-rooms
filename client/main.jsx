import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { GameManager } from "./utils/GameManager.js";

// Create game manager instance
const gameManager = new GameManager();

// React app initialization
const root = ReactDOM.createRoot(document.getElementById("react-root"));
root.render(<App gameManager={gameManager} />);