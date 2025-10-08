'use client';

import { useState } from 'react';
import { Participant } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users, Bus, MapPin } from 'lucide-react';
import AddressSearch from './AddressSearch';

interface ParticipantManagerProps {
  participants: Participant[];
  onParticipantsChange: (participants: Participant[]) => void;
  candidatesCount?: number;
  onClearCandidates?: () => void;
}

export default function ParticipantManager({ 
  participants, 
  onParticipantsChange,
  candidatesCount = 0,
  onClearCandidates,
}: ParticipantManagerProps) {
  const [name, setName] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>();
  // 대중교통으로 고정 (향후 확장 가능)
  const transportMode = 'transit' as const;

  const handleAddParticipant = () => {
    if (!name.trim() || !startLocation.trim()) {
      alert('이름과 출발지를 모두 입력해주세요.');
      return;
    }

    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      alert('출발지 좌표를 찾을 수 없습니다. 검색 결과에서 장소를 선택해주세요.');
      return;
    }

    // 후보지가 있으면 초기화 경고
    if (candidatesCount > 0 && onClearCandidates) {
      const confirmClear = window.confirm(
        `⚠️ 인원 추가 시 목표지점이 전체 초기화됩니다.\n현재 ${candidatesCount}개의 후보지가 삭제됩니다.\n계속하시겠습니까?`
      );
      if (!confirmClear) {
        return;
      }
      onClearCandidates();
    }

    const newParticipant: Participant = {
      id: Date.now().toString(),
      name: name.trim(),
      startLocation: startLocation.trim(),
      coordinates: {
        lat: coordinates.lat,
        lng: coordinates.lng,
      },
      transportMode,
    };

    console.log('[ParticipantManager] 새 참여자 추가:', newParticipant);

    onParticipantsChange([...participants, newParticipant]);
    setName('');
    setStartLocation('');
    setCoordinates(undefined);
  };

  const handleRemoveParticipant = (id: string) => {
    // 후보지가 있으면 초기화 경고
    if (candidatesCount > 0 && onClearCandidates) {
      const confirmClear = window.confirm(
        `⚠️ 인원 삭제 시 목표지점이 전체 초기화됩니다.\n현재 ${candidatesCount}개의 후보지가 삭제됩니다.\n계속하시겠습니까?`
      );
      if (!confirmClear) {
        return;
      }
      onClearCandidates();
    }
    
    onParticipantsChange(participants.filter(p => p.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddParticipant();
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl font-bold">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <span>참여자 등록</span>
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
              📍 출발지
            </label>
            <AddressSearch
              onSelect={(address: string, coords: { lat: number; lng: number }) => {
                console.log('[ParticipantManager] AddressSearch onSelect 호출:', { address, coords });
                setStartLocation(address);
                setCoordinates(coords);
              }}
              placeholder="예: 강남역, 홍대입구역"
            />
            {/* 좌표 표시 */}
            {coordinates && (
              <div className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1 animate-pulse font-medium">
                ✓ 좌표: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
              </div>
            )}
          </div>

          {/* 이동수단 안내 (선택 제거, 대중교통 고정) */}
          <div className="text-xs text-foreground flex items-center gap-2 p-2 bg-primary/10 rounded-lg border border-primary/20">
            <Bus className="h-4 w-4 text-primary" />
            <span className="font-medium">이동수단: 대중교통 (지하철/버스)</span>
          </div>

          <Button 
            onClick={handleAddParticipant} 
            className="w-full font-semibold py-5"
          >
            <Plus className="h-5 w-5 mr-2" />
            참여자 추가
          </Button>
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
                        <Badge variant="outline" className="border-primary/50 text-primary bg-primary/5">
                          <Bus className="h-3 w-3 mr-1" />
                          대중교통
                        </Badge>
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

