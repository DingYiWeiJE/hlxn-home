import type { Metadata } from "next";
import "./globals.css";
import BackToTop from "@/components/BackToTop";

export const metadata: Metadata = {
  icons: {
    icon: "/icon.png",
  },
  title: "汉理新能 | 专注新能源动力系统解决方案",
  description: "汉理新能致力于为全球企业提供先进的能源管理技术与服务",
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
    title: "汉理新能 | 专注新能源动力系统解决方案",
    description: "汉理新能致力于为全球企业提供先进的能源管理技术与服务",
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
    <html className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}
        
        <BackToTop />
      </body>
    </html>
  );
}
