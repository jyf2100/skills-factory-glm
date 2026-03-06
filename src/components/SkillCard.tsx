import type { GitLabProject } from '../gitlab';

interface SkillCardProps {
  skill: GitLabProject;
  onInstall?: (skill: GitLabProject) => void;
}

export function SkillCard({ skill, onInstall }: SkillCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow hover:border-blue-300">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{skill.name}</h3>
      <p className="text-gray-600 mb-4 line-clamp-2">
        {skill.description || 'No description'}
      </p>
      <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
        <span>⭐ {skill.star_count}</span>
        <span>🍴 {skill.forks_count}</span>
        <span>
          {skill.last_activity_at
            ? new Date(skill.last_activity_at).toLocaleDateString('zh-CN')
            : 'N/A'}
        </span>
      </div>
      <button
        onClick={() => onInstall?.(skill)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        安装
      </button>
    </div>
  );
}
