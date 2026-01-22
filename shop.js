// Girl Math Shop Page
// Renders scanned product + mock multi-offer list (UI-first).

const SHOP_CONTEXT_KEY = 'girlMathShopContext';

function safeText(value) {
    return String(value ?? '').replace(/[<>]/g, '');
}

function formatPriceRange(range) {
    if (!range || typeof range !== 'object') return 'Estimated: $25 - $200';
    let low = Number(range.low);
    let high = Number(range.high);
    if (!Number.isFinite(low) || low <= 0) low = 25;
    if (!Number.isFinite(high) || high <= 0) high = 200;
    if (low > high) [low, high] = [high, low];
    if (low === high) return `Estimated: ~$${Math.round(low)}`;
    return `Estimated: $${Math.round(low)} - $${Math.round(high)}`;
}

function confidenceLabel(confidence) {
    const c = Number(confidence);
    if (!Number.isFinite(c)) return null;
    if (c >= 0.8) return { text: 'High match', tone: 'high' };
    if (c >= 0.6) return { text: 'Good match', tone: 'mid' };
    if (c >= 0.4) return { text: 'Possible match', tone: 'low' };
    return { text: 'Low match', tone: 'low' };
}

// Deterministic seeded PRNG (mulberry32)
function mulberry32(seed) {
    let a = seed >>> 0;
    return function() {
        a |= 0;
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function hashStringToSeed(str) {
    const s = String(str || '');
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function minutesToLabel(minutes) {
    if (!Number.isFinite(minutes)) return '—';
    if (minutes <= 60) return `${Math.round(minutes)}m`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.round(hours / 24);
    return `${days}d`;
}

function buildMockOffers(candidate) {
    const name = safeText(candidate?.name || 'Product');
    const brand = safeText(candidate?.brand || '');
    const range = candidate?.priceRange || { low: 25, high: 200, currency: 'USD' };

    let low = Number(range.low);
    let high = Number(range.high);
    if (!Number.isFinite(low) || low <= 0) low = 25;
    if (!Number.isFinite(high) || high <= 0) high = 200;
    if (low > high) [low, high] = [high, low];

    const seed = hashStringToSeed(`${brand}|${name}|${low}|${high}`);
    const rand = mulberry32(seed);

    const retailers = [
        { id: 'amazon', name: 'Amazon', urlPrefix: 'https://www.amazon.com/s?k=' },
        { id: 'ebay', name: 'eBay', urlPrefix: 'https://www.ebay.com/sch/i.html?_nkw=' },
        { id: 'walmart', name: 'Walmart', urlPrefix: 'https://www.walmart.com/search?q=' },
        { id: 'target', name: 'Target', urlPrefix: 'https://www.target.com/s?searchTerm=' },
        { id: 'sephora', name: 'Sephora', urlPrefix: 'https://www.sephora.com/search?keyword=' },
        { id: 'bestbuy', name: 'Best Buy', urlPrefix: 'https://www.bestbuy.com/site/searchpage.jsp?st=' }
    ];

    // Choose 5 offers (stable order but varied by seed)
    const chosen = [...retailers]
        .sort(() => rand() - 0.5)
        .slice(0, 5);

    const currency = range.currency || 'USD';
    const q = encodeURIComponent(`${brand ? brand + ' ' : ''}${name}`.trim());

    const offers = chosen.map((r, idx) => {
        const price = Math.round(clamp(low + (high - low) * (0.12 + rand() * 0.86), low, high));
        const rating = clamp(3.5 + rand() * 1.4, 1, 5);
        const shippingMinutes = Math.round(clamp(60 * 12 + rand() * 60 * 72, 60, 60 * 24 * 7)); // ~0.5d to ~7d

        // A little variety (condition & shipping)
        const condition = idx === 0 && rand() > 0.6 ? 'Used - good' : 'New';
        const shippingText =
            shippingMinutes <= 60 * 24 ? 'Fast shipping' :
            shippingMinutes <= 60 * 72 ? '2–3 day shipping' :
            'Standard shipping';

        return {
            retailerId: r.id,
            retailerName: r.name,
            price,
            currency,
            rating: Math.round(rating * 10) / 10,
            ratingCount: Math.round(50 + rand() * 2500),
            shippingMinutes,
            shippingLabel: shippingText,
            condition,
            url: `${r.urlPrefix}${q}`
        };
    });

    return offers;
}

function renderOfferCard(offer, isBestPrice = false, index = 0) {
    const price = Number(offer.price);
    const retailerName = safeText(offer.retailerName || 'Retailer');
    const rating = Number(offer.rating);
    const ratingCount = Number(offer.ratingCount);
    const shippingLabel = safeText(offer.shippingLabel || '—');
    const url = String(offer.url || '#');

    const ratingText = Number.isFinite(rating) ? rating.toFixed(1) : '—';
    const ratingCountText = Number.isFinite(ratingCount) ? `(${ratingCount.toLocaleString()})` : '';
    const priceDisplay = Number.isFinite(price) ? price.toLocaleString() : '—';
    
    // Accessibility
    const cardAriaLabel = isBestPrice 
        ? `Best deal: $${priceDisplay} at ${retailerName}, ${ratingText} star rating with ${ratingCountText} reviews, ${shippingLabel}`
        : `$${priceDisplay} at ${retailerName}, ${ratingText} star rating with ${ratingCountText} reviews, ${shippingLabel}`;

    const cardClass = isBestPrice ? 'offer-card offer-card--best' : 'offer-card';
    const badgeHtml = isBestPrice ? '<div class="offer-badge">BEST DEAL</div>' : '';

    return `
        <div class="${cardClass}" 
             role="listitem" 
             tabindex="0" 
             aria-label="${cardAriaLabel}"
             data-offer-index="${index}"
             style="animation-delay: ${index * 60}ms">
            ${badgeHtml}
            <div class="offer-card-content">
                <!-- Store Info (Left) -->
                <div class="offer-store-info">
                    <h3 class="offer-store-name">${retailerName}</h3>
                    <div class="offer-meta">
                        <div class="offer-rating">
                            <span class="offer-stars">★</span>
                            <span class="offer-rating-value">${ratingText}</span>
                            <span class="offer-rating-count">${ratingCountText}</span>
                        </div>
                        <div class="offer-shipping">
                            <span class="offer-shipping-icon">🚚</span>
                            <span class="offer-shipping-text">${shippingLabel}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Price (Center-Right) -->
                <div class="offer-price">
                    <span class="offer-price-currency">$</span>
                    <span class="offer-price-amount">${priceDisplay}</span>
                </div>
                
                <!-- Shop Button (Right) -->
                <a href="${url}" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="offer-shop-btn"
                   aria-label="Shop at ${retailerName} for $${priceDisplay}">
                    Shop
                    <span class="offer-shop-arrow">→</span>
                </a>
            </div>
        </div>
    `;
}

function sortOffers(offers, mode) {
    const list = [...offers];
    if (mode === 'rating') {
        list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0) || (Number(a.price) || 0) - (Number(b.price) || 0));
        return list;
    }
    if (mode === 'shipping') {
        list.sort((a, b) => (Number(a.shippingMinutes) || Infinity) - (Number(b.shippingMinutes) || Infinity) || (Number(a.price) || 0) - (Number(b.price) || 0));
        return list;
    }
    // default: price lowest first
    list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0) || (Number(b.rating) || 0) - (Number(a.rating) || 0));
    return list;
}

