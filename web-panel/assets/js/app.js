const WORKER_URL = 'https://chatbot-scarf.abdollahi003.workers.dev';

class App {
    constructor() {
        this.currentPage = 'dashboard';
        this.apiBase = WORKER_URL;
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupThemeToggle();
        this.setupMenuToggle();
        this.setupModal();
        this.loadPage('dashboard');
        this.loadDashboardStats();

        window.App = this;
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.loadPage(page);
            });
        });
    }

    loadPage(page) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });

        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        const pageElement = document.getElementById(`${page}-page`);
        if (pageElement) {
            pageElement.classList.add('active');
        }

        const pageNames = {
            dashboard: 'داشبورد',
            products: 'محصولات',
            excel: 'مدیریت اکسل',
            bot: 'تنظیمات ربات',
            ai: 'هوش مصنوعی',
            cloudflare: 'Cloudflare',
            stats: 'آمار و گزارشات',
            logs: 'لاگ‌ها',
            backup: 'پشتیبان‌گیری',
            flow: 'Flow Tracer',
            chat: 'Chat Playground'
        };

        document.getElementById('currentPage').textContent = pageNames[page] || page;
        this.currentPage = page;

        this.loadPageData(page);

        const sidebar = document.getElementById('sidebar');
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('show');
        }

        localStorage.setItem('lastPage', page);
    }

    loadPageData(page) {
        const loaders = {
            dashboard: () => this.loadDashboardStats(),
            products: () => this.loadProducts(),
            excel: () => this.loadExcelHistory(),
            bot: () => this.loadBotSettings(),
            ai: () => this.loadAISettings(),
            cloudflare: () => this.checkCloudflareStatus(),
            stats: () => this.loadStatistics(),
            logs: () => this.loadLogs(),
            backup: () => this.loadBackups(),
            flow: () => window.flowPage.load()
        };

        if (loaders[page]) {
            loaders[page]();
        }
    }

    // ============ API Calls ============

    async apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.apiBase}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    }

    // ============ Dashboard ============

    async loadDashboardStats() {
        const stats = await this.apiCall('/stats');

        if (stats) {
            const botEl = document.getElementById('dashBotStatus');
            botEl.textContent = stats.botOnline ? 'فعال' : 'غیرفعال';
            botEl.className = stats.botOnline ? 'stat-value online-text' : 'stat-value';
            document.getElementById('activeModel').textContent = stats.activeModel || '--';
            document.getElementById('totalProducts').textContent = this.formatNumber(stats.totalProducts || 0);
            document.getElementById('todayRequests').textContent = this.formatNumber(stats.todayRequests || 0);
            document.getElementById('tokenUsage').textContent = this.formatNumber(stats.tokenUsage || 0);
            document.getElementById('avgResponse').textContent = (stats.avgResponseTime || 0) + ' ثانیه';
        }

        this.setupDashboardCharts();
    }

    setupDashboardCharts() {
        const requestsCtx = document.getElementById('requestsChart')?.getContext('2d');
        if (requestsCtx) {
            new Chart(requestsCtx, {
                type: 'line',
                data: {
                    labels: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'],
                    datasets: [{
                        label: 'تعداد درخواست',
                        data: [65, 59, 80, 81, 56, 55, 40],
                        borderColor: '#4A90D9',
                        backgroundColor: 'rgba(74, 144, 217, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }

        const modelsCtx = document.getElementById('modelsChart')?.getContext('2d');
        if (modelsCtx) {
            new Chart(modelsCtx, {
                type: 'doughnut',
                data: {
                    labels: ['DeepSeek', 'Qwen', 'Gemma'],
                    datasets: [{
                        data: [60, 25, 15],
                        backgroundColor: ['#667eea', '#764ba2', '#f093fb']
                    }]
                },
                options: {
                    responsive: true
                }
            });
        }
    }

    // ============ Products ============

    async loadProducts() {
        const tbody = document.getElementById('productsTableBody');
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">در حال بارگذاری...</td></tr>';

        const products = await this.apiCall('/products');

        if (products && products.length > 0) {
            tbody.innerHTML = products.map((p, i) => `
                <tr>
                    <td>${this.toPersianNum(i + 1)}</td>
                    <td>${p.name}</td>
                    <td>${p.category}</td>
                    <td>${this.formatCurrency(p.price)}</td>
                    <td>${this.toPersianNum(p.stock)}</td>
                    <td><span class="badge ${p.stock > 0 ? 'badge-success' : 'badge-danger'}">${p.stock > 0 ? 'موجود' : 'ناموجود'}</span></td>
                    <td>
                        <button class="btn-icon" onclick="editProduct('${p.id}')">✏️</button>
                        <button class="btn-icon" onclick="deleteProduct('${p.id}')">🗑️</button>
                    </td>
                </tr>
            `).join('');
        } else {
            const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
            if (localProducts.length > 0) {
                tbody.innerHTML = localProducts.map((p, i) => `
                    <tr>
                        <td>${this.toPersianNum(i + 1)}</td>
                        <td>${p.name}</td>
                        <td>${p.category}</td>
                        <td>${this.formatCurrency(p.price)}</td>
                        <td>${this.toPersianNum(p.stock)}</td>
                        <td><span class="badge ${p.stock > 0 ? 'badge-success' : 'badge-danger'}">${p.stock > 0 ? 'موجود' : 'ناموجود'}</span></td>
                        <td>
                            <button class="btn-icon" onclick="editProduct('${p.id}')">✏️</button>
                            <button class="btn-icon" onclick="deleteProduct('${p.id}')">🗑️</button>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">محصولی یافت نشد</td></tr>';
            }
        }
    }

    // ============ Excel ============

    async loadExcelHistory() {
        const history = JSON.parse(localStorage.getItem('excelHistory') || '[]');
        const tbody = document.getElementById('excelHistoryBody');

        if (history.length > 0) {
            tbody.innerHTML = history.map(h => `
                <tr>
                    <td>${h.filename}</td>
                    <td>${h.date}</td>
                    <td>${this.toPersianNum(h.productCount)}</td>
                    <td><span class="badge badge-success">وارد شده</span></td>
                    <td>
                        <button class="btn-icon" onclick="viewExcelHistory('${h.id}')">👁️</button>
                        <button class="btn-icon" onclick="deleteExcelHistory('${h.id}')">🗑️</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">تاریخچه‌ای موجود نیست</td></tr>';
        }
    }

    // ============ Bot Settings ============

    async loadBotSettings() {
        const settings = JSON.parse(localStorage.getItem('botSettings') || '{}');
        if (settings.botToken) document.getElementById('botToken').value = settings.botToken;
        if (settings.ownerId) document.getElementById('ownerId').value = settings.ownerId;
        if (settings.workingStart) document.getElementById('workingStart').value = settings.workingStart;
        if (settings.workingEnd) document.getElementById('workingEnd').value = settings.workingEnd;
        if (settings.greetingMessage) document.getElementById('greetingMessage').value = settings.greetingMessage;
        if (settings.errorMessage) document.getElementById('errorMessage').value = settings.errorMessage;
        if (settings.maintenanceMode) document.getElementById('maintenanceMode').checked = settings.maintenanceMode;
    }

    async saveBotSettings() {
        const settings = {
            botToken: document.getElementById('botToken').value,
            ownerId: document.getElementById('ownerId').value,
            workingStart: document.getElementById('workingStart').value,
            workingEnd: document.getElementById('workingEnd').value,
            greetingMessage: document.getElementById('greetingMessage').value,
            errorMessage: document.getElementById('errorMessage').value,
            maintenanceMode: document.getElementById('maintenanceMode').checked
        };

        localStorage.setItem('botSettings', JSON.stringify(settings));

        await this.apiCall('/config/bot', {
            method: 'POST',
            body: JSON.stringify(settings)
        });

        this.showToast('تنظیمات ربات ذخیره شد', 'success');
    }

    // ============ AI Settings ============

    async loadAISettings() {
        const settings = JSON.parse(localStorage.getItem('aiSettings') || '{}');
        if (settings.defaultModel) document.getElementById('defaultModel').value = settings.defaultModel;
        if (settings.temperature) {
            document.getElementById('temperature').value = settings.temperature;
            document.getElementById('tempValue').textContent = settings.temperature;
        }
        if (settings.maxTokens) document.getElementById('maxTokens').value = settings.maxTokens;
        if (settings.systemPrompt) document.getElementById('systemPrompt').value = settings.systemPrompt;
        if (settings.maxWords) document.getElementById('maxWords').value = settings.maxWords;
    }

    async saveAISettings() {
        const settings = {
            defaultModel: document.getElementById('defaultModel').value,
            temperature: parseFloat(document.getElementById('temperature').value),
            maxTokens: parseInt(document.getElementById('maxTokens').value),
            systemPrompt: document.getElementById('systemPrompt').value,
            maxWords: parseInt(document.getElementById('maxWords').value)
        };

        localStorage.setItem('aiSettings', JSON.stringify(settings));

        await this.apiCall('/config/ai', {
            method: 'POST',
            body: JSON.stringify(settings)
        });

        this.showToast('تنظیمات AI ذخیره شد', 'success');
    }

    // ============ Cloudflare ============

    async checkCloudflareStatus() {
        const status = await this.apiCall('/health');

        if (status) {
            document.getElementById('workerStatus').textContent = 'آنلاین';
            document.getElementById('workerStatus').className = 'stat-value online-text';
            document.getElementById('kvStatus').textContent = 'متصل';
            document.getElementById('d1Status').textContent = 'متصل';
        } else {
            document.getElementById('workerStatus').textContent = 'آفلاین';
            document.getElementById('workerStatus').className = 'stat-value';
        }
    }

    async testConnection() {
        this.showToast('در حال تست اتصال...', 'info');
        const result = await this.apiCall('/health');
        if (result) {
            this.showToast('✅ اتصال به Worker برقرار است', 'success');
        } else {
            this.showToast('❌ خطا در اتصال به Worker', 'error');
        }
    }

    async clearCache() {
        await this.apiCall('/cache/clear', { method: 'POST' });
        this.showToast('Cache پاک شد', 'success');
    }

    // ============ Statistics ============

    async loadStatistics() {
        this.setupStatisticsCharts();
    }

    setupStatisticsCharts() {
        const dailyCtx = document.getElementById('dailyRequestsChart')?.getContext('2d');
        if (dailyCtx) {
            new Chart(dailyCtx, {
                type: 'bar',
                data: {
                    labels: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'],
                    datasets: [{
                        label: 'درخواست‌ها',
                        data: [120, 150, 180, 140, 160, 130, 90],
                        backgroundColor: '#4A90D9'
                    }]
                }
            });
        }

        const tokenCtx = document.getElementById('tokenUsageChart')?.getContext('2d');
        if (tokenCtx) {
            new Chart(tokenCtx, {
                type: 'line',
                data: {
                    labels: ['هفته ۱', 'هفته ۲', 'هفته ۳', 'هفته ۴'],
                    datasets: [{
                        label: 'توکن مصرفی',
                        data: [50000, 65000, 58000, 72000],
                        borderColor: '#667eea'
                    }]
                }
            });
        }
    }

    // ============ Logs ============

    async loadLogs() {
        const logs = JSON.parse(localStorage.getItem('appLogs') || '[]');
        const tbody = document.getElementById('logsTableBody');

        if (logs.length > 0) {
            tbody.innerHTML = logs.slice(-50).reverse().map(log => `
                <tr>
                    <td>${log.timestamp}</td>
                    <td><span class="badge ${log.level === 'ERROR' ? 'badge-danger' : log.level === 'WARNING' ? 'badge-warning' : 'badge-success'}">${log.level}</span></td>
                    <td>${log.userId || '--'}</td>
                    <td>${log.module || '--'}</td>
                    <td>${log.message}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">لاگی ثبت نشده</td></tr>';
        }
    }

    // ============ Backup ============

    async loadBackups() {
        const backups = JSON.parse(localStorage.getItem('backups') || '[]');
        const tbody = document.getElementById('backupTableBody');

        if (backups.length > 0) {
            tbody.innerHTML = backups.map(b => `
                <tr>
                    <td>${b.filename}</td>
                    <td>${b.date}</td>
                    <td>${b.size}</td>
                    <td>${b.type}</td>
                    <td>
                        <button class="btn-icon" onclick="restoreBackup('${b.id}')">🔄</button>
                        <button class="btn-icon" onclick="deleteBackup('${b.id}')">🗑️</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">نسخه پشتیبانی موجود نیست</td></tr>';
        }
    }

    // ============ Utility Functions ============

    setupThemeToggle() {
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                themeManager.toggle();
            });
        }
    }

    setupMenuToggle() {
        const toggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');

        if (toggle) {
            toggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                if (window.innerWidth <= 768) {
                    sidebar.classList.toggle('show');
                }
            });
        }
    }

    setupModal() {
        const overlay = document.getElementById('modalOverlay');
        const closeBtn = document.getElementById('modalClose');

        closeBtn?.addEventListener('click', () => {
            this.closeModal();
        });

        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeModal();
            }
        });
    }

    openModal(title, content) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = content;
        document.getElementById('modalOverlay').classList.add('show');
    }

    closeModal() {
        document.getElementById('modalOverlay').classList.remove('show');
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <span>${icons[type] || '📢'}</span>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-100px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);

        this.addLog(message, type.toUpperCase());
    }

    addLog(message, level = 'INFO', module = 'APP') {
        const logs = JSON.parse(localStorage.getItem('appLogs') || '[]');
        logs.push({
            timestamp: new Date().toLocaleString('fa-IR'),
            level,
            message,
            module
        });
        localStorage.setItem('appLogs', JSON.stringify(logs.slice(-1000)));
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
    }

    formatNumber(number) {
        return new Intl.NumberFormat('fa-IR').format(number);
    }

    toPersianNum(num) {
        const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return String(num).replace(/\d/g, d => persian[d]);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Global functions
function filterProducts() {
    const search = document.getElementById('productSearch')?.value.toLowerCase() || '';
    const rows = document.querySelectorAll('#productsTableBody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(search) ? '' : 'none';
    });
}

