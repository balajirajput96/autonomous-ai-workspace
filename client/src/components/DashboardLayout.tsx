import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { Activity, Bot, Braces, House, Image, LockKeyhole, LogOut, PanelLeft, Workflow } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: House, label: "Overview", path: "/" },
  { icon: Bot, label: "AI Chat", path: "/chat" },
  { icon: Image, label: "Image Studio", path: "/images" },
  { icon: Braces, label: "Code Assistant", path: "/code" },
  { icon: Workflow, label: "Workflows", path: "/workflows" },
  { icon: Activity, label: "Activity Log", path: "/activity" },
];
const SIDEBAR_WIDTH_KEY = "ai-workspace-sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 220;
const MAX_WIDTH = 380;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => Number(localStorage.getItem(SIDEBAR_WIDTH_KEY)) || DEFAULT_WIDTH);
  const { loading, user, logout } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return <AuthScreen />;
  }

  if (!user.isOwner) {
    return <div className="flex min-h-screen items-center justify-center bg-[#080914] px-6">
      <div className="max-w-md text-center">
        <LockKeyhole className="mx-auto size-8 text-rose-300" />
        <h1 className="mt-4 text-xl font-semibold text-white">Access restricted</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">This workspace is limited to its owner. No workspace data has been shown.</p>
        <Button variant="outline" onClick={logout} className="mt-6 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">Sign out</Button>
      </div>
    </div>;
  }

  return <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
    <LayoutContent setSidebarWidth={setSidebarWidth}>{children}</LayoutContent>
  </SidebarProvider>;
}

function AuthScreen() {
  return <div className="flex min-h-screen items-center justify-center bg-[#080914] px-6">
    <div className="max-w-md text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-violet-400/10"><LockKeyhole className="size-6 text-violet-300" /></div>
      <h1 className="mt-5 text-2xl font-semibold text-white">Private workspace</h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">Sign in with Manus OAuth to enter this owner-only AI workspace.</p>
      <Button onClick={() => startLogin()} className="mt-6 bg-violet-500 hover:bg-violet-400">Sign in securely</Button>
    </div>
  </div>;
}

function LayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (value: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const active = menuItems.find(item => item.path === location);

  useEffect(() => {
    const move = (event: MouseEvent) => {
      if (!isResizing || isCollapsed) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const width = event.clientX - left;
      if (width >= MIN_WIDTH && width <= MAX_WIDTH) setSidebarWidth(width);
    };
    const up = () => setIsResizing(false);
    if (isResizing) {
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
      document.body.style.cursor = "col-resize";
    }
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      document.body.style.cursor = "";
    };
  }, [isResizing, isCollapsed, setSidebarWidth]);

  return <>
    <div ref={sidebarRef} className="relative">
      <Sidebar collapsible="icon" className="border-r border-white/10 bg-[#0d0f20]" disableTransition={isResizing}>
        <SidebarHeader className="h-[72px] border-b border-white/10 px-3">
          <div className="flex h-full items-center gap-3">
            <button onClick={toggleSidebar} className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"><PanelLeft className="size-4" /></button>
            {!isCollapsed && <div className="min-w-0"><p className="truncate text-sm font-semibold tracking-tight text-white">AI Workspace</p><p className="mt-0.5 text-[11px] text-violet-300">Owner-only control center</p></div>}
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2 py-4">
          <SidebarMenu>{menuItems.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-10 rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-white data-[active=true]:bg-violet-400/15 data-[active=true]:text-white"><item.icon className="size-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t border-white/10 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-xl px-1 py-1 text-left transition hover:bg-white/5">
                <Avatar className="size-8 border border-white/10"><AvatarFallback className="bg-violet-400/10 text-xs text-violet-200">{user?.name?.charAt(0).toUpperCase() ?? "O"}</AvatarFallback></Avatar>
                {!isCollapsed && <div className="min-w-0"><p className="truncate text-xs font-medium text-slate-200">{user?.name || "Owner"}</p><p className="mt-0.5 truncate text-[11px] text-slate-500">Private session</p></div>}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-white/10 bg-[#15172a] text-slate-200"><DropdownMenuItem onClick={logout} className="cursor-pointer text-rose-300 focus:bg-rose-400/10 focus:text-rose-200"><LogOut className="mr-2 size-4" />Sign out</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <div onMouseDown={() => setIsResizing(true)} className={`absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-violet-400/30 ${isCollapsed ? "hidden" : ""}`} />
    </div>
    <SidebarInset className="bg-[#080914]">
      {isMobile && <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-white/10 bg-[#080914]/90 px-3 backdrop-blur"><SidebarTrigger className="text-slate-300" /><span className="text-sm font-medium text-white">{active?.label ?? "AI Workspace"}</span></header>}
      <main className="min-h-screen">{children}</main>
    </SidebarInset>
  </>;
}
