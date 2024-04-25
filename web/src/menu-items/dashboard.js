// assets
import {
  IconDashboard,
  IconKey,
  IconBrandHipchat,
  IconSettings2,
} from "@tabler/icons";

// constant
const icons = { IconDashboard, IconKey, IconBrandHipchat, IconSettings2 };

// ==============================|| DASHBOARD MENU ITEMS ||============================== //

const dashboard = {
  id: "dashboard",
  title: "Home",
  type: "group",
  children: [
    {
      id: "default",
      title: "Dashboard",
      type: "item",
      url: "/dashboard",
      icon: icons.IconDashboard,
      breadcrumbs: false,
    },
    {
      id: "auth",
      title: "Authentication",
      type: "item",
      url: "/auth-login",
      icon: icons.IconKey,
      breadcrumbs: false,
    },
    {
      id: "chat",
      title: "Chat",
      type: "item",
      url: "/chat",
      icon: icons.IconBrandHipchat,
      breadcrumbs: false,
    },
    {
      id: "settings",
      title: "Settings",
      type: "item",
      url: "/config",
      icon: icons.IconSettings2,
      breadcrumbs: false,
    },
  ],
};

export default dashboard;
