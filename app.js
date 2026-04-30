// Change 'supabase' to 'supabaseClient'
const supabaseUrl = 'https://ntfzicpfqwderifnkodc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50ZnppY3BmcXdkZXJpZm5rb2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MjQ1NTksImV4cCI6MjA5MzEwMDU1OX0.uMVRFVLBHRZQ-6HPQ-QmBM-Fch2N-RdMKc73CIH7gH0';

// This initializes your specific project connection
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Now use 'supabaseClient' for your logic
console.log("Supabase is connected:", supabaseClient);

// Example: Fetching data from a table named 'products'
async function getProducts() {
    // Changed 'supabase' to 'supabaseClient'
    const { data, error } = await supabaseClient
        .from('products')
        .select('*')

    if (error) console.error('Error:', error)
    else console.log('Products:', data)
}

getProducts();


document.addEventListener('DOMContentLoaded', () => {
    const sendMoneyBtn = document.getElementById('sendMoneyBtn');
    const receiveMoneyBtn = document.getElementById('receiveMoneyBtn');
    const modalOverlay = document.getElementById('scannerModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalTitle = document.getElementById('modalTitle');
    const scannerInstruction = document.getElementById('scannerInstruction');

    // UI View Containers
    const scannerContainerView = document.getElementById('scannerContainerView');
    const scanResultView = document.getElementById('scanResultView');
    const modalFooterView = document.getElementById('modalFooterView');

    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    const resultAlerts = document.getElementById('resultAlerts');
    const scanAgainBtn = document.getElementById('scanAgainBtn');

    let html5QrcodeScanner = null;
    let currentMode = '';

    // Switch between scanner view and result view
    function showResultView() {
        scannerContainerView.classList.add('hidden');
        modalFooterView.classList.add('hidden');
        scanResultView.classList.remove('hidden');
    }

    function showScannerView() {
        scanResultView.classList.add('hidden');
        scannerContainerView.classList.remove('hidden');
        modalFooterView.classList.remove('hidden');

        // Reset Result View
        resultIcon.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
        resultTitle.textContent = 'Analyzing Code...';
        resultTitle.style.color = 'var(--text-primary)';
        resultAlerts.innerHTML = '';
    }

    // Function to open modal
    function openModal(mode) {
        currentMode = mode;
        if (mode === 'send') {
            modalTitle.textContent = 'Scan to Pay';
            scannerInstruction.textContent = 'Align the recipient\'s QR code within the frame.';
        } else {
            modalTitle.textContent = 'Scan to Receive';
            scannerInstruction.textContent = 'Scan sender\'s QR to verify details.';
        }

        showScannerView();
        modalOverlay.classList.remove('hidden');
        startScanner();
    }

    // Function to close modal
    function closeModal() {
        modalOverlay.classList.add('hidden');
        stopScanner();
        // Delay to allow fade out animation
        setTimeout(showScannerView, 300);
    }

    // Connect to Python FastAPI Backend
    async function evaluateSafety(decodedText) {
        showResultView();
        try {
            const response = await fetch('https://upi-shielduvicorn-main-app-host-0-0-0-0.onrender.com/check-safety', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qr_raw: decodedText,
                    user_intent: currentMode
                })
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const data = await response.json();
            displayAnalysis(data);
        } catch (error) {
            console.error('Error contacting backend:', error);
            resultIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color: var(--danger);"></i>';
            resultTitle.textContent = 'Connection Error';
            resultTitle.style.color = 'var(--danger)';
            resultAlerts.innerHTML = `<div style="background: rgba(239, 68, 68, 0.1); padding: 12px; border-radius: 8px; border-left: 4px solid var(--danger); font-size: 0.9rem;">
                Could not reach the security server. Is the FastAPI backend running on port 8000?
            </div>`;
        }
    }

    function displayAnalysis(data) {
        resultAlerts.innerHTML = ''; // clear

        if (data.is_safe && data.alerts.length === 0) {
            resultIcon.innerHTML = '<i class="fa-solid fa-shield-check" style="color: var(--secondary-accent);"></i>';
            resultTitle.textContent = 'Safe to Proceed';
            resultTitle.style.color = 'var(--secondary-accent)';

            resultAlerts.innerHTML = `<div style="background: rgba(16, 185, 129, 0.1); padding: 12px; border-radius: 8px; border-left: 4px solid var(--secondary-accent); font-size: 0.9rem; color: #d1fae5;">
                <i class="fa-solid fa-check-circle mr-2"></i> UPI Code verified successfully.
            </div>`;
        } else {
            // Apply styling based on Risk Level
            let colorHex = 'var(--danger)';
            let iconClass = 'fa-solid fa-circle-xmark';

            if (data.risk_level === 'Medium') {
                colorHex = '#f59e0b'; // amber
                iconClass = 'fa-solid fa-triangle-exclamation';
            }

            resultIcon.innerHTML = `<i class="${iconClass}" style="color: ${colorHex};"></i>`;
            resultTitle.textContent = `${data.risk_level} Risk Detected!`;
            resultTitle.style.color = colorHex;

            data.alerts.forEach(alertText => {
                const alertDiv = document.createElement('div');
                alertDiv.style.background = `rgba(0,0,0,0.3)`;
                alertDiv.style.padding = '12px';
                alertDiv.style.borderRadius = '8px';
                alertDiv.style.borderLeft = `4px solid ${colorHex}`;
                alertDiv.style.fontSize = '0.9rem';
                alertDiv.style.color = '#f8fafc';
                alertDiv.style.marginBottom = '8px';
                alertDiv.innerHTML = `<i class="fa-solid fa-shield-virus"></i> ${alertText}`;
                resultAlerts.appendChild(alertDiv);
            });
        }
    }

    // Success callback for QR Scanner
    function onScanSuccess(decodedText, decodedResult) {
        // Pause scanning to evaluate
        if (html5QrcodeScanner) {
            html5QrcodeScanner.pause(true);
        }

        // Pass to backend for validation
        evaluateSafety(decodedText);
    }

    // Failure callback for QR Scanner
    function onScanFailure(error) {
        // Ignore failures, wait for a good scan
    }

    // Start the scanner
    function startScanner() {
        if (html5QrcodeScanner !== null) {
            if (html5QrcodeScanner.getState() === 3) { // 3 = PAUSED
                html5QrcodeScanner.resume();
            }
            return;
        }

        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false
        };

        html5QrcodeScanner = new Html5Qrcode("reader");
        const cameraConfig = { facingMode: "environment" };

        html5QrcodeScanner.start(
            cameraConfig,
            config,
            onScanSuccess,
            onScanFailure
        ).catch((err) => {
            console.error("Error starting scanner: ", err);
            scannerInstruction.textContent = 'Error accessing camera. Please ensure permissions are granted.';
            scannerInstruction.style.color = 'var(--danger)';
        });
    }

    // Stop the scanner completely
    function stopScanner() {
        if (html5QrcodeScanner) {
            if (html5QrcodeScanner.getState() !== 1) { // Not state NOT_STARTED
                html5QrcodeScanner.stop().then(() => {
                    html5QrcodeScanner.clear();
                    html5QrcodeScanner = null;
                    scannerInstruction.style.color = 'var(--text-secondary)';
                }).catch(err => console.error(err));
            }
        }
    }

    // Event Listeners
    sendMoneyBtn.addEventListener('click', () => openModal('send'));
    receiveMoneyBtn.addEventListener('click', () => openModal('receive'));
    closeModalBtn.addEventListener('click', closeModal);

    // Scan Again Button inside Result View
    scanAgainBtn.addEventListener('click', () => {
        showScannerView();
        startScanner();
    });

    // Close on clicking outside the modal content
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // Close on pressing Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
            closeModal();
        }
    });
});