function loadShopContext() {
    try {
        const raw = sessionStorage.getItem(SHOP_CONTEXT_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

/**
 * Fetches real product offers from SerpAPI via our backend
 * @param {Object} candidate - Product candidate with name, brand, category
 * @returns {Promise<Array>} Array of offer objects, or empty array on error
 */
async function fetchRealOffers(candidate) {
    try {
        const productName = safeText(candidate?.name || '');
        const brand = safeText(candidate?.brand || '');
        const category = candidate?.category || 'other';

        if (!productName) {
            return [];
        }

        const response = await fetch('/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                productName,
                brand: brand || null,
                category
            })
        });

        if (!response.ok) {
            console.warn('Search API returned error, using fallback');
            return [];
        }

        const data = await response.json();
        const offers = data.offers || [];

        // Validate offers have required fields
        return offers.filter(offer => 
            offer && 
            typeof offer.price === 'number' && 
            offer.price > 0 &&
            offer.retailerName &&
            offer.url
        );

    } catch (error) {
        console.warn('Error fetching real offers, using fallback:', error.message);
        return [];
    }
}

/**
 * Shows loading state in the offers container
 * @param {HTMLElement} offersEl - Offers container element
 */
function showLoadingState(offersEl) {
    if (!offersEl) return;
    offersEl.innerHTML = `
        <div class="shop-loading" role="status" aria-live="polite">
            <div class="shop-loading-spinner"></div>
            <p>Finding the best deals...</p>
        </div>
    `;
}

/**
 * Shows error/empty state in the offers container
 * @param {HTMLElement} offersEl - Offers container element
 * @param {string} message - Message to display
 */
function showEmptyState(offersEl, message = 'No offers found') {
    if (!offersEl) return;
    offersEl.innerHTML = `<p class="shop-no-results" role="status">${safeText(message)}</p>`;
}

