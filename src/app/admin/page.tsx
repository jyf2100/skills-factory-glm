'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'sync' | 'list'>('sync');
  const [syncStatus, setSyncStatus] = useState<{
    status: 'idle' | 'syncing' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  const handleSync = async () => {
    setSyncStatus({ status: 'syncing', message: '正在同步...' });

    try {
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setSyncStatus({
          status: 'success',
          message: `同步完成：${data.synced || 0} 个技能`,
        });
      } else {
        setSyncStatus({
          status: 'error',
          message: `同步失败：${data.error || '未知错误'}`,
        });
      }
    } catch (error) {
      setSyncStatus({
        status: 'error',
        message: `同步失败：${error instanceof Error ? error.message : '未知错误'}`,
      });
    }

    // Reset status after 5 seconds
    setTimeout(() => {
      setSyncStatus({ status: 'idle', message: '' });
    }, 5000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">管理面板</h1>
        <p className="text-xl text-gray-600">
          GitHub → GitLab 技能同步与管理
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setActiveTab('sync')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'sync'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
          }`}
        >
          GitHub → GitLab 同步
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'list'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
          }`}
        >
          技能列表
        </button>
      </div>

      {/* Sync Tab */}
      {activeTab === 'sync' && (
        <div className="bg-white rounded-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            GitHub → GitLab 同步
          </h2>
          <p className="text-gray-600 mb-6">
            将 GitHub 仓库中的技能同步到本地 GitLab 仓库
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-2">说明</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>从配置的 GitHub 仓库读取技能</li>
                <li>推送到配置的 GitLab 仓库</li>
                <li>保留技能的哈希和签名信息</li>
              </ul>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-gray-900 mb-2">前提条件</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>已配置 GITHUB_URL 和 GITHUB_TOKEN</li>
                <li>已配置 GITEA_URL 和 GITEA_TOKEN（用作本地 GitLab）</li>
              </ul>
            </div>

            <button
              onClick={handleSync}
              disabled={syncStatus.status === 'syncing'}
              className={`w-full px-6 py-4 rounded-lg font-semibold transition-colors ${
                syncStatus.status === 'syncing'
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {syncStatus.status === 'syncing' ? '同步中...' : '开始同步'}
            </button>

            {syncStatus.message && (
              <div
                className={`p-4 rounded-lg ${
                  syncStatus.status === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {syncStatus.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* List Tab */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            GitLab 技能列表
          </h2>
          <p className="text-gray-600 mb-6">
            当前 GitLab 仓库中的所有技能
          </p>

          <div className="text-center py-12 text-gray-600">
            <p>加载中...</p>
          </div>
        </div>
      )}
    </div>
  );
}
