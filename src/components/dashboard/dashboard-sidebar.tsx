"use client";

import {
  Building2,
  Compass,
  Hammer,
  Landmark,
  LayoutDashboard,
  Sparkles,
  Trophy,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { DashboardTab } from "@/lib/types";

type NavItem = {
  id: DashboardTab;
  label: string;
  icon: typeof LayoutDashboard;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const topItem: NavItem = {
  id: "overview",
  label: "Overview",
  icon: LayoutDashboard,
};

const navGroups: NavGroup[] = [
  {
    label: "Builders",
    items: [
      { id: "builders", label: "Builders", icon: Hammer },
      { id: "communities", label: "All Communities", icon: Building2 },
    ],
  },
  {
    label: "Lenders",
    items: [{ id: "lenders", label: "Lender profiles", icon: Landmark }],
  },
  {
    label: "Others",
    items: [
      { id: "featured", label: "Featured Carousel", icon: Sparkles },
      {
        id: "featured-communities",
        label: "Featured Communities",
        icon: Compass,
      },
      { id: "top-10", label: "Top 10 Communities", icon: Trophy },
    ],
  },
];

type DashboardSidebarProps = {
  active: DashboardTab;
  onChange: (tab: DashboardTab) => void;
};

export function DashboardSidebar({ active, onChange }: DashboardSidebarProps) {
  return (
    <aside className="w-full shrink-0 lg:w-56">
      <nav className="flex gap-4 overflow-x-auto lg:flex-col lg:gap-6 lg:overflow-visible">
        <div className="flex shrink-0 gap-1 lg:flex-col">
          <SidebarButton
            item={topItem}
            active={active === topItem.id}
            onChange={onChange}
          />
        </div>

        {navGroups.map((group) => (
          <div key={group.label} className="shrink-0 lg:w-full">
            <p className="mb-2 hidden px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:block">
              {group.label}
            </p>
            <div className="flex gap-1 lg:flex-col">
              {group.items.map((item) => (
                <SidebarButton
                  key={item.id}
                  item={item}
                  active={active === item.id}
                  onChange={onChange}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function SidebarButton({
  item,
  active,
  onChange,
}: {
  item: NavItem;
  active: boolean;
  onChange: (tab: DashboardTab) => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onChange(item.id)}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {item.label}
    </button>
  );
}
