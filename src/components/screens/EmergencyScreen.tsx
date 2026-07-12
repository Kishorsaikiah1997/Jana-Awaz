
"use client";

import { EMERGENCY } from "@/lib/app-data";
import { Phone, Shield, Ambulance, Flame, Info, User, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const IconMap: Record<string, any> = {
  shield: Shield,
  ambulance: Ambulance,
  flame: Flame,
  info: Info,
  user: User
};

export function EmergencyScreen() {
  return (
    <div className="flex flex-col h-full bg-background animate-fade-in overflow-hidden">
      <div className="p-6 bg-red-600 text-white pb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-lg">
            <Phone className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold">Helpline</h1>
        </div>
        <p className="text-white/80 text-sm">Emergency assistance at your fingertips</p>
      </div>

      <div className="flex-1 -mt-6 rounded-t-3xl bg-background overflow-y-auto p-6 pb-24 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {EMERGENCY.map((item, idx) => {
            const Icon = IconMap[item.icon] || HelpCircle;
            return (
              <a 
                key={idx} 
                href={`tel:${item.number.replace(/\D/g, '')}`}
                className="group flex items-center justify-between p-5 bg-white rounded-2xl shadow-sm border border-transparent hover:border-red-500 hover:shadow-md transition-all active:scale-95"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{item.label}</h3>
                    <p className="text-sm font-mono text-muted-foreground">{item.number}</p>
                  </div>
                </div>
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
                  <Phone className="w-4 h-4" />
                </div>
              </a>
            );
          })}
        </div>

        <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/20">
          <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Tourist Information
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The Tourist Information Centers are located at Guwahati Airport, Railway Station, and various district headquarters. For any travel related queries, feel free to contact Assam Tourism toll-free numbers.
          </p>
        </div>
      </div>
    </div>
  );
}
