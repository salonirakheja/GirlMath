// Girl Math Scanner - Camera and Results UI
// Standalone scanner - NOT connected to Girl Math Calculator

let stream = null;
let capturedImageData = null;
let currentScanResult = null;
let selectedCandidate = null;

// DOM elements
const videoElement = document.getElementById('videoElement');
const canvasElement = document.getElementById('canvasElement');
const cameraPlaceholder = document.getElementById('cameraPlaceholder');
const capturedImage = document.getElementById('capturedImage');
const cameraContainer = document.getElementById('cameraContainer');
const captureBtn = document.getElementById('captureBtn');
const retakeBtn = document.getElementById('retakeBtn');
const cameraControls = document.getElementById('cameraControls');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');

// Scanner Results DOM elements
const scannerResults = document.getElementById('scannerResults');
const resultHeader = document.getElementById('resultHeader');
const primaryResult = document.getElementById('primaryResult');
const disambiguationView = document.getElementById('disambiguationView');
const needsInfoView = document.getElementById('needsInfoView');
const selectedResultView = document.getElementById('selectedResult');

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Add click handler to placeholder to start camera
    if (cameraPlaceholder) {
        cameraPlaceholder.addEventListener('click', startCamera);
    }
    
    // Set up capture button
    if (captureBtn) {
        captureBtn.addEventListener('click', capturePhoto);
    }
    
    // Set up retake button
    if (retakeBtn) {
        retakeBtn.addEventListener('click', retakePhoto);
    }
    
    // Set up needs-info view buttons
    const retakePhotoBtn = document.getElementById('retakePhotoBtn');
    const manualCategoryBtn = document.getElementById('manualCategoryBtn');
    const submitManualCategory = document.getElementById('submitManualCategory');
    
    if (retakePhotoBtn) {
        retakePhotoBtn.addEventListener('click', retakePhoto);
    }
    
    if (manualCategoryBtn) {
        manualCategoryBtn.addEventListener('click', showManualCategorySelector);
    }
    
    if (submitManualCategory) {
        submitManualCategory.addEventListener('click', handleManualCategorySubmit);
    }
});

// Start camera
async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        
        videoElement.srcObject = stream;
        videoElement.style.display = 'block';
        cameraPlaceholder.style.display = 'none';
        cameraControls.style.display = 'flex';
        captureBtn.style.display = 'block';
        retakeBtn.style.display = 'none';
        capturedImage.style.display = 'none';
        
        // Hide results when restarting camera
        hideAllResultViews();
        
        await videoElement.play();
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        
        cameraPlaceholder.innerHTML = `
            <div class="camera-icon">⚠️</div>
            <p class="camera-placeholder-text">Camera access denied</p>
            <p class="camera-placeholder-text" style="font-size: 0.7rem; margin-top: 8px;">
                Please allow camera access to scan products
            </p>
        `;
        cameraPlaceholder.style.cursor = 'default';
    }
}

// Capture photo from video stream
async function capturePhoto() {
    try {
        const context = canvasElement.getContext('2d');
        const videoWidth = videoElement.videoWidth;
        const videoHeight = videoElement.videoHeight;
        
        canvasElement.width = videoWidth;
        canvasElement.height = videoHeight;
        context.drawImage(videoElement, 0, 0, videoWidth, videoHeight);
        
        capturedImageData = canvasElement.toDataURL('image/jpeg', 0.8);
        
        stopCamera();
        
        capturedImage.src = capturedImageData;
        capturedImage.style.display = 'block';
        videoElement.style.display = 'none';
        cameraPlaceholder.style.display = 'none';
        
        captureBtn.style.display = 'none';
        retakeBtn.style.display = 'block';
        cameraControls.style.display = 'flex';
        
        // Clear previous results and show loading
        hideAllResultViews();
        showLoading(true);
        hideError();
        
        // Call API to identify product
        await identifyProduct(capturedImageData);
        
    } catch (error) {
        console.error('Error capturing photo:', error);
        showError('Error capturing photo. Please try again.');
        showLoading(false);
    }
}

