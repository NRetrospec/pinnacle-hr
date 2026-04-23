import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ConvexClerkProvider } from "./providers/ConvexClerkProvider";
import { ThemeProvider } from "./providers/ThemeProvider";

createRoot(document.getElementById("root")!).render(
  <ConvexClerkProvider>
    <ThemeProvider defaultTheme="system" defaultFontSize="medium">
      <App />
    </ThemeProvider>
  </ConvexClerkProvider>
);
