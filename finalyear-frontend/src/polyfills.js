// Browser compatibility polyfills
if (typeof window !== 'undefined') {
    // Add any missing browser APIs
    window.RPPGetBoolPref = window.RPPGetBoolPref || function() { return false; };
    
    // Ensure requestIdleCallback is available
    window.requestIdleCallback = window.requestIdleCallback || function(cb) {
        return setTimeout(() => {
            cb({
                didTimeout: false,
                timeRemaining: function() { return 0; }
            });
        }, 1);
    };
    
    window.cancelIdleCallback = window.cancelIdleCallback || function(id) {
        clearTimeout(id);
    };
    
    // Ensure ResizeObserver is available
    if (!window.ResizeObserver) {
        window.ResizeObserver = class ResizeObserver {
            constructor(callback) {
                this.callback = callback;
            }
            observe() {}
            unobserve() {}
            disconnect() {}
        };
    }
}