import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import Taproot from "./routes/taproot/Taproot.jsx";
import Faq from "./pages/Faq.jsx";

// We've committed to the taproot concept — it's the site. Only two routes remain:
// the story itself and the FAQ. (Old concept-picker + alternate directions removed.)
const router = createBrowserRouter([
  { path: "/", element: <Taproot /> },
  { path: "/taproot", element: <Taproot /> },
  { path: "/faq", element: <Faq /> },
]);
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><RouterProvider router={router} /></React.StrictMode>
);
