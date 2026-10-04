---
title: An Initial Exploration of Agent Development
date: 2026-10-01 21:31:09
---

To be honest, it is easier than I expected to build an agent. Tool calling is really straightforward, which shows how powerful LLMs have become through training! It used to be not that easy for LLMs to generate [Structured Outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/).
<!--more-->

# Chat Completions API
Let's start with the Create Chat Completion API. The endpoint looks like this:
```
https://<API_URL>/v1/chat/completions
```

Constructing the request body:
```typescript
{
  model: 'global:deepseek-v4.1-flash',
  messages: [
    { role: 'user', content: 'Hi!' },
  ],
}
```

Sending a request in TypeScript:
```typescript
(async () => {
  const response = await fetch('http://<API_URL>/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({
      model: 'global:deepseek-v4.1-flash',
      messages: [
        { role: 'user', content: 'Hi!' },
      ],
    }),
  });
  const data = await response?.json();

  // console.log only inspects up to a depth of 2 by default
  console.dir(data, { depth: null });
})();
```

```typescript
{
  choices: [
    {
      finish_reason: 'stop',
      index: 0,
      message: {
        content: 'Hi! How can I help you today?',
        reasoning_content: 'We need answer user just Hi. Need greet. Should be concise. Need maybe ask how can help. No issue. We can just respond.',
        role: 'assistant'
      }
    }
  ],
  created: 1790847223,
  id: '8b9d03b7d408dfc9b3f39d2f8943495f',
  model: 'deepseek-v4.1-flash',
  object: 'chat.completion',
  usage: {
    // ...
    total_tokens: 77
  }
}
```

# Context
Because LLMs are stateless, we need to store message history and send all previous messages with each new request.
```typescript
let messages: Message[] = [];

// ...

messages = messages.concat({
  role: 'user',
  content: input,
});

// ...

messages = messages.concat(reply);
```

Start an infinite loop to keep receiving user input:
```typescript
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Loop to keep asking user input
while (true) {
  const input = await rl.question('> ');
  // ...
}
```

Now we have a working chatbot!
```
> Hi!
CoT:   The user just said "Hi!" - a simple greeting. I should respond warmly and openly, inviting them to share what they need. No need for tools or complex reasoning here. Keep it natural and friendly.

Reply: Hi there! How can I help you today?
> What can you do?
CoT:   We need answer. User asks "What can you do?" We should respond helpfully. Need maybe concise list. We are API assistant. Should mention capabilities: answer questions, explain concepts, write/edit text, brainstorm, summarize, translate, code, math, planning, etc. Also limitations: no real-time unless tools? We don't have tools in this environment? We can say I can't browse internet or access personal data unless provided. We can ask what they need. Keep friendly. Desired oververbosity 5. Maybe bullet list. Ensure not too long. We can say: I can help with learning, writing, coding, analysis, brainstorming, everyday tasks. Examples. Also mention I can handle files? In this interface maybe not. Since we don't know, better general: "If you paste text or upload content where supported..." But no uploads? The assistant may have file reading capabilities? The system doesn't mention tools. We shouldn't promise. We can say "I can work with text you share." Could mention languages. Also clarify no memory? We can say within this chat. Let's craft. Maybe start: "I'm a general-purpose AI assistant. I can help you..." Then categories with examples. Then "I can't access the internet, external accounts, or real-time info by default, and I may make mistakes—so verify important facts." Then ask what they'd like to do. That's good.

Reply: I'm a general-purpose AI assistant. I can help you with things like:

- **Answering questions** and explaining concepts
- **Writing and editing** — emails, essays, resumes, posts, summaries
- **Coding** — writing, debugging, explaining code in many languages
- **Math and logic** — calculations, step-by-step solutions
- **Brainstorming** — ideas, names, plans, project outlines
- **Learning** — tutoring, practice questions, study plans
- **Translating** and improving text in different languages
- **Analyzing text** you share — pros/cons, themes, arguments, etc.

I can also help with everyday tasks like making schedules, drafting messages, comparing options, or organizing information.

A few limitations: I don’t have live internet access or real-time data by default, and I can’t access your accounts or private info unless you tell me. I can also make mistakes, so it’s good to verify important details.

What would you like help with?
> 
```

# Tool use
Now we can add bash capabilities to the model. First, let's define the tools schema:
```typescript
const tools = [
  {
    type: 'function',
    function: {
      name: 'bash',
      description: 'Execute bash commands',
      parameters: {
        type: 'object',
        properties: {
          commands: {
            type: 'string',
            description: 'Shell command to execute',
          },
        },
        required: ['commands'],
      },
    },
  }
];

// ...

const completions = async (m: Message[]) => {
  const data = await fetch('http://<API_URL>/v1/chat/completions', {
    // ...

    body: JSON.stringify({
      // ...
      tools: tools,
    }),
  });

  // ...
};
```

