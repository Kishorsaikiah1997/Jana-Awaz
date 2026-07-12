
"use client";

import { TRAVEL_TIPS } from "@/lib/app-data";
import { Lightbulb, Bus, Sun, Languages, Heart, Wifi, ShieldAlert } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const IconMap: Record<string, any> = {
  bus: Bus,
  sun: Sun,
  languages: Languages,
  heart: Heart,
  wifi: Wifi
};

export function TipsScreen() {
  return (
    <div className="flex flex-col h-full bg-background animate-fade-in overflow-hidden">
      <div className="p-6 bg-primary text-white pb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-lg">
            <Lightbulb className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold">Pro Tips</h1>
        </div>
        <p className="text-white/80 text-sm">Essential guide for your smooth trip</p>
      </div>

      <div className="flex-1 -mt-6 rounded-t-3xl bg-background overflow-y-auto p-6 pb-24">
        <div className="bg-accent/10 border border-accent/20 p-4 rounded-2xl mb-6 flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-primary flex-shrink-0" />
          <p className="text-xs text-primary font-medium">
            Assam is generally safe for travelers, but always check for weather alerts or local festivals which might cause traffic disruptions.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {TRAVEL_TIPS.map((tip, idx) => {
            const Icon = IconMap[tip.icon] || Lightbulb;
            return (
              <AccordionItem key={idx} value={`item-${idx}`} className="border rounded-2xl bg-white px-4 shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/5 rounded-lg">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-bold text-primary">{tip.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                  {tip.content}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
