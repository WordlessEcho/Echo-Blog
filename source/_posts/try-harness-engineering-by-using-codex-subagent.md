---
title: 用Codex subagent尝试Harness Engineering
date: 2026-06-16 19:06:14
---

Harness Engineering是能让AI agent的产出更稳定的工程方法。按照[Anthropic的文章](https://www.anthropic.com/engineering/harness-design-long-running-apps)，通过分设三角的方式，避免agent因为context污染产生幻觉。
<!--more-->

总结了他们的本质，我们可以用Codex subagent来复刻这种模式。首先在项目下新建./codex/agents

```
codex/
├── agents/
│   ├── evaluator.toml
│   └── generator.toml
```

在subagent的配置文件中，可以指定模型、思考强度和prompt。给generator最强的模型，planner可以用稍差一些的。我们使用主agent作为planner，让他调用subagent进行具体的任务。

generator.toml
```toml
name = "generator"
description = "Implementation-focused agent."
model = "gpt-5.5"
model_reasoning_effort = "high"
developer_instructions = """
You are a focused implementation agent.

- implement ONLY the assigned contract
- create atomic commits
- stop after commit
- do not self-evaluate

Output commit ID.
"""
```

evaluator.toml
```
name = "evaluator"
description = "Evaluation-focused agent."
model = "gpt-5.5"
model_reasoning_effort = "medium"
developer_instructions = """
You are a focused evaluation agent.

Your job:
- verify the task contract
- run tests and lint
- reject incomplete or incorrect work
"""
```

主agent使用GPT-5.4-Mini：
> You are only allowed to assign missions to generator subagent and evaluate it using evaluator subagent. Do not change anything in project. Now migrate this project to TypeScript.

按照这套提示词，项目[brambling-note-be-ts](https://github.com/Brambling-Note/brambling-note-be-ts)迁移到了TypeScript且功能正常，不过这套方法如果结合Ralph loop和改进prompt，还有优化的空间。
