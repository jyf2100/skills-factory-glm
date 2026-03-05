# 本地 Skills 市场（类 skill.sh）实施计划 v1

## Summary
构建一个团队共享的内网 Skills 市场，形态类似 [skill.sh](https://skill.sh/) 的“可搜索/可安装”体验，但供应链完全本地可控：  
1. 从互联网白名单来源搜索并拉取 skills。  
2. 在隔离环境执行严格安全审核与结构改造。  
3. 审核通过后签名发布到本地 Gitea Git 仓库。  
4. 用户通过 `npx` CLI 从本地市场安装并校验签名。  

第一阶段优先打通“采集-审核-入库-安装”主链路，前端市场页面做最小可用。

## 1. 目标与范围
1. 目标
1. 建立可审计的本地 skills 供应链。
2. 支持互联网来源检索、下载、审核、改造、入库、安装全流程。
3. 支持版本化管理、签名验证、可追溯审计日志。
4. 对终端用户提供 `npx` 一键安装体验。

2. 非目标（v1 不做）
1. 全网自由爬取（仅白名单来源）。
2. 双人审批（按你选择，v1 为单人审批）。
3. 完整“社交化”市场能力（评分、评论、推荐算法）。
4. 跨组织联邦同步。

## 2. 技术与部署决策
1. 架构形态：团队共享内网服务。
2. 仓库托管：Gitea 私有实例。
3. 服务栈：TypeScript/Node.js。
4. 隔离执行：Rootless 容器沙箱（Podman 或 Docker rootless）。
5. 审批策略：单人审批后方可发布。
6. 包格式：兼容现有 `SKILL.md` 结构，叠加本地治理元数据。
7. 安装方式：发布 npm CLI，支持 `npx skillsctl install ...`。
8. 来源策略：白名单来源 + 关键词搜索。

## 3. 系统架构（v1）
1. `market-api`（Node.js）
1. 提供搜索、详情、版本、安装元数据、审计查询 API。
2. 对接 Gitea、数据库、对象存储（可选）。

2. `ingest-worker`（Node.js）
1. 执行来源检索、下载、解包、结构规范化、静态扫描、SBOM 生成。
2. 触发沙箱动态检查并汇总结果。

3. `sandbox-runner`
1. 在 rootless 容器中执行动态行为检查。
2. 禁网或最小出网策略，采集系统调用/文件访问/进程行为摘要。

4. `review-console`（Web 最小前端）
1. 审核员查看风险报告、差异、许可证、来源证明。
2. 单人审批/驳回，并生成签名发布动作。

5. `publisher`
1. 将通过项写入本地 skills Git 仓库。
2. 生成索引与签名文件，推送到 Gitea。
3. 触发 market-api 索引刷新。

6. `skillsctl`（npm CLI）
1. `search`, `install`, `verify`, `list`。
2. 安装前强制签名验证与来源校验。

## 4. Git 仓库与元数据规范
1. 本地仓库建议结构（新建）
1. `skills/<skill_id>/<version>/`：技能内容（含 `SKILL.md`）。
2. `metadata/<skill_id>/<version>.json`：标准化元数据。
3. `attestations/<skill_id>/<version>.json`：审核与来源证明。
4. `signatures/<skill_id>/<version>.sig`：发布签名。
5. `index/skills-index.json`：市场检索索引。

2. 新增本地治理元数据类型 `SkillRecord`
1. `skill_id`, `version`, `source_url`, `source_commit`, `fetched_at`
2. `license`, `hash_sha256`, `sbom_ref`
3. `scan_result`, `sandbox_result`, `risk_level`
4. `reviewer`, `reviewed_at`, `approval_note`
5. `signature`, `published_at`, `gitea_repo_ref`

3. 兼容策略
1. 保留原始 `SKILL.md` 语义。
2. 改造信息不写回原文主干，统一写入 `metadata/*.json` 与 `attestations/*.json`。

## 5. 关键流程（端到端）
1. 采集流程
1. 用户提交关键词。
2. 系统仅在白名单来源检索候选。
3. 下载候选并计算哈希与来源证明。
4. 解析并规范化为统一 `SkillRecord` 草稿。

2. 审核流程
1. 静态扫描：恶意脚本模式、可疑命令、依赖风险、许可证策略。
2. 动态扫描：容器内最小权限执行，记录行为摘要。
3. 风险评级：`low/medium/high/critical`。
4. 审核员在控制台单人审批或驳回。
5. 审批通过才进入签名发布。

3. 发布流程
1. 生成 `metadata/attestations/signatures/index`。
2. 提交并推送到 Gitea 仓库。
3. market-api 刷新索引并对外可检索。

4. 安装流程
1. 开发者执行 `npx skillsctl install <skill_id>@<version>`。
2. CLI 从 market-api 获取索引与签名。
3. 校验签名、哈希、来源证明后安装到本地 skills 目录。
4. 安装结果写本地审计日志。

## 6. 对外接口（Public APIs / Interfaces / Types）
1. 新增 REST API
1. `GET /api/v1/skills?query=&risk=&source=`
2. `GET /api/v1/skills/:id`
3. `GET /api/v1/skills/:id/versions/:version`
4. `POST /api/v1/ingest/search`
5. `POST /api/v1/ingest/import`
6. `POST /api/v1/reviews/:ingest_id/approve`
7. `POST /api/v1/reviews/:ingest_id/reject`
8. `GET /api/v1/audit/:skill_id/:version`
9. `GET /api/v1/install/:skill_id/:version`（返回安装清单与签名）

2. 新增 CLI 接口
1. `npx skillsctl search <keyword>`
2. `npx skillsctl install <skill_id>@<version>`
3. `npx skillsctl verify <skill_id>@<version>`
4. `npx skillsctl source add <whitelist_url>`

3. 新增类型契约
1. `SkillRecord`
2. `ReviewDecision`
3. `AttestationEnvelope`
4. `InstallManifest`

## 7. 安全与合规基线
1. 来源控制
1. 仅允许白名单域名/组织。
2. 记录 `source_url + commit/tag + hash`。

2. 执行隔离
1. rootless 容器。
2. 默认禁网，按策略开最小白名单出网。
3. 只读根文件系统 + 限制 CPU/内存/时长。

3. 发布信任
1. 发布必须签名。
2. CLI 安装前必须验签。
3. 验签失败禁止安装。

4. 审计追踪
1. 每次 ingest/review/publish/install 产生日志。
2. 日志带关联 ID，支持追溯到来源与审批人。

## 8. 测试与验收场景
1. 功能测试
1. 白名单来源可检索并成功导入。
2. 非白名单来源被拒绝。
3. 单人审批后才可发布到 Gitea。
4. CLI 可搜索并安装已发布 skill。

2. 安全测试
1. 含危险命令模式的 skill 被静态扫描拦截。
2. 动态扫描发现越权行为时阻断发布。
3. 签名篡改后 CLI 安装失败。
4. 来源哈希不一致时阻断安装。

3. 稳定性测试
1. 批量导入 100+ skills 的队列稳定性。
2. Gitea 暂时不可用时发布重试与告警。
3. 索引刷新失败时回滚到上一版索引。

4. 验收标准（DoD）
1. 至少 1 条完整链路“搜索 -> 下载 -> 审核 -> 发布 -> npx 安装”稳定通过。
2. 所有发布工件均可追溯来源、审批与签名。
3. 高风险样本无法进入正式仓库。
4. API 与 CLI 文档可供团队直接使用。

## 9. 分阶段执行计划
1. Phase 0（1 周）基础设施
1. 搭建 Gitea、PostgreSQL、对象存储（可选）、私有 npm 源。
2. 初始化仓库结构与索引规范。

2. Phase 1（2 周）供应链主链路
1. 完成 ingest-worker、静态扫描、沙箱动态扫描。
2. 完成 review-console 最小页面与单人审批动作。
3. 完成 publisher 推送到 Gitea。

3. Phase 2（1 周）市场 API + CLI
1. 完成查询/详情/安装清单 API。
2. 发布 `skillsctl` 并支持 `npx` 安装验签。

4. Phase 3（1 周）强化与上线
1. 完成审计报表、告警、回滚机制。
2. 完成安全测试与上线演练。

## 10. 默认假设与已锁定决策
1. 当前仓库为空，将按 greenfield 新建项目结构。
2. 内网已有基础运行环境可部署 Gitea 与 Node 服务。
3. 审批按“单人审批”执行（即使整体安全策略为严格门禁）。
4. `npx` 通过私有 npm 源分发 `skillsctl`。
5. v1 不实现公开互联网访问，仅内网可用。
