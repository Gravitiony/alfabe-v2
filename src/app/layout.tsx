import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import Heartbeat from "@/components/Heartbeat";

export const metadata: Metadata = {
  title: "Alfabe Mail — Güvenli Okul E-postası",
  description:
    "Çocuklar için güvenli, reklamsız ve kontrollü ortamda e-posta kullanımını sağlayan eğitim odaklı mail platformu.",
};

const VALID_THEMES = ["koyu", "okyanus"];

const themeInit = `try{var t=localStorage.getItem('alfabe-theme');if(t==='koyu'||t==='okyanus'){document.cookie='alfabe-theme='+t+';path=/;max-age=31536000';document.documentElement.dataset.theme=t}}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const cookieTheme = store.get("alfabe-theme")?.value;
  const theme = cookieTheme && VALID_THEMES.includes(cookieTheme) ? cookieTheme : undefined;

  return (
    <html lang="tr" data-theme={theme} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
        <ThemeSwitcher />
        <Heartbeat />
      </body>
    </html>
  );
}