// Call vision API to identify product
async function identifyProduct(imageDataUrl) {
    try {
        const response = await fetch('/api/vision', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                imageDataUrl: imageDataUrl
            })
        });

        const responseText = await response.text();

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseErr) {
            throw new Error('Server returned invalid response. Are you running vercel dev?');
        }

        if (!response.ok) {
            throw new Error(data.error || data.message || 'Failed to identify product');
        }

        // Process the result using the scanner module
        if (window.ScannerModule && window.ScannerModule.processScanResult) {
            currentScanResult = window.ScannerModule.processScanResult(data);
        } else {
            // Fallback if module not loaded
            currentScanResult = processLocalScanResult(data);
        }
        
        // Display results
        displayScanResult(currentScanResult);
        showLoading(false);

    } catch (error) {
        console.error('Error identifying product:', error);
        showError(error.message || 'Failed to identify product. Please try again.');
        showLoading(false);
    }
}

// Fallback local processing if module not loaded
function processLocalScanResult(apiResponse) {
    const { imageSummary, candidates } = apiResponse;
    
    // Determine status based on confidence
    const topConfidence = candidates[0]?.confidence || 0;
    let status = 'ok';
    let followup = undefined;
    
    // Check for phone back image
    const isPhoneBack = (imageSummary || '').toLowerCase().includes('back') && 
                        (imageSummary || '').toLowerCase().includes('camera');
    
    if (topConfidence < 0.3) {
        status = 'needs_more_info';
        followup = {
            type: 'retake_hint',
            prompt: 'Not enough signal from this photo'
        };
    } else if (topConfidence < 0.6 || isPhoneBack) {
        status = 'needs_disambiguation';
        followup = {
            type: 'pick_one',
            prompt: isPhoneBack ? 'Phones look similar from the back — pick the closest match' : 'Pick the closest match',
            options: candidates.slice(0, 3).map(c => c.name)
        };
        if (isPhoneBack) {
            followup.hint = 'If you can, capture the front screen or the box label for a precise model.';
        }
    }
    
    return {
        status,
        imageSummary: imageSummary || 'Product image analyzed',
        candidates,
        followup
    };
}

// Display scan result based on status
function displayScanResult(result) {
    if (!result || !scannerResults) return;
    
    hideAllResultViews();
    scannerResults.style.display = 'block';
    
    // Set header text
    const headerText = resultHeader.querySelector('.result-header-text');
    if (headerText) {
        if (window.ScannerModule && window.ScannerModule.getResultHeader) {
            headerText.textContent = window.ScannerModule.getResultHeader(result);
        } else {
            headerText.textContent = result.status === 'ok' ? 'Looks like...' : 
                                     result.status === 'needs_disambiguation' ? 'Best guesses...' :
                                     'We need a bit more info...';
        }
    }
    
    switch (result.status) {
        case 'ok':
            displayOkResult(result);
            break;
        case 'needs_disambiguation':
            displayDisambiguationResult(result);
            break;
        case 'needs_more_info':
            displayNeedsInfoResult(result);
            break;
        default:
            displayOkResult(result);
    }
}

