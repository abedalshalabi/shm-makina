import { FACEBOOK_PIXEL_ID } from '../config/env';

declare global {
    interface Window {
        fbq: any;
        _fbq: any;
        _pixelInitialized?: boolean;
    }
}

export const initPixel = () => {
    if (!FACEBOOK_PIXEL_ID) {
        if (import.meta.env.DEV) {
            console.warn('Facebook Pixel ID not found in environment variables');
        }
        return;
    }

    if (window._pixelInitialized) {
        // console.log('[Pixel] Already initialized, skipping init.');
        return;
    }
    window._pixelInitialized = true;

    if (window.fbq) {
        console.log('[Pixel] Already initialized externally.');
        window._pixelInitialized = true;
        return;
    }

    /* eslint-disable */
    (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return; n = f.fbq = function () {
            n.callMethod ?
                n.callMethod.apply(n, arguments) : n.queue.push(arguments)
        };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
        n.queue = []; t = b.createElement(e); t.async = !0;
        t.src = v; s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s)
    })(window, document, 'script',
        'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    console.log('[Pixel] Initializing with ID:', FACEBOOK_PIXEL_ID);
    window.fbq('init', FACEBOOK_PIXEL_ID);
};

// Store last occurrence of EACH event type
const lastEvents: Record<string, { data: string; time: number }> = {};

export const trackEvent = (event: string, data?: any) => {
    if (!FACEBOOK_PIXEL_ID) return;

    const now = Date.now();
    const dataString = JSON.stringify(data || {});

    // Check against the last occurrence of THIS specific event
    const lastOccurrence = lastEvents[event];

    if (lastOccurrence) {
        const timeDiff = now - lastOccurrence.time;
        const isSameData = lastOccurrence.data === dataString;

        // Blocking duplicate within 5 seconds to be safe against slow API double-fetches
        if (isSameData && timeDiff < 5000) {
            console.warn(`[Pixel] Duplicate event blocked: ${event} (diff: ${timeDiff}ms)`);
            return;
        }
    }

    // Update the record for this event type
    lastEvents[event] = { data: dataString, time: now };

    console.log(`[Pixel] Tracking event: ${event}`, data);

    if (window.fbq) {
        window.fbq('track', event, data);
    } else {
        setTimeout(() => {
            if (window.fbq) {
                window.fbq('track', event, data);
            }
        }, 500);
    }
};
