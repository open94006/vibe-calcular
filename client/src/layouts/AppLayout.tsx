import React, { useState } from "react";
import { Menu, X, Dumbbell, Activity, Trophy, Zap } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import clsx from "clsx";
import ThemeToggle from "../components/ThemeToggle";

// Define navigation items outside component to avoid recreation
const NAV_ITEMS = [
  { name: "跑者計算機", path: "/running", icon: Activity },
  { name: "重量計算機", path: "/weight", icon: Dumbbell },
  { name: "投手計算機", path: "/pitching", icon: Trophy },
];

const SidebarContent: React.FC<{
  location: ReturnType<typeof useLocation>;
  isDesktopSidebarCollapsed: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}> = ({ location, isDesktopSidebarCollapsed, setIsSidebarOpen }) => (
  <>
    <div className="flex items-center p-4 h-16 border-b border-gray-700 bg-gray-900 transition-colors duration-300">
      <div
        className={clsx(
          "flex items-center space-x-2 transition-all duration-300",
          isDesktopSidebarCollapsed ? "justify-center w-full" : ""
        )}
      >
        <div className="bg-blue-600 p-1.5 rounded-lg shrink-0">
          <Zap size={20} className="text-white" fill="white" />
        </div>
        {/* Use inline style for color to force override if Tailwind utility fails due to specificity, though !text-white should work */}
        <span
          className={clsx(
            "font-bold text-xl !text-white whitespace-nowrap overflow-hidden transition-all duration-300",
            isDesktopSidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}
          style={{ color: "#ffffff" }}
        >
          Vibe Tools
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
                  "flex items-center p-3 rounded-lg transition-colors duration-200 group h-12",
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
                    "ml-3 font-medium whitespace-nowrap overflow-hidden transition-all duration-300",
                    isDesktopSidebarCollapsed
                      ? "w-0 opacity-0"
                      : "w-auto opacity-100"
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
          "flex items-center",
          isDesktopSidebarCollapsed
            ? "justify-center flex-col gap-4"
            : "justify-between"
        )}
      >
        <div
          className={clsx(
            "flex items-center transition-all duration-300",
            isDesktopSidebarCollapsed ? "flex-col" : "flex-row"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shrink-0">
            D
          </div>
          <div
            className={clsx(
              "transition-all duration-300 overflow-hidden",
              isDesktopSidebarCollapsed
                ? "h-0 opacity-0 mt-0"
                : "ml-3 h-auto opacity-100"
            )}
          >
            <p className="text-sm font-medium !text-white">Developer</p>
            <p className="text-xs text-gray-400">dev@example.com</p>
          </div>
        </div>
        <div className="text-white">
          <ThemeToggle />
        </div>
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
          "hidden md:flex bg-gray-900 shadow-md flex-col z-20 transition-all duration-300 ease-in-out h-full border-r border-gray-700",
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
          "fixed inset-0 z-50 md:hidden transition-opacity duration-300 ease-in-out",
          isSidebarOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Mobile Menu Panel */}
        <aside
          className={clsx(
            "absolute top-0 left-0 w-64 h-full bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col",
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
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10 h-16 flex items-center justify-between px-4 md:px-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 transition-colors duration-300">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none mr-4 text-gray-600 dark:text-gray-300 md:hidden"
            >
              <Menu size={24} />
            </button>
            <button
              onClick={toggleDesktopSidebar}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none mr-4 text-gray-600 dark:text-gray-300 hidden md:block"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-gray-800 dark:!text-white truncate">
              {NAV_ITEMS.find((item) => item.path === location.pathname)
                ?.name || "Dashboard"}
            </h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
