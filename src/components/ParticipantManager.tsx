'use client';
import { useState } from 'react';
import { Participant } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Users, Bus, MapPin, RefreshCw } from 'lucide-react';
import AddressSearch from './AddressSearch';
import SubwayStationPicker from './SubwayStationPicker';
import { subwayStations } from '@/data/subwayStations';

interface ParticipantManagerProps {
  participants: Participant[];
  onParticipantsChange: (participants: Participant[]) => void;
  candidatesCount?: number;
  onClearCandidates?: () => void;
  onRefresh?: () => void;
}

export default function ParticipantManager({ 
  participants, 
  onParticipantsChange,
  candidatesCount = 0,
  onClearCandidates,
  onRefresh,
}: ParticipantManagerProps) {
  const [name, setName] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>();
  const [transportMode, setTransportMode] = useState<'car' | 'transit'>('transit');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  
  // 출발지 선택 방법 탭
  const [startLocationTab, setStartLocationTab] = useState<'search' | 'subway'>('search');

  // 새로고침 처리 (5초 제한)
  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;
    
    if (timeSinceLastRefresh < 5000) {
      const remainingSeconds = Math.ceil((5000 - timeSinceLastRefresh) / 1000);
      alert(`⏱️ ${remainingSeconds}초 후에 다시 시도해주세요.`);
      return;
    }
    
    setIsRefreshing(true);
    setLastRefreshTime(now);
    
    try {
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 800);
    } catch {
      setIsRefreshing(false);
    }
  };

  const handleAddParticipant = () => {
    if (!name.trim() || !startLocation.trim()) {
      alert('이름과 출발지를 모두 입력해주세요.');
      return;
    }

    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      alert('출발지 좌표를 찾을 수 없습니다. 검색 결과에서 장소를 선택해주세요.');
      return;
    }

    if (candidatesCount > 0 && onClearCandidates) {
      const confirmClear = window.confirm(
        `⚠️ 인원 추가 시 목표지점이 전체 초기화됩니다.\n현재 ${candidatesCount}개의 후보지가 삭제됩니다.\n계속하시겠습니까?`
      );
      if (!confirmClear) return;
      onClearCandidates();
    }

    const newParticipant: Participant = {
      id: Date.now().toString(),
      name: name.trim(),
      startLocation: startLocation.trim(),
      coordinates: { lat: coordinates.lat, lng: coordinates.lng },
      transportMode,
    };

    onParticipantsChange([...participants, newParticipant]);
    setName('');
    setStartLocation('');
    setCoordinates(undefined);
  };

  const handleAddParticipantWithSubway = (stationId: string) => {
    if (!name.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    const station = subwayStations.find(s => s.id === stationId);
    if (!station) return;

    if (candidatesCount > 0 && onClearCandidates) {
      const confirmClear = window.confirm(
        `⚠️ 인원 추가 시 목표지점이 전체 초기화됩니다.\n현재 ${candidatesCount}개의 후보지가 삭제됩니다.\n계속하시겠습니까?`
      );
      if (!confirmClear) return;
      onClearCandidates();
    }

    const newParticipant: Participant = {
      id: Date.now().toString(),
      name: name.trim(),
      startLocation: `${station.name}역`,
      coordinates: station.coordinates,
      transportMode,
    };

    onParticipantsChange([...participants, newParticipant]);
    setName('');
    setStartLocation('');
    setCoordinates(undefined);
  };

  const handleRemoveParticipant = (id: string) => {
    if (candidatesCount > 0 && onClearCandidates) {
      const confirmClear = window.confirm(
        `⚠️ 인원 제거 시 목표지점이 전체 초기화됩니다.\n현재 ${candidatesCount}개의 후보지가 삭제됩니다.\n계속하시겠습니까?`
      );
      if (!confirmClear) return;
      onClearCandidates();
    }
    
    onParticipantsChange(participants.filter(p => p.id !== id));
  };

  const handleToggleTransportMode = (id: string) => {
    if (candidatesCount > 0 && onClearCandidates) {
      const confirmClear = window.confirm(
        `⚠️ 이동수단 변경 시 목표지점이 전체 초기화됩니다.\n현재 ${candidatesCount}개의 후보지가 삭제됩니다.\n계속하시겠습니까?`
      );
      if (!confirmClear) return;
      onClearCandidates();
    }

    onParticipantsChange(
      participants.map(p => 
        p.id === id 
          ? { ...p, transportMode: p.transportMode === 'transit' ? 'car' as const : 'transit' as const }
          : p
      )
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddParticipant();
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-xl font-bold">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <span>참여자 등록</span>
          </div>
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="hover:bg-muted relative"
              title="참여자 목록 새로고침 (5초마다 가능)"
            >
              <RefreshCw className={`h-4 w-4 transition-transform ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
              {isRefreshing && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping" />
              )}
            </Button>
          )}
        </CardTitle>
        <CardDescription className="text-base">
          출발 위치를 등록하면 최적의 만남 장소를 찾아드려요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {/* 입력 폼 */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
          <div>
            <label className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground">
              👤 이름
            </label>
            <Input
              type="text"
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground">
              📍 출발지 선택
            </label>
            
            {/* 탭 버튼 */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => {
                  setStartLocationTab('search');
                  setStartLocation('');
                  setCoordinates(undefined);
                }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                  startLocationTab === 'search'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                <MapPin className="h-4 w-4 inline mr-2" />
                직접 검색
              </button>
              <button
                onClick={() => {
                  setStartLocationTab('subway');
                  setStartLocation('');
                  setCoordinates(undefined);
                }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                  startLocationTab === 'subway'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                🚇 지하철역
              </button>
            </div>

            {/* 탭 컨텐츠 */}
            <div className="mt-3">
              {/* 직접 검색 탭 */}
              {startLocationTab === 'search' && (
                <AddressSearch
                  onSelect={(address: string, coords: { lat: number; lng: number }) => {
                    setStartLocation(address);
                    setCoordinates(coords);
                  }}
                  onConfirm={handleAddParticipant}
                  buttonLabel="참여자 추가"
                  placeholder="예: 강남역, 홍대입구역"
                />
              )}

              {/* 지하철역 탭 */}
              {startLocationTab === 'subway' && (
                <SubwayStationPicker
                  onSelect={(stationId: string) => {
                    const station = subwayStations.find(s => s.id === stationId);
                    if (station) {
                      setStartLocation(`${station.name}역`);
                      setCoordinates(station.coordinates);
                    }
                  }}
                  actionButton={{
                    label: '참여자 추가',
                    onClick: (stationId: string) => handleAddParticipantWithSubway(stationId),
                    disabled: !name.trim(),
                  }}
                  showPreviewHint
                  compact={false}
                />
              )}
            </div>
          </div>

          {/* 이동수단 선택 */}
          <div>
            <label className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground">
              🚗 이동수단
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTransportMode('transit')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all border-2 ${
                  transportMode === 'transit'
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-muted hover:bg-muted/80 text-foreground border-border'
                }`}
              >
                <Bus className="h-4 w-4 inline mr-2" />
                대중교통
              </button>
              <button
                type="button"
                onClick={() => setTransportMode('car')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all border-2 ${
                  transportMode === 'car'
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-muted hover:bg-muted/80 text-foreground border-border'
                }`}
              >
                🚗 자동차
              </button>
            </div>
          </div>
        </div>

        {/* 참여자 목록 */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <Users className="h-4 w-4 text-primary" />
            참여자 목록 ({participants.length}명)
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
            {participants.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
                <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">아직 참여자가 없어요</p>
                <p className="text-xs text-muted-foreground/70 mt-1">위에서 첫 참여자를 추가해보세요!</p>
              </div>
            ) : (
              participants.map((participant) => (
                <div
                  key={participant.id}
                  className="group relative p-4 bg-card rounded-lg border hover:border-primary transition-all hover:shadow-sm"
                >
                  <div className="relative flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="default" className="font-semibold">
                          {participant.name}
                        </Badge>
                        <button
                          onClick={() => handleToggleTransportMode(participant.id)}
                          title="클릭하여 이동수단 변경"
                          className={`px-2 py-1 text-xs font-medium rounded-md border transition-all hover:scale-105 ${
                            participant.transportMode === 'car' 
                              ? 'border-blue-500/50 text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900' 
                              : 'border-primary/50 text-primary bg-primary/5 hover:bg-primary/10'
                          }`}
                        >
                          {participant.transportMode === 'car' ? (
                            <>🚗 자동차</>
                          ) : (
                            <>
                              <Bus className="h-3 w-3 inline mr-1" />
                              대중교통
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        {participant.startLocation}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveParticipant(participant.id)}
                      className="text-destructive hover:text-destructive/80 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
