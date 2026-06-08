import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "ResuMe - AI 简历编辑器",
  description: "专业简历制作工具，多模板切换，一键导出PDF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
