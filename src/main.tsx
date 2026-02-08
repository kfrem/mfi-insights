import { createRoot } from "react-dom/client";
import { installGlobalErrorHandlers } from "./lib/errorReporting";
import App from "./App.tsx";
import "./index.css";

installGlobalErrorHandlers();

createRoot(document.getElementById("root")!).render(<App />);
