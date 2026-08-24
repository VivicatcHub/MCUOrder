import { Outlet } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CatalogProvider } from "./providers/CatalogProvider";
import { WatchedProvider } from "@/features/watched/components/WatchedProvider";

export function AppLayout() {
  return (
    <CatalogProvider>
      <WatchedProvider>
        <TooltipProvider delayDuration={200}>
          <Outlet />
        </TooltipProvider>
      </WatchedProvider>
    </CatalogProvider>
  );
}
