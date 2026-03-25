import { cn } from "@/lib/utils";

interface SiteSectionWrapperProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function SiteSectionWrapper({ children, className, id }: SiteSectionWrapperProps) {
  return (
    <section id={id} className={cn("py-20 md:py-32", className)}>
      {children}
    </section>
  );
}
