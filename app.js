// Change 'supabase' to 'supabaseClient'
const supabaseUrl = 'https://ntfzicpfqwderifnkodc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50ZnppY3BmcXdkZXJpZm5rb2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MjQ1NTksImV4cCI6MjA5MzEwMDU1OX0.uMVRFVLBHRZQ-6HPQ-QmBM-Fch2N-RdMKc73CIH7gH0';

// This initializes your specific project connection
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Now use 'supabaseClient' for your logic
console.log("Supabase is connected:", supabaseClient);

// Example: Fetching data from a table named 'products'
async function getScans() {
    const { data, error } = await supabaseClient
        .from('scans') // Change this to your new table name
        .select('*');

    if (error) {
        console.error('Database Error:', error.message);
    } else {
        console.log('Past Scans:', data);
    }
}

getScans();


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

    // NEW View Elements
    const homeView = document.getElementById('homeView');
    const paymentView = document.getElementById('paymentView');
    const historyView = document.getElementById('historyView');
    const navHistoryBtn = document.getElementById('navHistoryBtn');

    // Payment Elements
    const backToHomeFromPayment = document.getElementById('backToHomeFromPayment');
    const paymentUpiId = document.getElementById('paymentUpiId');
    const paymentAmount = document.getElementById('paymentAmount');
    const confirmPayBtn = document.getElementById('confirmPayBtn');
    const paymentSuccessMsg = document.getElementById('paymentSuccessMsg');

    // History Elements
    const backToHomeFromHistory = document.getElementById('backToHomeFromHistory');
    const historyListContainer = document.getElementById('historyListContainer');

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

    // View Switchers
    function hideAllViews() {
        homeView.classList.add('hidden');
        paymentView.classList.add('hidden');
        historyView.classList.add('hidden');
    }

    function showHome() {
        hideAllViews();
        homeView.classList.remove('hidden');
        // Reset payment stuff
        paymentAmount.value = '';
        paymentSuccessMsg.classList.add('hidden');
        confirmPayBtn.classList.remove('hidden');
        confirmPayBtn.disabled = false;
        confirmPayBtn.innerHTML = '<span style="font-weight: 600; font-size: 1.2rem;">Pay Now</span>';
    }

    function showPaymentScreen(upiId) {
        hideAllViews();
        paymentView.classList.remove('hidden');
        paymentUpiId.textContent = upiId;
        paymentUpiId.dataset.upi = upiId; // Store actual ID
    }

    async function showHistoryScreen() {
        hideAllViews();
        historyView.classList.remove('hidden');
        historyListContainer.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">Loading transactions...</div>';

        // Fetch transactions
        try {
            const { data, error } = await supabaseClient
                .from('transactions')
                .select('*')
                .order('id', { ascending: false });

            if (error) throw error;

            historyListContainer.innerHTML = '';
            if (!data || data.length === 0) {
                historyListContainer.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">No transactions found.</div>';
                return;
            }

            data.forEach(tx => {
                const isReported = tx.danger === 'yes';
                const txEl = document.createElement('div');
                txEl.className = 'history-item';

                const displayId = `Transaction #${tx.id || 'N/A'}`;

                txEl.innerHTML = `
                    <div class="history-info">
                        <div class="history-upi">${tx.qr}</div>
                        <div class="history-meta">${displayId}</div>
                        <div class="history-meta" style="color: ${isReported ? 'var(--danger)' : 'var(--secondary-accent)'}; font-weight: 600;">${isReported ? 'Danger' : 'Success'}</div>
                    </div>
                    <div class="history-actions">
                        <div class="history-amount">₹${tx.price}</div>
                        <button class="report-btn" data-id="${tx.id}" ${isReported ? 'disabled' : ''}>
                            ${isReported ? '<i class="fa-solid fa-flag"></i> Reported' : '<i class="fa-solid fa-triangle-exclamation"></i> Report'}
                        </button>
                    </div>
                `;

                // Add report listener
                const reportBtn = txEl.querySelector('.report-btn');
                if (!isReported) {
                    reportBtn.addEventListener('click', () => reportTransaction(tx.id, reportBtn, txEl));
                }

                historyListContainer.appendChild(txEl);
            });

        } catch (err) {
            console.error('Error fetching history:', err);
            historyListContainer.innerHTML = '<div style="text-align: center; color: var(--danger); padding: 20px;">Failed to load history. Make sure "transactions" table exists.</div>';
        }
    }

    async function reportTransaction(txId, btn, txEl) {
        if (!confirm('Are you sure you want to report this transaction as fraudulent?')) return;

        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        btn.disabled = true;

        try {
            const { error } = await supabaseClient
                .from('transactions')
                .update({ danger: 'yes' })
                .eq('id', txId);

            if (error) throw error;

            btn.innerHTML = '<i class="fa-solid fa-flag"></i> Reported';
            const statusDiv = txEl.querySelector('.history-info .history-meta:last-child');
            if (statusDiv) {
                statusDiv.textContent = 'Danger';
                statusDiv.style.color = 'var(--danger)';
            }
        } catch (err) {
            console.error('Report error:', err);
            btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Report';
            btn.disabled = false;
            alert('Failed to report transaction.');
        }
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

            const data = await response.json();
            displayAnalysis(data, decodedText);

            // --- ADD THIS TO SAVE TO SUPABASE ---
            const { error } = await supabaseClient
                .from('scans')
                .insert([
                    {
                        qr_content: decodedText,
                        risk_level: data.risk_level || 'Unknown'
                    }
                ]);

            if (error) console.error('Supabase Save Error:', error.message);
            else console.log('Scan successfully saved to Supabase!');
            // ------------------------------------

        } catch (error) {
            console.error('Error:', error);
        }
    }

    function displayAnalysis(data, decodedText) {
        resultAlerts.innerHTML = ''; // clear

        if (data.is_safe && data.alerts.length === 0) {
            resultIcon.innerHTML = '<i class="fa-solid fa-shield-check" style="color: var(--secondary-accent);"></i>';
            resultTitle.textContent = 'Safe to Proceed';
            resultTitle.style.color = 'var(--secondary-accent)';

            resultAlerts.innerHTML = `<div style="background: rgba(16, 185, 129, 0.1); padding: 12px; border-radius: 8px; border-left: 4px solid var(--secondary-accent); font-size: 0.9rem; color: #d1fae5;">
                <i class="fa-solid fa-check-circle mr-2"></i> UPI Code verified successfully.
            </div>`;

            if (currentMode === 'send') {
                // Extract UPI ID
                let upiId = decodedText;
                try {
                    if (decodedText.toLowerCase().startsWith('upi://')) {
                        const url = new URL(decodedText);
                        upiId = url.searchParams.get('pa') || decodedText;
                    }
                } catch (e) {
                    console.error('Error parsing UPI:', e);
                }

                // Redirect to payment screen
                closeModal();
                showPaymentScreen(upiId);
            }
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

    // Navigation Listeners
    navHistoryBtn.addEventListener('click', showHistoryScreen);
    backToHomeFromPayment.addEventListener('click', showHome);
    backToHomeFromHistory.addEventListener('click', showHome);

    // Payment Flow Listener
    confirmPayBtn.addEventListener('click', async () => {
        const amount = parseFloat(paymentAmount.value);
        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        confirmPayBtn.disabled = true;
        confirmPayBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

        const upiId = paymentUpiId.dataset.upi;

        try {
            const { error } = await supabaseClient
                .from('transactions')
                .insert([
                    {
                        qr: upiId,
                        price: amount,
                        danger: 'no'
                    }
                ]);

            if (error) throw error;

            confirmPayBtn.classList.add('hidden');
            paymentSuccessMsg.classList.remove('hidden');

            setTimeout(() => {
                showHome();
            }, 2500);

        } catch (err) {
            console.error("Payment error:", err);
            confirmPayBtn.disabled = false;
            confirmPayBtn.innerHTML = '<span style="font-weight: 600; font-size: 1.2rem;">Pay Now</span>';
            alert("Payment failed. Make sure 'transactions' table exists.");
        }
    });

    // Close on pressing Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
            closeModal();
        }
    });
});
