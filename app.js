document.addEventListener('DOMContentLoaded', () => {
    const sendMoneyBtn = document.getElementById('sendMoneyBtn');
    const receiveMoneyBtn = document.getElementById('receiveMoneyBtn');
    const modalOverlay = document.getElementById('scannerModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalTitle = document.getElementById('modalTitle');
    const scannerInstruction = document.getElementById('scannerInstruction');
    
    let html5QrcodeScanner = null;
    let currentMode = '';

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
        
        modalOverlay.classList.remove('hidden');
        startScanner();
    }

    // Function to close modal
    function closeModal() {
        modalOverlay.classList.add('hidden');
        stopScanner();
    }

    // Success callback for QR Scanner
    function onScanSuccess(decodedText, decodedResult) {
        // Stop scanning after a successful scan
        stopScanner();
        modalOverlay.classList.add('hidden');
        
        /* 
        Here is where we process the decoded text depending on the mode.
        In a real app, 'send' might parse UPI IDs (upi://pay?pa=xyz...) 
        and 'receive' might verify a static QR or authenticate.
        */
        
        setTimeout(() => {
            if (currentMode === 'send') {
                alert(`Sending Money Initiated!\n\nPayload:\n${decodedText}`);
            } else {
                alert(`Verification Successful!\n\nPayload:\n${decodedText}`);
            }
        }, 300);
    }

    // Failure callback for QR Scanner
    function onScanFailure(error) {
        // handle scan failure, usually better to ignore and keep scanning
        // console.warn(`Code scan error = ${error}`);
    }

    // Start the scanner
    function startScanner() {
        // Check if a scanner is already running
        if (html5QrcodeScanner !== null) return;
        
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false
        };

        html5QrcodeScanner = new Html5Qrcode("reader");
        
        // Select back camera or default to whatever is available
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

    // Stop the scanner
    function stopScanner() {
        if (html5QrcodeScanner) {
            html5QrcodeScanner.stop().then(() => {
                html5QrcodeScanner.clear();
                html5QrcodeScanner = null;
                // Reset instruction text on close
                scannerInstruction.style.color = 'var(--text-secondary)';
            }).catch((err) => {
                console.error("Error stopping scanner: ", err);
            });
        }
    }

    // Event Listeners
    sendMoneyBtn.addEventListener('click', () => openModal('send'));
    receiveMoneyBtn.addEventListener('click', () => openModal('receive'));
    closeModalBtn.addEventListener('click', closeModal);

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
