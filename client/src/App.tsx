import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ToolsManagement from "./pages/ToolsManagement";
import ToolForm from "./pages/ToolForm";
import ToolDetail from "./pages/ToolDetail";
import BorrowForm from "./pages/BorrowForm";
import MultiBorrowForm from "./pages/MultiBorrowForm";
import BorrowHistory from "./pages/BorrowHistory";
import SearchTools from "./pages/SearchTools";
import ToolSchedule from "./pages/ToolSchedule";
import MaintenanceManagement from "./pages/MaintenanceManagement";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/tools"} component={ToolsManagement} />
      <Route path={"/tools/new"} component={() => <ToolForm />} />
      <Route path={"/tools/search"} component={SearchTools} />
      <Route path={"/tools/:toolId/edit"} component={({ params }) => <ToolForm toolId={parseInt(params.toolId)} />} />
      <Route path={"/tools/:toolId"} component={({ params }) => <ToolDetail toolId={parseInt(params.toolId)} />} />
      <Route path={"/borrow-form"} component={BorrowForm} />
      <Route path={"/borrow-multi"} component={MultiBorrowForm} />
      <Route path={"/borrow-history"} component={BorrowHistory} />
      <Route path={"/tool-schedule"} component={ToolSchedule} />
      <Route path={"/maintenance"} component={MaintenanceManagement} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
