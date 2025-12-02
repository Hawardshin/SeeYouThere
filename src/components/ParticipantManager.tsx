'use client';
import { useState } from 'react';
import { Participant } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Users, Bus, MapPin } from 'lucide-react';
import AddressSearch from './AddressSearch';
import SubwayStationPicker from './SubwayStationPicker';
import { subwayStations } from '@/data/subwayStations';
import AlertModal, { useAlertModal } from './AlertModal';

interface ParticipantManagerProps {
  participants: Participant[];
  onAddParticipant: (participant: Participant) => Promise<boolean>;
  onRemoveParticipant: (id: string) => Promise<boolean>;
  onUpdateParticipant: (id: string, updates: Partial<Participant>) => Promise<boolean>;
  candidatesCount?: number;
  onClearCandidates?: () => Promise<boolean>;
}

export default function ParticipantManager({ 
  participants, 
  onAddParticipant,
  onRemoveParticipant,
  onUpdateParticipant,
  candidatesCount = 0,
  onClearCandidates,
}: ParticipantManagerProps) {
  const [name, setName] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>();
  const [transportMode, setTransportMode] = useState<'car' | 'transit'>('transit');
  const { alertState, showAlert, closeAlert } = useAlertModal();
  
  // 출발지 선택 방법 탭
  const [startLocationTab, setStartLocationTab] = useState<'search' | 'subway'>('subway');

  const handleAddParticipant = async () => {
    if (!name.trim() || !startLocation.trim()) {
      showAlert('이름과 출발지를 모두 입력해주세요.', { variant: 'warning' });
      return;
    }

    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      showAlert('출발지 좌표를 찾을 수 없습니다. 검색 결과에서 장소를 선택해주세요.', { variant: 'warning' });
      return;
    }

    if (candidatesCount > 0 && onClearCandidates) {
      const confirmClear = window.confirm(
        `⚠️ 인원 추가 시 목표지점이 전체 초기화됩니다.\n현재 ${candidatesCount}개의 후보지가 삭제됩니다.\n계속하시겠습니까?`
      );
      if (!confirmClear) return;
      await onClearCandidates();
    }

    const newParticipant: Participant = {
      id: Date.now().toString(),
      name: name.trim(),
      startLocation: startLocation.trim(),
      coordinates: { lat: coordinates.lat, lng: coordinates.lng },
      transportMode,
    };

    await onAddParticipant(newParticipant);
    setName('');
    setStartLocation('');
    setCoordinates(undefined);
  };

  const handleAddParticipantWithSubway = async (stationId: string) => {
    if (!name.trim()) {
      showAlert('이름을 입력해주세요.', { variant: 'warning' });
      return;
    }

    const station = subwayStations.find(s => s.id === stationId);
    if (!station) return;

    if (candidatesCount > 0 && onClearCandidates) {
      const confirmClear = window.confirm(
        `⚠️ 인원 추가 시 목표지점이 전체 초기화됩니다.\n현재 ${candidatesCount}개의 후보지가 삭제됩니다.\n계속하시겠습니까?`
      );
      if (!confirmClear) return;
      await onClearCandidates();
    }

    const newParticipant: Participant = {
      id: Date.now().toString(),
      name: name.trim(),
      startLocation: `${station.name}역`,
      coordinates: station.coordinates,
      transportMode,
    };

    await onAddParticipant(newParticipant);
    setName('');
    setStartLocation('');
    setCoordinates(undefined);
  };

  const handleRemoveParticipant = async (id: string) => {
    if (candidatesCount > 0 && onClearCandidates) {
      const confirmClear = window.confirm(
        `⚠️ 인원 제거 시 목표지점이 전체 초기화됩니다.\n현재 ${candidatesCount}개의 후보지가 삭제됩니다.\n계속하시겠습니까?`
      );
      if (!confirmClear) return;
      await onClearCandidates();
    }
    
    await onRemoveParticipant(id);
  };

  const handleToggleTransportMode = async (id: string) => {
    if (candidatesCount > 0 && onClearCandidates) {
      const confirmClear = window.confirm(
        `⚠️ 이동수단 변경 시 목표지점이 전체 초기화됩니다.\n현재 ${candidatesCount}개의 후보지가 삭제됩니다.\n계속하시겠습니까?`
      );
      if (!confirmClear) return;
      await onClearCandidates();
    }

    const participant = participants.find(p => p.id === id);
    if (participant) {
      const newMode = participant.transportMode === 'transit' ? 'car' as const : 'transit' as const;
      await onUpdateParticipant(id, { transportMode: newMode });
    }
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
                  onConfirm={async (address: string, coords: { lat: number; lng: number }) => {
                    // 이름 체크
                    if (!name.trim()) {
                      showAlert('이름을 입력해주세요.', { variant: 'warning' });
                      return;
                    }

                    // onConfirm으로 받은 장소 정보를 직접 사용 (state 업데이트 비동기 문제 방지)
                    if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
                      showAlert('출발지 좌표를 찾을 수 없습니다. 검색 결과에서 장소를 선택해주세요.', { variant: 'warning' });
                      return;
                    }

                    if (candidatesCount > 0 && onClearCandidates) {
                      const confirmClear = window.confirm(
                        `⚠️ 인원 추가 시 목표지점이 전체 초기화됩니다.\n현재 ${candidatesCount}개의 후보지가 삭제됩니다.\n계속하시겠습니까?`
                      );
                      if (!confirmClear) return;
                      await onClearCandidates();
                    }

                    const newParticipant: Participant = {
                      id: Date.now().toString(),
                      name: name.trim(),
                      startLocation: address.trim(),
                      coordinates: { lat: coords.lat, lng: coords.lng },
                      transportMode,
                    };

                    await onAddParticipant(newParticipant);
                    setName('');
                    setStartLocation('');
                    setCoordinates(undefined);
                  }}
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
          <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
            {participants.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
                <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">아직 참여자가 없어요</p>
                <p className="text-xs text-muted-foreground/70 mt-1">위에서 첫 참여자를 추가해보세요!</p>
              </div>
            ) : (
              participants.map((participant, index) => (
                <div
                  key={participant.id}
                  className="group relative p-4 bg-gradient-to-br from-card to-muted/30 rounded-xl border hover:border-primary/50 transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    {/* 프로필 아바타 */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md ${
                      ['bg-gradient-to-br from-violet-500 to-purple-600',
                       'bg-gradient-to-br from-blue-500 to-cyan-600',
                       'bg-gradient-to-br from-emerald-500 to-teal-600',
                       'bg-gradient-to-br from-orange-500 to-amber-600',
                       'bg-gradient-to-br from-pink-500 to-rose-600',
                       'bg-gradient-to-br from-indigo-500 to-blue-600'][index % 6]
                    }`}>
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* 참여자 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-foreground text-base">
                          {participant.name}
                        </span>
                        <button
                          onClick={() => handleToggleTransportMode(participant.id)}
                          title="클릭하여 이동수단 변경"
                          className={`px-2 py-0.5 text-xs font-medium rounded-full border transition-all hover:scale-105 ${
                            participant.transportMode === 'car' 
                              ? 'border-blue-400 text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400 hover:bg-blue-100' 
                              : 'border-green-400 text-green-600 bg-green-50 dark:bg-green-950/50 dark:text-green-400 hover:bg-green-100'
                          }`}
                        >
                          {participant.transportMode === 'car' ? '🚗 자동차' : '🚇 대중교통'}
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary/70" />
                        <span className="truncate">{participant.startLocation}</span>
                      </div>
                    </div>
                    
                    {/* 삭제 버튼 */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveParticipant(participant.id)}
                      className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
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

      {/* Alert Modal */}
      <AlertModal
        open={alertState.open}
        onOpenChange={closeAlert}
        title={alertState.title}
        message={alertState.message}
        variant={alertState.variant}
      />
    </Card>
  );
}
