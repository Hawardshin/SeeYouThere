'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';

interface MapViewProps {
  locations?: Array<{
    lat: number;
    lng: number;
    name: string;
    address?: string;
    isSelected?: boolean;
  }>;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

export default function MapView({ 
  locations = [], 
  center = { lat: 37.5665, lng: 126.9780 }, // 서울 시청
  zoom = 11,
  className = ''
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Google Maps 스크립트 로드
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 이미 로드되었는지 확인
    if ((window as any).google?.maps) {
      setIsLoaded(true);
      return;
    }

    // 이미 스크립트가 추가되었는지 확인
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // 스크립트는 있지만 아직 로드 안됨
      const checkGoogle = setInterval(() => {
        if ((window as any).google?.maps) {
          setIsLoaded(true);
          clearInterval(checkGoogle);
        }
      }, 100);
      return () => clearInterval(checkGoogle);
    }

    // Google Maps API 키 가져오기
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (!isLoaded || !mapRef.current || googleMapRef.current) return;

    const google = (window as any).google;
    googleMapRef.current = new google.maps.Map(mapRef.current, {
      center,
      zoom,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: true,
    });
  }, [isLoaded, center, zoom]);

  // 마커 업데이트
  useEffect(() => {
    if (!googleMapRef.current || !isLoaded) return;

    const google = (window as any).google;

    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    if (locations.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    // 새 마커 생성
    locations.forEach((location, index) => {
      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: googleMapRef.current,
        title: location.name,
        label: location.isSelected ? {
          text: '★',
          color: '#ffffff',
          fontSize: '18px',
          fontWeight: 'bold'
        } : {
          text: String(index + 1),
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 'bold'
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: location.isSelected ? 12 : 10,
          fillColor: location.isSelected ? '#9333ea' : '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        animation: location.isSelected ? google.maps.Animation.BOUNCE : undefined,
      });

      // 정보창
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 4px 0; font-weight: bold; font-size: 14px; color: #1f2937;">
              ${location.name}
            </h3>
            ${location.address ? `
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                ${location.address}
              </p>
            ` : ''}
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMapRef.current, marker);
      });

      markersRef.current.push(marker);
      bounds.extend({ lat: location.lat, lng: location.lng });
    });

    // 모든 마커가 보이도록 지도 조정
    if (locations.length === 1) {
      googleMapRef.current.setCenter({ lat: locations[0].lat, lng: locations[0].lng });
      googleMapRef.current.setZoom(15);
    } else if (locations.length > 1) {
      googleMapRef.current.fitBounds(bounds);
      // 너무 확대되지 않도록 제한
      google.maps.event.addListenerOnce(googleMapRef.current, 'bounds_changed', () => {
        const currentZoom = googleMapRef.current?.getZoom();
        if (currentZoom && currentZoom > 16) {
          googleMapRef.current?.setZoom(16);
        }
      });
    }

    // 선택된 위치가 있으면 1초 후 애니메이션 중지
    const selectedMarker = markersRef.current.find((_: any, idx: number) => locations[idx]?.isSelected);
    if (selectedMarker) {
      setTimeout(() => {
        selectedMarker.setAnimation(null);
      }, 2000);
    }
  }, [locations, isLoaded]);

  if (!isLoaded) {
    return (
      <Card className={`${className} flex items-center justify-center bg-muted`}>
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">지도 로딩 중...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`${className} overflow-hidden`}>
      <div 
        ref={mapRef} 
        className="w-full h-full min-h-[400px]"
        style={{ minHeight: '400px' }}
      />
    </Card>
  );
}