// Display OK result (high confidence)
function displayOkResult(result) {
    if (!primaryResult) return;
    
    const topCandidate = result.candidates[0];
    const otherCandidates = result.candidates.slice(1);
    
    // Primary product info
    const productNameEl = document.getElementById('primaryProductName');
    const priceRangeEl = document.getElementById('primaryPriceRange');
    const assumptionsEl = document.getElementById('primaryAssumptions');
    
    if (productNameEl) {
        productNameEl.textContent = topCandidate.name;
        if (topCandidate.brand) {
            productNameEl.innerHTML = `<span class="brand-name">${topCandidate.brand}</span> ${topCandidate.name}`;
        }
    }
    
    if (priceRangeEl) {
        priceRangeEl.textContent = formatPriceRange(topCandidate.priceRange);
    }
    
    if (assumptionsEl) {
        assumptionsEl.textContent = topCandidate.assumptions || 'Price varies by condition, region, and retailer';
    }
    
    // Other matches
    const otherMatchesEl = document.getElementById('otherMatches');
    const otherMatchesListEl = document.getElementById('otherMatchesList');
    
    if (otherMatchesEl && otherMatchesListEl && otherCandidates.length > 0) {
        otherMatchesListEl.innerHTML = otherCandidates.map(candidate => `
            <div class="other-match-item" data-candidate='${JSON.stringify(candidate)}'>
                <div class="other-match-name">${candidate.name}</div>
                <div class="other-match-price">${formatPriceRange(candidate.priceRange)}</div>
            </div>
        `).join('');
        
        otherMatchesEl.style.display = 'block';
        
        // Add click handlers to other matches
        otherMatchesListEl.querySelectorAll('.other-match-item').forEach(item => {
            item.addEventListener('click', () => {
                const candidate = JSON.parse(item.getAttribute('data-candidate'));
                selectCandidate(candidate);
            });
        });
    } else if (otherMatchesEl) {
        otherMatchesEl.style.display = 'none';
    }
    
    primaryResult.style.display = 'block';
    
    // Store selected candidate
    selectedCandidate = topCandidate;
}

// Display disambiguation result
function displayDisambiguationResult(result) {
    if (!disambiguationView) return;
    
    const promptEl = document.getElementById('disambiguationPrompt');
    const candidateCardsEl = document.getElementById('candidateCards');
    const quickPickOptionsEl = document.getElementById('quickPickOptions');
    const hintEl = document.getElementById('disambiguationHint');
    
    // Set prompt
    if (promptEl && result.followup?.prompt) {
        promptEl.textContent = result.followup.prompt;
    }
    
    // Generate candidate cards
    if (candidateCardsEl) {
        candidateCardsEl.innerHTML = result.candidates.map((candidate, index) => `
            <div class="candidate-card" data-index="${index}" data-candidate='${JSON.stringify(candidate)}'>
                <div class="candidate-card-header">
                    ${candidate.brand ? `<span class="candidate-brand">${candidate.brand}</span>` : ''}
                    <span class="candidate-name">${candidate.name}</span>
                </div>
                <div class="candidate-card-price">${formatPriceRange(candidate.priceRange)}</div>
                <div class="candidate-card-confidence">
                    <div class="confidence-indicator" style="width: ${Math.round(candidate.confidence * 100)}%"></div>
                </div>
                <button type="button" class="candidate-select-btn">Select</button>
            </div>
        `).join('');
        
        // Add click handlers
        candidateCardsEl.querySelectorAll('.candidate-card').forEach(card => {
            card.addEventListener('click', () => {
                const candidate = JSON.parse(card.getAttribute('data-candidate'));
                selectCandidate(candidate);
            });
        });
    }
    
    // Show quick pick options if available (for phones, etc.)
    if (quickPickOptionsEl && result.followup?.options && result.followup.type === 'pick_one') {
        const quickPickLabel = document.getElementById('quickPickLabel');
        const quickPickButtons = document.getElementById('quickPickButtons');
        
        if (quickPickLabel) {
            quickPickLabel.textContent = 'Quick pick:';
        }
        
        if (quickPickButtons) {
            quickPickButtons.innerHTML = result.followup.options.map(option => `
                <button type="button" class="quick-pick-btn" data-option="${option}">${option}</button>
            `).join('');
            
            // Add click handlers
            quickPickButtons.querySelectorAll('.quick-pick-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const option = btn.getAttribute('data-option');
                    handleQuickPickSelection(option, result);
                });
            });
        }
        
        quickPickOptionsEl.style.display = 'block';
    }
    
    // Show hint if available
    if (hintEl && result.followup?.hint) {
        hintEl.textContent = '💡 ' + result.followup.hint;
        hintEl.style.display = 'block';
    } else if (hintEl) {
        hintEl.style.display = 'none';
    }
    
    disambiguationView.style.display = 'block';
}

