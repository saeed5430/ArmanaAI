class FlowTracerPage {
    constructor() {
        this.selectedRow = null;
        this.distributionChart = null;
        this.latencyChart = null;
    }

    async load() {
        await Promise.all([
            this.loadStats(),
            this.loadLogs()
        ]);
    }

    async loadStats() {
        try {
            const response = await fetch(`${WORKER_URL}/flow-stats`);
            if (!response.ok) return;
            const data = await response.json();
            const stats = data.byPath || data;
            this.renderStats(stats);
            this.renderDistributionChart(stats);
            this.renderLatencyChart(stats);
        } catch (error) {
            console.error('Error loading flow stats:', error);
        }
    }

    async loadLogs() {
        try {
            const response = await fetch(`${WORKER_URL}/flow-logs?limit=50`);
            if (!response.ok) return;
            const logs = await response.json();
            this.renderLogs(logs);
        } catch (error) {
            console.error('Error loading flow logs:', error);
            document.getElementById('flowTableBody').innerHTML =
                '<tr><td colspan="6" style="text-align:center">❌ خطا در بارگذاری</td></tr>';
        }
    }

    renderStats(stats) {
        if (!Array.isArray(stats)) return;
        const statMap = {};
        stats.forEach(s => { statMap[s.flow_path] = s; });

        document.getElementById('statCache').textContent =
            (statMap.cache?.percentage || 0) + '%';
        document.getElementById('statKeyword').textContent =
            ((statMap.keyword_high?.percentage || 0) + (statMap.keyword_medium?.percentage || 0)).toFixed(1) + '%';
        document.getElementById('statSQL').textContent =
            (statMap.sql?.percentage || 0) + '%';
        document.getElementById('statFailed').textContent =
            (statMap.failed?.percentage || 0) + '%';
    }

    renderDistributionChart(stats) {
        const ctx = document.getElementById('flowDistributionChart')?.getContext('2d');
        if (!ctx || !Array.isArray(stats) || stats.length === 0) return;

        if (this.distributionChart) {
            this.distributionChart.destroy();
        }

        const labels = {
            cache: '⚡ Cache Hit',
            keyword_high: '✓ Keyword High',
            keyword_medium: '⚠️ Keyword Medium',
            sql: '🧠 Text-to-SQL',
            failed: '❌ Failed'
        };

        const colors = {
            cache: '#4caf50',
            keyword_high: '#2196f3',
            keyword_medium: '#ff9800',
            sql: '#ff5722',
            failed: '#f44336'
        };

        this.distributionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: stats.map(s => labels[s.flow_path] || s.flow_path),
                datasets: [{
                    data: stats.map(s => s.count),
                    backgroundColor: stats.map(s => colors[s.flow_path] || '#999'),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        rtl: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const s = stats[context.dataIndex];
                                return context.label + ': ' + context.parsed + ' (' + (s.percentage || 0) + '%)';
                            }
                        }
                    }
                }
            }
        });
    }

    renderLatencyChart(stats) {
        const ctx = document.getElementById('flowLatencyChart')?.getContext('2d');
        if (!ctx || !Array.isArray(stats) || stats.length === 0) return;

        if (this.latencyChart) {
            this.latencyChart.destroy();
        }

        const labels = {
            cache: 'Cache',
            keyword_high: 'Keyword H',
            keyword_medium: 'Keyword M',
            sql: 'SQL',
            failed: 'Failed'
        };

        this.latencyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: stats.map(s => labels[s.flow_path] || s.flow_path),
                datasets: [{
                    label: 'میانگین تاخیر (ms)',
                    data: stats.map(s => s.avg_latency || 0),
                    backgroundColor: '#4A90D9',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'میلی‌ثانیه'
                        }
                    }
                }
            }
        });
    }

    renderLogs(logs) {
        const tbody = document.getElementById('flowTableBody');
        if (!Array.isArray(logs) || logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">هیچ داده‌ای ثبت نشده</td></tr>';
            return;
        }

        const pathNames = {
            cache: '⚡ Cache Hit',
            keyword_high: '✓ Keyword High',
            keyword_medium: '⚠️ Keyword Medium',
            sql: '🧠 Text-to-SQL',
            failed: '❌ Failed',
            pending: '⏳ Pending'
        };

        tbody.innerHTML = logs.map(log => {
            const time = new Date(log.timestamp).toLocaleString('fa-IR');
            const pathName = pathNames[log.flow_path] || log.flow_path;
            const scoreClass = log.keyword_score >= 0.7 ? 'score-high' :
                              log.keyword_score >= 0.4 ? 'score-medium' : 'score-low';
            const latencyClass = log.total_latency_ms < 100 ? 'latency-fast' :
                                log.total_latency_ms < 1000 ? 'latency-normal' : 'latency-slow';

            return `
                <tr onclick="window.flowPage.showDetail('${log.request_id}')"
                    data-request-id="${log.request_id}">
                    <td>${time}</td>
                    <td title="${log.original_query}">${this.truncate(log.original_query, 40)}</td>
                    <td><span class="flow-badge ${log.flow_path}">${pathName}</span></td>
                    <td class="${scoreClass}">${log.keyword_score ? log.keyword_score.toFixed(2) : '--'}</td>
                    <td class="${latencyClass}">${log.total_latency_ms || '--'}</td>
                    <td><button class="btn-icon" onclick="event.stopPropagation(); window.flowPage.showDetail('${log.request_id}')">🔍</button></td>
                </tr>
            `;
        }).join('');
    }

    async showDetail(requestId) {
        try {
            const response = await fetch(`${WORKER_URL}/flow/${requestId}`);
            if (!response.ok) return;
            const flow = await response.json();

            document.querySelectorAll('#flowTableBody tr').forEach(r => r.classList.remove('selected'));
            const row = document.querySelector(`[data-request-id="${requestId}"]`);
            if (row) row.classList.add('selected');

            const panel = document.getElementById('flowDetailPanel');
            panel.style.display = 'block';
            panel.scrollIntoView({ behavior: 'smooth' });

            document.getElementById('detailTitle').textContent =
                `جزئیات درخواست: ${this.truncate(flow.original_query, 50)}`;

            document.getElementById('detailBasic').innerHTML = `
                <div class="detail-item">
                    <span class="detail-label">Request ID</span>
                    <span class="detail-value">${flow.request_id}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">پرسش اصلی</span>
                    <span class="detail-value">${flow.original_query}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">پرسش فشرده</span>
                    <span class="detail-value">${flow.compressed_query || '--'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">مسیر نهایی</span>
                    <span class="detail-value"><span class="flow-badge ${flow.flow_path}">${flow.flow_path}</span></span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">تاخیر کل</span>
                    <span class="detail-value">${flow.total_latency_ms}ms</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">زمان</span>
                    <span class="detail-value">${new Date(flow.timestamp).toLocaleString('fa-IR')}</span>
                </div>
            `;

            document.getElementById('detailFlowDiagram').innerHTML =
                this.buildFlowDiagram(flow);

            if (flow.sql_query) {
                document.getElementById('detailSQLSection').style.display = 'block';
                document.getElementById('detailSQL').textContent = flow.sql_query;
            } else {
                document.getElementById('detailSQLSection').style.display = 'none';
            }

        } catch (error) {
            console.error('Error loading flow detail:', error);
        }
    }

    buildFlowDiagram(flow) {
        const steps = [];

        if (flow.cache_checked) {
            if (flow.cache_hit) {
                steps.push(`<span class="flow-step-pass">✓</span> Cache HIT → <span class="flow-badge cache">⚡ Return ${flow.cache_latency_ms}ms</span>`);
            } else {
                steps.push(`<span class="flow-step-fail">✗</span> Cache MISS → Continue (${flow.cache_latency_ms}ms)`);
            }
        } else {
            steps.push(`<span class="flow-step-skip">⊘</span> Cache Skipped`);
        }

        if (flow.keyword_checked) {
            const scoreEmoji = flow.keyword_score >= 0.7 ? '✓' :
                              flow.keyword_score >= 0.4 ? '⚠️' : '✗';
            const stepClass = flow.keyword_score >= 0.4 ? 'pass' : 'fail';
            steps.push(`<span class="flow-step-${stepClass}">${scoreEmoji}</span> Keyword Search → Score: ${(flow.keyword_score || 0).toFixed(2)} | ${flow.keyword_results_count} results (${flow.keyword_latency_ms}ms)`);
        } else {
            steps.push(`<span class="flow-step-skip">⊘</span> Keyword Skipped`);
        }

        if (flow.sql_triggered) {
            if (flow.sql_success) {
                steps.push(`<span class="flow-step-pass">✓</span> Text-to-SQL → <span class="flow-badge sql">🧠 ${flow.sql_results_count} results (${flow.sql_latency_ms}ms)</span>`);
            } else {
                steps.push(`<span class="flow-step-fail">✗</span> Text-to-SQL → FAILED (${flow.sql_latency_ms}ms)`);
            }
        } else {
            steps.push(`<span class="flow-step-skip">⊘</span> Text-to-SQL Not Triggered`);
        }

        if (flow.error_message) {
            steps.push(`<span class="flow-step-fail">❌</span> Error: ${flow.error_message}`);
        }

        return steps.map((s, i) =>
            `<div class="flow-step">${s}</div>` +
            (i < steps.length - 1 ? '<div class="flow-arrow">│</div>' : '')
        ).join('');
    }

    truncate(text, maxLength) {
        if (!text) return '--';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
}

window.flowPage = new FlowTracerPage();

function refreshFlowLogs() {
    window.flowPage.loadLogs();
}

function closeDetail() {
    document.getElementById('flowDetailPanel').style.display = 'none';
    document.querySelectorAll('#flowTableBody tr').forEach(r => r.classList.remove('selected'));
}
