'use client';

import { useState } from 'react';
import { Participant } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users, Car, Bus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AddressSearch from './AddressSearch';

interface ParticipantManagerProps {
  participants: Participant[];
  onParticipantsChange: (participants: Participant[]) => void;
}

export default function ParticipantManager({ participants, onParticipantsChange }: ParticipantManagerProps) {
  const [name, setName] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>();
  const [transportMode, setTransportMode] = useState<'car' | 'transit'>('transit');

  const handleAddParticipant = () => {
    if (!name.trim() || !startLocation.trim()) {
      alert('이름과 출발지를 모두 입력해주세요.');
      return;
    }

    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      alert('출발지 좌표를 찾을 수 없습니다. 검색 결과에서 장소를 선택해주세요.');
      return;
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
    setTransportMode('transit');
  };

  const handleRemoveParticipant = (id: string) => {
    onParticipantsChange(participants.filter(p => p.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddParticipant();
    }
  };

  return (
    <Card className="h-full border-2 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="bg-primary/5 border-b-2 border-border/50">
        <CardTitle className="flex items-center gap-2 text-xl font-bold tracking-wide uppercase">
          <Users className="h-6 w-6 text-primary" />
          병력 배치
        </CardTitle>
        <CardDescription className="text-base">
          참여 인원의 출발 위치를 등록하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 입력 폼 */}
        <div className="space-y-3 p-4 bg-accent/30 rounded-lg border-2 border-dashed border-primary/30">
          <div>
            <label className="text-sm font-semibold mb-1.5 block uppercase tracking-wide text-foreground">병사 이름</label>
            <Input
              type="text"
              placeholder="예: 홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>

          <div>
            <label className="text-sm font-semibold mb-1.5 block uppercase tracking-wide text-foreground">출발 거점</label>
            <AddressSearch
              onSelect={(address: string, coords: { lat: number; lng: number }) => {
                console.log('[ParticipantManager] AddressSearch onSelect 호출:', { address, coords });
                setStartLocation(address);
                setCoordinates(coords);
              }}
              placeholder="출발지를 검색하세요 (예: 강남역)"
            />
            {/* 디버깅: 현재 좌표 표시 */}
            {coordinates && (
              <div className="text-xs text-muted-foreground mt-1">
                좌표: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold mb-1.5 block uppercase tracking-wide text-foreground">이동 수단</label>
            <Select
              value={transportMode}
              onValueChange={(value) => setTransportMode(value as 'car' | 'transit')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transit">
                  <div className="flex items-center gap-2">
                    <Bus className="h-4 w-4" />
                    <span>대중교통</span>
                  </div>
                </SelectItem>
                <SelectItem value="car">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    <span>자동차</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleAddParticipant} 
            className="w-full font-semibold tracking-wide uppercase shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            병력 추가
          </Button>
        </div>

        {/* 참여자 목록 */}
        <div>
          <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            참여자 목록 ({participants.length}명)
          </h3>
          <div className="space-y-2">
            {participants.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8 border rounded-lg bg-gray-50 dark:bg-gray-900">
                참여자를 추가해주세요
              </p>
            ) : (
              participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-start justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="default" className="font-semibold">
                        {participant.name}
                      </Badge>
                      {participant.transportMode === 'car' ? (
                        <Badge variant="outline" className="text-xs">
                          <Car className="h-3 w-3 mr-1" />
                          자동차
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <Bus className="h-3 w-3 mr-1" />
                          대중교통
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {participant.startLocation}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveParticipant(participant.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

