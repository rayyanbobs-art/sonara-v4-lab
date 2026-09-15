import { useEffect } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppHeader from "@/components/custom/AppHeader";
import AppFooter from "@/components/custom/AppFooter";
import BottomNavBar from "@/components/custom/BottomNavBar";
import { checkForAppUpdates } from "@/utils/updater";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 2,
      networkMode: "always",
    },
    mutations: {
      retry: 2,
      networkMode: "always",
    },
  },
});

const RootLayout = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      void checkForAppUpdates();
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Backspace") return;

      const target = e.target as HTMLElement;

      const isEditable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable;

      if (!isEditable) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-full h-screen bg-[#0d1015] text-foreground flex flex-col relative overflow-hidden select-none font-sans">
        <AppHeader />
        <div className="flex-1 w-full overflow-hidden">
          <Outlet />
        </div>
        <AppFooter />
        <BottomNavBar />
      </div>
      <TanStackRouterDevtools />
    </QueryClientProvider>
  );
};

export const Route = createRootRoute({
  component: RootLayout,
});
