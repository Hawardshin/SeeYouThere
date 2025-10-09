'use client';

import { useState, useRef } from 'react';
import { MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import MapView from './MapView';
import { subwayStations, availableLines } from '@/data/subwayStations';

interface SubwayStationPickerProps {
  onSelect: (stationId: string) => void;
  selectedStationId?: string | null;
  actionButton?: {
    label: string;
    onClick: (stationId: string) => void;
    disabled?: boolean;
    loadingLabel?: string;
  };
  showPreviewHint?: boolean;
  compact?: boolean; // LocationManager용 간소화 버전
}

export default function SubwayStationPicker({
  onSelect,
  selectedStationId,
  actionButton,
  showPreviewHint = true,
  compact = false,
}: SubwayStationPickerProps) {
  const [selectedLine, setSelectedLine] = useState<string>(availableLines[0] || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewStation, setPreviewStation] = useState<string | null>(selectedStationId || null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lineScrollRef = useRef<HTMLDivElement>(null);

  // 검색어가 있으면 모든 호선에서 검색, 없으면 선택된 호선만
  const filteredStations = subwayStations
    .filter(s => searchQuery === '' ? s.line === selectedLine : s.name.includes(searchQuery));

  const handleStationClick = (stationId: string) => {
    const newPreview = previewStation === stationId ? null : stationId;
    setPreviewStation(newPreview);
    if (newPreview) {
      onSelect(stationId);
    }
  };

  const getMapLocations = () => {
    if (previewStation) {
      return subwayStations
        .filter(s => s.id === previewStation)
        .filter(s => s.coordinates && typeof s.coordinates.lat === 'number' && typeof s.coordinates.lng === 'number')
        .map(station => ({
          lat: Number(station.coordinates.lat),
          lng: Number(station.coordinates.lng),
          name: `${station.name}역`,
          address: station.line,
          isSelected: true,
        }));
    }
    
    return filteredStations
      .filter(s => s.coordinates && typeof s.coordinates.lat === 'number' && typeof s.coordinates.lng === 'number')
      .map(station => ({
        lat: Number(station.coordinates.lat),
        lng: Number(station.coordinates.lng),
        name: `${station.name}역`,
        address: station.line,
        isSelected: false,
      }));
  };

  // 통일된 UI - compact 여부에 따라 스타일만 조정
  return (
    <div className={compact ? "space-y-3" : "border-2 border-primary/20 rounded-lg overflow-hidden bg-muted/30"}>
      <div className={compact ? "space-y-3" : "p-3 space-y-3"}>
        {/* 호선 선택 */}
        <div>
          {!compact && (
            <label className="text-xs font-semibold text-foreground mb-2 block">
              호선 선택
            </label>
          )}
          <div className="relative">
            <button
              onClick={() => lineScrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeft className={compact ? "w-4 h-4" : "h-3 w-3 text-primary"} />
            </button>

            <div 
              ref={lineScrollRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide px-8 pb-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {availableLines.map((line) => (
                <button
                  key={line}
                  onClick={() => {
                    setSelectedLine(line);
                    setPreviewStation(null);
                    setSearchQuery('');
                  }}
                  className={`flex-shrink-0 min-w-[70px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedLine === line
                      ? 'bg-primary text-primary-foreground'
                      : compact 
                        ? 'bg-muted hover:bg-muted/80 text-foreground border border-border'
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  {line}
                </button>
              ))}
            </div>

            <button
              onClick={() => lineScrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronRight className={compact ? "w-4 h-4" : "h-3 w-3 text-primary"} />
            </button>
          </div>
        </div>

        {/* 역 검색 */}
        <div>
          <Input
            type="text"
            placeholder="역 이름 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-sm"
          />
        </div>

        {/* 역 리스트 */}
        <div className={compact ? "" : "border-t border-border pt-3"}>
          {!compact && (
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-foreground">
                {searchQuery ? `검색결과 (${filteredStations.length}개역)` : `${selectedLine} (${filteredStations.length}개역)`}
              </h4>
              <div className="flex gap-1">
                <button
                  onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
                  className="p-1 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                  <ChevronLeft className="h-3 w-3 text-primary" />
                </button>
                <button
                  onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
                  className="p-1 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                  <ChevronRight className="h-3 w-3 text-primary" />
                </button>
              </div>
            </div>
          )}
          
          <div className="relative">
            {compact && (
              <button
                onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <div 
              ref={scrollRef}
              className={compact 
                ? "flex gap-3 overflow-x-auto scrollbar-hide px-8 py-2"
                : "overflow-x-auto pb-2 -mx-2 px-2 scroll-smooth"
              }
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {compact ? (
                // compact 모드: 직접 flex
                filteredStations.map((station) => (
                  <button
                    key={station.id}
                    onClick={() => handleStationClick(station.id)}
                    className={`flex-shrink-0 w-[140px] h-[70px] p-3 rounded-lg border-2 transition-all text-left ${
                      previewStation === station.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium text-sm truncate">
                      {station.name}역
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {station.line}
                    </div>
                  </button>
                ))
              ) : (
                // full 모드: flex 래퍼 사용
                <div className="flex gap-2 min-w-min">
                  {filteredStations.map((station) => (
                    <button
                      key={station.id}
                      onClick={() => handleStationClick(station.id)}
                      className={`flex-shrink-0 w-[140px] h-[70px] px-3 py-2 text-left transition-all duration-150 border rounded-lg ${
                        previewStation === station.id
                          ? 'border-primary bg-primary/10 shadow-md'
                          : 'border-border hover:border-primary/50 hover:bg-accent/30'
                      }`}
                    >
                      <MapPin className={`h-3 w-3 mb-1 ${
                        previewStation === station.id ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <div className="font-semibold text-xs text-foreground mb-0.5 truncate">
                        {station.name}역
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {station.line}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {compact && (
              <button
                onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 지도 미리보기 */}
      <div className={compact ? "space-y-3 border-t pt-3" : "relative h-[300px] border-t border-border"}>
        {compact ? (
          // compact 모드: 항상 지도 표시 (ParticipantManager처럼)
          <>
            <div className="text-sm font-medium">미리보기</div>
            <MapView
              locations={getMapLocations()}
              className="h-[350px]"
            />
            {previewStation && actionButton && (
              <Button
                onClick={() => actionButton.onClick(previewStation)}
                disabled={actionButton.disabled}
                className="w-full"
              >
                {actionButton.disabled && actionButton.loadingLabel
                  ? actionButton.loadingLabel
                  : actionButton.label}
              </Button>
            )}
          </>
        ) : (
          // full 모드: 지도 위에 floating 버튼
          <>
            <MapView
              locations={getMapLocations()}
              className="h-full"
            />
            
            {previewStation && actionButton && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[90%] max-w-xs z-10">
                <Button
                  onClick={() => actionButton.onClick(previewStation)}
                  disabled={actionButton.disabled}
                  className="w-full font-semibold shadow-lg"
                >
                  {actionButton.disabled && actionButton.loadingLabel
                    ? actionButton.loadingLabel
                    : actionButton.label}
                </Button>
              </div>
            )}
            
            {!previewStation && showPreviewHint && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md">
                <p className="text-[10px] text-muted-foreground text-center">
                  💡 역을 클릭하면 위치를 확인할 수 있습니다
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