A simple helper function to execute `bash -c`:
```typescript
const bash = (id: string, parameters: string): Message => ({
  role: 'tool',
  content: execSync(`bash -c ${parameters}`).toString(),
  tool_call_id: id,
});
```

If `finish_reason` is `stop`, return to waiting for user input. Otherwise, execute the tool and send the result back to the model:
```typescript
// Loop to keep asking user input
while (true) {
  const input = await rl.question('> ');

  // ...

  // Loop to check `finish_reason`
  while (true) {
    const data = await completions(messages);
  
    // ...
  
    const finishReason = data.choices[0].finish_reason;
    // Back to user input
    if (finishReason === 'stop') {
      break;
    }
  
    // TODO
  }
}
```

The API returns the requested tool call and its arguments in our specified schema. Since executing commands generated by the model carries real risk, we prompt the user for confirmation before execution, and then send the result back to the model:
```typescript
switch (finishReason) {
  case 'tool_calls':
    // ...

    for (const toolCall of reply.tool_calls) {
      switch (toolCall?.function?.name) {
        case 'bash':
          try {
            // Stringify JSON as {@link tools.function.parameters.properties} requested
            const args = JSON.parse(toolCall.function.arguments);

            // Confirm before executing the bash command
            console.log(`bash:  ${args?.commands}`);
            const confirm = await rl.question('Execute? (y) ');
            if (confirm !== 'y' && confirm !== 'yes') {
              // TODO: Inform the model that user refused to execute
              console.log('Tool use of `bash` canceled');
              return;
            }
            console.log('');

            // Append result to messages then go back to API requesting loop
            const result = bash(toolCall.id, args?.commands);
            messages = messages.concat(result);
          } // ...
          // ...

          // ...
      }
    }
}
```

Finally, we have built an agent! With the power of bash, it can perform almost any task.
```
> Where is my working directory?
CoT:   The user asks where their working directory is. I can run a bash command to find out.

Reply:
bash:  pwd
Execute? (y) y

CoT:   The user asked where their working directory is. I ran pwd and got /mnt/c/files/src/learn-building-agent. Let me report that.

Maybe also list contents to be helpful. But the question is simple. Let me just answer, maybe with a brief listing.

Reply: Your working directory is:

\```
/mnt/c/files/src/learn-building-agent
\```

That's the result of `pwd` — the current directory where commands will run.
```

### Context Structure
Behind the scenes, the complete `messages` array passed to the model across this interaction demonstrates how state is maintained throughout the tool calling lifecycle:
```typescript
[
  {
    role: 'system',
    content: 'You are an agent.\n' +
      '\n' +
      '    <tools>\n' +
      '    - bash: Execute bash commands\n' +
      '    </tools>\n' +
      '    '
  },
  { role: 'user', content: 'Where is my working directory?' },
  {
    content: '',
    reasoning_content: "The user asks where their working directory is. I can run a bash command to find out.",
    role: 'assistant',
    tool_calls: [
      {
        function: { arguments: '{"commands": "pwd"}', name: 'bash' },
        id: 'call_00_ET_GoI4NCDixpippSR6U6bb9060',
        index: 0,
        type: 'function'
      }
    ]
  },
  {
    role: 'tool',
    content: '/mnt/c/files/src/learn-building-agent\n',
    tool_call_id: 'call_00_ET_GoI4NCDixpippSR6U6bb9060'
  },
  {
    content: 'Your working directory is:\n' +
      '\n' +
      '```\n' +
      '/mnt/c/files/src/learn-building-agent\n' +
      '```\n' +
      '\n' +
      'That\'s the result of `pwd` — the current directory where commands will run.',
    reasoning_content: 'The user asked where their working directory is. I ran pwd and got /mnt/c/files/src/learn-building-agent. Let me report that.\n' +
      '\n' +
      'Maybe also list contents to be helpful. But the question is simple. Let me just answer, maybe with a brief listing.',
    role: 'assistant'
  }
]
```

# Reference
- [Create chat completion | OpenAI API Reference](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)
- [Fetch API - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [Accept input from the command line in Node.js | Node.js Learn](https://nodejs.org/learn/command-line/accept-input-from-the-command-line-in-nodejs)

For Chinese readers, also check out these related notes (generated by Opus 5.5):
- [Learning pi agent and its codes](https://github.com/WordlessEcho/Echo-Blog/tree/main/source/agent-sessions/learning-pi-and-its-codes/3d258a0f-b65f-4d79-84f3-edabee85793d.jsonl)
- [pi agent 入门](https://github.com/WordlessEcho/Echo-Blog/tree/main/source/agent-sessions/learning-pi-and-its-codes/pi-Agent-入门.md)