// Display needs more info result
function displayNeedsInfoResult(result) {
    if (!needsInfoView) return;
    needsInfoView.style.display = 'block';
}

// Handle candidate selection
function selectCandidate(candidate) {
    selectedCandidate = candidate;
    
    // Hide other views
    if (primaryResult) primaryResult.style.display = 'none';
    if (disambiguationView) disambiguationView.style.display = 'none';
    if (needsInfoView) needsInfoView.style.display = 'none';
    
    // Show selected result
    if (selectedResultView) {
        const nameEl = document.getElementById('selectedProductName');
        const priceEl = document.getElementById('selectedPriceRange');
        const assumptionsEl = document.getElementById('selectedAssumptions');
        
        if (nameEl) {
            nameEl.textContent = candidate.name;
            if (candidate.brand) {
                nameEl.innerHTML = `<span class="brand-name">${candidate.brand}</span> ${candidate.name}`;
            }
        }
        
        if (priceEl) {
            priceEl.textContent = formatPriceRange(candidate.priceRange);
        }
        
        if (assumptionsEl) {
            assumptionsEl.textContent = candidate.assumptions || 'Price varies by condition, region, and retailer';
        }
        
        selectedResultView.style.display = 'block';
    }
    
    // Update header
    const headerText = resultHeader?.querySelector('.result-header-text');
    if (headerText) {
        headerText.textContent = '✓ Selected';
    }
}

// Handle quick pick selection (for phones, etc.)
function handleQuickPickSelection(option, result) {
    // Find matching candidate or create one based on the option
    let matchingCandidate = result.candidates.find(c => 
        c.name.toLowerCase().includes(option.toLowerCase())
    );
    
    if (!matchingCandidate) {
        // Create a candidate based on the quick pick option
        const category = result.candidates[0]?.category || 'phone';
        matchingCandidate = createQuickPickCandidate(option, category);
    }
    
    selectCandidate(matchingCandidate);
}

// Create a candidate for quick pick options
function createQuickPickCandidate(option, category) {
    const priceRanges = {
        'iPhone (standard)': { low: 699, high: 999, currency: 'USD' },
        'iPhone Pro': { low: 999, high: 1199, currency: 'USD' },
        'iPhone Pro Max': { low: 1099, high: 1599, currency: 'USD' },
        'Android / Other': { low: 299, high: 999, currency: 'USD' }
    };
    
    return {
        name: option,
        category: category,
        confidence: 0.6,
        priceRange: priceRanges[option] || { low: 299, high: 999, currency: 'USD' },
        assumptions: 'Price varies by storage capacity, model year, and condition'
    };
}

// Show manual category selector
function showManualCategorySelector() {
    const selector = document.getElementById('manualCategorySelector');
    if (selector) {
        selector.style.display = 'block';
    }
}

// Handle manual category submission
function handleManualCategorySubmit() {
    const categorySelect = document.getElementById('manualCategory');
    if (!categorySelect || !categorySelect.value) {
        showError('Please select a category');
        return;
    }
    
    const category = categorySelect.value;
    let result;
    
    if (window.ScannerModule && window.ScannerModule.createManualCategoryResult) {
        result = window.ScannerModule.createManualCategoryResult(category);
    } else {
        // Fallback
        result = createLocalManualCategoryResult(category);
    }
    
    currentScanResult = result;
    displayScanResult(result);
}

