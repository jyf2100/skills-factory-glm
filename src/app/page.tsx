'use client';
import { useState, useEffect } from 'react';
import { SearchBar } from '../components/SearchBar';
import { SkillList } from '../components/SkillList';
import type { GitLabProject } from '../gitlab';

const CATEGORIES = [
  { id: 'all', name: '全部', emoji: '🌟' },
  { id: 'frontend', name: '前端开发', emoji: '🎨' },
  { id: 'backend', name: '后端开发', emoji: '⚙️' },
  { id: 'data', name: '数据分析', emoji: '📊' },
  { id: 'docs', name: '文档处理', emoji: '📝' },
  { id: 'ui', name: 'UI/UX 设计', emoji: '✨' },
  { id: 'automation', name: '自动化', emoji: '🤖' },
];

export default function HomePage() {
  const [skills, setSkills] = useState<GitLabProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [hoveredSkill, setHoveredSkill] = useState<number | null>(null);

  // Fetch skills from GitLab API
  useEffect(() => {
    fetchSkills();
  }, [selectedCategory, searchKeyword]);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchKeyword) {
        params.append('search', searchKeyword);
      }
      params.append('per_page', '20');

      const url = `/api/skills?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setSkills(data.skills || []);
      } else {
        console.error('Failed to fetch skills:', data.error);
        setSkills([]);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleInstall = (skill: GitLabProject) => {
    const installCommand = `npx skills-factory install ${skill.path_with_namespace}`;
    navigator.clipboard.writeText(installCommand);
    alert(`安装命令已复制！\\n\\n${installCommand}`);
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-16 relative overflow-hidden">
        {/* Background gradient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 -left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 float-animation"></div>
          <div className="absolute top-40 -right-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 float-animation" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 float-animation" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 glass-strong rounded-3xl p-12 soft-shadow-lg border-0">
          <h1 className="text-6xl font-bold bg-gradient-text bg-clip-text text-transparent mb-4">
            AI Agent 技能市场
          </h1>
          <p className="text-xl text-gray-200 mb-8">
            为 AI Agent 提供模块化、可复用的技能包
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-8 text-gray-300">
            <div className="flex items-center gap-2">
              <span className="text-3xl">📦</span>
              <div>
                <div className="text-sm">已收录技能</div>
                <div className="text-2xl font-bold">2800+</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">⭐</span>
              <div>
                <div className="text-sm">活跃用户</div>
                <div className="text-2xl font-bold">1000+</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">📥</span>
              <div>
                <div className="text-sm">今日下载</div>
                <div className="text-2xl font-bold">5200+</div>
              </div>
            </div>
          </div>

          <SearchBar onSearch={handleSearch} />
        </div>
      </section>

      {/* Categories */}
      <section className="relative z-10">
        <div className="glass-strong rounded-2xl p-8 soft-shadow">
          <h2 className="text-3xl font-bold text-white mb-6">
            技能分类
          </h2>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-6 py-3 rounded-xl border-2 transition-all duration-300 hover:scale hover:shadow-xl ${
                  selectedCategory === cat.id
                    ? 'bg-accent-color text-white border-white'
                    : 'bg-white/20 text-gray-300 border-gray-600/50 hover:border-accent-color'
                }`}
              >
                <span className="text-2xl mr-2">{cat.emoji}</span>
                <span className="font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Skills List */}
      <section className="relative z-10">
        <h2 className="text-3xl font-bold text-white mb-6 px-4">
          {searchKeyword ? `搜索结果: "${searchKeyword}"` : '所有技能'}
        </h2>
        <SkillList
          skills={skills}
          loading={loading}
          onInstall={handleInstall}
        />
      </section>

      {/* Floating Skill Cards */}
      {hoveredSkill !== null && (
        <div className="fixed bottom-8 right-8 z-50 glass-strong rounded-2xl p-6 soft-shadow-lg max-w-sm">
          <div className="text-white text-sm">
            <div className="font-semibold mb-2">快速安装</div>
            <div className="text-xs text-gray-300 mb-4">
              {skills.find(s => s.id === hoveredSkill)?.name || 'Unknown'}
            </div>
            <div className="text-xs text-gray-400 mb-2">
              {skills.find(s => s.id === hoveredSkill)?.description || '暂无描述'}
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  if (hoveredSkill !== null) {
                    const skill = skills.find(s => s.id === hoveredSkill);
                    if (skill) handleInstall(skill);
                  }
                }}
                className="w-full bg-accent-color hover:bg-blue-600 text-white rounded-lg py-3 px-4 transition-colors"
              >
                安装到本地
              </button>
              <button
                onClick={() => setHoveredSkill(null)}
                className="w-full bg-white/20 hover:bg-white/30 text-gray-300 rounded-lg py-3 px-4 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
