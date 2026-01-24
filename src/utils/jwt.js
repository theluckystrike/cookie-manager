/**
 * JWT Decoder Utility
 * Detects and decodes JWT tokens in cookie values
 */

export const JWT = {
    /**
     * Check if a string is a valid JWT
     * @param {string} value
     * @returns {boolean}
     */
    isJWT(value) {
        if (!value || typeof value !== 'string') return false;

        const parts = value.split('.');
        if (parts.length !== 3) return false;

        try {
            // Try to decode header and payload
            JSON.parse(atob(this._base64UrlToBase64(parts[0])));
            JSON.parse(atob(this._base64UrlToBase64(parts[1])));
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Decode a JWT token
     * @param {string} token
     * @returns {Object|null}
     */
    decode(token) {
        if (!this.isJWT(token)) return null;

        const parts = token.split('.');

        try {
            const header = JSON.parse(atob(this._base64UrlToBase64(parts[0])));
            const payload = JSON.parse(atob(this._base64UrlToBase64(parts[1])));

            return {
                header,
                payload,
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
    isExpired(decoded) {
        if (!decoded?.payload?.exp) return null;
        return Date.now() >= decoded.payload.exp * 1000;
    },

    /**
     * Format JWT expiration for display
     * @param {number} exp - Expiration timestamp (seconds)
     * @returns {string}
     */
    formatExpiry(exp) {
        if (!exp) return 'No expiration';

        const date = new Date(exp * 1000);
        const now = Date.now();
        const diff = date.getTime() - now;

        if (diff < 0) {
            return `Expired ${this._timeAgo(Math.abs(diff))} ago`;
        }
        return `Expires in ${this._timeAgo(diff)}`;
    },

    /**
     * Get human-readable JWT claims
     * @param {Object} payload
     * @returns {Object}
     */
    getClaimsInfo(payload) {
        if (!payload) return {};

        const claims = {};

        // Standard claims
        if (payload.iss) claims.issuer = payload.iss;
        if (payload.sub) claims.subject = payload.sub;
        if (payload.aud) claims.audience = payload.aud;
        if (payload.exp) claims.expiration = new Date(payload.exp * 1000).toISOString();
        if (payload.iat) claims.issuedAt = new Date(payload.iat * 1000).toISOString();
        if (payload.nbf) claims.notBefore = new Date(payload.nbf * 1000).toISOString();

        return claims;
    },

    /**
     * Convert base64url to standard base64
     * @private
     * @param {string} base64url
     * @returns {string}
     */
    _base64UrlToBase64(base64url) {
        let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        return base64;
    },

    /**
     * Convert milliseconds to human readable format
     * @private
     * @param {number} ms
     * @returns {string}
     */
    _timeAgo(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m`;
        return `${seconds}s`;
    }
};
