document.addEventListener('DOMContentLoaded', function() {
    // ====================================================================
    // ===================  CONFIGURATION VARIABLES  ======================
    // ====================================================================
    
    // PASTE YOUR DEPLOYED WEB APP URL FROM GOOGLE APPS SCRIPT HERE
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxV_KpYUWZlaoePllBxw5KMNnNekmcGPRAYnfeh6_V5WbSTz0uyoTfeh1h01tZtLMSBeQ/exec"; 

    // --- Details for the UPI Payment Link & QR Code ---
    // These should match what you have in Code.gs
    const UPI_ID = "veldho56@icici"; // IMPORTANT: Replace with your actual UPI ID
    const PAYEE_NAME = "ISHYA IISER TVM"; // Replace with the name you want to show
    const TRANSACTION_NOTE = "ISHYA26 Coupon";
    const AMOUNT = "50";

    // ====================================================================
    // ==================  END OF CONFIGURATION  ==========================
    // ====================================================================

    // --- Modal Handling ---
    const modal = document.getElementById('payment-modal');
    const buyNowBtn = document.getElementById('buy-now-btn');
    const closeBtn = document.querySelector('.close-btn');

    buyNowBtn.onclick = function() {
        modal.style.display = 'flex';
    }
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    }
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    // --- Generate UPI Links and QR Code ---
    const upiPayLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${AMOUNT}&cu=INR&tn=${encodeURIComponent(TRANSACTION_NOTE)}`;
    const qrCodeImg = document.getElementById('upi-qr-code');
    const payNowLink = document.getElementById('pay-now-link');
    
    // Using an external API to generate QR code from the UPI link
    qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiPayLink)}`;
    payNowLink.href = upiPayLink;


    // --- Form Submission Handling ---
    const form = document.getElementById('coupon-form');
    const submitBtn = document.getElementById('submit-btn');
    const statusMessage = document.getElementById('status-message');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        submitBtn.disabled = true;
        submitBtn.innerText = 'Submitting...';
        statusMessage.textContent = '';
        statusMessage.style.color = 'white';

        const file = document.getElementById('screenshot').files[0];
        if (!file) {
            statusMessage.textContent = 'Please upload a screenshot.';
            statusMessage.style.color = '#e94560';
            submitBtn.disabled = false;
            submitBtn.innerText = 'Submit';
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = function() {
            const base64File = reader.result.split(',')[1];
            
            const formData = {
                name: form.name.value,
                email: form.email.value,
                phone: form.phone.value,
                file: {
                    base64: base64File,
                    type: file.type,
                    name: file.name
                }
            };
            
            fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(formData)
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    statusMessage.textContent = 'Success! Your e-coupon has been sent to your email.';
                    statusMessage.style.color = '#4CAF50';
                    form.reset();
                } else {
                    throw new Error(data.message || 'An unknown error occurred.');
                }
            })
            .catch(error => {
                statusMessage.textContent = `Error: ${error.message}`;
                statusMessage.style.color = '#e94560';
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Submit';
            });
        };

        reader.onerror = function() {
            statusMessage.textContent = 'Error reading file.';
            statusMessage.style.color = '#e94560';
            submitBtn.disabled = false;
            submitBtn.innerText = 'Submit';
        };
    });
});
