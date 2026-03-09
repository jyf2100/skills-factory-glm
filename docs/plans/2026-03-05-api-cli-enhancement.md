# API 端点 + CLI 命令增强计划

## 1) 分析

### 现状
- Market API: health, skills 端点
- CLI: list, search, install, uninstall, update, audit 命令
- 模块: security, signing, publisher

### 成功标准
- `POST /api/v1/ingest/import` 导入技能
- `POST /api/v1/reviews/:id/approve` 批准发布
- `GET /api/v1/install/:id/:version` 安装清单
- CLI `verify` 验证签名
- CLI `source add/list` 白名单管理

---

## 2) 落地计划

### Task 1: 添加 ingest 路由

**Files**:
- Create: `src/api/routes/ingest.ts`
- Modify: `src/api/server.ts`
- Create: `src/api/routes/ingest.test.ts`

**Step 1**: 写失败测试

```typescript
it('should import skill from GitHub', async () => {
  const body = JSON.stringify({ source: 'owner/repo' });
  // POST to /api/v1/ingest/import
  // Expect 202 Accepted with ingestId
});
```

**Step 2-4**: 实现 + 验证

---

### Task 2: 添加 reviews 路由

**Files**:
- Create: `src/api/routes/reviews.ts`
- Modify: `src/api/server.ts`
- Create: `src/api/routes/reviews.test.ts`

---

### Task 3: 添加 install 路由

**Files**:
- Create: `src/api/routes/install.ts`
- Modify: `src/api/server.ts`
- Create: `src/api/routes/install.test.ts`

---

### Task 4: CLI verify 命令

**Files**:
- Modify: `src/index.ts`

---

### Task 5: CLI source 命令

**Files**:
- Modify: `src/index.ts`
- Create: `src/sources.ts` (白名单管理)

---

## 执行顺序

1. Task 1 (ingest 路由)
2. Task 2 (reviews 路由)
3. Task 3 (install 路由)
4. Task 4 (CLI verify)
5. Task 5 (CLI source)
