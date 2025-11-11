import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Niche Signal Scout',
  description:
    'An agentic research assistant that scouts Reddit, Hacker News, and Dev.to for niche social discussions on demand.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
