目录

1. [要点速览](#summary)
2. [大模型是什么](#llm)
3. [Agent 是什么](#agent)
4. [看一次真实运行](#run)
5. [出错时会怎样](#errors)
6. [pi 的三层代码](#layers)
7. [第一层：统一接口](#ai)
8. [第二层：循环本体](#core)
9. [第三层：写代码的 agent](#coding)
10. [下一步做什么](#next)
11. [术语表](#glossary)
12. [本页的写法](#method)

# 通过 pi 理解 AI Agent

这一页用 pi 项目的真实代码，解释 AI agent 怎样工作。你不需要任何 AI 背景。

**适合谁**会写代码，但没接触过 AI 的程序员

**读完你能**说清 agent 的工作原理，并知道该读哪些源码

**阅读时间**约 20 分钟

## 要点速览

1. 大模型像一个函数：输入一串消息，输出下一条消息。
2. 大模型不记得上一次调用。每次都要把全部历史重新发给它。
3. 大模型不会执行任何操作。它只会写出“我想调用某个工具”的请求，由程序去执行。
4. Agent 就是一个循环：问模型 → 执行它要的工具 → 把结果交给模型 → 再问，直到模型不再要工具。
5. 工具出错时，错误信息也交给模型。模型会读错误，然后自己改正。

## 大模型是什么

从程序员的角度，可以把大模型（LLM，large language model）看成这样一个函数：

```
llm(消息列表) → 一条新消息
```

新消息不是一次返回的，而是一小段一小段地“流”回来。所以你在聊天界面里会看到文字逐渐出现。

### 消息有四种角色

| 角色 | 谁写的 | 用途 |
| --- | --- | --- |
| `system` | 程序 | 告诉模型规则和背景，例如“你是编程助手” |
| `user` | 用户 | 用户的问题或指令 |
| `assistant` | 模型 | 模型的回答，可能包含工具调用请求 |
| `toolResult` | 程序 | 工具执行后的结果 |

定义位置：packages/ai/src/types.ts 第 491–553 行

### 三个必须知道的限制

**1. 模型按 token 计算长度。** token 是模型处理文本的单位。粗略地说，4 个英文字符约等于 1 个 token。pi 估算长度时就用“字符数 ÷ 4”。

**2. 每次请求有长度上限。** 这个上限叫上下文窗口（context window），例如 20 万 token。历史太长就放不下。

**3. 模型不记事。** 第二次调用时，模型完全不知道第一次说过什么。程序必须每次把完整历史重新发过去。

### 模型怎样“使用”工具

发送请求时，程序附上一份工具清单。每个工具有名字、说明和参数格式（用 JSON Schema 描述）。模型如果需要工具，就在回答里写一段结构化数据：

```
{ "type": "toolCall", "id": "call_1",
  "name": "read_file", "arguments": { "path": "config.json" } }
```

**关键点：**模型只写出请求，不执行它。读文件的是你的程序。程序执行完，把结果作为新消息加进历史，再调用一次模型。

## Agent 是什么

Agent 等于“模型 + 工具 + 循环”。整个循环只有四步：

1

把全部历史和工具清单发给模型，拿到回答。

2

把回答加进历史。回答里没有工具调用？任务完成，停止。

3

逐个执行回答里请求的工具。出错也要生成结果。

4

把每个工具结果加进历史。

↺ 回到第 1 步

写成代码是这样：

```
messages = [system, user]
while (true) {
  const reply = await llm(messages, tools)
  messages.push(reply)
  const calls = reply.content.filter(c => c.type === "toolCall")
  if (calls.length === 0) break          // 没有工具调用，结束
  for (const call of calls) {
    const result = await run(call)       // 出错也返回一个结果
    messages.push({ role: "toolResult", toolCallId: call.id, content: result })
  }
}
```

什么时候结束，由模型决定。pi 剩下的几万行代码，都是为了让这个循环更可靠、更好用。

## 看一次真实运行

下面的数据来自真实运行：用 pi 的 `Agent` 类，配一个按剧本回答的假模型和一个 `read_file` 工具。用户问“config.json 里的端口是多少？”。

点“下一步”，看历史一条一条增加。

**第 1 步，共 6 步**

注意两点：

- 第二次调用模型时，它收到的是 `[system, user, assistant, toolResult]`：整个历史又发了一遍。
- `stopReason` 说明模型为什么停下。`toolUse` 表示要调用工具，`stop` 表示说完了，`length` 表示输出太长被截断。

## 出错时会怎样

Agent 不会因为工具出错而崩溃。错误信息会作为一条结果（标记 `isError: true`）交给模型。下面是另一次真实运行：模型先写错参数名，再写错文件名，最后改对。

```
模型: read_file({"file": "config.json"})
结果: 出错 —— Validation failed for tool "read_file":
        - path: must have required properties path
模型: read_file({"path": "conf.json"})
结果: 出错 —— File not found: conf.json
模型: read_file({"path": "config.json"})
结果: { "port": 8080 }
模型: The port is 8080.
```

所以，写给模型的错误信息要像写给人的一样清楚：说明错在哪里，怎样改。

## pi 的三层代码

pi 把代码分成三层，下层不知道上层的存在。

| 层 | 目录 | 负责什么 |
| --- | --- | --- |
| pi-ai | packages/ai | 和 40 多家模型服务商通信，把它们不同的格式统一成一种 |
| pi-agent-core | packages/agent | 运行上面那个循环：调用模型、检查并执行工具、发出事件 |
| pi-coding-agent | packages/coding-agent | 具体工具、系统提示词、保存会话、压缩历史、终端界面 |

**第一遍可以跳过：**packages/agent/src/harness 和 packages/coding-agent/src/experimental。这两处是实验性的新代码，主程序没有用到。

## 第一层：统一接口

### 它解决什么问题

同一件事，各家服务商的写法不同。例如在 pi 里，工具结果是一条单独的 `toolResult` 消息；Anthropic 却要求把它放进一条 `user` 消息，写成 `tool_result` 块。

### 它怎样解决

每种接口格式配一个翻译模块（适配器）。以 Anthropic 为例：

- **发出请求时**，把 pi 的消息翻译成 Anthropic 的格式。anthropic-messages.ts 第 1226 行 convertMessages
- **接收回答时**，服务器通过一条一直打开的连接不断推送数据（这种方式叫 SSE）。适配器把每段数据翻译成统一的事件，如“新增文字”“新增工具参数”“完成”。第 601–789 行
- **翻译停止原因**，例如把 `end_turn` 翻译成 `stop`。第 1494 行 mapStopReason

### 值得学习的一条约定

请求失败时，适配器不抛出异常，而是返回一条 `stopReason` 为 `error` 的消息。这样循环总能拿到一条消息，不用到处处理异常。types.ts 第 335 行

## 第二层：循环本体

核心代码在 packages/agent/src/agent-loop.ts 的 `runLoop` 函数（第 162 行）。建议完整读一遍。

### 每个工具调用要经过 7 步

1. 按名字找到工具。找不到，就返回错误结果。
2. 修正模型常犯的格式错误（`prepareArguments`）。
3. 按参数格式检查参数。不合格，就返回上面看到的那种错误。
4. 调用 `beforeToolCall`。它可以阻止执行，例如用来做权限确认。
5. 执行工具。工具抛出的异常会变成错误结果。
6. 调用 `afterToolCall`。它可以修改结果。
7. 生成 `toolResult` 消息，加进历史。

### 三个设计细节

**输出被截断时，不执行工具。** 如果 `stopReason` 是 `length`，工具参数可能只写了一半，但看起来仍然有效。pi 会拒绝执行，并让模型重新发出请求。第 263 行

**工具并行执行，结果按顺序保存。** 一条回答里有多个工具调用时，它们同时运行，但结果按原来的顺序写入历史。第 583、643 行

**用户可以中途插话。** 用 `steer()` 发的消息，在当前这批工具执行完后插入；用 `followUp()` 发的消息，等 agent 本该停下时才插入。第 294、301 行

## 第三层：会写代码的 agent

默认有四个工具：`read`（读文件）、`bash`（运行命令）、`edit`（修改文件）、`write`（写文件）。有了 bash，模型可以自己搜索代码、运行测试。

### 工具的输出是写给模型看的

文件太长时，read 只返回前 2000 行，并在末尾写上：

```
[Showing lines 1-2000 of 5000. Use offset=2001 to continue.]
```

模型读到这句话，就会自己再读下一段。read.ts 第 163–173 行

edit 不用行号，而是让模型给出要替换的原文和新文本，原文必须在文件中唯一。原因是模型数行号不可靠，而原文对不上时可以立即报错。edit.ts 第 21 行

### 系统提示词

系统提示词按段拼成：身份说明、工具清单、规则、项目说明文件（如 `AGENTS.md` 的原文）、当前目录。项目里的 AGENTS.md 能改变 pi 的行为，就是因为它被直接放进了提示词。system-prompt.ts 第 121 行

### 历史太长时：压缩

**问题：**历史只增不减，迟早超过上下文窗口。

**例子：**模型窗口是 200,000 token，pi 预留 16,384 token。历史超过 183,616 token 时，开始压缩。

**做法：**

1. 保留最近约 20,000 token 的原文。切分点不能落在工具结果上，因为工具结果必须紧跟它的调用请求。
2. 请模型把更早的部分总结成固定格式：目标、进度、关键决定、下一步。
3. 用这份总结代替被删掉的旧历史。

compaction.ts 第 148、289、529 行

### 为什么历史只追加、不修改

每次请求都重发整个历史，所以服务商会缓存相同的开头部分。命中缓存更便宜也更快。如果改动了开头，缓存就失效。因此 pi 中途修改提示词或工具时，不改原来的消息，而是在末尾追加一条新的 system 消息。anthropic-messages.ts 第 1115 行

## 下一步做什么

### 按这个顺序读源码

1. packages/agent/README.md：概念和事件顺序
2. packages/ai/src/types.ts 第 364–668 行：消息和工具的类型
3. packages/agent/src/agent-loop.ts：全文，这是核心
4. packages/agent/src/agent.ts
5. packages/ai/src/api/anthropic-messages.ts：convertMessages 和 stream
6. packages/coding-agent/src/core/tools/read.ts、edit.ts、system-prompt.ts
7. packages/coding-agent/src/core/compaction/compaction.ts

### 动手运行

在仓库根目录运行 agent 循环的单元测试（35 个，不需要 API key）：

```
node node_modules/vitest/dist/cli.js --run --root packages/agent test/agent-loop.test.ts
```

### 三个小练习

1. 让模型在一条回答里调用两个工具，观察它们怎样并行执行。
2. 加一个 `beforeToolCall`，阻止读取某个文件，看模型收到什么。
3. 把模型回答的 `stopReason` 改成 `length`，验证截断保护。

## 术语表

LLM / 大模型

根据输入文本生成后续文本的模型，例如 Claude、GPT。

token

模型计算文本长度的单位。约 4 个英文字符为 1 个 token。

上下文窗口

一次请求能放入的最大 token 数。

系统提示词

程序写给模型的规则和背景，放在 system 消息里。

工具调用

模型在回答中写出的请求，说明要用哪个工具、传什么参数。

stopReason

模型停止输出的原因：stop、toolUse、length、error 等。

轮（turn）

一次模型调用，加上它请求的所有工具执行。

适配器

把 pi 的统一格式与某家服务商的格式互相翻译的模块。

SSE

Server-Sent Events。服务器通过一条持续打开的连接，不断推送数据。

压缩

把旧历史总结成短文，让对话能继续进行。

提示词缓存

服务商缓存相同的请求开头，下次请求更快、更便宜。

## 本页的写法

本页按 ISO 24495-1:2023《简明语言》的四项原则编写。这是作者按标准自查的结果，未经第三方评估。

| 原则 | 本页的做法 |
| --- | --- |
| 相关 | 开头写明读者和阅读目的；只讲理解 agent 必需的内容，省略界面、扩展等细节。 |
| 易找到 | 侧边目录；要点放在最前面；标题直接说明该节内容。 |
| 易理解 | 短句；首次出现的术语当场解释，并汇总在术语表；每个概念配一个真实例子；术语前后一致。 |
| 易使用 | 给出源码位置、阅读顺序、可直接运行的命令和练习。 |

标准建议请目标读者试读并验证。如果某一节读不懂，请告诉我是哪一节，我会改写。

内容基于 pi v0.87.1 源码。行号对应该版本。