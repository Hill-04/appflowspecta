import { cn } from "@/lib/utils";

interface SiteContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function SiteContainer({ children, className }: SiteContainerProps) {
  return (
    <div className={cn("max-w-6xl mx-auto px-5 sm:px-8 lg:px-12", className)}>
      {children}
    </div>
  );
}
