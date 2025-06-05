import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

export function Tabs({ value, onValueChange, className, children }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, setValue: onValueChange }}>
      <div data-slot="tabs" className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="tabs-list" className={cn("flex gap-2", className)} {...props} />;
}

interface TabsTriggerProps extends React.ComponentProps<"button"> {
  value: string;
}

export function TabsTrigger({ value, className, ...props }: TabsTriggerProps) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsTrigger must be used within Tabs");
  const active = ctx.value === value;
  return (
    <button
      data-slot="tabs-trigger"
      onClick={() => ctx.setValue(value)}
      className={cn(
        "px-3 py-1 rounded-md text-sm",
        active ? "bg-primary text-primary-foreground" : "bg-muted",
        className
      )}
      {...props}
    />
  );
}

interface TabsContentProps extends React.ComponentProps<"div"> {
  value: string;
}

export function TabsContent({ value, className, ...props }: TabsContentProps) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent must be used within Tabs");
  if (ctx.value !== value) return null;
  return <div data-slot="tabs-content" className={className} {...props} />;
}
