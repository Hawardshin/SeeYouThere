'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { searchPlaces, type PlaceResult } from '@/lib/mapApi';

interface AddressSearchProps {
  onSelect: (address: string, coordinates: { lat: number; lng: number }) => void;
  placeholder?: string;
  defaultValue?: string;
}

export default function AddressSearch({ 
  onSelect, 
  placeholder = "장소를 검색하세요",
  defaultValue = ""
}: AddressSearchProps) {
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 엔터키 또는 검색 버튼 클릭 시 검색 실행
  const handleSearch = async () => {
    if (query.trim().length < 2 || isLoading) {
      return;
    }

    setIsLoading(true);
    setShowNoResults(false);
    setIsOpen(false);
    
    try {
      const places = await searchPlaces(query);
      
      setResults(places);
      setIsOpen(true);
      
      if (places.length === 0) {
        setShowNoResults(true);
      }
    } catch (error) {
      console.error('검색 오류:', error);
      setShowNoResults(true);
    } finally {
      setIsLoading(false);
    }
  };

  // 엔터키 감지
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // 장소 선택 핸들러
  const handleSelectPlace = (place: PlaceResult) => {
    console.log('[AddressSearch] 장소 선택:', place);
    setQuery(place.name); // 장소 이름 표시 (예: "신림역")
    setIsOpen(false);
    setShowNoResults(false);
    
    console.log('[AddressSearch] onSelect 호출 전:', {
      name: place.name,
      coordinates: place.coordinates
    });
    
    onSelect(place.name, place.coordinates); // 장소 이름 전달
  };

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowNoResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pl-9 pr-3"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isLoading || query.trim().length < 2}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold tracking-wide uppercase text-sm shadow-md hover:shadow-lg flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              검색 중...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              검색
            </>
          )}
        </button>
      </div>

      {/* 검색 결과 드롭다운 */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border-2 border-primary/30 rounded-lg shadow-2xl max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {results.map((place) => (
            <button
              key={place.placeId}
              onClick={() => handleSelectPlace(place)}
              className="w-full px-4 py-3 text-left hover:bg-accent/50 transition-all duration-150 border-b border-border/50 last:border-b-0 flex items-start gap-3 hover:scale-[1.02] active:scale-[0.98]"
            >
              <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate text-foreground">{place.name}</div>
                <div className="text-xs text-muted-foreground truncate">{place.address}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 검색 결과 없음 메시지 */}
      {showNoResults && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
          검색 결과가 없습니다. 다른 키워드로 검색해보세요.
        </div>
      )}
    </div>
  );
}
