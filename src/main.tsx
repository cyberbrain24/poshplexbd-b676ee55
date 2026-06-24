import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initGlobalErrorHandler } from "./utils/global-error-handler";

// Initialize global error capture before rendering
initGlobalErrorHandler();

createRoot(document.getElementById("root")!).render(<App />);
