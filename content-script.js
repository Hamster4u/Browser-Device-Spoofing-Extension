(async function () {
    // Load all settings with defaults
    const settings = await browser.storage.local.get({
        enabled: false,
        sizeSpoofing: false,
        mouseSpoofing: false,
        width: 1440,
        height: 900,
        innerWidth: 1024,
        innerHeight: 768,
        dpr: 1,
        colorDepth: 24,
        exceptions: ""
    });

    // Check if extension is enabled at all
    if (!settings.enabled) {
        console.log("🔍 [Fake Pixels] Extension is disabled.");
        return;
    }

    // Check for URL exceptions
    const exceptionPatterns = settings.exceptions.split('\n')
        .map(pattern => pattern.trim())
        .filter(pattern => pattern.length > 0);

    const currentUrl = window.location.hostname;
    const isExcepted = exceptionPatterns.some(pattern => {
        try {
            // Convert wildcard pattern to regex
            const regexPattern = pattern
                .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
                .replace(/\*/g, '.*');
            return new RegExp(`^${regexPattern}$`, 'i').test(currentUrl);
        } catch (e) {
            console.warn(`[Fake Pixels] Invalid exception pattern: ${pattern}`);
            return false;
        }
    });

    if (isExcepted) {
        console.log(`🔍 [Fake Pixels] Skipping spoofing for exception: ${currentUrl}`);
        return;
    }

    // Prepare parameters for injection
    const params = {
        sizeSpoofing: settings.sizeSpoofing,
        screenW: parseInt(settings.width) || 1440,
        screenH: parseInt(settings.height) || 900,
        winW: parseInt(settings.innerWidth) || 1024,
        winH: parseInt(settings.innerHeight) || 768,
        dpr: parseFloat(settings.dpr) || 1,
        colorDepth: parseInt(settings.colorDepth) || 24,
        mouseSpoofing: settings.mouseSpoofing
    };

    const injectedCode = `
    (function () {
        const params = ${JSON.stringify(params)};
        const winW = params.winW;
        const winH = params.winH;

        // Generic spoof function
        function spoof(obj, prop, value) {
            try {
                Object.defineProperty(obj, prop, {
                    get: () => value,
                    configurable: true
                });
            } catch (e) {
                console.warn(\`[Fake Pixels] Failed to spoof \${prop} on \${obj === screen ? 'screen' : obj === window ? 'window' : obj === (window.visualViewport || {}) ? 'visualViewport' : obj === (document.documentElement || {}) ? 'documentElement' : obj === (document.body || {}) ? 'document.body' : 'object'}:\`, e);
            }
        }

        // Size Spoofing
        if (params.sizeSpoofing) {
            // Screen properties
            spoof(screen, "width", params.screenW);
            spoof(screen, "height", params.screenH);
            spoof(screen, "availWidth", params.screenW);
            spoof(screen, "availHeight", params.screenH);
            spoof(screen, "colorDepth", params.colorDepth);
            spoof(screen, "pixelDepth", params.colorDepth);

            // Window properties
            spoof(window, "innerWidth", winW);
            spoof(window, "innerHeight", winH);
            spoof(window, "outerWidth", winW);
            spoof(window, "outerHeight", winH);
            spoof(window, "devicePixelRatio", params.dpr);

            // Visual Viewport
            if (window.visualViewport) {
                spoof(window.visualViewport, "width", winW);
                spoof(window.visualViewport, "height", winH);
                spoof(window.visualViewport, "scale", 1);
                spoof(window.visualViewport, "displayCutout", null);
            }

            // Document dimensions
            if (document.documentElement) {
                spoof(document.documentElement, "clientWidth", winW);
                spoof(document.documentElement, "clientHeight", winH);
            }
            if (document.body) {
                spoof(document.body, "clientWidth", winW);
                spoof(document.body, "clientHeight", winH);
            }

            console.log("🔍 [Fake Pixels] Size spoofing active");
        }

        // Mouse Spoofing
        if (params.mouseSpoofing) {
            let lastRandomPos = null;
            let lastUpdateTime = 0;
            
            function getRandomPosition() {
                const now = Date.now();
                if (lastRandomPos && now - lastUpdateTime < 100) {
                    return lastRandomPos;
                }
                
                lastRandomPos = {
                    x: Math.floor(Math.random() * winW),
                    y: Math.floor(Math.random() * winH),
                    pageX: Math.floor(Math.random() * winW),
                    pageY: Math.floor(Math.random() * (document.body.scrollHeight || winH * 3))
                };
                lastUpdateTime = now;
                return lastRandomPos;
            }

            const handleMouseEvent = function(event) {
                if (!event.__fakeMouseEvent) {
                    const randomPos = getRandomPosition();
                    
                    Object.defineProperties(event, {
                        'clientX': { value: randomPos.x },
                        'clientY': { value: randomPos.y },
                        'pageX': { value: randomPos.pageX },
                        'pageY': { value: randomPos.pageY },
                        'screenX': { value: randomPos.x },
                        'screenY': { value: randomPos.y },
                        'x': { value: randomPos.x },
                        'y': { value: randomPos.y },
                        'offsetX': { 
                            get: () => randomPos.x - (event.target?.getBoundingClientRect()?.left || 0) 
                        },
                        'offsetY': { 
                            get: () => randomPos.y - (event.target?.getBoundingClientRect()?.top || 0) 
                        },
                        '__fakeMouseEvent': { value: true }
                    });
                }
            };

            // Capture mouse events
            document.addEventListener('mousemove', handleMouseEvent, true);
            document.addEventListener('mousedown', handleMouseEvent, true);
            document.addEventListener('mouseup', handleMouseEvent, true);
            document.addEventListener('click', handleMouseEvent, true);

            console.log("🔍 [Fake Pixels] Mouse spoofing active");
        }

        console.log("🔍 [Fake Pixels] Spoofing initialized");
    })();
    `;

    const script = document.createElement("script");
    script.textContent = injectedCode;
    script.type = 'text/javascript';
    document.documentElement.appendChild(script);
})();