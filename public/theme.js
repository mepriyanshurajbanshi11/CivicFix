/**
 * CivicFix Theme (Dark / Light Mode) & PWA Helper
 */
(function () {
    // 1. Immediately apply saved theme to prevent FOUC (Flash of Unstyled Content)
    const savedTheme = localStorage.getItem('civic_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

    if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }

    // 2. Register Service Worker for PWA
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('CivicFix Service Worker active:', reg.scope))
                .catch(err => console.warn('Service Worker registration skipped:', err));
        });
    }

    // 3. Bind Theme Toggle Buttons when DOM is loaded
    function setupThemeToggle() {
        const toggleBtns = document.querySelectorAll('.theme-toggle-btn, #themeToggleBtn');
        const sunSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
        const moonSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';

        const updateIcons = (dark) => {
            toggleBtns.forEach(btn => {
                btn.innerHTML = dark ? sunSvg : moonSvg;
                btn.setAttribute('title', dark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
                btn.setAttribute('aria-label', dark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
            });
        };

        const currentDark = document.documentElement.getAttribute('data-theme') === 'dark';
        updateIcons(currentDark);

        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const nowDark = document.documentElement.getAttribute('data-theme') === 'dark';
                const nextDark = !nowDark;
                document.documentElement.setAttribute('data-theme', nextDark ? 'dark' : 'light');
                localStorage.setItem('civic_theme', nextDark ? 'dark' : 'light');
                updateIcons(nextDark);
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupThemeToggle);
    } else {
        setupThemeToggle();
    }
})();
