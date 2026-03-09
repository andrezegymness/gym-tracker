// ==========================================
// PWA REGISTRATION — Andre's Calibrations
// Registers service worker + shows install prompt
// Include this script on every page.
// ==========================================

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                console.log('[PWA] Service Worker registered, scope:', reg.scope);

                // Check for updates periodically
                setInterval(() => reg.update(), 60 * 60 * 1000); // every hour

                // Notify user when update is ready
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
                            showUpdateBanner();
                        }
                    });
                });
            })
            .catch(err => console.error('[PWA] SW registration failed:', err));
    });
}

// Show offline indicator
window.addEventListener('online', () => {
    const badge = document.getElementById('offlineBadge');
    if (badge) badge.remove();
    console.log('[PWA] Back online');
});

window.addEventListener('offline', () => {
    if (document.getElementById('offlineBadge')) return;
    const badge = document.createElement('div');
    badge.id = 'offlineBadge';
    badge.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:10000;background:#ff9f0a;color:#000;text-align:center;padding:6px;font-size:0.78rem;font-weight:700;letter-spacing:0.5px;';
    badge.textContent = 'OFFLINE MODE — Your data is saved locally';
    document.body.prepend(badge);
    console.log('[PWA] Offline');
});

// Show update available banner
function showUpdateBanner() {
    if (document.getElementById('updateBanner')) return;
    const banner = document.createElement('div');
    banner.id = 'updateBanner';
    banner.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:10000;background:#1c1c1e;border:0.5px solid #38383a;border-radius:12px;padding:12px 20px;display:flex;align-items:center;gap:12px;box-shadow:0 4px 20px rgba(0,0,0,0.5);';
    banner.innerHTML = `
        <span style="color:#fff;font-size:0.85rem;font-weight:600;">Update available</span>
        <button onclick="location.reload()" style="background:#0a84ff;color:#fff;border:none;border-radius:8px;padding:6px 14px;font-weight:700;font-size:0.8rem;cursor:pointer;">Refresh</button>
        <button onclick="this.parentElement.remove()" style="background:none;border:none;color:#636366;cursor:pointer;font-size:16px;">✕</button>`;
    document.body.appendChild(banner);
}

// Capture install prompt for "Add to Home Screen"
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;

    // Show install suggestion after a delay (don't be aggressive)
    setTimeout(() => {
        if (!deferredInstallPrompt) return;
        const installed = localStorage.getItem('pwaInstallDismissed');
        if (installed) return;
        showInstallBanner();
    }, 15000); // 15 seconds after page load
});

function showInstallBanner() {
    if (document.getElementById('installBanner')) return;
    const banner = document.createElement('div');
    banner.id = 'installBanner';
    banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9600;display:flex;justify-content:center;padding:16px;pointer-events:none;';
    banner.innerHTML = `
    <div style="pointer-events:auto;background:#1c1c1e;border:0.5px solid #38383a;border-radius:16px;padding:18px 24px;max-width:440px;width:100%;display:flex;align-items:center;gap:14px;box-shadow:0 -4px 30px rgba(0,0,0,0.5);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);">
        <div style="flex-shrink:0;width:44px;height:44px;background:linear-gradient(135deg,#0a84ff,#30d158);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;">📲</div>
        <div style="flex:1;min-width:0;">
            <div style="color:#fff;font-weight:700;font-size:0.92rem;">Install the app</div>
            <div style="color:#98989d;font-size:0.75rem;line-height:1.3;">Add to your home screen for offline gym access.</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">
            <button id="installBtn" style="background:#0a84ff;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-weight:700;font-size:0.8rem;cursor:pointer;white-space:nowrap;">Install</button>
            <button id="installDismiss" style="background:none;border:none;color:#636366;font-size:0.72rem;cursor:pointer;">Not now</button>
        </div>
    </div>`;
    document.body.appendChild(banner);

    document.getElementById('installBtn').addEventListener('click', async () => {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        const result = await deferredInstallPrompt.userChoice;
        console.log('[PWA] Install result:', result.outcome);
        deferredInstallPrompt = null;
        banner.remove();
    });

    document.getElementById('installDismiss').addEventListener('click', () => {
        localStorage.setItem('pwaInstallDismissed', '1');
        banner.remove();
    });
}
