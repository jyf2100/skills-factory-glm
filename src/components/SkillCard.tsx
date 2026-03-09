import type { GitLabProject } from '../gitlab';

interface SkillCardProps {
  skill: GitLabProject;
  onInstall?: (skill: GitLabProject) => void;
}

export function SkillCard({ skill, onInstall }: SkillCardProps) {
  return (
    <div className="glass-strong rounded-2xl p-6 border-0 transition-all duration-300 hover:scale hover:shadow-xl group relative overflow-hidden">
      {/* Background gradient decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-blue-500/0 opacity-10 rounded-full blur-sm"></div>

      <h3 className="text-2xl font-bold text-white mb-3 relative z-10">
        {skill.name}
      </h3>
      <p className="text-gray-300 mb-6 line-clamp-2 min-h-[4.5rem]">
        {skill.description || 'No description'}
      </p>

      <div className="flex justify-between items-center text-sm text-gray-300 mb-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            ⭐ {skill.star_count}
          </span>
          <span className="flex items-center gap-1">
            🍴 {skill.forks_count}
          </span>
          {skill.last_activity_at && (
            <span className="flex items-center gap-1">
              🕐 {new Date(skill.last_activity_at).toLocaleDateString('zh-CN')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">热度</span>
          <div className="w-20 h-2 bg-gray-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
              style={{ width: `${Math.min(100, (skill.star_count / 10) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <button
        onClick={() => onInstall?.(skill)}
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg font-semibold hover:scale transition-all duration-300 hover:shadow-lg active:scale group-hover:active"
      >
        安装
      </button>

      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-blue-600/0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 -z-0"></div>
    </div>
  );
}
