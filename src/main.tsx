import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.tsx";
import Home from "./pages/Home.tsx";
import BracketBuilder from "./pages/BracketBuilder.tsx";
// import AdminTeams from "./pages/AdminTeams.tsx";
// import AdminBracket from "./pages/AdminBracket.tsx";
import BracketView from "./pages/BracketView.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="bracket" element={<BracketBuilder />} />
          <Route path="view" element={<BracketView />} />
          {/* <Route path="admin/teams" element={<AdminTeams />} />
          <Route path="admin/bracket" element={<AdminBracket />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
