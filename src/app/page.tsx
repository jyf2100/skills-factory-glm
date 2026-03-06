'use client';

import { useState, useEffect } from 'react';
import { SearchBar } from '../components/SearchBar';
import { SkillList } from '../components/SkillList';
import type { GitLabProject } from '../gitlab';

const CATEGORIES = ['全部', '前端开发', '后端开发', '数据分析', '文档处理', 'UI/UX 设计', '自动化'];

export default function HomePage() {
  const [skills, setSkills] = useState<GitLabProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchKeyword, setSearchKeyword] = useState('');

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
    console.log('Install skill:', skill.path_with_namespace);
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h2 className="text-5xl font-bold text-gray-900 mb-4">
          AI Agent 技能市场
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          为 AI Agent 提供模块化、可复用的技能包
        </p>
        <SearchBar onSearch={handleSearch} />
      </section>

      {/* Categories */}
      <section>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">技能分类</h3>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-4 py-2 border rounded-full cursor-pointer transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Skills List */}
      <section>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          {searchKeyword ? `搜索结果: "${searchKeyword}"` : '所有技能'}
        </h3>
        <SkillList skills={skills} loading={loading} onInstall={handleInstall} />
      </section>
    </div>
  );
}
