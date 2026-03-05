# Skills Registry 实现计划

## 1) 分析

### 现状
- `search` 命令只搜索本地 `skills-lock.json`
- `install` 命令需要用户知道 `owner/repo` 格式
- 没有中央技能索引，用户无法发现可用技能

### 约束
- 不能依赖外部 API 服务（保持离线优先）
- 搜索速度要快
- 注册表格式简单，易于维护

### 成功标准
1. `npx skills-factory search <keyword>` 能搜索远程技能注册表
2. `npx skills-factory browse` 能浏览所有可用技能
3. 注册表可扩展，支持添加新技能

### 风险
- 注册表可能过时
- 需要定期维护

---

## 2) 设计方案

**推荐：本地 JSON 注册表**

在项目中维护 `skills-registry.json`：
```json
{
  "version": 1,
  "skills": [
    {
      "name": "openclaw-config",
      "source": "openclaw/openclaw",
      "description": "Manage OpenClaw bot configuration",
      "keywords": ["openclaw", "config", "bot"]
    }
  ]
}
```

---

## 3) 落地计划

### Task 1: 创建 skills-registry.json
**Files**:
- Create: `skills-registry.json`

**Step 1**: 创建注册表文件
```json
{
  "version": 1,
  "skills": [
    {
      "name": "openclaw-config",
      "source": "adisinghstudent/easyclaw",
      "description": "Manage OpenClaw bot configuration - channels, agents, security, and autopilot settings",
      "keywords": ["openclaw", "config", "bot", "ai"]
    },
    {
      "name": "openclaw-setup",
      "source": "iofficeai/aionui",
      "description": "OpenClaw usage expert: Helps you install, deploy, configure, and use OpenClaw personal AI assistant",
      "keywords": ["openclaw", "setup", "install", "deploy"]
    }
  ]
}
```

---

### Task 2: 实现注册表读取和搜索
**Files**:
- Create: `src/registry.ts`
- Create: `src/registry.test.ts`

**Step 1**: 写失败测试
```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readRegistry, searchRegistry } from './registry.js';

describe('registry', () => {
  it('should read skills-registry.json', async () => {
    const registry = await readRegistry(process.cwd());
    assert.ok(registry);
    assert.ok(registry.skills.length > 0);
  });

  it('should search skills by keyword', async () => {
    const registry = await readRegistry(process.cwd());
    const matches = searchRegistry(registry, 'openclaw');
    assert.ok(matches.length >= 2);
  });

  it('should return empty array for no matches', async () => {
    const registry = await readRegistry(process.cwd());
    const matches = searchRegistry(registry, 'nonexistent-xyz');
    assert.strictEqual(matches.length, 0);
  });
});
```

**Step 2**: 运行测试并确认失败
```bash
npm run build && npm test
# 预期: fail - module not found
```

**Step 3**: 最小实现
```typescript
import fs from 'node:fs';
import path from 'node:path';

export interface RegistrySkill {
  name: string;
  source: string;
  description: string;
  keywords: string[];
}

export interface Registry {
  version: number;
  skills: RegistrySkill[];
}

const REGISTRY_FILE = 'skills-registry.json';

export async function readRegistry(baseDir: string): Promise<Registry> {
  const registryPath = path.join(baseDir, REGISTRY_FILE);

  if (!fs.existsSync(registryPath)) {
    return { version: 1, skills: [] };
  }

  const content = await fs.promises.readFile(registryPath, 'utf-8');
  return JSON.parse(content);
}

export function searchRegistry(registry: Registry, keyword: string): RegistrySkill[] {
  const lowerKeyword = keyword.toLowerCase();

  return registry.skills.filter(skill => {
    const nameMatch = skill.name.toLowerCase().includes(lowerKeyword);
    const descMatch = skill.description.toLowerCase().includes(lowerKeyword);
    const keywordMatch = skill.keywords.some(k => k.toLowerCase().includes(lowerKeyword));

    return nameMatch || descMatch || keywordMatch;
  });
}
```

**Step 4**: 运行测试并确认通过
```bash
npm run build && npm test
# 预期: pass
```

---

### Task 3: 更新 search 命令使用注册表
**Files**:
- Modify: `src/index.ts`

**Step 1**: 修改 handleSearch 函数
- 先搜索本地已安装技能
- 同时搜索远程注册表
- 分别显示结果

**Step 2**: 测试命令
```bash
node dist/bin/skills-factory.js search openclaw
# 预期: 显示本地 + 远程技能
```

---

### Task 4: 添加 browse 命令
**Files**:
- Modify: `src/index.ts`

**Step 1**: 添加 handleBrowse 函数
**Step 2**: 在 switch 中添加 case
**Step 3**: 更新帮助文本

---

## 执行顺序
1. Task 1（创建注册表文件）
2. Task 2（实现注册表模块）
3. Task 3（更新 search 命令）
4. Task 4（添加 browse 命令）
