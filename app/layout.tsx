import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dns-test.vercel.app";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "DNS Test",
  title: {
    default: "DNS Test - Find the Fastest DNS Server for Your Network",
    template: "%s | DNS Test",
  },
  description:
    "Run a real DNS speed test, compare public DNS servers, find the fastest DNS provider, and copy IPv4 DNS addresses for your router or device.",
  keywords: [
    "DNS test",
    "DNS speed test",
    "fastest DNS server",
    "best DNS provider",
    "public DNS benchmark",
    "DNS resolver comparison",
    "copy DNS IPv4",
    "Cloudflare DNS",
    "Google DNS",
    "AdGuard DNS",
  ],
  authors: [{ name: "DNS Test" }],
  creator: "DNS Test",
  publisher: "DNS Test",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "DNS Test",
    title: "DNS Test - Find the Fastest DNS Server for Your Network",
    description:
      "Compare public DNS resolvers with real DNS-over-HTTPS checks and copy the best IPv4 DNS addresses.",
  },
  twitter: {
    card: "summary",
    title: "DNS Test - Find the Fastest DNS Server",
    description: "Benchmark public DNS servers and copy the best IPv4 DNS addresses for your network.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (_) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md support-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-primary">⚡ DNS Test</span>
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 ml-2 font-mono">
                Open Source
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="size-9 rounded-lg" asChild>
                <a
                  href="https://github.com/owaiss0/Dns-checker"
                  target="_blank"
                  rel="noreferrer"
                  title="View Source on GitHub"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4"
                  >
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                  <span className="sr-only">GitHub</span>
                </a>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
