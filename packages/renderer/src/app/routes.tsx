import { createHashRouter, RouterProvider } from "react-router-dom";

import HomePage from "../pages/home.js";
import LibraryPage from "../pages/library.js";
import ReviewPage from "../pages/review.js";
import SettingsPage from "../pages/settings.js";
import TodayPage from "../pages/today.js";
import AppShell from "./layout/app-shell.js";

const router = createHashRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "today", element: <TodayPage /> },
      { path: "review", element: <ReviewPage /> },
      { path: "library", element: <LibraryPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);

const AppRoutes = () => <RouterProvider router={router} />;

export default AppRoutes;
