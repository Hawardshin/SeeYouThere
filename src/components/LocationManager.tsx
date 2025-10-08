'use client';

import { useState } from 'react';
import { Participant, CandidateLocation, TravelTime } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Clock, Trash2, Loader2 } from 'lucide-react';
import { getTravelTime } from '@/lib/mapApi';
import AddressSearch from './AddressSearch';

interface LocationManagerProps {
  participants: Participant[];
  candidates: CandidateLocation[];
  onCandidatesChange: (candidates: CandidateLocation[]) => void;
  selectedLocationId: string | null;
  onLocationSelect: (id: string | null) => void;
  departureTime: string;
  onDepartureTimeChange: (time: string) => void;
}

export default function LocationManager({
  participants,
  candidates,
  onCandidatesChange,
  selectedLocationId,
  onLocationSelect,
  departureTime,
  onDepartureTimeChange,
}: LocationManagerProps) {
  const [locationAddress, setLocationAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>();
  const [isCalculating, setIsCalculating] = useState(false);

  const handleAddCandidate = async () => {
    if (!locationAddress.trim()) {
      alert('장소를 입력해주세요.');
      return;
    }

    if (participants.length === 0) {
      alert('참여자를 먼저 추가해주세요.');
      return;
    }

    // 좌표 유효성 검사
    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      alert('후보지 좌표를 찾을 수 없습니다. 검색 결과에서 장소를 선택해주세요.');
      return;
    }

    console.log('[LocationManager] 후보지 추가:', {
      address: locationAddress,
      coordinates: coordinates
    });

    setIsCalculating(true);

    try {
      const candidateCoords = coordinates;

      // 각 참여자별 소요시간 계산
      const travelTimes: TravelTime[] = await Promise.all(
        participants.map(async (participant) => {
          // 참여자 출발지 좌표 (이제 필수값)
          const startCoords = participant.coordinates;
          
          let duration = 0;
          let distance = 0;

          console.log(`[LocationManager] ${participant.name} 경로 계산 시작:`, {
            from: startCoords,
            to: candidateCoords,
            mode: participant.transportMode
          });
          
          // 교통수단에 따라 다른 API 모드 사용
          const mode = participant.transportMode === 'car' ? 'driving' : 'transit';
          const result = await getTravelTime(startCoords, candidateCoords, mode);
          
          duration = result.duration;
          distance = result.distance;
          
          console.log(`[LocationManager] ${participant.name} 경로 계산 성공:`, {
            duration: `${duration}분`,
            distance: `${(distance / 1000).toFixed(1)}km`
          });

          return {
            participantId: participant.id,
            participantName: participant.name,
            duration,
            distance,
          };
        })
      );

      const newCandidate: CandidateLocation = {
        id: Date.now().toString(),
        name: locationAddress, // 검색한 장소 이름 그대로 사용
        address: locationAddress,
        coordinates: {
          lat: candidateCoords.lat,
          lng: candidateCoords.lng,
        },
        travelTimes,
      };

      console.log('[LocationManager] 후보지 저장:', newCandidate);

      onCandidatesChange([...candidates, newCandidate]);
      setLocationAddress('');
      setCoordinates(undefined);
    } catch (error) {
      console.error('후보지 추가 오류:', error);
      alert('후보지 추가 중 오류가 발생했습니다.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleRemoveCandidate = (id: string) => {
    onCandidatesChange(candidates.filter(c => c.id !== id));
    if (selectedLocationId === id) {
      onLocationSelect(null);
    }
  };

  const getTotalTime = (travelTimes: TravelTime[]) => {
    return travelTimes.reduce((sum, tt) => sum + tt.duration, 0);
  };

  const getMaxTime = (travelTimes: TravelTime[]) => {
    return Math.max(...travelTimes.map(tt => tt.duration), 0);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <MapPin className="h-5 w-5 text-primary" />
          회합 후보지
        </CardTitle>
        <CardDescription className="text-base">
          약속 장소 후보를 검색하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 출발 시간 설정 */}
        <div className="p-4 bg-muted/50 rounded-lg border">
          <label className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground">
            <Clock className="h-4 w-4 text-primary" />
            출발 시간
          </label>
          <input
            type="time"
            value={departureTime}
            onChange={(e) => onDepartureTimeChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-2">
            선택한 시간 기준으로 소요시간을 계산합니다
          </p>
        </div>

        {/* 입력 폼 */}
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
          <div>
            <label className="text-sm font-semibold mb-1.5 block text-foreground">📍 목표 지점</label>
            <AddressSearch
              onSelect={(address: string, coords: { lat: number; lng: number }) => {
                setLocationAddress(address);
                setCoordinates(coords);
              }}
              placeholder="장소를 검색하세요 (예: 스타벅스 강남역점)"
            />
          </div>

          <Button 
            onClick={handleAddCandidate} 
            className="w-full font-semibold"
            disabled={participants.length === 0 || isCalculating}
          >
            {isCalculating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>소요시간 계산 중...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                <span>후보지 추가</span>
              </>
            )}
          </Button>

          {participants.length === 0 && (
            <p className="text-xs text-destructive font-medium flex items-center gap-1.5 bg-destructive/10 p-2 rounded border border-destructive/30">
              <span>⚠️</span>
              <span>먼저 참여자를 추가해주세요</span>
            </p>
          )}
        </div>

        {/* 후보지 목록 */}
        <div>
          <h3 className="text-sm font-semibold mb-2 text-foreground flex items-center gap-2">
            🎯 후보 지점 목록 ({candidates.length}개)
          </h3>
          <div className="space-y-2">
            {candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg bg-muted/30">
                후보 장소를 추가해주세요
              </p>
            ) : (
              candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedLocationId === candidate.id
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border bg-card hover:border-primary/50 hover:shadow-sm'
                  }`}
                  onClick={() => onLocationSelect(candidate.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">
                        {candidate.name}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {candidate.address}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCandidate(candidate.id);
                      }}
                      className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* 소요시간 요약 */}
                  <div className="flex gap-3 mb-2">
                    <div className="flex items-center gap-1 text-xs font-medium text-foreground">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">총합:</span>
                      <span className="font-semibold">{getTotalTime(candidate.travelTimes)}분</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-foreground">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">최대:</span>
                      <span className="font-semibold">{getMaxTime(candidate.travelTimes)}분</span>
                    </div>
                  </div>

                  {/* 선택된 경우 상세 정보 표시 */}
                  {selectedLocationId === candidate.id && (
                    <div className="mt-3 pt-3 border-t space-y-1.5">
                      {candidate.travelTimes.map((tt) => {
                        const participant = participants.find(p => p.id === tt.participantId);
                        return (
                          <div
                            key={tt.participantId}
                            className="flex justify-between items-center text-sm bg-muted/50 px-3 py-2 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-foreground font-medium">
                                {tt.participantName}
                              </span>
                              {participant?.transportMode === 'transit' && (
                                <Badge variant="outline" className="text-xs py-0 border-primary/50 text-primary">
                                  대중교통
                                </Badge>
                              )}
                            </div>
                            <Badge variant="secondary" className="font-semibold">
                              {tt.duration}분
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

