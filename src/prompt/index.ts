const generateTopic = (ask: string, answer: string) => `
你的任务是给下面对话总结一个标题，标题提炼出来提问者的目标或者想法或者意图，不超过 10 个字。
对话内容：
  提问者：${ask}
  chat GPT: ${answer}

标题是：
`;

export { generateTopic };
