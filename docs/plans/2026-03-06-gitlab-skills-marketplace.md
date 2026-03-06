# GitLab 技能市场（仿造 skills.sh）实现计划（修正版）

## 目标

创建一个类似 skills.sh 的 Web 界面，用于管理和展示存储在本地 GitLab 上的技能。

## 数据流

```
GitHub 技能仓库 → 同步到 → 本地 GitLab → Web 界面展示/管理
                     (已实现)
```

## 技术方案

**方案**：Next.js 全栈框架 + GitLab API

**理由**：
- Next.js 适合 SSR 和动态内容
- React 生态成熟，组件化开发效率高
- 可以与现有 API 无缝集成

## 任务拆解

### Task 1: 环境配置与基础架构 ✅ 已完成

**Files**:
- `package.json` (修改)
- `next.config.mjs` (新建)
- `tsconfig.json` (修改)
- `.env.example` (修改)
- `postcss.config.cjs` (新建)
- `tailwind.config.ts` (新建)

**Steps**:
1. 安装 Next.js、React、Tailwind CSS 等依赖
2. 配置 TypeScript
3. 添加环境变量（GitLab URL、Token）
4. 配置 Tailwind CSS

**Result**: ✅ Next.js 项目可启动，环境变量可读取，Tailwind CSS 工作

---

### Task 2: GitLab API 客户端 ✅ 已完成

**Files**:
- `src/gitlab.ts` (新建)
- `src/gitlab.test.ts` (新建)
- `tsconfig.cli.json` (新建)

**Steps**:
1. 创建 GitLabClient 类
2. 实现：listProjects、getProjectFiles、getSkillContent
3. 添加认证（Personal Access Token）
4. 编写测试

**Result**: ✅ 可从本地 GitLab 读取项目和文件，所有测试通过 (7/7)

---

### Task 3: API 端点（GitLab 数据）✅ 已完成

**Files**:
- `src/app/api/skills/route.ts` (新建)
- `src/app/api/skills/[id]/route.ts` (新建)
- `src/app/api/search/route.ts` (新建)
- `src/app/api/leaderboard/route.ts` (新建)
- `src/api/gitlab.test.ts` (新建)

**Steps**:
1. 技能列表 API（从 GitLab 读取）
2. 技能详情 API（读取 SKILL.md）
3. 搜索 API（关键词搜索）
4. 排行榜 API（热门、趋势）

**Result**: ✅ API 可返回 GitLab 中的技能数据，所有测试通过 (9/9)

---

### Task 4: 前端 - 首页与搜索 ✅ 已完成

**Files**:
- `src/app/page.tsx` (修改)
- `src/components/SkillCard.tsx` (新建)
- `src/components/SkillList.tsx` (新建)
- `src/components/SearchBar.tsx` (新建)

**Steps**:
1. Hero 区域（标题、搜索框）
2. 技能分类标签
3. 技能卡片组件（名称、描述、安装按钮、统计）
4. 技能列表组件（网格布局）
5. 与 API 集成

**Result**: ✅ 首页与 skills.sh 风格一致，可浏览和搜索技能

---

### Task 5: 前端 - 技能详情页 ✅ 已完成

**Files**:
- `src/app/skills/[id]/page.tsx` (新建)

**Steps**:
1. 技能详情页面布局
2. 技能内容展示（SKILL.md 渲染）
3. 安装按钮（复制命令：`npx skills-factory install gitlab-owner/repo`）
4. 统计信息展示

**Result**: ✅ 可查看技能详情并复制安装命令

---

### Task 6: 前端 - 排行榜页面 ✅ 已完成

**Files**:
- `src/app/leaderboard/page.tsx` (新建)

**Steps**:
1. 排行榜页面布局
2. Tab 切换（All Time、Trending、Hot）
3. 技能排名展示
4. 与 API 集成

**Result**: ✅ 可查看技能排行榜

---

### Task 7: 前端 - 管理面板

**Files**:
- `src/app/admin/page.tsx` (新建)
- `src/app/admin/sync/page.tsx` (新建)
- `src/components/SyncPanel.tsx` (新建)

**Steps**:
1. 管理面板布局
2. GitHub → GitLab 同步控制（调用现有的 publisher 功能）
3. 技能列表管理

**Expected Result**: 可管理技能同步

---

### Task 8: 测试与集成

**Files**:
- 所有测试文件

**Steps**:
1. 单元测试覆盖率检查
2. 集成测试（API + 前端）
3. 修复 Bug

**Expected Result**: 所有测试通过，功能正常

---

### Task 9: 部署配置

**Files**:
- `docker-compose.yml` (修改)
- `Dockerfile` (新建/修改)
- `.env.example` (更新)

**Steps**:
1. 配置 Next.js 构建输出
2. Docker 部署配置
3. 环境变量文档更新
4. 部署说明更新

**Expected Result**: 可一键部署 Web 服务

---

## 验收标准

1. ✅ 首页与 skills.sh 风格一致
2. ✅ 可从 GitLab 浏览和搜索技能
3. ✅ 可查看技能详情
4. ✅ 可一键复制安装命令（指向 GitLab）
5. ✅ 可查看技能排行榜
6. ✅ 可在管理面板触发 GitHub → GitLab 同步
7. ✅ 所有测试通过

## 风险

1. **GitLab API 限制**：可能需要分页处理
2. **Markdown 渲染**：需要处理 SKILL.md 的 frontmatter 和内容
3. **性能问题**：大量技能时可能需要缓存

## 下一步

开始执行 Task 1：环境配置与基础架构
