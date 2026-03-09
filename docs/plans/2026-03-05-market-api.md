# Market API 实现计划

## 1) 分析

### 现状
- CLI 已实现，只操作本地文件
- 没有服务端 API
- 无法提供团队共享的市场服务

### 约束
- 使用 TypeScript/Node.js
- 不引入重型框架
- 复用现有模块

### 成功标准
1. `npm run api` 能启动 HTTP 服务
2. `GET /api/v1/skills` 返回技能列表
3. `GET /api/v1/skills/:id` 返回技能详情

---

## 2) 设计

**推荐：原生 Node.js http 模块**

---

## 3) 落地计划

### Task 1.1: 创建 API 服务器骨架
**Files**:
- Create: `src/api/server.ts`
- Modify: `package.json`（添加 `api` script）

**Step 1**: 创建服务器
**Step 2**: 测试 `npm run api`
**Step 3**: 验证 `curl http://localhost:3000/api/v1/health`

---

### Task 1.2: 实现 GET /api/v1/skills
**Files**:
- Create: `src/api/routes/skills.ts`
- Create: `src/api/routes/skills.test.ts`

**Step 1**: 写失败测试
**Step 2**: 运行测试确认失败
**Step 3**: 最小实现
**Step 4**: 运行测试确认通过

---

### Task 1.3: 实现 GET /api/v1/skills/:id
**Files**:
- Modify: `src/api/routes/skills.ts`
- Modify: `src/api/routes/skills.test.ts`

---

## 执行顺序
1. Task 1.1（服务器骨架）
2. Task 1.2（列表接口）
3. Task 1.3（详情接口）
