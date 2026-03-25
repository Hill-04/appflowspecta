import { AppSidebar } from "./AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import OrionFloatingWidget from "./orion/OrionFloatingWidget";
import { OrionTourProvider } from "./orion/OrionTourProvider";
import OrionSpotlight from "./orion/OrionSpotlight";
import { useArchiving } from "@/hooks/useArchiving";

export function Layout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  useArchiving();

  return (
    <OrionTourProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main
          className={cn(
            "flex-1 overflow-auto animate-fade-in",
            isMobile ? "pt-14 p-4" : "ml-60 p-6"
          )}
        >
          {children}
        </main>
        <OrionFloatingWidget />
        <OrionSpotlight />
      </div>
    </OrionTourProvider>
  );
}
