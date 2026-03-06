# Gitea 远程仓库配置

## 1) 分析

### 现状
- Publisher 模块已有 `gitInit/gitAdd/gitCommit/gitPush` 函数
- 这些函数在测试中使用模拟目录，可正常工作
- 需要为实际部署环境配置远程仓库

### 约束
- 不引入外部依赖
- 保持 TDD 流程

### 成功标准
- ✅ 能从配置文件或环境变量读取 Gitea URL
- ✅ 能配置认证 token
- ✅ `gitPush` 能成功推送到远程

### 风险
- ⚠️ 可能没有真实的 Gitea 环境（本地测试）
- ⚠️ Token 泄露风险（需要安全处理）

---

## 2) 设计方案

### 方案 A：环境变量配置（推荐）
**核心思路**：使用 `.env` 文件存储 Gitea URL 和 token

**优点**：
- 简单、标准
- 支持本地开发环境
- 易于 CI/CD 集成

**缺点**：
- token 明文存储在本地

### 方案 B：配置文件
**核心思路**：读取 `skills-factory.json` 配置文件

**优点**：
- 可提交到版本控制
- 环境特定配置

**缺点**：
- 需要额外配置步骤

### 推荐：方案 A（环境变量 + 可选配置文件）

---

## 3) 落地计划

### Task 1: 创建配置模块

**Files**:
- Create: `src/config.ts`
- Create: `src/config.test.ts`
- Modify: `src/publisher.ts`

**Step 1**: 写失败测试

```typescript
it('should read config from environment variables', () => {
  process.env.GITEA_URL = 'https://gitea.example.com/skills.git';
  process.env.GITEA_TOKEN = 'test-token';

  const config = getConfig();
  assert.strictEqual(config.giteaUrl, 'https://gitea.example.com/skills.git');
  assert.strictEqual(config.giteaToken, 'test-token');
});
```

**Step 2-4**: 实现 + 验证

```typescript
export function getConfig(): Config {
  return {
    giteaUrl: process.env.GITEA_URL || 'https://gitea.example.com/skills.git',
    giteaToken: process.env.GITEA_TOKEN || '',
  };
}

// Modify gitPush to use config
```

**Step 5**: 运行测试

```bash
npm run build
node --test dist/config.test.js
```

---

### Task 2: 集成到 Publisher

**Files**:
- Modify: `src/publisher.ts`

**Step 1**: 修改 gitPush 使用远程配置

```typescript
export async function gitPush(
  repoPath: string,
  remote: string = 'origin',
  branch: string = 'main'
): Promise<GitResult> {
  const config = getConfig();
  if (!config.giteaUrl || !config.giteaToken) {
    return { success: true, message: 'No remote configured' };
  }

  // Use git config with credential.helper
  const repoUrl = new URL(config.giteaUrl);
  const auth = `${repoUrl.username}:${config.giteaToken}@${repoUrl.host}`;

  return execGit(repoPath, ['push', '-u', auth, remote, branch]);
}
```

---

### Task 3: 添加 .env.example

**Files**:
- Create: `.env.example`

**Step 1-2**: 创建示例配置文件

```env
# Gitea Configuration
GITEA_URL=https://gitea.example.com/skills.git
GITEA_TOKEN=your-token-here
```

---

## 执行顺序

1. Task 1 (config module)
2. Task 2 (integrate to publisher)
3. Task 3 (env.example)