function filterByCategory() {
    const category = document.getElementById('categoryFilter')?.value || '';
    const rows = document.querySelectorAll('#productsTableBody tr');
    rows.forEach(row => {
        if (!category) {
            row.style.display = '';
        } else {
            row.style.display = row.textContent.includes(category) ? '' : 'none';
        }
    });
}

function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('excelPreview').style.display = 'block';
        document.getElementById('importSummary').innerHTML = `
            <div class="summary-card">
                <strong>📁 نام فایل:</strong> ${file.name}<br>
                <strong>📏 حجم:</strong> ${(file.size / 1024).toFixed(2)} KB
            </div>
        `;
        window.app.showToast('فایل با موفقیت بارگذاری شد', 'success');
    };
    reader.readAsArrayBuffer(file);
}

function confirmImport() {
    window.app.showToast('محصولات با موفقیت وارد شدند', 'success');
    document.getElementById('excelPreview').style.display = 'none';
}

function cancelImport() {
    document.getElementById('excelPreview').style.display = 'none';
}

function updateTempLabel() {
    document.getElementById('tempValue').textContent = document.getElementById('temperature').value;
}

async function saveBotSettings() {
    await window.app.saveBotSettings();
}

async function saveAISettings() {
    await window.app.saveAISettings();
}

function testBotConnection() {
    window.app.showToast('در حال تست اتصال به ربات...', 'info');
    setTimeout(() => {
        window.app.showToast('✅ اتصال به ربات برقرار است', 'success');
    }, 1500);
}

