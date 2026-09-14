import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";
import { Library, ListMusic, Settings } from "lucide-react";
import { homeRoutes } from "@/constants/constants";
import CreatePlaylistDialog from "@/features/playlists/components/CreatePlaylistDialog";
import useGetAllPlaylistsQuery from "@/features/playlists/api/useGetAllPlaylistsQuery";

const AppSidebar = () => {
  const { data: playlists } = useGetAllPlaylistsQuery();

  return (
    <Sidebar variant="floating" className="pb-25 bg-sidebar border-r border-sidebar-border backdrop-blur-2xl">
      <SidebarHeader
        data-tauri-drag-region
        className="flex justify-center items-center h-10"
      >
        {/* <WindowControlButtons /> */}
      </SidebarHeader>
      <SidebarContent className="overscroll-contain w-full h-full px-1">
        <SidebarGroup className="space-y-1">
          <SidebarGroupLabel className="font-semibold font-heading flex items-center gap-2 text-sidebar-foreground px-4 pt-1">
            <Library className="size-4 text-primary" />
            <span className="text-sm font-bold tracking-tight">My Library</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {homeRoutes.map((route) => (
                <SidebarMenuItem key={route.name}>
                  <SidebarMenuButton className="w-full h-9 p-0">
                    <Link
                      to={route.href}
                      className="w-full h-full text-xs font-medium px-4 rounded-xl flex items-center gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                      activeProps={{
                        className: "text-primary bg-primary/10 font-semibold",
                      }}
                    >
                      <route.icon className="size-4 shrink-0" />
                      {route.name}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="space-y-1">
          <SidebarGroupLabel className="font-semibold font-heading flex items-center justify-between text-sidebar-foreground/60 px-4 text-xs">
            <span>Playlists</span>
            <CreatePlaylistDialog />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {playlists?.map((playlist) => (
                <SidebarMenuItem key={playlist.id}>
                  <SidebarMenuButton className="w-full h-9 p-0">
                    <Link
                      to={"/playlists/$id"}
                      params={{ id: playlist.id.toString() }}
                      className="w-full h-full text-xs font-medium px-4 rounded-xl flex items-center gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent truncate transition-colors"
                      activeProps={{
                        className: "text-primary bg-primary/10 font-semibold",
                      }}
                    >
                      <ListMusic className="size-4 shrink-0 text-sidebar-foreground/50" />
                      <span className="truncate">{playlist.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="w-full h-9 p-0">
              <Link
                to={"/settings"}
                className="w-full h-full text-xs px-4 rounded-xl flex items-center gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                activeProps={{
                  className: "text-primary bg-primary/10 font-semibold",
                }}
              >
                <Settings className="size-4 shrink-0" />
                Settings
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
