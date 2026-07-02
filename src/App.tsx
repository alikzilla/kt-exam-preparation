import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import TestsPage from "./pages/TestsPage";
import QuestionsPage from "./pages/QuestionsPage";
import TestPage from "./pages/TestPage";
import ResultsPage from "./pages/ResultsPage";
import HistoryPage from "./pages/HistoryPage";

// Data-router (createBrowserRouter) вместо BrowserRouter: нужен для
// useBlocker — перехвата навигации при незавершённом тесте.
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <DashboardPage /> },
      { path: "/tests", element: <TestsPage /> },
      { path: "/questions", element: <QuestionsPage /> },
      { path: "/test", element: <TestPage /> },
      { path: "/results/:attemptId", element: <ResultsPage /> },
      { path: "/history", element: <HistoryPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
