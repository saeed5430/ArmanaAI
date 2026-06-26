class ChatPlayground {
    constructor() {
        this.messages = [];
    }

    async send(text) {
        const input = document.getElementById('chatInput');
        const status = document.getElementById('chatStatus');
        const messages = document.getElementById('chatMessages');

        if (!text.trim()) return;

        input.value = '';
        input.style.height = 'auto';

        this.addMessage(text, 'user');

        status.innerHTML = '<span class="typing-dots">🤔 در حال فکر کردن</span>';
        status.className = 'chat-status typing';

        try {
            const response = await fetch(`${WORKER_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            if (!response.ok) {
                const err = await response.json();
                this.addMessage('❌ ' + (err.error || 'خطا در ارتباط با سرور'), 'bot');
                status.className = 'chat-status error';
                status.innerHTML = '❌ خطا';
                return;
            }

            const data = await response.json();
            this.addMessage(data.response, 'bot', data);
            status.className = 'chat-status';
            status.innerHTML = `✅ ${data.model} · ${data.latency_ms}ms · ${data.search_method}`;

        } catch (error) {
            this.addMessage('❌ خطا: ' + error.message, 'bot');
            status.className = 'chat-status error';
            status.innerHTML = '❌ خطا';
        }

        input.focus();
    }

    addMessage(text, role, meta = null) {
        const messages = document.getElementById('chatMessages');
        const time = new Date().toLocaleTimeString('fa-IR');

        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${role}`;

        const avatar = role === 'user' ? '👤' : '🤖';

        let metaHtml = '';
        if (meta) {
            metaHtml = `
                <div class="bubble-meta">
                    <span class="meta-item">🧠 ${meta.model}</span>
                    <span class="meta-item">⚡ ${meta.latency_ms}ms</span>
                    <span class="meta-item">🔍 ${meta.search_method} (${(meta.search_score * 100).toFixed(0)}%)</span>
                    ${meta.compressed ? `<span class="meta-item">📝 ${meta.compressed}</span>` : ''}
                    <span class="meta-item">📊 ${meta.tokens} tokens</span>
                </div>`;
        }

        bubble.innerHTML = `
            <div class="bubble-avatar">${avatar}</div>
            <div class="bubble-content">
                <p>${text}</p>
                <span class="bubble-time">${time}</span>
                ${metaHtml}
            </div>
        `;

        messages.appendChild(bubble);
        messages.scrollTop = messages.scrollHeight;
    }
}

const chatPlayground = new ChatPlayground();

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    chatPlayground.send(input.value);
}
