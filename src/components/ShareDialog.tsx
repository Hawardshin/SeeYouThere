'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Share2, Users, Eye, Loader2, Link, MessageCircle } from 'lucide-react';
import { Participant, CandidateLocation } from '@/types';

type ShareMode = 'select' | 'editable' | 'readonly';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomCode: string;
  meetingTitle: string;
  participants: Participant[];
  candidates: CandidateLocation[];
}

export default function ShareDialog({
  open,
  onOpenChange,
  roomCode,
  meetingTitle,
  participants,
  candidates,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [shareMode, setShareMode] = useState<ShareMode>('select');
  const [readonlyShareId, setReadonlyShareId] = useState<string | null>(null);
  const [isCreatingShare, setIsCreatingShare] = useState(false);

  // 편집 가능 공유 URL (기존 방식)
  const getEditableShareUrl = () => {
    if (typeof window === 'undefined') return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}?room=${roomCode}&step=3`;
  };

  // 읽기 전용 공유 URL
  const getReadonlyShareUrl = () => {
    if (typeof window === 'undefined' || !readonlyShareId) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/share/${readonlyShareId}`;
  };

  // 읽기 전용 공유 생성
  const createReadonlyShare = async () => {
    setIsCreatingShare(true);
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: meetingTitle,
          participants,
          candidates,
        }),
      });

      const data = await response.json();
      if (data.success && data.meetingId) {
        setReadonlyShareId(data.meetingId);
        setShareMode('readonly');
      } else {
        console.error('공유 생성 실패:', data.error);
      }
    } catch (error) {
      console.error('공유 생성 오류:', error);
    } finally {
      setIsCreatingShare(false);
    }
  };

  // 클립보드에 복사
  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('복사 실패:', error);
    }
  };

  // 카카오톡 공유
  const handleKakaoShare = (url: string, isReadonly: boolean) => {
    const modeText = isReadonly ? '결과를 확인해보세요!' : '함께 모임 장소를 정해요!';
    const text = `📍 ${meetingTitle}\n\n${modeText}`;
    
    if (navigator.share) {
      navigator.share({
        title: meetingTitle,
        text: text,
        url: url,
      }).catch(() => {});
    } else {
      const fullText = `${text}\n${url}`;
      navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 네이티브 공유
  const handleNativeShare = async (url: string, isReadonly: boolean) => {
    const modeText = isReadonly ? '결과를 확인해보세요!' : '함께 모임 장소를 정해요!';
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: meetingTitle,
          text: `📍 ${meetingTitle} - ${modeText}`,
          url: url,
        });
      } catch (error) {
        // 사용자가 취소한 경우
      }
    } else {
      handleCopy(url);
    }
  };

  // 모드 선택 화면으로 돌아가기
  const goBack = () => {
    setShareMode('select');
    setReadonlyShareId(null);
  };

  // 다이얼로그 닫을 때 상태 초기화
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setShareMode('select');
      setReadonlyShareId(null);
    }
    onOpenChange(open);
  };

  // 공유 링크 UI 컴포넌트
  const ShareLinkUI = ({ url, isReadonly }: { url: string; isReadonly: boolean }) => (
    <div className="space-y-4">
      {/* 공유 링크 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">공유 링크</label>
        <div className="flex gap-2">
          <Input
            readOnly
            value={url}
            className="font-mono text-sm"
          />
          <Button
            onClick={() => handleCopy(url)}
            variant="outline"
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* 공유 버튼들 */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => handleCopy(url)}
          variant="outline"
          className="w-full"
        >
          <Link className="h-4 w-4 mr-2" />
          {copied ? '복사됨!' : '링크 복사'}
        </Button>
        
        <Button
          onClick={() => handleKakaoShare(url, isReadonly)}
          className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E]"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          카카오톡
        </Button>
      </div>

      {/* 네이티브 공유 (모바일) */}
      {'share' in navigator && (
        <Button
          onClick={() => handleNativeShare(url, isReadonly)}
          className="w-full"
        >
          <Share2 className="h-4 w-4 mr-2" />
          다른 앱으로 공유
        </Button>
      )}

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={goBack}>
          ← 다른 방식으로 공유
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            결과 공유하기
          </DialogTitle>
          <DialogDescription>
            {shareMode === 'select' && '공유 방식을 선택하세요'}
            {shareMode === 'editable' && '링크를 받은 사람도 함께 편집할 수 있어요'}
            {shareMode === 'readonly' && '결과만 보여주는 읽기 전용 페이지에요'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 모드 선택 화면 */}
          {shareMode === 'select' && (
            <>
              {/* 방 정보 */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">모임 이름</div>
                <div className="font-semibold text-lg">{meetingTitle}</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {participants.length}명의 참여자 · {candidates.length}개의 후보 장소
                </div>
              </div>

              {/* 공유 방식 선택 */}
              <div className="space-y-3">
                <Button
                  onClick={() => setShareMode('editable')}
                  variant="outline"
                  className="w-full h-auto p-4 flex flex-col items-start gap-2"
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <Users className="h-5 w-5 text-blue-500" />
                    함께 편집하기
                  </div>
                  <p className="text-sm text-muted-foreground text-left">
                    링크를 받은 사람이 참여자나 후보 장소를 수정할 수 있어요
                  </p>
                </Button>

                <Button
                  onClick={createReadonlyShare}
                  variant="outline"
                  className="w-full h-auto p-4 flex flex-col items-start gap-2"
                  disabled={isCreatingShare}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {isCreatingShare ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Eye className="h-5 w-5 text-green-500" />
                    )}
                    읽기 전용으로 공유
                  </div>
                  <p className="text-sm text-muted-foreground text-left">
                    결과만 예쁘게 보여주는 페이지를 공유해요
                  </p>
                </Button>
              </div>
            </>
          )}

          {/* 편집 가능 공유 */}
          {shareMode === 'editable' && (
            <>
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium mb-1">
                  <Users className="h-4 w-4" />
                  함께 편집하기
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  방 코드: <span className="font-mono font-bold">{roomCode}</span>
                </p>
              </div>
              <ShareLinkUI url={getEditableShareUrl()} isReadonly={false} />
              <p className="text-xs text-muted-foreground text-center">
                💡 이 링크로 접속하면 바로 방에 참여해서 함께 편집할 수 있어요
              </p>
            </>
          )}

          {/* 읽기 전용 공유 */}
          {shareMode === 'readonly' && readonlyShareId && (
            <>
              <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-medium mb-1">
                  <Eye className="h-4 w-4" />
                  읽기 전용 페이지
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">
                  결과만 볼 수 있는 예쁜 페이지가 생성되었어요
                </p>
              </div>
              <ShareLinkUI url={getReadonlyShareUrl()} isReadonly={true} />
              <p className="text-xs text-muted-foreground text-center">
                � 이 링크는 결과만 볼 수 있고 수정할 수 없어요
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
