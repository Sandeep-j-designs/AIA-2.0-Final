import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";
import { TabIndicator } from "@/components/ui/tab-indicator";

/* Underline tabs are the one tab style (5 Nov 2026): a 2px brand rule under
   the active tab, sizes from the Foundations tokens. */
const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.List
    data-slot="tabs-list"
    ref={ref}
    className={cn(
      "relative inline-flex h-auto items-center gap-6 rounded-none bg-transparent p-0 text-pi-body",
      className
    )}
    {...props}
  >
    {children}
    <TabIndicator />
  </TabsPrimitive.List>
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    data-slot="tabs-trigger"
    ref={ref}
    className={cn(
      "group inline-flex h-control-lg items-center justify-center gap-2 whitespace-nowrap rounded-none border-b-2 border-transparent px-0 text-body font-medium text-pi-body transition-colors hover:text-pi-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 data-[state=active]:border-pi-brand data-[state=active]:text-pi-ink",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
