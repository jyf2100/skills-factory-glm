import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Skills Factory - AI Agent Skills Marketplace',
  description: 'Internal skills marketplace for AI agents',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen bg-gray-50">
          <header className="border-b bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Skills Factory</h1>
              <nav className="flex gap-6">
                <a href="/" className="text-gray-600 hover:text-gray-900">首页</a>
                <a href="/leaderboard" className="text-gray-600 hover:text-gray-900">排行榜</a>
                <a href="/admin" className="text-gray-600 hover:text-gray-900">管理</a>
              </nav>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="border-t mt-12 py-6 bg-white">
            <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
              <p>Skills Factory - 内部 AI Agent 技能市场</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
