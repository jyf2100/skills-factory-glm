# Uninstall 和 Update 命令实现计划

## 1) 分析

### 现状

- 项目已有 CLI 框架 (`src/index.ts`)
- 已实现：list, search, install, audit 命令
- 锁文件管理：`src/lockfile.ts`
- GitHub 下载：`src/github.ts`
- 安全校验：`src/security.ts`

### 约束

- 复用现有模块（lockfile, github, security）
- 保持 TDD 流程
- 每个 task 都要有测试验证

### 成功标准

- `npx skills-factory uninstall <skill-name>` 能正确删除技能
- `npx skills-factory update <skill-name>` 能更新到最新版本
- 更新后 lockfile 正确更新
- 操作后自动 git commit

### 风险

- 卸载时可能误删用户修改
- 更新时可能有 breaking changes
- 网络请求可能失败

---

## 2) 设计方案

### 方案 A: 在现有 cli() 函数中添加 case（推荐）

**优点**：简单直接，复用现有代码
**缺点**：cli() 函数会变长

### 方案 B: 创建独立的 commands 目录

**优点**：更好的代码组织
**缺点**：需要重构现有代码

### 推荐：方案 A

保持现有结构，直接在 index.ts 中添加新命令处理函数。

---

## 3) 落地计划

### Task 1: 实现 removeSkillFromLockfile 函数

**Files**:

- Modify: `src/lockfile.ts`
- Create: `src/lockfile.test.ts` (添加测试)

**Step 1**: 写失败测试

```typescript
it('should remove skill from lockfile', () => {
  const lockfile: Lockfile = {
    version: 1,
    skills: {
      'skill-a': { source: 'a/b', sourceType: 'github', computedHash: 'hash-a' },
      'skill-b': { source: 'c/d', sourceType: 'github', computedHash: 'hash-b' },
    },
  };
  const result = removeSkillFromLockfile(lockfile, 'skill-a');
  assert.ok(!result.skills['skill-a']);
  assert.ok(result.skills['skill-b']);
});
```

**Step 2**: 运行测试并确认失败

```bash
npm run build && npm test
# 预期: fail - removeSkillFromLockfile not found
```

**Step 3**: 最小实现

```typescript
export function removeSkillFromLockfile(lockfile: Lockfile, skillName: string): Lockfile {
  const { [skillName]: removed, ...remaining } = lockfile.skills;
  return { ...lockfile, skills: remaining };
}
```

**Step 4**: 运行测试并确认通过

```bash
npm run build && npm test
# 预期: pass
```

---

### Task 2: 实现 uninstall 命令

**Files**:

- Modify: `src/index.ts`

**Step 1**: 在 cli() switch 中添加 uninstall case
**Step 2**: 实现 handleUninstall 函数
**Step 3**: 测试手动验证 `node dist/bin/skills-factory.js uninstall skill-name`

---

### Task 3: 实现 update 命令

**Files**:

- Modify: `src/index.ts`

**Step 1**: 在 cli() switch 中添加 update case
**Step 2**: 实现 handleUpdate 函数（重新下载并审核）
**Step 3**: 测试手动验证

---

## 执行顺序 

1. Task 1（lockfile 模块）
2. Task 2（uninstall CLI）
3. Task 3（update CLI）
