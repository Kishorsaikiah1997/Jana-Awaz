import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useRef } from "react";

interface Option {
  id: string;
  name_en: string;
  name_hi: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  highContrast?: boolean;
}

export function SearchableSelect({ options, value, onChange, placeholder, disabled, highContrast }: SearchableSelectProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.id === value);
  const displayValue = selectedOption ? (String(t(selectedOption.name_en)).trim().toLowerCase() === selectedOption.name_hi.trim().toLowerCase() ? String(t(selectedOption.name_en)) : `${String(t(selectedOption.name_en))} / ${selectedOption.name_hi}`) : "";

  const filteredOptions = options.filter(opt => 
    String(t(opt.name_en)).toLowerCase().includes(searchTerm.toLowerCase()) || 
    opt.name_hi.includes(searchTerm)
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className={`w-full rounded-2xl p-3.5 text-base transition flex justify-between items-center ${
          disabled 
            ? "bg-[#F5F5F5] text-slate-400 cursor-not-allowed border border-slate-200" 
            : highContrast
              ? "bg-black border-yellow-400 border-2 text-yellow-400 cursor-pointer"
              : "bg-[#FFFEF7] border border-[#C8B99A] hover:border-[#FFB347] text-[#3E2723] cursor-pointer"
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={displayValue ? "" : "opacity-60"}>
          {displayValue || placeholder}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>

      {isOpen && !disabled && (
        <div className={`absolute z-50 w-full mt-1 rounded-xl shadow-lg border max-h-60 overflow-y-auto ${
          highContrast ? "bg-black border-yellow-400 text-yellow-400" : "bg-[#FFFEF7] border-[#C8B99A]"
        }`}>
          <div className="sticky top-0 p-2 bg-inherit border-b border-inherit">
            <input 
              type="text" 
              className={`w-full p-2 rounded-lg text-sm focus:outline-none ${
                highContrast ? "bg-black text-yellow-400 border border-yellow-400 placeholder-yellow-600" : "bg-white border border-[#E8DCC8] text-[#3E2723] placeholder-slate-400 focus:border-[#FF9933]"
              }`}
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-2 text-sm opacity-60">No results found</div>
            ) : (
              filteredOptions.map((opt) => (
                <div 
                  key={opt.id}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition ${
                    value === opt.id 
                      ? (highContrast ? "bg-yellow-400/20" : "bg-[#FDF6E3] font-bold text-[#FF9933]") 
                      : (highContrast ? "hover:bg-yellow-400/10" : "hover:bg-slate-50 text-[#3E2723]")
                  }`}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                >
                  {String(t(opt.name_en)).trim().toLowerCase() === opt.name_hi.trim().toLowerCase() ? String(t(opt.name_en)) : `${String(t(opt.name_en))} / ${opt.name_hi}`}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
