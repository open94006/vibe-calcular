import React, { useState } from "react";
import { Menu, X, Dumbbell, Activity, Trophy, Cloud } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import clsx from "clsx";
import ThemeToggle from "../components/ThemeToggle";
import Footer from "../components/Footer";

// Define navigation items outside component to avoid recreation
const ShuttlecockIcon = ({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 19c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" />
    <path d="M12 9V3" />
    <path d="M9 10l-2-5" />
    <path d="M15 10l2-5" />
    <path d="M12 19v2" />
  </svg>
);

const NAV_ITEMS = [
  { name: "天氣查詢", path: "/weather", icon: Cloud },
  { name: "馬拉松配速換算", path: "/running", icon: Activity },
  { name: "磅-公斤換算", path: "/weight", icon: Dumbbell },
  { name: "公里-英里換算", path: "/pitching", icon: Trophy },
  { name: "羽球記分板", path: "/badminton", icon: ShuttlecockIcon },
];

const SidebarContent: React.FC<{
  location: ReturnType<typeof useLocation>;
  isDesktopSidebarCollapsed: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}> = ({ location, isDesktopSidebarCollapsed, setIsSidebarOpen }) => (
  <>
    <div className="flex items-center p-4 h-12 border-b border-gray-700 bg-gray-900 transition-colors duration-300">
      <div
        className={clsx(
          "flex items-center space-x-2 transition-all duration-300",
          isDesktopSidebarCollapsed ? "justify-center w-full" : ""
        )}
      >
        <div className="shrink-0 overflow-hidden rounded-lg w-8 h-8">
          <img
            src="/runner_icon.jpg"
            alt="Logo"
            className="w-full h-full object-cover"
          />
        </div>
        {/* Use inline style for color to force override if Tailwind utility fails due to specificity, though !text-white should work */}
        <span
          className={clsx(
            "font-bold text-xl !text-white whitespace-nowrap overflow-hidden transition-all duration-500 ease-in-out",
            isDesktopSidebarCollapsed
              ? "max-w-0 opacity-0 ml-0"
              : "max-w-[200px] opacity-100 ml-2"
          )}
          style={{ color: "#ffffff" }}
        >
          Z-Running
        </span>
      </div>
      {/* Mobile Close Button inside sidebar */}
      <button
        onClick={() => setIsSidebarOpen(false)}
        className="md:hidden absolute right-4 p-1 rounded-md hover:bg-gray-700 text-gray-300 focus:outline-none"
      >
        <X size={24} />
      </button>
    </div>

    <nav className="flex-1 overflow-y-auto py-4 bg-gray-900 transition-colors duration-300">
      <ul className="space-y-2 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={clsx(
                  "flex items-center p-3 rounded-lg transition-all duration-500 ease-in-out group h-12",
                  isActive
                    ? "bg-blue-600 !text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:!text-white",
                  isDesktopSidebarCollapsed ? "justify-center" : ""
                )}
                title={isDesktopSidebarCollapsed ? item.name : undefined}
              >
                <item.icon
                  size={24}
                  className={clsx(
                    "shrink-0 transition-colors duration-200",
                    isActive
                      ? "!text-white"
                      : "text-gray-400 group-hover:!text-white"
                  )}
                />
                <span
                  className={clsx(
                    "font-medium whitespace-nowrap overflow-hidden transition-all duration-500 ease-in-out",
                    isDesktopSidebarCollapsed
                      ? "max-w-0 opacity-0 ml-0"
                      : "max-w-[200px] opacity-100 ml-3"
                  )}
                >
                  {item.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>

    <div className="p-4 border-t border-gray-700 bg-gray-900 transition-colors duration-300">
      <div
        className={clsx(
          "flex items-center transition-all duration-500 ease-in-out w-full",
          isDesktopSidebarCollapsed ? "justify-center" : "justify-end"
        )}
      >
        <div
          className={clsx(
            "transition-all duration-500 ease-in-out overflow-hidden w-full",
            isDesktopSidebarCollapsed
              ? "max-w-0 opacity-0"
              : "max-w-full opacity-100"
          )}
        >
          <ThemeToggle />
        </div>
        {isDesktopSidebarCollapsed && (
          <div className="flex justify-center w-full">
            <ThemeToggle showLabel={false} />
          </div>
        )}
      </div>
    </div>
  </>
);

const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile default closed
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
    useState(false); // Desktop collapse state
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside
        className={clsx(
          "hidden md:flex bg-gray-900 shadow-md flex-col z-20 transition-all duration-500 ease-in-out h-full border-r border-gray-700",
          isDesktopSidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent
          location={location}
          isDesktopSidebarCollapsed={isDesktopSidebarCollapsed}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      </aside>

      {/* Sidebar - Mobile Overlay & Menu */}
      <div
        className={clsx(
          "fixed inset-0 z-50 md:hidden transition-all duration-500 ease-in-out",
          isSidebarOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none delay-150"
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-500"
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Mobile Menu Panel */}
        <aside
          className={clsx(
            "absolute top-0 left-0 w-64 h-full bg-gray-900 shadow-2xl transform transition-transform duration-500 ease-in-out flex flex-col",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <SidebarContent
            location={location}
            isDesktopSidebarCollapsed={false}
            setIsSidebarOpen={setIsSidebarOpen}
          />
        </aside>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10 h-12 md:h-12 flex items-center justify-between px-4 md:px-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 transition-colors duration-300">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-0 mr-2 md:mr-4 text-gray-600 dark:text-gray-300 md:hidden"
            >
              <Menu size={20} />
            </button>
            <button
              onClick={toggleDesktopSidebar}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-0 mr-4 text-gray-600 dark:text-gray-300 hidden md:block"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-base md:text-xl font-semibold text-gray-800 dark:!text-white truncate">
              {NAV_ITEMS.find((item) => item.path === location.pathname)
                ?.name || "Dashboard"}
            </h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
          <div className="max-w-7xl mx-auto flex flex-col min-h-full">
            <div className="flex-1">
              <Outlet />
            </div>
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
