'use client';

import { useState } from 'react';
import { Participant } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users } from 'lucide-react';

interface ParticipantManagerProps {
  participants: Participant[];
  onParticipantsChange: (participants: Participant[]) => void;
}

export default function ParticipantManager({ participants, onParticipantsChange }: ParticipantManagerProps) {
  const [name, setName] = useState('');
  const [startLocation, setStartLocation] = useState('');

  const handleAddParticipant = () => {
    if (!name.trim() || !startLocation.trim()) {
      alert('이름과 출발지를 모두 입력해주세요.');
      return;
    }

    const newParticipant: Participant = {
      id: Date.now().toString(),
      name: name.trim(),
      startLocation: startLocation.trim(),
    };

    onParticipantsChange([...participants, newParticipant]);
    setName('');
    setStartLocation('');
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          참여자 관리
        </CardTitle>
        <CardDescription>
          약속에 참여하는 사람들의 이름과 출발지를 입력하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 입력 폼 */}
        <div className="space-y-3">
          <Input
            type="text"
            placeholder="이름 (예: 홍길동)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Input
            type="text"
            placeholder="출발지 (예: 강남역)"
            value={startLocation}
            onChange={(e) => setStartLocation(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button 
            onClick={handleAddParticipant} 
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            참여자 추가
          </Button>
        </div>

        {/* 참여자 목록 */}
        <div className="space-y-2">
          {participants.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              참여자를 추가해주세요
            </p>
          ) : (
            participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{participant.name}</Badge>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {participant.startLocation}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveParticipant(participant.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {participants.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              총 <span className="font-semibold text-blue-600">{participants.length}명</span>의 참여자
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
