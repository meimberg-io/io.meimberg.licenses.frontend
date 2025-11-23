import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress findDOMNode deprecation warning from react-quill
// This is a known issue with the library and doesn't affect functionality
if (import.meta.env.DEV) {
  const originalError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("findDOMNode is deprecated")
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

createRoot(document.getElementById("root")!).render(<App />);




