import { lazy } from "react";

// project imports
import MainLayout from "layout/MainLayout";
import Loadable from "ui-component/Loadable";

// dashboard routing
const DashboardDefault = Loadable(
  lazy(() => import("views/AwsDefenderPageCode/dashboard/Default"))
);
const AuthLogin = Loadable(
  lazy(() => import("views/AwsDefenderPageCode/auth"))
);
const MainChatPage = Loadable(
  lazy(() => import("views/AwsDefenderPageCode/chat"))
);
const SettingsMain = Loadable(
  lazy(() => import("views/AwsDefenderPageCode/settings"))
);

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: "/",
  element: <MainLayout />,
  children: [
    {
      path: "/",
      element: <DashboardDefault />,
    },
    {
      path: "dashboard",
      children: [
        {
          path: "",
          element: <DashboardDefault />,
        },
      ],
    },
    {
      path: "/auth-login",
      children: [
        {
          path: "",
          element: <AuthLogin />,
        },
      ],
    },
    {
      path: "/chat",
      children: [
        {
          path: "",
          element: <MainChatPage />,
        },
      ],
    },
    {
      path: "/config",
      children: [
        {
          path: "",
          element: <SettingsMain />,
        },
      ],
    },
  ],
};

export default MainRoutes;