// Local fallback for manual category result - NEVER returns "Consumer Product" or $0
function createLocalManualCategoryResult(category) {
    // All prices are non-zero
    const priceRanges = {
        phone: { low: 299, high: 1299, currency: 'USD' },
        jewellery: { low: 30, high: 800, currency: 'USD' },
        shoes: { low: 50, high: 400, currency: 'USD' },
        bag: { low: 50, high: 1500, currency: 'USD' },
        clothes: { low: 25, high: 350, currency: 'USD' },
        skincare: { low: 15, high: 150, currency: 'USD' },
        electronics: { low: 80, high: 1200, currency: 'USD' },
        watch: { low: 80, high: 600, currency: 'USD' },
        other: { low: 25, high: 250, currency: 'USD' }
    };
    
    // Better names - never "Consumer Product"
    const categoryNames = {
        phone: 'Smartphone',
        jewellery: 'Fashion Jewelry',
        shoes: 'Footwear',
        bag: 'Handbag',
        clothes: 'Fashion Apparel',
        skincare: 'Beauty Product',
        electronics: 'Electronic Device',
        watch: 'Wristwatch',
        other: 'Lifestyle Product'
    };
    
    const secondaryNames = {
        phone: 'Mobile Device',
        jewellery: 'Jewelry Piece',
        shoes: 'Casual Shoes',
        bag: 'Fashion Bag',
        clothes: 'Clothing Item',
        skincare: 'Personal Care',
        electronics: 'Tech Gadget',
        watch: 'Timepiece',
        other: 'Personal Item'
    };
    
    const primaryPriceRange = priceRanges[category] || priceRanges.other;
    
    return {
        status: 'ok',
        imageSummary: 'Category selected manually',
        candidates: [
            {
                name: categoryNames[category] || 'Lifestyle Product',
                category: category,
                confidence: 0.5,
                priceRange: primaryPriceRange,
                assumptions: 'Wide range based on category; actual price depends on specific product, brand, and condition'
            },
            {
                name: secondaryNames[category] || 'Personal Item',
                category: category,
                confidence: 0.4,
                priceRange: {
                    low: Math.round(primaryPriceRange.low * 0.8),
                    high: Math.round(primaryPriceRange.high * 1.2),
                    currency: 'USD'
                },
                assumptions: 'Alternative estimate with broader range'
            }
        ]
    };
}

// Helper: Format price range - NEVER shows $0 or empty
function formatPriceRange(range) {
    // Default fallback if no range provided
    if (!range) {
        return 'Estimated: $25 - $200';
    }
    
    if (window.ScannerModule && window.ScannerModule.formatPriceRange) {
        const formatted = window.ScannerModule.formatPriceRange(range);
        // Ensure we never show $0
        if (formatted.includes('$0') || formatted === '$--') {
            return 'Estimated: $25 - $200';
        }
        return formatted;
    }
    
    // Ensure non-zero values
    let low = range.low || 25;
    let high = range.high || 200;
    
    if (low <= 0) low = 25;
    if (high <= 0) high = 200;
    if (low > high) [low, high] = [high, low];
    
    if (low === high) {
        return `Estimated: ~$${low}`;
    }
    return `Estimated: $${low} - $${high}`;
}

// Helper: Hide all result views
function hideAllResultViews() {
    if (scannerResults) scannerResults.style.display = 'none';
    if (primaryResult) primaryResult.style.display = 'none';
    if (disambiguationView) disambiguationView.style.display = 'none';
    if (needsInfoView) needsInfoView.style.display = 'none';
    if (selectedResultView) selectedResultView.style.display = 'none';
    
    // Hide manual category selector
    const selector = document.getElementById('manualCategorySelector');
    if (selector) selector.style.display = 'none';
}

// Show loading indicator
function showLoading(show) {
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'block' : 'none';
    }
}

// Show error message
function showError(message) {
    if (errorMessage) {
        const errorText = errorMessage.querySelector('.error-text');
        if (errorText) {
            errorText.textContent = message;
        }
        errorMessage.style.display = 'block';
    }
}

// Hide error message
function hideError() {
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
}

// Retake photo
function retakePhoto() {
    capturedImageData = null;
    capturedImage.src = '';
    capturedImage.style.display = 'none';
    
    hideAllResultViews();
    hideError();
    showLoading(false);
    
    // Reset selected candidate
    selectedCandidate = null;
    currentScanResult = null;
    
    startCamera();
}

// Stop camera stream
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        videoElement.srcObject = null;
    }
}

// Clean up when page is unloaded
window.addEventListener('beforeunload', () => {
    stopCamera();
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden && stream) {
        // Keep stream running for brief tab switches
    }
});
