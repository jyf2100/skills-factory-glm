'use client';
import { useState } from 'react';
import { SkillCard } from './SkillCard';
import type { GitLabProject } from '../gitlab';

interface SkillListProps {
  skills: GitLabProject[];
  loading?: boolean;
  onInstall?: (skill: GitLabProject) => void;
}

export function SkillList({ skills, loading, onInstall }: SkillListProps) {
  const [copiedSkill, setCopiedSkill] = useState<string | null>(null);

  const handleInstall = (skill: GitLabProject) => {
    const installCommand = `npx skills-factory install ${skill.path_with_namespace}`;
    navigator.clipboard.writeText(installCommand);
    setCopiedSkill(skill.path_with_namespace);
    onInstall?.(skill);

    // Show toast notification
    setTimeout(() => setCopiedSkill(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        {/* Loading cards */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-strong rounded-2xl p-6 border-0 soft-shadow-lg shimmer h-48">
            <div className="h-6 bg-gray-600/50 rounded mb-4 w-3/4"></div>
            <div className="h-4 bg-gray-700/50 rounded mb-2 w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="glass-strong rounded-2xl p-12 text-center border-0 soft-shadow-lg">
        <div className="text-6xl mb-4">📦</div>
        <div className="text-xl text-gray-300 mb-2">暂无技能数据</div>
        <p className="text-sm text-gray-400">
          请检查 GitLab 配置或确保技能项目存在
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {skills.map((skill) => (
        <div key={skill.id}>
          <SkillCard skill={skill} onInstall={handleInstall} />
          {copiedSkill === skill.path_with_namespace && (
            <div className="mt-2 text-center text-green-400 text-sm font-medium animate-bounce">
              ✓ 安装命令已复制
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
