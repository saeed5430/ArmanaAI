import config from '../config.js';

export function createEitaaClient() {
  const botToken = config.EITAA_BOT_TOKEN;
  const baseUrl = `https://tapi.bale.ai/bot${botToken}`;

  async function callMethod(method, params = {}) {
    const url = `${baseUrl}/${method}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await response.json();
      return data;
    } catch {
      return { ok: false };
    }
  }

  return {
    async sendMessage(chatId, text) {
      return callMethod('sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'HTML'
      });
    },

    async sendTyping(chatId) {
      return callMethod('sendChatAction', {
        chat_id: chatId,
        action: 'typing'
      });
    },

    async setWebhook(url) {
      return callMethod('setWebhook', { url });
    },

    async getWebhookInfo() {
      return callMethod('getWebhookInfo');
    },

    parseUpdate(body) {
      if (!body || !body.message) return null;

      const { message } = body;
      if (!message.text && !message.caption) return null;

      return {
        updateId: body.update_id,
        messageId: message.message_id,
        chatId: String(message.chat?.id || ''),
        userId: String(message.from?.id || ''),
        text: message.text || message.caption || '',
        timestamp: message.date || Math.floor(Date.now() / 1000)
      };
    }
  };
}
