# Publisher 与 Gitea 集成实现计划

## 1) 分析

### 现状
- 项目已有 Market API（src/api/）和 Signing 模块（src/signing.ts）
- CLI 已支持 install/uninstall/update/audit 命令
- 锁文件管理：src/lockfile.ts

### 约束
- 复用现有 signing 模块进行签名验证
- 保持 TDD 流程
- 每个任务都要有测试验证
- 遵循 PLAN.md 定义的仓库结构

### 成功标准
- `publishSkill()` 能将技能写入正确的目录结构
- `pushToGitea()` 能推送到远程仓库
- 生成正确的索引和签名文件

### 风险
- Gitea 可能未配置（需要 mock 或跳过）
- Git 操作可能需要认证

---

## 2) 设计方案

### 方案 A: 单一 publisher.ts 模块（推荐）

**优点**：简单直接，易于测试
**缺点**：模块较大

### 方案 B: 拆分为 publisher/git/gitea 多模块

**优点**：更好的分离关注点
**缺点**：需要更多文件

### 推荐：方案 A

先做最小实现，后续再拆分。

---

## 3) 落地计划

### Task 1: 定义 Publisher 类型与接口

**Files**:
- Create: `src/publisher.ts`
- Create: `src/publisher.test.ts`

**Step 1**: 写类型定义

```typescript
// 仓库结构
export interface SkillRepository {
  skillsDir: string;      // skills/<skill_id>/<version>/
  metadataDir: string;    // metadata/<skill_id>/<version>.json
  attestationsDir: string; // attestations/<skill_id>/<version>.json
  signaturesDir: string;  // signatures/<skill_id>/<version>.sig
  indexPath: string;      // index/skills-index.json
}

// 发布记录
export interface PublishedSkill {
  skillId: string;
  version: string;
  sourceUrl: string;
  sourceCommit: string;
  fetchedAt: string;
  hash: string;
  reviewer: string;
  reviewedAt: string;
  signature: string;
  publishedAt: string;
}
```

**Step 2**: 写失败测试

```typescript
it('should generate skill directory path', () => {
  const repo = createRepository('/path/to/repo');
  assert.strictEqual(
    repo.getSkillPath('my-skill', '1.0.0'),
    '/path/to/repo/skills/my-skill/1.0.0'
  );
});
```

**Step 3**: 最小实现

```typescript
export function createRepository(basePath: string) {
  return {
    basePath,
    getSkillPath: (skillId: string, version: string) =>
      `${basePath}/skills/${skillId}/${version}`,
    getMetadataPath: (skillId: string, version: string) =>
      `${basePath}/metadata/${skillId}/${version}.json`,
    getAttestationPath: (skillId: string, version: string) =>
      `${basePath}/attestations/${skillId}/${version}.json`,
    getSignaturePath: (skillId: string, version: string) =>
      `${basePath}/signatures/${skillId}/${version}.sig`,
    getIndexPath: () => `${basePath}/index/skills-index.json`,
  };
}
```

**Step 4**: 运行测试并确认通过

---

### Task 2: 实现 generateAttestation 函数

**Files**:
- Modify: `src/publisher.ts`
- Modify: `src/publisher.test.ts`

**Step 1**: 写失败测试

```typescript
it('should generate attestation for published skill', () => {
  const record: SkillRecord = {
    skillId: 'test-skill',
    version: '1.0.0',
    sourceUrl: 'https://github.com/a/b',
    sourceCommit: 'abc123',
    hash: 'sha256:deadbeef',
    fetchedAt: '2026-03-05T10:00:00Z',
    riskLevel: 'low',
  };
  const attestation = generateAttestation(record, 'reviewer', privateKey);
  assert.strictEqual(attestation.skillId, 'test-skill');
  assert.ok(attestation.signature);
});
```

**Step 2**: 最小实现（复用 signing 模块）

**Step 3**: 运行测试

---

### Task 3: 实现 updateIndex 函数

**Files**:
- Modify: `src/publisher.ts`
- Modify: `src/publisher.test.ts`

**Step 1**: 写失败测试

```typescript
it('should update skills index', () => {
  const existingIndex = { skills: [] };
  const newSkill = { skillId: 'new-skill', version: '1.0.0', description: 'Test' };
  const updated = updateIndex(existingIndex, newSkill);
  assert.strictEqual(updated.skills.length, 1);
  assert.strictEqual(updated.skills[0].skillId, 'new-skill');
});
```

**Step 2**: 最小实现

**Step 3**: 运行测试

---

### Task 4: 实现 gitCommitAndPush 函数

**Files**:
- Modify: `src/publisher.ts`
- Modify: `src/publisher.test.ts`

**Step 1**: 写测试（使用 mock 或临时目录）

**Step 2**: 实现使用 child_process 执行 git 命令

**Step 3**: 运行测试

---

## 执行顺序

1. Task 1（类型与路径函数）
2. Task 2（Attestation 生成）
3. Task 3（Index 更新）
4. Task 4（Git 操作）
