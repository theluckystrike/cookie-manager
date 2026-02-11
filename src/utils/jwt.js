/**
 * JWT Decoder Utility
 * Detects and decodes JWT tokens in cookie values.
 * IIFE pattern - exposes JWT globally on self and window.
 */
(function () {
    'use strict';

    /**
     * Convert base64url to standard base64
     * @param {string} base64url
     * @returns {string}
     */
    function _base64UrlToBase64(base64url) {
        var base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        return base64;
    }

    /**
     * Convert milliseconds to human readable format
     * @param {number} ms
     * @returns {string}
     */
    function _timeAgo(ms) {
        var seconds = Math.floor(ms / 1000);
        var minutes = Math.floor(seconds / 60);
        var hours = Math.floor(minutes / 60);
        var days = Math.floor(hours / 24);

        if (days > 0) return days + 'd ' + (hours % 24) + 'h';
        if (hours > 0) return hours + 'h ' + (minutes % 60) + 'm';
        if (minutes > 0) return minutes + 'm';
        return seconds + 's';
    }

    var JWT = {
        /**
         * Check if a string is a valid JWT
         * @param {string} value
         * @returns {boolean}
         */
        isJWT: function (value) {
            if (!value || typeof value !== 'string') return false;

            var parts = value.split('.');
            if (parts.length !== 3) return false;

            try {
                // Try to decode header and payload
                JSON.parse(atob(_base64UrlToBase64(parts[0])));
                JSON.parse(atob(_base64UrlToBase64(parts[1])));
                return true;
            } catch (e) {
                return false;
            }
        },

        /**
         * Decode a JWT token
         * @param {string} token
         * @returns {Object|null}
         */
        decode: function (token) {
            if (!this.isJWT(token)) return null;

            var parts = token.split('.');

            try {
                var header = JSON.parse(atob(_base64UrlToBase64(parts[0])));
                var payload = JSON.parse(atob(_base64UrlToBase64(parts[1])));

                return {
                    header: header,
                    payload: payload,
                    signature: parts[2],
                    raw: token
                };
            } catch (error) {
                console.error('[JWT] Decode error:', error);
                return null;
            }
        },

        /**
         * Check if JWT is expired
         * @param {Object} decoded - Decoded JWT object
         * @returns {boolean|null} - null if no exp claim
         */
        isExpired: function (decoded) {
            if (!decoded || !decoded.payload || !decoded.payload.exp) return null;
            return Date.now() >= decoded.payload.exp * 1000;
        },

        /**
         * Format JWT expiration for display
         * @param {number} exp - Expiration timestamp (seconds)
         * @returns {string}
         */
        formatExpiry: function (exp) {
            if (!exp) return 'No expiration';

            var date = new Date(exp * 1000);
            var now = Date.now();
            var diff = date.getTime() - now;

            if (diff < 0) {
                return 'Expired ' + _timeAgo(Math.abs(diff)) + ' ago';
            }
            return 'Expires in ' + _timeAgo(diff);
        },

        /**
         * Get human-readable JWT claims
         * @param {Object} payload
         * @returns {Object}
         */
        getClaimsInfo: function (payload) {
            if (!payload) return {};

            var claims = {};

            // Standard claims
            if (payload.iss) claims.issuer = payload.iss;
            if (payload.sub) claims.subject = payload.sub;
            if (payload.aud) claims.audience = payload.aud;
            if (payload.exp) claims.expiration = new Date(payload.exp * 1000).toISOString();
            if (payload.iat) claims.issuedAt = new Date(payload.iat * 1000).toISOString();
            if (payload.nbf) claims.notBefore = new Date(payload.nbf * 1000).toISOString();

            return claims;
        }
    };

    // Expose globally on both self (service worker) and window (popup/pages)
    if (typeof self !== 'undefined') self.JWT = JWT;
    if (typeof window !== 'undefined') window.JWT = JWT;
})();
