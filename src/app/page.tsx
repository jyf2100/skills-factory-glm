export default function HomePage() {
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
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="搜索技能..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              搜索
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">技能分类</h3>
        <div className="flex flex-wrap gap-2">
          <span className="px-4 py-2 bg-white border rounded-full text-gray-700 cursor-pointer hover:bg-gray-50">
            全部
          </span>
          <span className="px-4 py-2 bg-white border rounded-full text-gray-700 cursor-pointer hover:bg-gray-50">
            前端开发
          </span>
          <span className="px-4 py-2 bg-white border rounded-full text-gray-700 cursor-pointer hover:bg-gray-50">
            后端开发
          </span>
          <span className="px-4 py-2 bg-white border rounded-full text-gray-700 cursor-pointer hover:bg-gray-50">
            数据分析
          </span>
          <span className="px-4 py-2 bg-white border rounded-full text-gray-700 cursor-pointer hover:bg-gray-50">
            文档处理
          </span>
          <span className="px-4 py-2 bg-white border rounded-full text-gray-700 cursor-pointer hover:bg-gray-50">
            UI/UX 设计
          </span>
          <span className="px-4 py-2 bg-white border rounded-full text-gray-700 cursor-pointer hover:bg-gray-50">
            自动化
          </span>
        </div>
      </section>

      {/* Featured Skills */}
      <section>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">精选技能</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Skill Cards */}
          <div className="bg-white rounded-lg p-6 border hover:shadow-lg transition-shadow">
            <h4 className="text-xl font-semibold text-gray-900 mb-2">示例技能 1</h4>
            <p className="text-gray-600 mb-4">这是一个示例技能的描述...</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">1,234 安装</span>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                安装
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border hover:shadow-lg transition-shadow">
            <h4 className="text-xl font-semibold text-gray-900 mb-2">示例技能 2</h4>
            <p className="text-gray-600 mb-4">这是一个示例技能的描述...</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">567 安装</span>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                安装
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border hover:shadow-lg transition-shadow">
            <h4 className="text-xl font-semibold text-gray-900 mb-2">示例技能 3</h4>
            <p className="text-gray-600 mb-4">这是一个示例技能的描述...</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">89 安装</span>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                安装
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
