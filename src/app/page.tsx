
"use client";

import { useState } from "react";
import { StatusBar } from "@/components/StatusBar";
import { BottomNav } from "@/components/BottomNav";
import { ExploreScreen } from "@/components/screens/ExploreScreen";
import { FoodScreen } from "@/components/screens/FoodScreen";
import { FestivalsScreen } from "@/components/screens/FestivalsScreen";
import { TipsScreen } from "@/components/screens/TipsScreen";
import { EmergencyScreen } from "@/components/screens/EmergencyScreen";

type Tab = 'explore' | 'food' | 'festivals' | 'tips' | 'emergency';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('explore');

  const renderScreen = () => {
    switch (activeTab) {
      case 'explore': return <ExploreScreen />;
      case 'food': return <FoodScreen />;
      case 'festivals': return <FestivalsScreen />;
      case 'tips': return <TipsScreen />;
      case 'emergency': return <EmergencyScreen />;
      default: return <ExploreScreen />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background selection:bg-accent selection:text-accent-foreground">
      <StatusBar />
      <div className="flex-1 relative overflow-hidden">
        {renderScreen()}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
