import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Activity from "@/pages/Activity";
import Chat from "@/pages/Chat";
import Code from "@/pages/Code";
import Home from "@/pages/Home";
import Images from "@/pages/Images";
import NotFound from "@/pages/NotFound";
import Workflows from "@/pages/Workflows";
import { Route, Switch } from "wouter";
import DashboardLayout from "./components/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
function Router() { return <DashboardLayout><Switch><Route path="/" component={Home} /><Route path="/chat" component={Chat} /><Route path="/images" component={Images} /><Route path="/code" component={Code} /><Route path="/workflows" component={Workflows} /><Route path="/activity" component={Activity} /><Route component={NotFound} /></Switch></DashboardLayout>; }
export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster theme="dark" /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
