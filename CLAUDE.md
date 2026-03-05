# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Skills Factory 是一个内部技能市场管理系统，用于存储、管理和分发 AI Agent 技能（Skills）。该项目从 GitHub 等来源安装技能包，并在本地进行管理。

## Directory Structure

```
skills-factory/
├── skills/                    # 已安装的技能包（从外部源安装）
│   └── <skill-name>/
│       └── SKILL.md           # 技能定义文件（必需）
│       └── references/        # 参考文档（可选）
├── .agents/skills/            # 代理使用的技能副本（运行时使用）
├── .agent/                    # 代理配置目录（预留）
└── skills-lock.json          # 技能锁定文件，记录来源和哈希
```

## Skills Lock File

`skills-lock.json` 跟踪已安装技能的元信息：

```json
{
  "version": 1,
  "skills": {
    "<skill-name>": {
      "source": "owner/repo",           // GitHub 源
      "sourceType": "github",           // 源类型
      "computedHash": "sha256..."       // 内容哈希
    }
  }
}
```

## Skill Structure

每个技能包遵循以下结构：

- **SKILL.md**: 技能定义文件，包含 YAML frontmatter 和 Markdown 内容
  - `name`: 技能名称
  - `description`: 技能描述（用于触发匹配）
  - `version`: 可选版本号

- **references/**: 可选的参考文档目录，存放详细的技术文档

## Adding New Skills

1. 创建 `skills/<skill-name>/` 目录
2. 添加 `SKILL.md` 文件，包含必要的 YAML frontmatter
3. 可选添加 `references/` 目录存放参考文档
4. 更新 `skills-lock.json` 记录来源信息

## Skill Description Guidelines

技能的 `description` 字段用于触发匹配，应遵循以下原则：

- 明确描述技能的用途和适用场景
- 包含关键词以便匹配用户请求
- 描述触发条件（"Use when..." 或 "使用场景..."）
