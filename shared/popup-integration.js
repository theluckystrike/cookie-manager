/**
 * Zovo Popup Integration
 * Shared utilities for integrating retention, analytics, and cross-promotion into popups
 */

class ZovoPopupIntegration {
    constructor(config) {
        this.extensionId = config.extensionId;
        this.extensionName = config.extensionName;
        this.retention = null;

        this.init();
    }

    async init() {
        // Initialize retention system if available
        if (typeof ZovoRetention !== 'undefined') {
            this.retention = new ZovoRetention();
        }

        // Track popup open
        await this.incrementUsage();

        // Check for retention prompts
        await this.checkRetentionPrompts();

        // Render footer
        this.renderFooter();
    }

    async incrementUsage() {
        const { usageCount = 0 } = await chrome.storage.local.get('usageCount');
        await chrome.storage.local.set({ usageCount: usageCount + 1 });
    }

    async checkRetentionPrompts() {
        if (!this.retention) return;

        const prompt = await this.retention.checkPrompts();
        if (prompt) {
            this.showRetentionPrompt(prompt);
        }
    }

    showRetentionPrompt(prompt) {
        // Check if container exists
        let container = document.getElementById('zovo-retention-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'zovo-retention-container';

            // Insert after header or at top of popup
            const header = document.querySelector('.zovo-header, header, .header');
            if (header) {
                header.after(container);
            } else {
                document.body.insertBefore(container, document.body.firstChild);
            }
        }

        // Build prompt DOM safely to prevent XSS from prompt data
        var promptDiv = document.createElement('div');
        promptDiv.className = 'zovo-retention-prompt';

        var closeBtn = document.createElement('button');
        closeBtn.className = 'zovo-retention-close';
        closeBtn.id = 'dismissPrompt';
        closeBtn.setAttribute('aria-label', 'Dismiss');
        closeBtn.textContent = '\u00D7';
        promptDiv.appendChild(closeBtn);

        var titleEl = document.createElement('h4');
        titleEl.className = 'zovo-retention-title';
        titleEl.textContent = prompt.title || '';
        promptDiv.appendChild(titleEl);

        var msgEl = document.createElement('p');
        msgEl.className = 'zovo-retention-message';
        msgEl.textContent = prompt.message || '';
        promptDiv.appendChild(msgEl);

        if (prompt.ctaUrl) {
            var ctaLink = document.createElement('a');
            ctaLink.href = prompt.ctaUrl;
            ctaLink.target = '_blank';
            ctaLink.className = 'zovo-btn zovo-btn-primary zovo-btn-sm';
            ctaLink.textContent = prompt.cta || '';
            promptDiv.appendChild(ctaLink);
        } else {
            var ctaBtn = document.createElement('button');
            ctaBtn.className = 'zovo-btn zovo-btn-primary zovo-btn-sm';
            ctaBtn.setAttribute('data-action', prompt.ctaAction || '');
            ctaBtn.textContent = prompt.cta || '';
            promptDiv.appendChild(ctaBtn);
        }

        container.textContent = '';
        container.appendChild(promptDiv);

        // Handle dismiss
        const dismissBtn = container.querySelector('#dismissPrompt');
        dismissBtn?.addEventListener('click', async () => {
            await this.retention.dismissPrompt(prompt.id);
            container.remove();
        });

        // Handle actions
        const actionBtn = container.querySelector('[data-action]');
        if (actionBtn) {
            actionBtn.addEventListener('click', async () => {
                const action = actionBtn.dataset.action;
                if (action === 'copy_share_link') {
                    const shareUrl = `https://www.zovo.one/extensions/${this.extensionId}?ref=share`;
                    await navigator.clipboard.writeText(shareUrl);
                    actionBtn.textContent = 'Copied!';
                    setTimeout(() => {
                        actionBtn.textContent = prompt.cta;
                    }, 2000);
                }
            });
        }
    }

    renderFooter() {
        // Check if footer already exists
        if (document.querySelector('.zovo-footer')) return;

        const footer = document.createElement('footer');
        footer.className = 'zovo-footer';
        footer.innerHTML = `
            <a href="https://www.zovo.one?ref=${this.extensionId}&source=footer" target="_blank" class="zovo-footer-link">
                <span>Part of</span>
                <strong class="zovo-footer-brand">Zovo</strong>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
            </a>
        `;

        document.body.appendChild(footer);
    }

    showMoreFromZovo() {
        // Create modal/panel for cross-promotion
        const modal = document.createElement('div');
        modal.className = 'zovo-more-modal';
        modal.innerHTML = `
            <div class="zovo-more-panel">
                <div class="zovo-more-header">
                    <h3>More from Zovo</h3>
                    <button class="zovo-btn zovo-btn-ghost zovo-btn-sm" id="closeMore">×</button>
                </div>
                
                <div class="zovo-more-membership">
                    <div class="zovo-more-membership-badge">★ PRO MEMBER</div>
                    <h4>Get all Zovo extensions</h4>
                    <p>$4.99/mo or $199 lifetime</p>
                    <a href="https://www.zovo.one?ref=${this.extensionId}&source=more_panel" 
                       target="_blank" 
                       class="zovo-btn zovo-btn-primary zovo-btn-sm zovo-btn-block" style="background: white; color: #7C3AED;">
                        Join Zovo
                    </a>
                </div>

                <div class="zovo-more-extensions">
                    <h4 style="font-size: 14px; margin-bottom: 12px;">Popular Extensions</h4>
                    <div id="extensionList"></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Populate extensions from catalog
        if (typeof ZovoCatalog !== 'undefined') {
            const recommendations = ZovoCatalog.getRecommendations(this.extensionId, 3);
            const list = modal.querySelector('#extensionList');

            recommendations.forEach(ext => {
                const card = document.createElement('a');
                card.href = ext.zovoUrl;
                card.target = '_blank';
                card.className = 'zovo-extension-card';

                const img = document.createElement('img');
                img.src = ext.icon || '';
                img.alt = ext.name || '';
                img.addEventListener('error', function () { this.style.display = 'none'; });
                card.appendChild(img);

                const info = document.createElement('div');
                info.className = 'zovo-extension-card-info';
                const h5 = document.createElement('h5');
                h5.textContent = ext.name || '';
                info.appendChild(h5);
                const p = document.createElement('p');
                p.textContent = ext.tagline || '';
                info.appendChild(p);
                card.appendChild(info);

                list.appendChild(card);
            });
        }

        // Close handler
        modal.querySelector('#closeMore')?.addEventListener('click', () => {
            modal.remove();
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
}

// Additional popup styles for retention and promotion
const additionalStyles = `
.zovo-more-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.zovo-more-modal .zovo-more-panel {
    margin: 16px;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideUp 0.2s ease;
}

@keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}
`;

// Inject additional styles (wait for DOM to be ready)
function _injectPopupIntegrationStyles() {
    if (document.head) {
        var styleEl = document.createElement('style');
        styleEl.textContent = additionalStyles;
        document.head.appendChild(styleEl);
    }
}
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _injectPopupIntegrationStyles);
    } else {
        _injectPopupIntegrationStyles();
    }
}

// Export
if (typeof window !== 'undefined') {
    window.ZovoPopupIntegration = ZovoPopupIntegration;
}
