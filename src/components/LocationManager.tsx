'use client';

import { useState } from 'react';
import { Participant, CandidateLocation, TravelTime } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Clock, Trash2 } from 'lucide-react';

interface LocationManagerProps {
  participants: Participant[];
  candidates: CandidateLocation[];
  onCandidatesChange: (candidates: CandidateLocation[]) => void;
  selectedLocationId: string | null;
  onLocationSelect: (id: string | null) => void;
}

export default function LocationManager({
  participants,
  candidates,
  onCandidatesChange,
  selectedLocationId,
  onLocationSelect,
}: LocationManagerProps) {
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');

  const handleAddCandidate = () => {
    if (!locationName.trim() || !locationAddress.trim()) {
      alert('장소명과 주소를 모두 입력해주세요.');
      return;
    }

    if (participants.length === 0) {
      alert('참여자를 먼저 추가해주세요.');
      return;
    }

    // 더미 데이터: 각 참여자별 소요시간 생성 (실제로는 지도 API 사용)
    const travelTimes: TravelTime[] = participants.map((participant) => ({
      participantId: participant.id,
      participantName: participant.name,
      duration: Math.floor(Math.random() * 40) + 10, // 10-50분 랜덤
      distance: Math.floor(Math.random() * 20000) + 1000, // 1-21km 랜덤
    }));

    const newCandidate: CandidateLocation = {
      id: Date.now().toString(),
      name: locationName.trim(),
      address: locationAddress.trim(),
      travelTimes,
    };

    onCandidatesChange([...candidates, newCandidate]);
    setLocationName('');
    setLocationAddress('');
  };

  const handleRemoveCandidate = (id: string) => {
    onCandidatesChange(candidates.filter(c => c.id !== id));
    if (selectedLocationId === id) {
      onLocationSelect(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCandidate();
    }
  };

  const getTotalTime = (travelTimes: TravelTime[]) => {
    return travelTimes.reduce((sum, tt) => sum + tt.duration, 0);
  };

  const getMaxTime = (travelTimes: TravelTime[]) => {
    return Math.max(...travelTimes.map(tt => tt.duration), 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          후보 장소 관리
        </CardTitle>
        <CardDescription>
          약속 후보 장소를 추가하고 소요시간을 확인하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 입력 폼 */}
        <div className="space-y-3">
          <Input
            type="text"
            placeholder="장소명 (예: 스타벅스 강남점)"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={participants.length === 0}
          />
          <Input
            type="text"
            placeholder="주소 (예: 서울시 강남구 테헤란로)"
            value={locationAddress}
            onChange={(e) => setLocationAddress(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={participants.length === 0}
          />
          <Button 
            onClick={handleAddCandidate} 
            className="w-full"
            disabled={participants.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            후보지 추가
          </Button>
          {participants.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              ℹ️ 참여자를 먼저 추가해주세요
            </p>
          )}
        </div>

        {/* 후보지 목록 */}
        <div className="space-y-2">
          {candidates.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              후보 장소를 추가해주세요
            </p>
          ) : (
            candidates.map((candidate) => (
              <div
                key={candidate.id}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedLocationId === candidate.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
                onClick={() => onLocationSelect(candidate.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {candidate.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* 소요시간 요약 */}
                <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>총합: {getTotalTime(candidate.travelTimes)}분</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>최대: {getMaxTime(candidate.travelTimes)}분</span>
                  </div>
                </div>

                {/* 선택된 경우 상세 정보 표시 */}
                {selectedLocationId === candidate.id && (
                  <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800 space-y-1">
                    {candidate.travelTimes.map((tt) => (
                      <div
                        key={tt.participantId}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-gray-700 dark:text-gray-300">
                          {tt.participantName}
                        </span>
                        <Badge variant="outline">
                          {tt.duration}분
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {candidates.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              총 <span className="font-semibold text-blue-600">{candidates.length}개</span>의 후보지
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
