// 인기 장소 데이터

export interface PopularLocation {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export const popularLocations: PopularLocation[] = [
  {
    id: 'gangnam',
    name: '강남역',
    address: '대한민국 서울특별시',
    coordinates: { lat: 37.500074999999995, lng: 127.026296 },
  },
  {
    id: 'sillim',
    name: '신림역',
    address: '서울특별시 관악구 신림로 340',
    coordinates: { lat: 37.485219, lng: 126.929733 },
  },
  {
    id: 'seoul-station',
    name: '서울역',
    address: '서울특별시 용산구 한강대로 405',
    coordinates: { lat: 37.554648, lng: 126.970880 },
  },
  {
    id: 'hyehwa',
    name: '혜화역',
    address: '서울특별시 종로구 대학로12길 21',
    coordinates: { lat: 37.582152, lng: 127.001854 },
  },
  {
    id: 'chungmuro',
    name: '충무로역',
    address: '대한민국 서울특별시 신촌동',
    coordinates: { lat: 37.561243, lng: 126.99428
 },
  },
  {
    id: 'sinchon',
    name: '신촌역',
    address: '대한민국 서울특별시 신촌동',
      coordinates: { lat: 37.559771, lng: 126.94236699999999 },
  },
  {
    id: 'euljiro',
    name: '을지로입구역',
    address: '대한민국 서울특별시 중구 을지로동 42',
    coordinates: { lat: 37.566014, lng: 126.982618 },
  },
  {
    id: 'sadang',
    name: '사당역',
    address: '대한민국 서울특별시',
    coordinates: { lat: 37.47653, lng: 126.981685 },
  },
  {
    id: 'konkuk',
    name: '건대입구역',
    address: '서울특별시 광진구 능동로 209',
    coordinates: { lat: 37.540693, lng: 127.07023 },
  },
  {
    id: 'hongdae',
    name: '홍대입구역',
    address: '서울특별시 마포구 양화로 160',
    coordinates: { lat: 37.557527, lng: 126.925384 },
  },
  {
    id: 'seolleung',
    name: '선릉역',
    address: '서울특별시 강남구 테헤란로 지하 427',
    coordinates: { lat: 37.504557, lng: 127.049500 },
  },
  {
    id: 'wangsimni',
    name: '왕십리역',
    address: '서울특별시 성동구 왕십리로 지하 1',
    coordinates: { lat: 37.561567, lng: 127.037192 },
  },
  {
    id: 'yongsan',
    name: '용산역',
    address: '서울특별시 용산구 한강대로23길 55',
    coordinates: { lat: 37.529849, lng: 126.964561 },
  },
  {
    id: 'yeongdeungpo',
    name: '영등포역',
    address: '서울특별시 영등포구 영중로 1',
    coordinates: { lat: 37.515570, lng: 126.907456 },
  },
  {
    id: 'garosu',
    name: '가로수길',
    address: '서울특별시 강남구 신사동 가로수길',
    coordinates: { lat: 37.519885, lng: 127.022712 },
  },
  {
    id: 'jongno',
    name: '종로3가역',
    address: '서울특별시 종로구 종로 지하 143',
    coordinates: { lat: 37.571607, lng: 126.991806 },
  },
  {
    id: 'noryangjin',
    name: '노량진역',
    address: '서울특별시 동작구 노량진로 151 ',
    coordinates: { lat: 37.514219, lng: 126.942454 },
  },
  {
    id: 'munrae',
    name: '문래역',
    address: '서울특별시 영등포구 문래동3가 55-1',
    coordinates: { lat: 37.517933, lng: 126.89476 },
  }
];
