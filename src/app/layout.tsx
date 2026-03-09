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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 glass glass-strong border-0 border-b-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-text bg-clip-text text-transparent">
              Skills Factory
            </h1>
            <span className="text-xs text-gray-400 ml-2">AI Agent Skills Marketplace</span>
          </div>
          <nav className="flex gap-6">
            <a
              href="/"
              className="text-gray-300 hover:text-white transition-colors duration-200 hover:scale"
            >
              首页
            </a>
            <a
              href="/leaderboard"
              className="text-gray-300 hover:text-white transition-colors duration-200 hover:scale"
            >
              排行榜
            </a>
            <a
              href="/admin"
              className="text-gray-300 hover:text-white transition-colors duration-200 hover:scale"
            >
              管理
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700/50 glass border-0 border-t-0">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <p className="text-gray-400 text-sm">
            Skills Factory - 内部 AI Agent 技能市场
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Built with Next.js 15 & Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
}
