import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { TimelinePage } from "@/pages/TimelinePage";
import { TitleDetailsPage } from "@/pages/TitleDetailsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <TimelinePage /> },
      { path: "/title/:titleId", element: <TitleDetailsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
