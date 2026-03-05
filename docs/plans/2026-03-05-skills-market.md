# Skills Market 实现计划

## 1) 分析

### 现状
- 项目目录：`/Volumes/work/workspace/skills-factory/`
- **不是 git 仓库**：需要初始化
- **没有 package.json**：需要创建 npm 包结构
- 已有结构：
  - `skills/` - 存放已安装的技能
  - `.agents/skills/` - 运行时代理使用的技能副本
  - `skills-lock.json` - 技能锁定文件（记录来源和哈希）
- 现有技能：`openclaw-config`, `openclaw-setup`（来源 GitHub）

### 约束
1. 必须兼容现有 `skills-lock.json` 格式
2. Node.js ≥ 22（当前 v23.10.0）
3. 需要支持 `npx` 方式运行
4. 安全校验必须可审计

### 成功标准
1. **下载**：能从 GitHub 仓库下载指定技能
2. **审核**：
   - 必须验证 SKILL.md 存在且格式正确
   - 必须计算并记录内容哈希
   - 必须检测潜在安全问题（敏感文件、危险命令等）
3. **上传**：将审核通过的技能提交到本地 git 仓库
4. **搜索/下载**：
   - `npx skills-factory search <keyword>` 能搜索技能
   - `npx skills-factory install <skill-name>` 能安装技能

### 风险
1. GitHub API 限流（未认证 60次/小时）
2. 技能内容安全（恶意代码、敏感信息泄露）
3. 网络依赖（下载过程需要稳定网络）
4. 版本冲突（同一技能不同版本）

---

## 2) 设计方案

### 方案 A：单 CLI 工具（推荐）

**核心思路**：创建一个 npm CLI 包，提供 `search`、`install`、`audit`、`publish` 命令。

**主要组件**：
```
skills-factory/
├── package.json           # CLI 入口：bin/skills-factory
├── bin/
│   └── skills-factory     # CLI 入口脚本
├── src/
│   ├── commands/          # 命令实现
│   │   ├── search.ts
│   │   ├── install.ts
│   │   ├── audit.ts
│   │   └── publish.ts
│   ├── github.ts          # GitHub API 封装
│   ├── security.ts        # 安全校验模块
│   ├── lockfile.ts        # skills-lock.json 管理
│   └── index.ts
├── skills/                # 技能存储目录
└── skills-lock.json       # 锁定文件
```

**优点**：
- 单一职责，易于维护
- npx 直接可用
- TypeScript 类型安全

**缺点**：
- 需要发布到 npm（或使用本地路径）

### 方案 B：Monorepo + 多包

**核心思路**：拆分为 `@skills-factory/core`、`@skills-factory/cli`、`@skills-factory/audit`。

**优点**：模块化更彻底

**缺点**：工程量大，过度设计

### 方案 C：纯脚本方案

**核心思路**：用 shell 脚本 + Node.js 脚本实现，无编译步骤。

**优点**：简单直接

**缺点**：难以维护，类型不安全

### 推荐：方案 A

**取舍理由**：
- 工程量适中，符合"最小闭环"原则
- TypeScript 提供类型安全，减少运行时错误
- 单包结构便于 npx 使用

---

## 3) 落地计划

### Task 1: 项目初始化 [预计 5 分钟]

**Files**：
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `bin/skills-factory`
- Create: `src/index.ts`

**Step 1**：创建 package.json（npm init + 添加 bin 配置）
**Step 2**：创建 tsconfig.json
**Step 3**：创建 bin 入口脚本
**Step 4**：创建 src/index.ts 骨架
**Step 5**：安装依赖并验证 `npx . --help` 能运行

---

### Task 2: CLI 框架 + search 命令 [预计 10 分钟]

**Files**：
- Create: `src/commands/search.ts`
- Modify: `src/index.ts`

**Step 1**：写失败测试 - `npx . search` 无参数应报错
**Step 2**：实现 search 命令骨架（列出 skills-lock.json 中的技能）
**Step 3**：验证搜索结果输出

---

### Task 3: GitHub 下载模块 [预计 15 分钟]

**Files**：
- Create: `src/github.ts`
- Create: `src/commands/fetch.ts`

**Step 1**：写失败测试 - 下载不存在的仓库应报错
**Step 2**：实现 GitHub 下载逻辑（使用 @octokit/rest）
**Step 3**：验证能下载技能到 skills/ 目录

---

### Task 4: 安全校验模块 [预计 15 分钟]

**Files**：
- Create: `src/security.ts`
- Create: `src/commands/audit.ts`

**Step 1**：写失败测试 - 无效 SKILL.md 应报错
**Step 2**：实现校验逻辑（YAML frontmatter、哈希计算、敏感文件检测）
**Step 3**：验证审核报告输出

---

### Task 5: install 命令（整合下载+审核）[预计 10 分钟]

**Files**：
- Create: `src/commands/install.ts`
- Modify: `src/index.ts`

**Step 1**：写失败测试 - 安装未审核技能应报错
**Step 2**：整合 fetch + audit 流程
**Step 3**：验证完整安装流程

---

### Task 6: Git 提交和推送 [预计 5 分钟]

**Files**：
- Modify: `src/commands/install.ts`

**Step 1**：安装后自动 git add + commit
**Step 2**：验证 git log 有新提交

---

### Task 7: 初始化 Git 仓库 + 首次提交 [预计 3 分钟]

**Files**：
- Create: `.gitignore`
- 初始化 git

**Step 1**：`git init`
**Step 2**：创建 .gitignore
**Step 3**：首次提交

---

## 执行顺序

1. Task 7（先初始化 git，便于后续提交）
2. Task 1（项目初始化）
3. Task 2（CLI 框架）
4. Task 3（GitHub 下载）
5. Task 4（安全审核）
6. Task 5（install 命令）
7. Task 6（Git 集成）

---

## 验收标准

- [ ] `npx . search openclaw` 能搜索到技能
- [ ] `npx . install owner/repo` 能下载并安装技能
- [ ] 安装后 `skills-lock.json` 正确更新
- [ ] 安全校验能检测问题技能
- [ ] 每次安装都有 git commit
