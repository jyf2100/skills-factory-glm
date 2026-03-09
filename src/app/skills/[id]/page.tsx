'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface SkillData {
  id: number;
  name: string;
  path: string;
  path_with_namespace: string;
  description?: string;
  web_url: string;
  created_at: string;
  last_activity_at?: string;
  star_count: number;
  forks_count: number;
  content?: string;
}

export default function SkillDetailPage() {
  const params = useParams<{ id: string }>();
  const [skill, setSkill] = useState<SkillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSkill();
  }, [params.id]);

  const fetchSkill = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/skills/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setSkill(data);
      } else {
        console.error('Failed to fetch skill:', data.error);
      }
    } catch (error) {
      console.error('Error fetching skill:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInstall = () => {
    if (!skill) return;
    const installCommand = `npx skills-factory install ${skill.path_with_namespace}`;
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">加载中...</p>
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">技能不存在</p>
      </div>
    );
  }

  // Parse SKILL.md frontmatter and content
  const skillContent = skill.content || '';
  const frontmatterMatch = skillContent.match(/^---\n([\s\S]*?)\n---/);
  const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
  const content = frontmatterMatch ? skillContent.slice(frontmatterMatch[0].length) : skillContent;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg p-8 border border-gray-200">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{skill.name}</h1>
        {skill.description && (
          <p className="text-xl text-gray-600 mb-6">{skill.description}</p>
        )}

        {/* Stats */}
        <div className="flex gap-6 text-gray-600 mb-6">
          <span>⭐ {skill.star_count} stars</span>
          <span>🍴 {skill.forks_count} forks</span>
          {skill.last_activity_at && (
            <span>
              最后更新: {new Date(skill.last_activity_at).toLocaleDateString('zh-CN')}
            </span>
          )}
        </div>

        {/* Install Button */}
        <button
          onClick={handleCopyInstall}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            copied
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {copied ? '✓ 已复制安装命令' : '复制安装命令'}
        </button>

        {copied && skill.path_with_namespace && (
          <div className="mt-4 p-3 bg-gray-100 rounded font-mono text-sm">
            <code className="text-gray-800">
              npx skills-factory install {skill.path_with_namespace}
            </code>
          </div>
        )}
      </div>

      {/* SKILL.md Content */}
      {skillContent && (
        <div className="bg-white rounded-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">技能详情</h2>
          {frontmatter && (
            <pre className="bg-gray-100 p-4 rounded mb-6 overflow-x-auto">
              <code className="text-sm text-gray-800">{frontmatter}</code>
            </pre>
          )}
          <div className="prose max-w-none text-gray-700">
            <pre className="whitespace-pre-wrap">{content}</pre>
          </div>
        </div>
      )}

      {/* External Link */}
      {skill.web_url && (
        <div className="text-center">
          <a
            href={skill.web_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            查看 GitLab 仓库 →
          </a>
        </div>
      )}
    </div>
  );
}
