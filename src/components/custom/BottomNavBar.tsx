import { Link } from "@tanstack/react-router";
import { Home, Sparkles, Library, Heart, Settings } from "lucide-react";

export const BottomNavBar = () => {
  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Stream", href: "/stream", icon: Sparkles },
    { name: "Favorites", href: "/favorites", icon: Heart },
    { name: "Library", href: "/songs", icon: Library },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-2 left-0 right-0 z-40 flex items-center justify-center pointer-events-none px-4 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-full bg-card/90 dark:bg-card/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/40 transition-all">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className="group relative flex items-center justify-center h-10 px-3 rounded-full text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-95 select-none"
            activeProps={{
              className: "bg-primary/20 text-primary font-bold shadow-xs px-3.5",
            }}
          >
            <item.icon className="size-4.5 shrink-0" />
            <span className="hidden group-[.bg-primary\\/20]:inline-block ml-1.5 text-xs font-semibold tracking-tight whitespace-nowrap">
              {item.name}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavBar;
