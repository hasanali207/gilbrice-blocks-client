import {
  BarChart3,
  FileDown,
  FileIcon,
  Home,
  KeySquareIcon,
  LogOut,
  MapPin,
  MoveLeftIcon,
  NotebookPen,
  Settings,
  ShoppingBag,
  Truck,
  UserPlus,
  UserRoundSearch,
  Users,
  Wallet,
} from "lucide-react";

import { getDashboardPath } from "./route";

export interface MenuItem {
  name: string;
  icon: any;
  href?: string;
  sub?: MenuItem[];
  protectedPath?: string;
}

export type UserRole =
  | "GILBRICE_SUPER_ADMIN"
  | "GILBRICE_ADMIN"
  | "GILBRICE_FINANCE"
  | "OWNER"
  | "MANAGER"
  | "WAREHOUSE_EMPLOYEE"
  | "CASHIER";

/* ============================================================
   getMenus(role)

   NOTE: This is a plain function, NOT a hook. It must be called
   from inside a component's render body (or another hook), and
   it must be passed the role explicitly — it does not read from
   Redux itself. This avoids the "Invalid hook call" error caused
   by calling useAppSelector at module top-level.

   Every route under the GILBRICE admin menu is normalized to the
   "/superadmin/..." prefix, and every "create" route follows the
   same "/superadmin/<module>/create" pattern.
============================================================ */
export const getMenus = (
  role: UserRole | null | undefined,
): Record<UserRole, MenuItem[]> => {
  const basePath = getDashboardPath(role);

  /* ---------------- GILBRICE ADMIN MENU ---------------- */
  const gilbriceAdminMenu: MenuItem[] = [
    {
      name: "Dashboard",
      icon: Home,
      href: basePath,
    },
    /* ---------------- PARTNERS ---------------- */
    {
      name: "Partners",
      icon: Users,
      sub: [
        {
          name: "All Partners",
          icon: UserRoundSearch,
          href: `${basePath}/partners`,
        },
        {
          name: "Add Partner",
          icon: UserPlus,
          href: `${basePath}/partners/create`,
        },
      ],
    },
    /* ---------------- CUSTOMERS ---------------- */
    {
      name: "Customers",
      icon: Users,
      sub: [
        {
          name: "All Customers",
          icon: UserRoundSearch,
          href: `${basePath}/customers/allcustomers`,
        },
        {
          name: "Add Customer",
          icon: UserPlus,
          href: `${basePath}/customers/create`,
        },
      ],
    },
    {
      name: "Locations",
      icon: MapPin,
      sub: [
        {
          name: "All Locations",
          icon: BarChart3,
          href: `${basePath}/locations`,
        },
      ],
    },
    {
      name: "Carrier",
      icon: ShoppingBag,
      sub: [
        {
          name: "All Carrier",
          icon: BarChart3,
          href: `${basePath}/carrier`,
        },
      ],
    },
    /* ---------------- SHIPMENTS ---------------- */
    {
      name: "Shipments",
      icon: Truck,
      sub: [
        {
          name: "All Shipments",
          icon: FileDown,
          href: `${basePath}/shipments`,
        },
        {
          name: "Create Shipment",
          icon: UserPlus,
          href: `${basePath}/shipments/create`,
        },
      ],
    },

    // /* ---------------- PACKAGES ---------------- */
    // {
    //   name: "Packages",
    //   icon: Package,
    //   sub: [
    //     {
    //       name: "Package Scan",
    //       icon: ScanLine,
    //       href: `${basePath}/packages/scan`,
    //     },
    //     {
    //       name: "Scan History",
    //       icon: CalendarClock,
    //       href: `${basePath}/packages/history`,
    //     },
    //   ],
    // },

    /* ---------------- MANIFESTS ---------------- */
    {
      name: "Manifests",
      icon: NotebookPen,
      sub: [
        {
          name: "All Manifests",
          icon: FileIcon,
          href: `${basePath}/manifests`,
        },
        {
          name: "Create Manifest",
          icon: UserPlus,
          href: `${basePath}/manifests/create`,
        },
      ],
    },

    /* ---------------- PAYMENTS ---------------- */
    {
      name: "Payments",
      icon: Wallet,
      sub: [
        {
          name: "All Payments",
          icon: BarChart3,
          href: `${basePath}/payments`,
        },
      ],
    },
    {
      name: "Reports",
      icon: BarChart3,
      sub: [
        {
          name: "Payment Reports",
          icon: FileDown,
          href: `${basePath}/reports/payments`,
        },
        {
          name: "Partner Ledger",
          icon: FileDown,
          href: `${basePath}/reports/parnter-ledger`,
        },
      ],
    },

    /* ---------------- USER (GILBRICE STAFF) ---------------- */
    {
      name: "User",
      icon: Users,
      sub: [
        {
          name: "All User",
          icon: UserRoundSearch,
          href: `${basePath}/user`,
        },
        {
          name: "Add User",
          icon: UserPlus,
          href: `${basePath}/user/create`,
        },
      ],
    },

    /* ---------------- REPORTS ---------------- */

    /* ---------------- SETTINGS ---------------- */
    {
      name: "Settings",
      icon: Settings,
      sub: [
        {
          name: "Profile",
          icon: Settings,
          href: `${basePath}/profile`,
        },
        {
          name: "Change Password",
          icon: KeySquareIcon,
          href: `${basePath}/password`,
        },
      ],
    },

    {
      name: "Exit Dashboard",
      icon: MoveLeftIcon,
      href: `/`,
    },
    {
      name: "Logout",
      icon: LogOut,
      href: `/logout`,
    },
  ];

  /* ---------------- GILBRICE FINANCE MENU ---------------- */

  /* ---------------- PARTNER OWNER MENU ---------------- */
  const partnerOwnerMenu: MenuItem[] = [
    {
      name: "Dashboard",
      icon: Home,
      href: `${basePath}`,
    },

    /* ---------------- CLIENTS ---------------- */
    {
      name: "Clients",
      icon: Users,
      sub: [
        {
          name: "All Clients",
          icon: UserRoundSearch,
          href: `${basePath}/clients`,
        },
      ],
    },
    {
      name: "Orders",
      icon: Users,
      sub: [
        {
          name: "All Orders",
          icon: UserRoundSearch,
          href: `${basePath}/orders`,
        },
      ],
    },
    {
      name: "Productions",
      icon: Users,
      sub: [
        {
          name: "All Productions",
          icon: UserRoundSearch,
          href: `${basePath}/productions`,
        },
      ],
    },
    {
      name: "Deliveries",
      icon: Users,
      sub: [
        {
          name: "All Deliveries",
          icon: UserRoundSearch,
          href: `${basePath}/deliveries`,
        },
      ],
    },
    {
      name: "Inventory",
      icon: Users,
      sub: [
        {
          name: "All Inventory",
          icon: UserRoundSearch,
          href: `${basePath}/inventory`,
        },
      ],
    },

    /* ---------------- PAYMENTS ---------------- */
    {
      name: "Payments",
      icon: Wallet,
      sub: [
        {
          name: "All Payments",
          icon: BarChart3,
          href: `${basePath}/payments`,
        },
        {
          name: "All Ledger",
          icon: FileDown,
          href: `${basePath}/partners/ledger`,
        },
      ],
    },

    /* ---------------- REPORTS ---------------- */
    {
      name: "Reports",
      icon: BarChart3,
      sub: [
        {
          name: "Shipment Reports",
          icon: FileDown,
          href: `${basePath}/reports/shipments`,
        },
        {
          name: "Payment Reports",
          icon: FileDown,
          href: `${basePath}/reports/payments`,
        },
        {
          name: "Partner Ledger",
          icon: FileDown,
          href: `${basePath}/reports/partner-ledger`,
        },
      ],
    },

    /* ---------------- SETTINGS ---------------- */
    {
      name: "Settings",
      icon: Settings,
      sub: [
        {
          name: "Profile",
          icon: Settings,
          href: `${basePath}/profile`,
        },
        {
          name: "Change Password",
          icon: KeySquareIcon,
          href: `${basePath}/password`,
        },
      ],
    },
    {
      name: "Exit Dashboard",
      icon: MoveLeftIcon,
      href: `/`,
    },
    {
      name: "Logout",
      icon: LogOut,
      href: `${basePath}/logout`,
    },
  ];

  /* ============================================================
     FINAL ROLE → MENU CONFIG
  ============================================================ */
  return {
    GILBRICE_SUPER_ADMIN: gilbriceAdminMenu,

    GILBRICE_ADMIN: gilbriceAdminMenu,

    GILBRICE_FINANCE: gilbriceAdminMenu,

    OWNER: partnerOwnerMenu,

    MANAGER: partnerOwnerMenu,

    WAREHOUSE_EMPLOYEE: partnerOwnerMenu,

    CASHIER: partnerOwnerMenu,
  };
};
