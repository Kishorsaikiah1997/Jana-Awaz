
"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  Star, 
  MapPin, 
  ExternalLink, 
  ArrowLeft, 
  Share2, 
  Heart, 
  Navigation,
  ArrowRight,
  Filter
} from "lucide-react";
import { TOURISM_PLACES, DISTRICTS, CATEGORIES, TourismPlace } from "@/lib/app-data";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { cn } from "@/lib/utils";

type SortOption = 'A-Z' | 'Popular';

const FALLBACK_IMG = "https://picsum.photos/seed/placeholder/800/600";

export function ExploreScreen() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>('Popular');
  const [selectedPlace, setSelectedPlace] = useState<TourismPlace | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Load favorites from local storage
  useEffect(() => {
    const saved = localStorage.getItem('assam_favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  }, []);

  const toggleFavorite = (id: string) => {
    const newFavorites = favorites.includes(id)
      ? favorites.filter(favId => favId !== id)
      : [...favorites, id];
    
    setFavorites(newFavorites);
    localStorage.setItem('assam_favorites', JSON.stringify(newFavorites));
    
    toast({
      title: favorites.includes(id) ? "Removed from favorites" : "Saved to favorites",
      description: favorites.includes(id) ? "Place removed." : "Added to your collection.",
    });
  };

  const handleShare = async (place: TourismPlace) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: place.name,
          text: `Check out ${place.name} in ${place.district}, Assam!`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      // Fallback
      navigator.clipboard.writeText(`${place.name} - ${place.district}, Assam`);
      toast({
        title: "Copied to clipboard",
        description: "Share details copied.",
      });
    }
  };

  const featuredPlaces = useMemo(() => TOURISM_PLACES.filter(p => p.featured), []);

  const filteredPlaces = useMemo(() => {
    let result = TOURISM_PLACES.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.district.toLowerCase().includes(search.toLowerCase()) ||
        p.search_keywords.some(k => k.toLowerCase().includes(search.toLowerCase()));
      const matchesDistrict = selectedDistrict === "All" || p.district === selectedDistrict;
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      const matchesFavorites = !showOnlyFavorites || favorites.includes(p.id);
      return matchesSearch && matchesDistrict && matchesCategory && matchesFavorites;
    });

    switch (sortBy) {
      case 'A-Z':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'Popular':
        result.sort((a, b) => b.popularity_score - a.popularity_score);
        break;
      default:
        break;
    }
    return result;
  }, [search, selectedDistrict, selectedCategory, sortBy, favorites, showOnlyFavorites]);

  const nearbyPlaces = useMemo(() => {
    if (!selectedPlace) return [];
    return TOURISM_PLACES.filter(p => p.district === selectedPlace.district && p.id !== selectedPlace.id);
  }, [selectedPlace]);

  if (selectedPlace) {
    const isFavorite = favorites.includes(selectedPlace.id);
    return (
      <div className="animate-slide-up h-full bg-white flex flex-col">
        <div className="relative h-[45%] w-full">
          <Image 
            src={selectedPlace.images[0] || FALLBACK_IMG} 
            alt={selectedPlace.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
            <button 
              onClick={() => setSelectedPlace(null)}
              className="bg-white/90 p-2 rounded-full shadow-lg backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5 text-primary" />
            </button>
            <div className="flex gap-2">
              <button 
                onClick={() => toggleFavorite(selectedPlace.id)}
                className="bg-white/90 p-2 rounded-full shadow-lg backdrop-blur-sm active:scale-90 transition-transform"
              >
                <Heart className={cn("w-5 h-5 transition-colors", isFavorite ? "text-red-500 fill-current" : "text-gray-400")} />
              </button>
              <button 
                onClick={() => handleShare(selectedPlace)}
                className="bg-white/90 p-2 rounded-full shadow-lg backdrop-blur-sm"
              >
                <Share2 className="w-5 h-5 text-primary" />
              </button>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 to-transparent text-white">
            <Badge className="bg-accent text-accent-foreground mb-2">{selectedPlace.category}</Badge>
            <h2 className="text-3xl font-bold leading-tight">{selectedPlace.name}</h2>
            <div className="flex items-center gap-2 mt-1 opacity-90">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">{selectedPlace.district}, Assam</span>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto pb-24 space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              About
              <div className="h-px flex-1 bg-muted" />
            </h3>
            <p className="text-muted-foreground leading-relaxed italic">
              {selectedPlace.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="w-full h-12 flex items-center gap-2 font-bold"
              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.latitude},${selectedPlace.longitude}`, '_blank')}
            >
              <Navigation className="w-4 h-4" />
              Directions
            </Button>
            <Button 
              className="w-full h-12 flex items-center gap-2 font-bold"
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedPlace.latitude},${selectedPlace.longitude}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
              View Map
            </Button>
          </div>

          {nearbyPlaces.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3">Nearby in {selectedPlace.district}</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {nearbyPlaces.map(p => (
                  <Card 
                    key={p.id} 
                    className="min-w-[200px] rounded-xl overflow-hidden cursor-pointer shrink-0 border-none shadow-sm"
                    onClick={() => setSelectedPlace(p)}
                  >
                    <div className="relative h-28 w-full">
                      <Image 
                        src={p.images[0] || FALLBACK_IMG} 
                        alt={p.name} 
                        fill 
                        className="object-cover" 
                      />
                    </div>
                    <CardContent className="p-3">
                      <h4 className="font-bold text-sm truncate">{p.name}</h4>
                      <p className="text-[10px] text-muted-foreground">{p.category}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background animate-fade-in">
      {/* Header & Search */}
      <div className="p-6 bg-primary text-primary-foreground space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Assam Guide</h1>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("text-primary-foreground", showOnlyFavorites && "bg-white/20")}
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          >
            <Heart className={cn("w-5 h-5", showOnlyFavorites && "fill-current text-red-400")} />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input 
            placeholder="Search places, districts..." 
            className="pl-10 h-12 rounded-2xl bg-white text-foreground border-none shadow-lg focus-visible:ring-accent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 -mt-4 rounded-t-[2.5rem] bg-background overflow-y-auto no-scrollbar pb-24">
        {/* Featured Section */}
        {search === "" && !showOnlyFavorites && featuredPlaces.length > 0 && (
          <div className="pt-6">
            <div className="px-6 flex justify-between items-end mb-4">
              <h2 className="text-xl font-bold">Featured</h2>
              <button className="text-primary text-xs font-bold flex items-center gap-1">
                See All <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto px-6 pb-4 no-scrollbar">
              {featuredPlaces.map(place => (
                <div 
                  key={place.id}
                  className="relative min-w-[280px] h-44 rounded-3xl overflow-hidden shadow-md cursor-pointer group shrink-0"
                  onClick={() => setSelectedPlace(place)}
                >
                  <Image 
                    src={place.images[0] || FALLBACK_IMG} 
                    alt={place.name} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end">
                    <Badge className="w-fit mb-1 bg-accent text-accent-foreground text-[10px]">{place.category}</Badge>
                    <h3 className="text-white font-bold text-lg">{place.name}</h3>
                    <p className="text-white/70 text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {place.district}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                <SelectTrigger className="rounded-xl border-none bg-white shadow-sm font-medium">
                  <SelectValue placeholder="All Districts" />
                </SelectTrigger>
                <SelectContent>
                  {DISTRICTS.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="rounded-xl border-none bg-white shadow-sm font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Popular">Popular</SelectItem>
                  <SelectItem value="A-Z">A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold transition-all border",
                  selectedCategory === cat 
                    ? "bg-primary text-white border-primary shadow-md" 
                    : "bg-white text-primary border-primary/10 hover:bg-primary/5"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="px-6 grid grid-cols-1 gap-4">
          {filteredPlaces.map((place) => (
            <Card 
              key={place.id} 
              className="flex items-center gap-4 p-3 rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group bg-white"
              onClick={() => setSelectedPlace(place)}
            >
              <div className="relative h-24 w-24 rounded-xl overflow-hidden shrink-0">
                <Image 
                  src={place.images[0] || FALLBACK_IMG} 
                  alt={place.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-sm truncate pr-2 group-hover:text-primary transition-colors">{place.name}</h3>
                  <div className="flex items-center gap-0.5 text-yellow-500">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-[10px] font-bold text-foreground">{(place.popularity_score / 20).toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Badge variant="outline" className="w-fit text-[10px] py-0 px-1.5 font-medium border-primary/20 text-primary">
                    {place.category}
                  </Badge>
                  <div className="flex items-center text-muted-foreground text-[10px] gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{place.district}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          {filteredPlaces.length === 0 && (
            <div className="text-center py-20 flex flex-col items-center opacity-40">
              <Search className="w-12 h-12 mb-2" />
              <p className="text-sm">No items found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
