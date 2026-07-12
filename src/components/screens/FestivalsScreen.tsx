
"use client";

import { FESTIVALS } from "@/lib/app-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Calendar, Sparkles } from "lucide-react";

const FALLBACK_FEST_IMG = "https://picsum.photos/seed/fest-placeholder/600/400";

export function FestivalsScreen() {
  return (
    <div className="flex flex-col h-full bg-background animate-fade-in overflow-hidden">
      <div className="p-6 bg-primary text-white pb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-lg">
            <Calendar className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold">Festivals</h1>
        </div>
        <p className="text-white/80 text-sm">Experience the soul of Assam</p>
      </div>

      <div className="flex-1 -mt-6 rounded-t-3xl bg-background overflow-y-auto p-6 pb-24 space-y-8">
        {FESTIVALS.map((f) => (
          <div key={f.id} className="relative group">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-16 text-center pt-4">
                <span className="block text-primary font-black text-xs uppercase tracking-widest">{f.month}</span>
                <span className="block h-px w-8 bg-primary/20 mx-auto my-2" />
                <Sparkles className="w-5 h-5 text-accent mx-auto animate-pulse" />
              </div>
              <Card className="flex-1 rounded-2xl border-none shadow-sm overflow-hidden bg-white hover:shadow-lg transition-all duration-300">
                <div className="relative h-44 w-full">
                  <Image 
                    src={f.image || FALLBACK_FEST_IMG} 
                    alt={f.name} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-accent text-accent-foreground font-bold shadow-lg">
                      {f.month}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-bold text-xl mb-2 text-primary">{f.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    {f.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
