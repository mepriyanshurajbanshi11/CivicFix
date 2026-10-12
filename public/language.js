/**
 * CivicFix Language Switcher & Full-Page Translation
 * Supports English, Hindi, and key Indian regional languages
 * using Google Translate client integration with persistent language state.
 */

(function () {
    const STORAGE_KEY = 'civicfix_lang';
    const SUPPORTED_LANGUAGES = [
        { code: 'en', name: 'English' },
        { code: 'hi', name: 'हिन्दी (Hindi)' },
        { code: 'bn', name: 'বাংলা (Bengali)' },
        { code: 'mr', name: 'मराठी (Marathi)' },
        { code: 'te', name: 'తెలుగు (Telugu)' },
        { code: 'ta', name: 'தமிழ் (Tamil)' },
        { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
        { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
        { code: 'ur', name: 'اردو (Urdu)' },
        { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
        { code: 'ml', name: 'മലയാളം (Malayalam)' },
        { code: 'or', name: 'ଓଡ଼ିଆ (Odia)' }
    ];

    /**
     * Parse the active language from localStorage or the googtrans cookie
     */
    function getCurrentLanguage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return saved;
        } catch (e) {
            // localStorage not available
        }

        const match = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([a-zA-Z\-]+)/);
        if (match && match[1]) {
            return match[1];
        }

        return 'en';
    }

    /**
     * Set the googtrans cookie for root and current domain
     */
    function setLanguageCookie(langCode) {
        const cookieVal = '/en/' + langCode;
        document.cookie = 'googtrans=' + cookieVal + '; path=/';

        const host = window.location.hostname;
        if (host && host !== 'localhost' && !/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
            document.cookie = 'googtrans=' + cookieVal + '; domain=.' + host + '; path=/';
            const parts = host.split('.');
            if (parts.length > 1) {
                const rootDomain = '.' + parts.slice(-2).join('.');
                document.cookie = 'googtrans=' + cookieVal + '; domain=' + rootDomain + '; path=/';
            }
        }
    }

    /**
     * Clear the googtrans cookie
     */
    function clearLanguageCookie() {
        const past = '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'googtrans' + past;
        document.cookie = 'googtrans=/en/en; path=/;';

        const host = window.location.hostname;
        if (host && host !== 'localhost') {
            document.cookie = 'googtrans' + past + ' domain=.' + host + ';';
            const parts = host.split('.');
            if (parts.length > 1) {
                const rootDomain = '.' + parts.slice(-2).join('.');
                document.cookie = 'googtrans' + past + ' domain=' + rootDomain + ';';
            }
        }
    }

    /**
     * Sync all select dropdowns on the page to the target language
     */
    function updateDropdownValues(langCode) {
        const dropdowns = document.querySelectorAll('.lang-select');
        dropdowns.forEach((select) => {
            select.value = langCode;
        });
    }

    /**
     * Switch language and propagate to Google Translate
     */
    function changeLanguage(langCode) {
        try {
            localStorage.setItem(STORAGE_KEY, langCode);
        } catch (e) {
            // localStorage error ignore
        }

        updateDropdownValues(langCode);

        if (langCode === 'en') {
            clearLanguageCookie();
        } else {
            setLanguageCookie(langCode);
        }

        const teCombo = document.querySelector('.goog-te-combo');
        if (teCombo) {
            teCombo.value = langCode;
            teCombo.dispatchEvent(new Event('change', { bubbles: true }));

            // If switching to English, reload to restore original content cleanly
            if (langCode === 'en') {
                setTimeout(() => {
                    window.location.reload();
                }, 150);
            }
        } else {
            // Google Translate combo not loaded yet; reload with new cookie
            window.location.reload();
        }
    }

    /**
     * Ensure the hidden google_translate_element container exists
     */
    function ensureTranslateContainer() {
        let el = document.getElementById('google_translate_element');
        if (!el) {
            el = document.createElement('div');
            el.id = 'google_translate_element';
            el.style.display = 'none';
            document.body.appendChild(el);
        }
        return el;
    }

    /**
     * Load Google Translate element script
     */
    function loadGoogleTranslateScript() {
        if (document.getElementById('google-translate-script')) return;

        window.googleTranslateElementInit = function () {
            if (window.google && window.google.translate) {
                new window.google.translate.TranslateElement(
                    {
                        pageLanguage: 'en',
                        includedLanguages: 'en,hi,bn,mr,te,ta,gu,pa,ur,kn,ml,or',
                        autoDisplay: false
                    },
                    'google_translate_element'
                );

                const currentLang = getCurrentLanguage();
                updateDropdownValues(currentLang);

                // If saved language is not English, ensure combo triggers it
                if (currentLang && currentLang !== 'en') {
                    let attempts = 0;
                    const interval = setInterval(() => {
                        attempts++;
                        const combo = document.querySelector('.goog-te-combo');
                        if (combo) {
                            clearInterval(interval);
                            if (combo.value !== currentLang) {
                                combo.value = currentLang;
                                combo.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                        if (attempts > 30) clearInterval(interval);
                    }, 100);
                }
            }
        };

        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.head.appendChild(script);
    }

    /**
     * Clean up Google Translate artifacts (e.g., body offset shift)
     */
    function sanitizeGoogleLayout() {
        const fixBody = () => {
            if (document.body && document.body.style.top && document.body.style.top !== '0px') {
                document.body.style.top = '0px';
            }
        };

        if (window.MutationObserver) {
            const observer = new MutationObserver(fixBody);
            if (document.body) {
                observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
                });
            }
        }

        setInterval(fixBody, 500);
    }

    /**
     * Event delegation for language change
     */
    document.addEventListener('change', function (e) {
        if (e.target && e.target.classList.contains('lang-select')) {
            changeLanguage(e.target.value);
        }
    });

    /**
     * Initialize on DOM load
     */
    function init() {
        ensureTranslateContainer();
        loadGoogleTranslateScript();
        sanitizeGoogleLayout();

        const currentLang = getCurrentLanguage();
        updateDropdownValues(currentLang);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose utility globally
    window.CivicFixLang = {
        languages: SUPPORTED_LANGUAGES,
        getCurrent: getCurrentLanguage,
        setLanguage: changeLanguage
    };
})();
