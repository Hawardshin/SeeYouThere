import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SeeYouThere - 약속 장소 추천 서비스",
  description: "모두가 만족하는 약속 장소를 찾아드립니다. 참여자들의 출발지를 입력하면 최적의 만남 장소를 추천해드립니다.",
  keywords: ["약속 장소", "만남 장소", "중간 지점", "장소 추천", "약속", "모임 장소", "SeeYouThere"],
  authors: [{ name: "SeeYouThere Team" }],
  creator: "SeeYouThere",
  publisher: "SeeYouThere",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://see-you-there.vercel.app'),
  openGraph: {
    title: "SeeYouThere - 약속 장소 추천 서비스",
    description: "모두가 만족하는 약속 장소를 찾아드립니다. 참여자들의 출발지를 입력하면 최적의 만남 장소를 추천해드립니다.",
    url: 'https://see-you-there.vercel.app',
    siteName: 'SeeYouThere',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SeeYouThere - 약속 장소 추천 서비스',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "SeeYouThere - 약속 장소 추천 서비스",
    description: "모두가 만족하는 약속 장소를 찾아드립니다.",
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code', // Google Search Console에서 받은 코드로 교체
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <GoogleAnalytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme');
                if (!theme) {
                  localStorage.setItem('theme', 'dark');
                  document.documentElement.classList.add('dark');
                } else if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
