// import React from "react";
// import { BrowserRouter as Router } from "react-router-dom";

// import MainLayout from "../shared/layout/MainLayout";
// import AppRoutes from "./routes";

// export default function App() {
//   return (
//     <Router>
//       <MainLayout>
//         <AppRoutes />
//       </MainLayout>
//     </Router>
//   );
// }



import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import MainLayout from "../shared/layout/MainLayout";
import AppRoutes from "./routes";

import "../styles/global.css";
import "../styles/layout.css";
import "../styles/header.css";
import "../styles/station.css";


export default function App() {
  return (
    <Router>
      <MainLayout>
        <AppRoutes />
      </MainLayout>
    </Router>
  );
}