function setup() {
    const titleEl = document.getElementById('shopProductTitle');
    const imageEl = document.getElementById('shopScannedImage');
    const imagePlaceholderEl = document.getElementById('shopImagePlaceholder');
    const offersEl = document.getElementById('shopOffers');
    const startOverBtn = document.getElementById('shopStartOverBtn');
    const savingsCard = document.getElementById('shopSavingsCard');
    const savingsAmount = document.getElementById('savingsAmount');
    const savingsStore = document.getElementById('savingsStore');

    const context = loadShopContext();
    const candidate = context?.candidate || null;
    const imageDataUrl = context?.imageDataUrl || null;

    if (startOverBtn) {
        startOverBtn.addEventListener('click', () => {
            sessionStorage.removeItem(SHOP_CONTEXT_KEY);
            window.location.href = 'index.html';
        });
    }

    if (!candidate) {
        if (titleEl) titleEl.textContent = 'No product selected';
        if (offersEl) showEmptyState(offersEl, 'Go back to the scanner and tap "Shop this item".');
        return;
    }

    // Set product name
    const safeName = safeText(candidate.name || 'Product');
    const safeBrand = safeText(candidate.brand || '');
    const fullProductName = safeBrand ? `${safeBrand} ${safeName}` : safeName;
    
    if (titleEl) {
        titleEl.textContent = fullProductName;
    }

    // Set product thumbnail
    if (imageEl && imagePlaceholderEl) {
        if (typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:image/')) {
            imageEl.src = imageDataUrl;
            imageEl.style.display = 'block';
            imagePlaceholderEl.style.display = 'none';
        } else {
            imageEl.style.display = 'none';
            imagePlaceholderEl.style.display = 'flex';
        }
    }

    // Show loading state
    showLoadingState(offersEl);

    // Try to fetch real offers, fall back to mock offers
    fetchRealOffers(candidate).then(realOffers => {
        let offers = realOffers;

        // If no real offers or too few, supplement with mock offers
        if (offers.length === 0) {
            offers = buildMockOffers(candidate);
        } else if (offers.length < 3) {
            // If we have some real offers but not many, add a few mock ones
            const mockOffers = buildMockOffers(candidate);
            // Add mock offers that don't duplicate retailers
            const existingRetailers = new Set(offers.map(o => o.retailerId));
            const additionalMock = mockOffers
                .filter(m => !existingRetailers.has(m.retailerId))
                .slice(0, 3 - offers.length);
            offers = [...offers, ...additionalMock];
        }

        render(offers);
    }).catch(error => {
        console.error('Error loading offers:', error);
        // Fall back to mock offers on any error
        const offers = buildMockOffers(candidate);
        render(offers);
    });

    function render(offers) {
        // Sort by price (lowest first)
        const sorted = sortOffers(offers, 'price');
        if (!offersEl) return;
        
        // Determine how many offers to show initially
        const totalOffers = sorted.length;
        const initialCount = Math.min(5, totalOffers);
        const hasMore = totalOffers > 5;
        
        // Show initial offers (first 5)
        const initialOffers = sorted.slice(0, initialCount);
        const remainingOffers = hasMore ? sorted.slice(5) : [];
        
        // Render initial offers
        let html = initialOffers.map((offer, index) => {
            const isBestPrice = index === 0;
            return renderOfferCard(offer, isBestPrice, index);
        }).join('');
        
        // Add remaining offers container and toggle button if there are more offers
        if (hasMore) {
            html += `
                <div class="shop-remaining-offers" id="shopRemainingOffers" style="display: none;">
                    ${remainingOffers.map((offer, index) => {
                        return renderOfferCard(offer, false, initialCount + index);
                    }).join('')}
                </div>
                <button type="button" class="shop-show-more-btn" id="shopShowMoreBtn" aria-label="Show ${remainingOffers.length} more offers">
                    Show more
                </button>
            `;
        }
        
        offersEl.innerHTML = html;
        
        // Setup "Show more/less" toggle button handler
        if (hasMore) {
            const showMoreBtn = document.getElementById('shopShowMoreBtn');
            const remainingEl = document.getElementById('shopRemainingOffers');
            let isExpanded = false;
            
            if (showMoreBtn && remainingEl) {
                showMoreBtn.addEventListener('click', () => {
                    if (isExpanded) {
                        // Collapse
                        remainingEl.style.display = 'none';
                        showMoreBtn.textContent = 'Show more';
                        showMoreBtn.setAttribute('aria-label', `Show ${remainingOffers.length} more offers`);
                        isExpanded = false;
                    } else {
                        // Expand
                        remainingEl.style.display = 'flex';
                        showMoreBtn.textContent = 'Show less';
                        showMoreBtn.setAttribute('aria-label', 'Show less offers');
                        isExpanded = true;
                    }
                    // Re-setup keyboard navigation for all cards
                    setupKeyboardNavigation();
                });
            }
        }
        
        // Update savings card
        if (savingsCard && savingsAmount && savingsStore && sorted.length >= 2) {
            const lowestPrice = sorted[0].price;
            const highestPrice = sorted[sorted.length - 1].price;
            const savings = highestPrice - lowestPrice;
            
            if (savings > 0) {
                savingsAmount.textContent = `$${savings}`;
                savingsStore.textContent = `by choosing ${sorted[0].retailerName}`;
                savingsCard.style.display = 'flex';
            }
        }
        
        // Add keyboard navigation to cards
        setupKeyboardNavigation();
    }
    
    // Keyboard navigation for offer cards
    function setupKeyboardNavigation() {
        const cards = offersEl.querySelectorAll('.offer-card');
        cards.forEach((card, index) => {
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const link = card.querySelector('.offer-shop-btn');
                    if (link) link.click();
                }
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const next = cards[index + 1];
                    if (next) next.focus();
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prev = cards[index - 1];
                    if (prev) prev.focus();
                }
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', setup);
