'use client';

import { useState } from 'react';
import { Participant, CandidateLocation } from '@/types';
import ParticipantManager from '@/components/ParticipantManager';
import LocationManager from '@/components/LocationManager';
import ResultsDisplay from '@/components/ResultsDisplay';
import ShareDialog from '@/components/ShareDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  const [meetingTitle, setMeetingTitle] = useState('새로운 모임');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [candidates, setCandidates] = useState<CandidateLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
            SeeYouThere 👋
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            모두에게 공평한 약속 장소를 찾아드립니다
          </p>
        </div>

        {/* 모임 제목 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>모임 제목</CardTitle>
            <CardDescription>약속의 이름을 입력하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              type="text"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 팀 회식"
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 참여자 관리 */}
          <ParticipantManager
            participants={participants}
            onParticipantsChange={setParticipants}
          />

          {/* 후보지 관리 */}
          <LocationManager
            participants={participants}
            candidates={candidates}
            onCandidatesChange={setCandidates}
            selectedLocationId={selectedLocationId}
            onLocationSelect={setSelectedLocationId}
          />
        </div>

        <Separator className="my-8" />

        {/* 결과 표시 및 추천 */}
        <ResultsDisplay
          candidates={candidates}
          selectedLocationId={selectedLocationId}
        />

        {/* 공유 버튼 */}
        {candidates.length > 0 && (
          <div className="mt-6 flex justify-center">
            <ShareDialog
              meetingTitle={meetingTitle}
              participants={participants}
              candidates={candidates}
            />
          </div>
        )}
      </div>
    </div>
  );
}
