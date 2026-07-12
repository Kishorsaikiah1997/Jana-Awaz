
"use client";

import { Map, Utensils, Calendar, Lightbulb, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = 'explore' | 'food' | 'festivals' | 'tips' | 'emergency';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'explore', label: 'Explore', icon: Map },
    { id: 'food', label: 'Food', icon: Utensils },
    { id: 'festivals', label: 'Festivals', icon: Calendar },
    { id: 'tips', label: 'Tips', icon: Lightbulb },
    { id: 'emergency', label: 'SOS', icon: Phone },
  ];

  return (
    <div className="absolute bottom-0 left-0 w-full bg-white border-t flex justify-around items-center pt-2 pb-6 px-2 z-50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as Tab)}
            className={cn(
              "flex flex-col items-center gap-1 min-w-[60px] transition-all duration-300",
              isActive ? "text-primary scale-110" : "text-muted-foreground"
            )}
          >
            <div className={cn(
              "p-2 rounded-full transition-all",
              isActive ? "bg-primary/10" : "bg-transparent"
            )}>
              <Icon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
