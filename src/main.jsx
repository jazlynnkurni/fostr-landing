import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import Home from "./pages/Home.jsx";
import Taproot from "./routes/taproot/Taproot.jsx";
import Record from "./routes/record/Record.jsx";
import Survey from "./routes/survey/Survey.jsx";
import Worklight from "./routes/worklight/Worklight.jsx";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/taproot", element: <Taproot /> },
  { path: "/record", element: <Record /> },
  { path: "/survey", element: <Survey /> },
  { path: "/worklight", element: <Worklight /> },
]);
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><RouterProvider router={router} /></React.StrictMode>
);
