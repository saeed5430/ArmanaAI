// Theme Manager
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        document.documentElement.setAttribute('data-theme', this.theme);
        this.updateToggleButton();
    }

    toggle() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        document.documentElement.setAttribute('data-theme', this.theme);
        this.updateToggleButton();
        this.showToast(`حالت ${this.theme === 'dark' ? 'تاریک' : 'روشن'} فعال شد`, 'success');
    }

    updateToggleButton() {
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            const icon = toggle.querySelector('.theme-icon');
            const text = toggle.querySelector('.theme-text');
            if (this.theme === 'dark') {
                icon.textContent = '☀️';
                text.textContent = 'حالت روشن';
            } else {
                icon.textContent = '🌙';
                text.textContent = 'حالت تاریک';
            }
        }
    }

    showToast(message, type = 'success') {
        if (window.App) {
            window.App.showToast(message, type);
        }
    }
}

const themeManager = new ThemeManager();
