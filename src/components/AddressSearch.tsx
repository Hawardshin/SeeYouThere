'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { searchPlaces, type PlaceResult } from '@/lib/mapApi';
import MapView from './MapView';

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
  const [previewPlace, setPreviewPlace] = useState<PlaceResult | null>(null); // 미리보기 중인 장소
  const [confirmedPlace, setConfirmedPlace] = useState<PlaceResult | null>(null); // 확정된 장소
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 장소 클릭 (미리보기)
  const handlePreviewPlace = (place: PlaceResult) => {
    console.log('[AddressSearch] 장소 미리보기:', place);
    setPreviewPlace(place); // 지도에 미리보기 표시
  };

  // 장소 확정 (설정 버튼)
  const handleConfirmPlace = () => {
    if (!previewPlace) return;
    
    console.log('[AddressSearch] 장소 확정:', previewPlace);
    setConfirmedPlace(previewPlace);
    setQuery(previewPlace.name); // 장소 이름 표시
    setIsOpen(false);
    setShowNoResults(false);
    
    onSelect(previewPlace.name, previewPlace.coordinates);
  };

  // 새로운 검색 시 상태 초기화
  const handleSearch = async () => {
    if (query.trim().length < 2 || isLoading) {
      return;
    }

    setIsLoading(true);
    setShowNoResults(false);
    setIsOpen(false);
    setPreviewPlace(null); // 미리보기 초기화
    
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
      {/* 확정된 장소 표시 */}
      {confirmedPlace && !isOpen && (
        <div className="mb-3 p-3 bg-primary/10 border-2 border-primary/30 rounded-lg">
          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-foreground">
                {confirmedPlace.name}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {confirmedPlace.address}
              </div>
            </div>
            <Badge className="bg-primary text-primary-foreground shrink-0">
              설정됨
            </Badge>
          </div>
        </div>
      )}

      {/* 검색창과 검색 버튼 */}
      <div className="relative flex gap-2 mb-4">
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

      {/* 검색 결과 없음 메시지 */}
      {showNoResults && (
        <div className="w-full bg-background border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground mb-4">
          검색 결과가 없습니다. 다른 키워드로 검색해보세요.
        </div>
      )}

      {/* 네이버 지도 스타일 레이아웃: 좌측 리스트 + 우측 지도 */}
      {isOpen && results.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 border-2 border-primary/30 rounded-lg p-4 bg-card shadow-2xl">
          {/* 좌측: 검색 결과 리스트 */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            <h3 className="text-sm font-semibold text-foreground mb-3 sticky top-0 bg-card py-2 z-10">
              검색 결과 ({results.length}개)
            </h3>
            {results.map((place, index) => (
              <div key={place.placeId} className="space-y-0">
                {/* 장소 정보 카드 */}
                <button
                  onClick={() => handlePreviewPlace(place)}
                  className={`w-full px-4 py-3 text-left transition-all duration-150 border rounded-lg flex items-start gap-3 ${
                    previewPlace?.placeId === place.placeId
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-border hover:border-primary/50 hover:bg-accent/30'
                  }`}
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate text-foreground">
                      {place.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {place.address}
                    </div>
                  </div>
                  <MapPin className={`h-5 w-5 shrink-0 mt-0.5 ${
                    previewPlace?.placeId === place.placeId ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </button>

                {/* 선택된 장소의 설정 버튼 */}
                {previewPlace?.placeId === place.placeId && (
                  <div className="px-4 pb-3 pt-2 animate-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={handleConfirmPlace}
                      className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      이 위치로 설정
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 우측: 지도 */}
          <div className="lg:sticky lg:top-4 h-[500px]">
            <MapView
              locations={
                previewPlace
                  ? [
                      {
                        lat: previewPlace.coordinates.lat,
                        lng: previewPlace.coordinates.lng,
                        name: previewPlace.name,
                        address: previewPlace.address,
                        isSelected: true,
                      },
                    ]
                  : results.map((place) => ({
                      lat: place.coordinates.lat,
                      lng: place.coordinates.lng,
                      name: place.name,
                      address: place.address,
                      isSelected: false,
                    }))
              }
              className="h-full rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
