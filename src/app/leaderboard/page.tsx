'use client';

import { useState, useEffect } from 'react';

type LeaderboardType = 'all-time' | 'trending' | 'hot';

interface RankedSkill {
  rank: number;
  id: number;
  name: string;
  path: string;
  path_with_namespace: string;
  description?: string;
  web_url: string;
  star_count: number;
  forks_count: number;
  last_activity_at?: string;
}

const TABS = [
  { id: 'all-time' as const, label: '历史总榜' },
  { id: 'trending' as const, label: '趋势榜' },
  { id: 'hot' as const, label: '热门榜' },
];

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('all-time');
  const [skills, setSkills] = useState<RankedSkill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leaderboard?type=${activeTab}&per_page=50`);
      const data = await response.json();

      if (response.ok) {
        setSkills(data.skills || []);
      } else {
        console.error('Failed to fetch leaderboard:', data.error);
        setSkills([]);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800';
    if (rank === 2) return 'bg-gray-200 text-gray-800';
    if (rank === 3) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-600';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank.toString();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">技能排行榜</h1>
        <p className="text-xl text-gray-600">
          发现最受欢迎和最新的 AI Agent 技能
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      ) : skills.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">暂无数据</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto bg-white rounded-lg border border-gray-200">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 font-semibold text-gray-700">
            <div className="col-span-1">排名</div>
            <div className="col-span-2">技能名称</div>
            <div className="col-span-3">描述</div>
            <div className="col-span-2 text-center">Stars</div>
            <div className="col-span-2 text-center">Forks</div>
            <div className="col-span-2 text-center">最后更新</div>
          </div>

          {/* Skills */}
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              {/* Rank */}
              <div className="col-span-1 flex items-center justify-center">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center ${getRankBadgeColor(skill.rank)}`}>
                  {getRankIcon(skill.rank)}
                </span>
              </div>

              {/* Name */}
              <div className="col-span-2 flex items-center">
                <a
                  href={`/skills/${skill.path_with_namespace}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {skill.name}
                </a>
              </div>

              {/* Description */}
              <div className="col-span-3 flex items-center text-gray-600 text-sm truncate">
                {skill.description || '-'}
              </div>

              {/* Stars */}
              <div className="col-span-2 flex items-center justify-center text-gray-700">
                ⭐ {skill.star_count}
              </div>

              {/* Forks */}
              <div className="col-span-2 flex items-center justify-center text-gray-700">
                🍴 {skill.forks_count}
              </div>

              {/* Last Updated */}
              <div className="col-span-2 flex items-center justify-center text-gray-600 text-sm">
                {skill.last_activity_at
                  ? new Date(skill.last_activity_at).toLocaleDateString('zh-CN')
                  : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
