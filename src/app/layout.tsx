import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CustomContactBar from "@/components/CustomContactBar";
import BackToTop from "@/components/BackToTop";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  icons: {
    icon: "/icon.png",
  },
  title: "汉理楚能 | 智能能源管理解决方案",
  description: "汉理楚能致力于为全球企业提供先进的能源管理技术与服务",
  keywords: "能源管理,智能监控,数据分析,成本优化",
  metadataBase: new URL("https://gitee.io/hanlichuneng"),
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://gitee.io/hanlichuneng",
    title: "汉理楚能 | 智能能源管理解决方案",
    description: "汉理楚能致力于为全球企业提供先进的能源管理技术与服务",
  },
  alternates: {
    languages: {
      zh: "https://gitee.io/hanlichuneng/zh/",
      en: "https://gitee.io/hanlichuneng/en/",
    },
  },
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}
        <CustomContactBar />
        <BackToTop />
      </body>
    </html>
  );
}
