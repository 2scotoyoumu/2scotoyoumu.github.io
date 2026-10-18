/**
 * 2's Complement Web Sanctuary - Shared Retro Web 1.0 Utilities
 * Apache / PHP / Node.js compatible.
 */

(function () {
    'use strict';

    const SANCTUARY = {
        version: '2026.10.18-web1.0',
        defaultCounter: 1337
    };

    /**
     * Escape HTML to prevent XSS.
     */
    function escapeHtml(str) {
        if (typeof str !== 'string') return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Safe fetch with timeout and JSON/text fallback.
     */
    async function safeFetch(url, options = {}, timeout = 8000) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);
        try {
            const res = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timer);
            return { ok: res.ok, status: res.status, res };
        } catch (err) {
            clearTimeout(timer);
            return { ok: false, status: 0, error: err };
        }
    }

    /**
     * Highlight current page in the retro navigation.
     */
    function highlightCurrentNav() {
        const links = document.querySelectorAll('.retro-nav-link');
        if (!links.length) return;

        const currentPath = window.location.pathname.toLowerCase();
        const currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';

        links.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            const hrefLower = href.toLowerCase();
            if (
                hrefLower === currentFile ||
                (currentFile === 'index.html' && hrefLower.includes('index.html')) ||
                (currentFile === '' && hrefLower.includes('index.html')) ||
                currentPath.includes(hrefLower.replace(/^\.\//, '').replace(/^\.\.\//, ''))
            ) {
                link.classList.add('active');
            }
        });
    }

    /**
     * Load Apache/PHP counter and update the odometer element.
     * Falls back to localStorage when PHP is unavailable.
     */
    async function loadApacheCounter(counterId = 'visitCounter', statusId = 'counterBackendStatus') {
        const counterElem = document.getElementById(counterId);
        const statusElem = document.getElementById(statusId);
        if (!counterElem) return;

        const basePath = window.location.pathname.replace(/\/[^/]*$/, '/') || '/';
        const counterUrl = basePath + 'counter.php?ts=' + Date.now();

        try {
            const result = await safeFetch(counterUrl, { cache: 'no-store' }, 5000);
            if (result.ok && result.res) {
                const data = await result.res.json();
                if (data && typeof data.count !== 'undefined') {
                    const countNum = parseInt(data.count, 10);
                    const padded = String(countNum).padStart(6, '0');
                    counterElem.innerText = padded;
                    if (statusElem) {
                        statusElem.innerText = `● Apache 計數器同步成功 (HIT #${countNum})`;
                    }
                    try {
                        localStorage.setItem('cached_counter', countNum);
                    } catch (e) {}
                    return;
                }
            }
        } catch (e) {
            console.warn('Apache counter.php 連接降級:', e);
        }

        // Fallback to localStorage
        let localCount = SANCTUARY.defaultCounter;
        try {
            localCount = parseInt(localStorage.getItem('cached_counter') || String(SANCTUARY.defaultCounter), 10);
        } catch (e) {}
        localCount++;
        try {
            localStorage.setItem('cached_counter', localCount);
        } catch (e) {}
        counterElem.innerText = String(localCount).padStart(6, '0');
        if (statusElem) {
            statusElem.innerText = `○ 本地計數器 (HIT #${localCount})`;
        }
    }

    /**
     * Return a retro-formatted date string.
     */
    function getCurrentDateString(date = new Date()) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        const w = weekdays[date.getDay()];
        return `${y}.${m}.${d} (${w})`;
    }

    /**
     * Display the current date in an element with id 'currentDate'.
     */
    function showCurrentDate(elementId = 'currentDate') {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = getCurrentDateString();
        }
    }

    /**
     * Create a gentle falling sakura / star decoration effect.
     * Adds elements directly to the body.
     */
    function createFallingSakura(options = {}) {
        const count = options.count || 18;
        const symbols = options.symbols || ['❀', '✿', '❁', '✧', '✦', '♡'];
        const colors = options.colors || ['#ff3385', '#ff8ad6', '#b266ff', '#ffd8f2'];

        function spawnOne() {
            const el = document.createElement('span');
            el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            el.style.position = 'fixed';
            el.style.left = Math.random() * 100 + 'vw';
            el.style.top = '-20px';
            el.style.color = colors[Math.floor(Math.random() * colors.length)];
            el.style.fontSize = (10 + Math.random() * 14) + 'px';
            el.style.opacity = '0.7';
            el.style.pointerEvents = 'none';
            el.style.zIndex = '9998';
            el.style.transition = `top ${6 + Math.random() * 6}s linear, opacity 0.5s ease-in`;
            document.body.appendChild(el);

            requestAnimationFrame(() => {
                el.style.top = '110vh';
            });

            setTimeout(() => {
                el.style.opacity = '0';
                setTimeout(() => {
                    if (el.parentNode) el.parentNode.removeChild(el);
                }, 500);
            }, 5000 + Math.random() * 5000);
        }

        for (let i = 0; i < count; i++) {
            setTimeout(spawnOne, i * 400);
        }
        setInterval(spawnOne, 1200);
    }

    /**
     * Inject a CRT scanline overlay for retro feel.
     */
    function injectCrtOverlay() {
        if (document.getElementById('crtOverlay')) return;
        const div = document.createElement('div');
        div.id = 'crtOverlay';
        div.className = 'crt-overlay';
        document.body.appendChild(div);
    }

    /**
     * Initialize common page behavior.
     */
    function init() {
        highlightCurrentNav();
        showCurrentDate();
        injectCrtOverlay();
        // Sakura effect is disabled by default to avoid performance concerns;
        // call createFallingSakura() explicitly on pages that want it.
    }

    // Auto-init when DOM is ready.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose public API.
    window.SanctuaryUtils = {
        escapeHtml,
        safeFetch,
        loadApacheCounter,
        getCurrentDateString,
        showCurrentDate,
        createFallingSakura,
        injectCrtOverlay,
        highlightCurrentNav
    };
})();