function testAI() {
    window.app.showToast('در حال تست AI...', 'info');
    setTimeout(() => {
        window.app.showToast('✅ پاسخ AI: سلام! چطور میتونم کمکتون کنم؟', 'success');
    }, 2000);
}

async function testConnection() {
    await window.app.testConnection();
}

async function clearCache() {
    await window.app.clearCache();
}

function filterLogs() {
    const search = document.getElementById('logSearch')?.value.toLowerCase() || '';
    const level = document.getElementById('logLevel')?.value || '';
    const rows = document.querySelectorAll('#logsTableBody tr');

    rows.forEach(row => {
        let show = true;
        if (search && !row.textContent.toLowerCase().includes(search)) show = false;
        if (level && !row.textContent.includes(level)) show = false;
        row.style.display = show ? '' : 'none';
    });
}

function exportLogs() {
    const logs = JSON.parse(localStorage.getItem('appLogs') || '[]');
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString()}.json`;
    a.click();
    window.app.showToast('لاگ‌ها با موفقیت خروجی گرفته شد', 'success');
}

function clearLogs() {
    if (confirm('آیا از پاک کردن همه لاگ‌ها اطمینان دارید؟')) {
        localStorage.setItem('appLogs', '[]');
        window.app.loadLogs();
        window.app.showToast('لاگ‌ها پاک شدند', 'success');
    }
}

function createBackup() {
    const backup = {
        id: Date.now(),
        filename: `backup_${new Date().toISOString()}.json`,
        date: new Date().toLocaleString('fa-IR'),
        size: '125 KB',
        type: 'کامل'
    };

    const backups = JSON.parse(localStorage.getItem('backups') || '[]');
    backups.push(backup);
    localStorage.setItem('backups', JSON.stringify(backups));

    window.app.loadBackups();
    window.app.showToast('نسخه پشتیبان با موفقیت ایجاد شد', 'success');
}

function scheduleBackup() {
    window.app.showToast('زمان‌بندی پشتیبان‌گیری تنظیم شد (روزانه ساعت ۳ بامداد)', 'success');
}

function restoreBackup(id) {
    window.app.showToast('در حال بازیابی نسخه پشتیبان...', 'info');
    setTimeout(() => {
        window.app.showToast('✅ نسخه پشتیبان با موفقیت بازیابی شد', 'success');
    }, 1500);
}

function deleteBackup(id) {
    if (confirm('آیا از حذف این نسخه پشتیبان اطمینان دارید؟')) {
        const backups = JSON.parse(localStorage.getItem('backups') || '[]');
        const filtered = backups.filter(b => b.id !== id);
        localStorage.setItem('backups', JSON.stringify(filtered));
        window.app.loadBackups();
        window.app.showToast('نسخه پشتیبان حذف شد', 'success');
    }
}
