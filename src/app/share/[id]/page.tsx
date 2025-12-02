'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Meeting } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Users, MapPin, Clock, Home, Trophy, TrendingUp, Car, Train, Navigation, Sparkles, User, BarChart3, Target, Timer } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function SharePage() {
  const params = useParams();
  const meetingId = params.id as string;
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMeeting() {
      try {
        const response = await fetch(`/api/meetings?id=${meetingId}`);
        const data = await response.json();

        if (data.success) {
          setMeeting(data.meeting);
        } else {
          setError(data.error || '모임을 찾을 수 없습니다.');
        }
      } catch {
        setError('모임 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    if (meetingId) {
      fetchMeeting();
    }
  }, [meetingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="max-w-md shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-red-600">😢 앗, 문제가 생겼어요</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">{error}</p>
              <Link href="/">
                <Button size="lg" className="gap-2">
                  <Home className="h-4 w-4" />
                  새 모임 만들러 가기
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // 통계 계산
  const stats = meeting.candidates.map((candidate) => {
    const times = candidate.travelTimes.map(tt => tt.duration);
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const maxTime = Math.max(...times, 0);
    const avgTime = times.length > 0 ? totalTime / times.length : 0;
    const mean = avgTime;
    const variance = times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / times.length;
    const fairnessScore = Math.sqrt(variance);

    return {
      locationId: candidate.id,
      locationName: candidate.name,
      totalTime,
      maxTime,
      avgTime,
      fairnessScore,
    };
  });

  const fairestLocation = stats.length > 0 
    ? stats.reduce((prev, curr) => curr.fairnessScore < prev.fairnessScore ? curr : prev)
    : null;

  const fastestLocation = stats.length > 0
    ? stats.reduce((prev, curr) => curr.totalTime < prev.totalTime ? curr : prev)
    : null;

  // 참여자의 교통수단 아이콘
  const getTransportIcon = (mode: 'car' | 'transit') => {
    return mode === 'car' ? <Car className="h-3 w-3" /> : <Train className="h-3 w-3" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 헤더 배경 */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent py-8 md:py-12">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">모임 결과</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {meeting.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {meeting.participants.length}명이 함께하는 모임의 최적 장소를 찾았어요!
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* 추천 장소 - 상단에 크게 */}
        {(fairestLocation || fastestLocation) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              추천 장소
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fairestLocation && (
                <Card className="border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-green-500 rounded-full">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardDescription className="text-green-600 dark:text-green-400 font-medium">
                          가장 공평한 장소
                        </CardDescription>
                        <CardTitle className="text-xl text-gray-900 dark:text-white">
                          {fairestLocation.locationName}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-300">
                        평균 {Math.round(fairestLocation.avgTime)}분
                      </Badge>
                      <Badge variant="outline" className="border-green-300 text-green-700 dark:text-green-300">
                        편차 {fairestLocation.fairnessScore.toFixed(1)}분
                      </Badge>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-3">
                      ✨ 모든 참여자가 비슷한 시간이 걸려요
                    </p>
                  </CardContent>
                </Card>
              )}

              {fastestLocation && (
                <Card className="border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-500 rounded-full">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardDescription className="text-blue-600 dark:text-blue-400 font-medium">
                          가장 빠른 장소
                        </CardDescription>
                        <CardTitle className="text-xl text-gray-900 dark:text-white">
                          {fastestLocation.locationName}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300">
                        총합 {fastestLocation.totalTime}분
                      </Badge>
                      <Badge variant="outline" className="border-blue-300 text-blue-700 dark:text-blue-300">
                        최대 {fastestLocation.maxTime}분
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-3">
                      ⚡ 전체 이동 시간이 가장 짧아요
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}

  

        <Separator />

        {/* 참여자별 상세 분석 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            참여자별 상세 분석
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meeting.participants.map((participant, pIndex) => {
              // 해당 참여자의 모든 후보지까지 소요시간 계산
              // participantId 또는 participantName으로 매칭 (ID 불일치 대비)
              const participantTimes = meeting.candidates.map(candidate => {
                const tt = candidate.travelTimes.find(t => 
                  t.participantId === participant.id || t.participantName === participant.name
                );
                return {
                  locationName: candidate.name,
                  locationId: candidate.id,
                  duration: tt?.duration || 0,
                  isEstimated: tt?.isEstimated || false,
                };
              }).sort((a, b) => a.duration - b.duration);

              const minTime = participantTimes[0];
              const maxTime = participantTimes[participantTimes.length - 1];
              const avgTime = participantTimes.reduce((sum, t) => sum + t.duration, 0) / participantTimes.length;
              
              // 가장 빠른 장소가 추천 장소인지 확인
              const isBestForFairest = minTime?.locationId === fairestLocation?.locationId;
              const isBestForFastest = minTime?.locationId === fastestLocation?.locationId;

              return (
                <motion.div
                  key={participant.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * pIndex }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow border-2 hover:border-primary/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {participant.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {participant.name}
                            {participant.transportMode === 'car' ? (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Car className="h-3 w-3" /> 자동차
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Train className="h-3 w-3" /> 대중교통
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Navigation className="h-3 w-3" />
                            {participant.startLocation}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* 요약 통계 */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-green-50 dark:bg-green-950/50 p-2.5 rounded-lg text-center">
                          <p className="text-xs text-green-600 dark:text-green-400 mb-0.5">최소</p>
                          <p className="font-bold text-green-700 dark:text-green-300">{minTime?.duration || 0}분</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/50 p-2.5 rounded-lg text-center">
                          <p className="text-xs text-blue-600 dark:text-blue-400 mb-0.5">평균</p>
                          <p className="font-bold text-blue-700 dark:text-blue-300">{Math.round(avgTime)}분</p>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-950/50 p-2.5 rounded-lg text-center">
                          <p className="text-xs text-orange-600 dark:text-orange-400 mb-0.5">최대</p>
                          <p className="font-bold text-orange-700 dark:text-orange-300">{maxTime?.duration || 0}분</p>
                        </div>
                      </div>

                      {/* 가장 가까운 장소 */}
                      {minTime && (
                        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700 dark:text-green-300">가장 가까운 곳</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isBestForFairest && (
                                <Badge className="bg-green-500 text-white text-xs">공평 추천</Badge>
                              )}
                              {isBestForFastest && (
                                <Badge className="bg-blue-500 text-white text-xs">빠름 추천</Badge>
                              )}
                            </div>
                          </div>
                          <p className="font-semibold mt-1">{minTime.locationName}</p>
                          <p className="text-sm text-green-600 dark:text-green-400">
                            <Timer className="h-3 w-3 inline mr-1" />
                            {minTime.duration}분 소요
                          </p>
                        </div>
                      )}

                      {/* 장소별 소요시간 바 차트 */}
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">장소별 소요시간</p>
                        {participantTimes.map((time, idx) => {
                          const maxDuration = Math.max(...participantTimes.map(t => t.duration));
                          const percentage = maxDuration > 0 ? (time.duration / maxDuration) * 100 : 0;
                          const isMin = idx === 0;
                          const isMax = idx === participantTimes.length - 1;
                          
                          return (
                            <div key={time.locationId} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className={`truncate flex-1 ${isMin ? 'text-green-600 font-medium' : isMax ? 'text-orange-600' : 'text-muted-foreground'}`}>
                                  {time.locationName}
                                </span>
                                <span className={`font-medium ml-2 ${isMin ? 'text-green-600' : isMax ? 'text-orange-600' : ''}`}>
                                  {time.duration}분
                                  {time.isEstimated && <span className="text-muted-foreground ml-1">*</span>}
                                </span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 0.5, delay: 0.1 * idx }}
                                  className={`h-full rounded-full ${
                                    isMin 
                                      ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                                      : isMax 
                                        ? 'bg-gradient-to-r from-orange-400 to-red-500'
                                        : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                                  }`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <Separator />

        {/* 후보 장소 목록 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                후보 장소 ({meeting.candidates.length}개)
              </CardTitle>
              <CardDescription>각 장소별 상세 소요시간</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {meeting.candidates.map((candidate, index) => {
                const stat = stats.find(s => s.locationId === candidate.id);
                const isFairest = fairestLocation?.locationId === candidate.id;
                const isFastest = fastestLocation?.locationId === candidate.id;

                return (
                  <motion.div
                    key={candidate.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      isFairest || isFastest
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-lg">{candidate.name}</h4>
                          {isFairest && (
                            <Badge className="bg-green-500 text-white text-xs gap-1">
                              <Trophy className="h-3 w-3" />
                              공평
                            </Badge>
                          )}
                          {isFastest && (
                            <Badge className="bg-blue-500 text-white text-xs gap-1">
                              <TrendingUp className="h-3 w-3" />
                              빠름
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {candidate.address}
                        </p>
                      </div>
                    </div>

                    {/* 통계 */}
                    {stat && (
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        <div className="bg-muted/50 p-3 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground mb-1">총합</p>
                          <p className="font-bold text-lg">{stat.totalTime}<span className="text-xs font-normal">분</span></p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground mb-1">평균</p>
                          <p className="font-bold text-lg">{Math.round(stat.avgTime)}<span className="text-xs font-normal">분</span></p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground mb-1">최대</p>
                          <p className="font-bold text-lg">{stat.maxTime}<span className="text-xs font-normal">분</span></p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground mb-1">편차</p>
                          <p className="font-bold text-lg">{stat.fairnessScore.toFixed(1)}</p>
                        </div>
                      </div>
                    )}

                    {/* 각 참여자별 시간 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {candidate.travelTimes.map((tt) => {
                        const participant = meeting.participants.find(
                          p => p.id === tt.participantId || p.name === tt.participantName
                        );
                        return (
                          <div
                            key={tt.participantId || tt.participantName}
                            className="flex justify-between items-center bg-muted/30 p-2.5 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                                {tt.participantName.charAt(0)}
                              </div>
                              <span className="text-sm font-medium">{tt.participantName}</span>
                              {participant && (
                                <span className="text-muted-foreground">
                                  {getTransportIcon(participant.transportMode)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="font-semibold">{tt.duration}분</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* 하단 CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-8"
        >
          <p className="text-muted-foreground mb-4">
            나도 모임 장소를 찾고 싶다면?
          </p>
          <Link href="/">
            <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
              <Sparkles className="h-4 w-4" />
              새로운 모임 만들기
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
