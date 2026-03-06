# Skills Factory - 内部技能市场管理系统

Skills Factory 是一个用于存储、管理和分发 AI Agent 技能（Skills）的内部管理系统。支持从 GitHub 等来源安装技能包，并在本地进行管理和安全审计。

## 目录

- [概述](#概述)
- [安装](#安装)
- [快速开始](#快速开始)
- [CLI 命令](#cli-命令)
- [API 服务](#api-服务)
- [配置](#配置)
- [项目结构](#项目结构)
- [安全审计](#安全审计)
- [常见问题](#常见问题)

---

## 概述

### 功能特性

- ✅ **技能安装**：从 GitHub 仓库下载和安装技能包
- ✅ **安全审计**：自动检测敏感信息、可疑文件和安全风险
- ✅ **版本管理**：通过 skills-lock.json 追踪已安装技能的来源和哈希
- ✅ **完整性验证**：验证技能是否被篡改
- ✅ **远程仓库**：支持 Gitea 远程仓库同步
- ✅ **API 服务**：提供 HTTP API 用于集成
- ✅ **审核流程**：支持技能导入审核和批准/拒绝工作流

### 系统要求

- Node.js >= 22.0.0
- Git（用于版本控制）

---

## 安装

### 从 npm 安装

```bash
npm install -g skills-factory
```

### 从源码安装

```bash
# 克隆仓库
git clone https://github.com/jyf2100/skills-factory-glm.git
cd skills-factory-glm

# 安装依赖
npm install

# 构建项目
npm run build
```

---

## 快速开始

### 1. 安装一个技能

```bash
npx skills-factory install owner/repo
```

### 2. 列出已安装的技能

```bash
npx skills-factory list
```

### 3. 搜索技能

```bash
npx skills-factory search <keyword>
```

### 4. 启动 API 服务

```bash
npm run api
```

---

## CLI 命令

### 基本命令

| 命令 | 说明 | 示例 |
|-----|------|------|
| `search <keyword>` | 搜索技能（本地 + 仓库） | `npx skills-factory search openclaw` |
| `browse` | 浏览仓库中的所有技能 | `npx skills-factory browse` |
| `list` | 列出已安装的技能 | `npx skills-factory list` |

### 安装与管理

| 命令 | 说明 | 示例 |
|-----|------|------|
| `install <source>` | 从 GitHub 安装技能 | `npx skills-factory install owner/repo` |
| `update <skill-name>` | 更新技能到最新版本 | `npx skills-factory update openclaw-config` |
| `uninstall <skill>` | 卸载已安装的技能 | `npx skills-factory uninstall openclaw-config` |

### 安全与验证

| 命令 | 说明 | 示例 |
|-----|------|------|
| `audit <skill-name>` | 审计已安装的技能 | `npx skills-factory audit openclaw-config` |
| `verify <skill-name>` | 验证技能完整性和签名 | `npx skills-factory verify openclaw-config` |

### 源管理

| 命令 | 说明 | 示例 |
|-----|------|------|
| `source list` | 列出白名单中的源 | `npx skills-factory source list` |
| `source add <url>` | 添加源到白名单 | `npx skills-factory source add github.com/myorg` |
| `source remove <url>` | 从白名单移除源 | `npx skills-factory source remove github.com/myorg` |

### 选项

| 选项 | 说明 |
|-----|------|
| `-h, --help` | 显示帮助信息 |
| `-v, --version` | 显示版本号 |

---

## API 服务

### 启动服务

```bash
npm run api
```

服务默认运行在 `http://localhost:3000`

### 环境变量

| 变量 | 说明 | 默认值 |
|-----|------|--------|
| `PORT` | API 服务端口 | 3000 |

### API 端点

#### 健康检查

```bash
GET /api/v1/health
```

**响应：**
```json
{
  "status": "ok"
}
```

#### 列出所有技能

```bash
GET /api/v1/skills
```

**响应：**
```json
{
  "skills": [
    {
      "name": "openclaw-config",
      "source": "owner/repo",
      "hash": "sha256:..."
    }
  ]
}
```

#### 获取单个技能

```bash
GET /api/v1/skills/:id
```

#### 导入技能

```bash
POST /api/v1/ingest/import
Content-Type: application/json

{
  "source": "owner/repo"
}
```

**响应：**
```json
{
  "id": "uuid",
  "status": "pending",
  "source": "owner/repo"
}
```

#### 查询导入状态

```bash
GET /api/v1/ingest/:id
```

**响应：**
```json
{
  "id": "uuid",
  "status": "completed",
  "skillName": "openclaw-config"
}
```

#### 列出所有导入

```bash
GET /api/v1/ingest
```

#### 审核批准

```bash
POST /api/v1/reviews/:id/approve
```

#### 审核拒绝

```bash
POST /api/v1/reviews/:id/reject
Content-Type: application/json

{
  "reason": "Security concern"
}
```

#### 查询审核状态

```bash
GET /api/v1/reviews/:id
```

#### 安装技能

```bash
GET /api/v1/install/:owner/:repo
```

---

## 配置

### Gitea 远程仓库配置

Skills Factory 支持通过环境变量配置 Gitea 远程仓库，用于自动同步和推送。

#### 配置步骤

1. 复制示例配置文件：

```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，设置 Gitea 配置：

```env
# Gitea repository URL (必须以 .git 结尾)
GITEA_URL=https://gitea.example.com/skills.git

# Gitea 认证令牌
# 在你的 Gitea 实例中生成：Settings -> Applications -> Generate Token
GITEA_TOKEN=your-token-here
```

3. 重启服务或重新运行命令

**重要：**
- `.env` 文件已在 `.gitignore` 中，不会被提交到版本控制
- 确保 Gitea URL 以 `.git` 结尾
- Gitea Token 需要具有仓库读写权限

#### Git 推送行为

配置 Gitea 后，系统会在以下操作自动推送到远程仓库：
- 技能安装后
- 技能更新后
- 技能卸载后

---

## 项目结构

```
skills-factory/
├── skills/                    # 已安装的技能包（从外部源安装）
│   └── <skill-name>/
│       └── SKILL.md           # 技能定义文件（必需）
│       └── references/        # 参考文档（可选）
├── .agents/skills/            # 代理使用的技能副本（运行时使用）
├── .agent/                    # 代理配置目录（预留）
├── skills-lock.json          # 技能锁定文件，记录来源和哈希
├── skills-registry.json       # 技能仓库索引
├── src/                      # 源代码
│   ├── api/                 # API 路由和服务器
│   ├── bin/                 # CLI 入口
│   ├── config.ts            # 配置模块
│   ├── publisher.ts         # Git 发布功能
│   ├── signing.ts          # 签名和验证
│   ├── audit-log.ts        # 审计日志
│   └── ...
├── dist/                     # 编译输出
├── docs/                     # 文档
│   └── plans/             # 实现计划
└── .env.example            # 环境变量示例
```

### Skills Lock File

`skills-lock.json` 跟踪已安装技能的元信息：

```json
{
  "version": 1,
  "skills": {
    "<skill-name>": {
      "source": "owner/repo",
      "sourceType": "github",
      "computedHash": "sha256:..."
    }
  }
}
```

### Skill 结构

每个技能包遵循以下结构：

- **SKILL.md**: 技能定义文件，包含 YAML frontmatter 和 Markdown 内容
  - `name`: 技能名称
  - `description`: 技能描述（用于触发匹配）
  - `version`: 可选版本号

- **references/**: 可选的参考文档目录，存放详细的技术文档

---

## 安全审计

### 检测项

Skills Factory 在安装和更新技能时会自动进行安全审计，检测以下内容：

| 检测类型 | 说明 |
|---------|------|
| **敏感信息** | 检测 API 密钥、密码、令牌等 |
| **可疑文件** | 检测潜在恶意文件模式 |
| **Shell 脚本** | 检测 `.sh`、`.bash` 等脚本 |
| **SKILL.md 格式** | 验证技能定义文件格式正确性 |

### 审计输出

```bash
npx skills-factory audit <skill-name>
```

**通过示例：**
```
Auditing skill: openclaw-config...

✓ Security audit passed
```

**警告示例：**
```
Auditing skill: openclaw-config...

Warnings:
  ⚠ No references directory found

Security Issues:
  [low] Shell script detected: script.sh
  [high] API key pattern detected in file.txt
```

### 手动验证

```bash
npx skills-factory verify <skill-name>
```

验证会对比当前文件哈希与存储在 lockfile 中的哈希：

```
Verifying skill: openclaw-config...

Stored hash:   sha256:abc123...
Current hash:  sha256:abc123...

✓ Skill integrity verified
✓ Verification complete: openclaw-config
```

---

## 常见问题

### Q: 如何安装自定义技能？

A: 将技能文件放入 `skills/<skill-name>/` 目录，并确保包含 `SKILL.md` 文件。

### Q: 如何添加新技能到仓库？

A: 编辑 `skills-registry.json` 文件，添加技能信息：

```json
{
  "version": 1,
  "skills": [
    {
      "name": "my-skill",
      "description": "My custom skill",
      "source": "owner/repo",
      "keywords": ["custom", "tool"]
    }
  ]
}
```

### Q: Gitea 推送失败怎么办？

A: 检查以下几点：
1. 确认 `.env` 文件中的 `GITEA_URL` 和 `GITEA_TOKEN` 配置正确
2. 确认 Gitea URL 以 `.git` 结尾
3. 确认 Gitea Token 有足够的权限
4. 检查网络连接

### Q: 审计失败但我知道代码是安全的？

A: 可以暂时绕过审计（不推荐生产环境）：
1. 手动创建技能目录
2. 编辑 `skills-lock.json` 添加技能条目
3. 手动同步到 `.agents/skills/`

### Q: 如何运行测试？

A:

```bash
# 构建项目
npm run build

# 运行所有测试
npm test

# 运行特定测试
node --test dist/config.test.js
```

### Q: API 服务如何配置 CORS？

A: API 服务默认已启用 CORS，允许所有来源。如需修改，编辑 `src/api/server.ts` 中的 CORS 设置。

---

## 开发

### 构建

```bash
npm run build
```

### 开发模式

```bash
npm run dev
```

### 类型检查

```bash
npm run typecheck
```

---

## 许可证

MIT

---

## 贡献

欢迎提交 Issue 和 Pull Request！

---

## 联系

如有问题或建议，请提交 Issue 或联系项目维护者。
