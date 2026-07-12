
"use client";

import { FOOD } from "@/lib/app-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Utensils, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";

const FALLBACK_FOOD_IMG = "https://picsum.photos/seed/food-placeholder/400/400";

export function FoodScreen() {
  const [search, setSearch] = useState("");

  const filteredFood = useMemo(() => {
    return FOOD.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.type?.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div className="flex flex-col h-full bg-background animate-fade-in overflow-hidden">
      <div className="p-6 bg-primary text-white pb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-lg">
            <Utensils className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold">Cuisine</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary w-4 h-4" />
          <Input 
            placeholder="Search food, ingredients..." 
            className="pl-10 h-10 rounded-xl bg-white text-foreground border-none shadow-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 -mt-6 rounded-t-3xl bg-background overflow-y-auto p-6 pb-24 space-y-4">
        {filteredFood.map((item) => (
          <Card key={item.id} className="rounded-2xl border-none shadow-sm overflow-hidden flex bg-white group hover:shadow-md transition-shadow">
            <div className="relative w-32 h-32 flex-shrink-0">
              <Image 
                src={item.image || FALLBACK_FOOD_IMG} 
                alt={item.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              {item.type && (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-white/80 backdrop-blur-sm text-primary text-[8px] px-1.5 py-0">
                    {item.type}
                  </Badge>
                </div>
              )}
            </div>
            <CardContent className="p-4 flex flex-col justify-center flex-1">
              <h3 className="font-bold text-primary text-lg mb-1">{item.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 italic">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}

        {filteredFood.length === 0 && (
          <div className="text-center py-20 opacity-30">
            <Utensils className="w-12 h-12 mx-auto mb-2" />
            <p>No matches found</p>
          </div>
        )}
      </div>
    </div>
  );
}
