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
    setTimeout(() => setCopiedSkill(null), 2000);
    onInstall?.(skill);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">加载中...</p>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">没有找到技能</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {skills.map((skill) => (
        <div key={skill.id}>
          <SkillCard skill={skill} onInstall={handleInstall} />
          {copiedSkill === skill.path_with_namespace && (
            <div className="mt-2 text-sm text-green-600 text-center">
              ✓ 安装命令已复制
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
