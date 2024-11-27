import { Configuration, OpenAIApi } from 'openai';

type SlackApiMessage = {
  user: string;
  text: string;
  ts: string;
};

export const fetchSlackThread = async (
  threadUrl: string,
  slackToken: string
): Promise<SlackApiMessage[]> => {
  // Extract channel ID and thread timestamp from URL
  // Implementation will depend on your Slack URL format
  const response = await fetch(`https://slack.com/api/conversations.replies`, {
    headers: {
      Authorization: `Bearer ${slackToken}`,
    },
  });

  const data = await response.json();
  return data.messages.map((msg: SlackApiMessage) => ({
    user: msg.user,
    text: msg.text,
    timestamp: msg.ts,
  }));
};

export const generateSummary = async (
  messages: SlackApiMessage[],
  openAiToken: string,
  prompt: string,
  language: string
): Promise<string> => {
  const configuration = new Configuration({
    apiKey: openAiToken,
  });
  const openai = new OpenAIApi(configuration);

  const conversationText = messages
    .map((msg) => `${msg.user}: ${msg.text}`)
    .join('\n');

  const systemPrompt =
    language === 'zh-Hant' ? '請用繁體中文回答' : 'Please respond in English';

  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `${prompt}\n\nConversation:\n${conversationText}`,
      },
    ],
  });

  return response.data.choices[0]?.message?.content || '';
};
