// ==========================================
// CATERING BUSINESS MANAGEMENT SYSTEM - CHECKOUT
// ==========================================

const checkoutForm = document.getElementById('checkout-form');
const checkoutModalInner = document.getElementById('checkout-modal');
const successOverlay = document.getElementById('success-overlay');
const successOrderId = document.getElementById('success-order-id');
const backToMenuBtn = document.getElementById('back-to-menu');
const checkoutSummaryContainer = document.getElementById('checkout-order-summary');

// ============================
// LIVE CHECKOUT DRAWER SYNC ENGINE
// ============================
window.syncCheckoutSummary = function () {
    if (!checkoutSummaryContainer) return;
    checkoutSummaryContainer.innerHTML = '';

    if (!window.cart || window.cart.length === 0) {
        checkoutSummaryContainer.innerHTML = '<p>Your cart is empty.</p>';
        return;
    }

    let runningSubtotal = 0;
    const summaryList = document.createElement('div');
    summaryList.style.padding = '10px';
    summaryList.style.background = '#111';
    summaryList.style.borderRadius = '6px';
    summaryList.style.border = '1px solid #222';

    window.cart.forEach(item => {
        let currentQty = item.qty;
        if (item.selected_unit === 'kg' || item.selected_unit === 'litre') {
            currentQty *= 1000;
        }
        const finalCost = Math.ceil((currentQty / item.base_size) * item.price);
        runningSubtotal += finalCost;

        const itemRow = document.createElement('div');
        itemRow.style.display = 'flex';
        itemRow.style.justifyContent = 'space-between';
        itemRow.style.marginBottom = '6px';
        itemRow.style.fontSize = '14px';
        itemRow.innerHTML = `
            <span style="color: #ddd;">${item.name} (${item.qty} ${item.selected_unit})</span>
            <span style="color: var(--gold-primary); font-weight: bold;">Rs. ${finalCost}</span>
        `;
        summaryList.appendChild(itemRow);
    });

    const breakdownDivider = document.createElement('hr');
    breakdownDivider.style.border = '0';
    breakdownDivider.style.borderTop = '1px solid var(--gold-primary)';
    breakdownDivider.style.margin = '10px 0';
    summaryList.appendChild(breakdownDivider);

    const aggregateTotalRow = document.createElement('div');
    aggregateTotalRow.style.display = 'flex';
    aggregateTotalRow.style.justifyContent = 'space-between';
    aggregateTotalRow.style.fontWeight = 'bold';
    aggregateTotalRow.style.fontSize = '16px';
    aggregateTotalRow.innerHTML = `
        <span style="color: #fff;">Grand Total:</span>
        <span style="color: var(--gold-primary);">Rs. ${runningSubtotal}</span>
    `;
    summaryList.appendChild(aggregateTotalRow);
    checkoutSummaryContainer.appendChild(summaryList);
};

// ============================
// TRANSACTION FORM EVENT ROUTING HANDLER
// ============================
if (checkoutForm) {
    checkoutForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Structural Parameter Isolation
        const name = document.getElementById('fullName').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const address = document.getElementById('address').value.trim();
        const paymentMethod = document.getElementById('paymentMethod').value;

        // Assertion and Validation
        if (!name || !phone || !email || !address) {
            alert("Please fill all required fields.");
            return;
        }

        if (!window.cart || window.cart.length === 0) {
            alert("Your cart is empty.");
            return;
        }

        // Execution of aggregate pricing computation values
        const aggregateCalculatedTotal = window.cart.reduce((sum, item) => {
            let currentQty = item.qty;
            if (item.selected_unit === 'kg' || item.selected_unit === 'litre') {
                currentQty *= 1000;
            }
            return sum + Math.ceil((currentQty / item.base_size) * item.price);
        }, 0);

        // Standardized System Payload Specification
        const orderPayload = {
            customer: {
                name: name,
                phone: phone,
                email: email,
                address: address
            },
            order: {
                items: window.cart.map(i => ({
                    id: i.id,
                    name: i.name,
                    price: i.price,
                    type: i.type,
                    qty: i.qty,
                    unit: i.selected_unit,
                    calculated_price: Math.ceil(((i.selected_unit === 'kg' || i.selected_unit === 'litre' ? i.qty * 1000 : i.qty) / i.base_size) * i.price)
                })),
                total: aggregateCalculatedTotal,
                payment_method: paymentMethod
            },
            timestamp: new Date().toISOString()
        };

        console.log("Submitting order structure context to gateway payload:", orderPayload);

        // Visual State Adjustments
        const submitButton = checkoutForm.querySelector('button[type="submit"]');
        const processingOriginalText = submitButton ? submitButton.textContent : "Place Order";

        if (submitButton) {
            submitButton.textContent = "Processing...";
            submitButton.disabled = true;
        }

        // Central Network Request Pipeline Intercept
        fetch('/api/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderPayload)
        })
            .then(res => {
                if (!res.ok) throw new Error("Server HTTP Gateway response processing status failed.");
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    if (checkoutModalInner) checkoutModalInner.classList.remove('active');

                    if (successOrderId) {
                        successOrderId.textContent = data.order_id || `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
                    }
                    if (successOverlay) successOverlay.classList.add('active');

                    // State clear commands
                    window.cart = [];
                    if (window.updateCartUI) window.updateCartUI();
                    checkoutForm.reset();
                } else {
                    alert("Failed to process transaction structure: " + (data.message || data.error || "Unknown Error"));
                }
            })
            .catch(err => {
                console.error("Critical API link route failure:", err);

                if (!navigator.onLine) {
                    // Resilient Client-Side Memory Array Storage Strategy for Offline Mode
                    window.orders = window.orders || [];
                    if (checkoutModalInner) checkoutModalInner.classList.remove('active');

                    const pseudoGeneratedId = Math.floor(100000 + Math.random() * 900000);
                    if (successOrderId) {
                        successOrderId.textContent = `#ORD-${pseudoGeneratedId} (Saved Offline)`;
                    }

                    orderPayload.id = pseudoGeneratedId;
                    orderPayload.status = "Pending";
                    window.orders.push(orderPayload);

                    if (successOverlay) successOverlay.classList.add('active');

                    window.cart = [];
                    if (window.updateCartUI) window.updateCartUI();
                    checkoutForm.reset();
                    alert("You are currently offline. Your order has been saved in your browser locally, and will sync once you are back online!");
                } else {
                    alert("Failed to place order: " + err.message + "\n\nPlease make sure your Flask server is running and you have cleared your browser cache (Ctrl + F5).");
                }
            })
            .finally(() => {
                if (submitButton) {
                    submitButton.textContent = processingOriginalText;
                    submitButton.disabled = false;
                }
            });
    });
}

if (backToMenuBtn) {
    backToMenuBtn.addEventListener('click', () => {
        if (successOverlay) successOverlay.classList.remove('active');
    });
}

// ==========================================
// CARD SELECTION & PREMIUM INPUT FORMATTING
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const paymentMethodSelect = document.getElementById('paymentMethod');
    const cardPaymentFields = document.getElementById('card-payment-fields');
    const cardNameInput = document.getElementById('cardName');
    const cardNumberInput = document.getElementById('cardNumber');
    const cardExpiryInput = document.getElementById('cardExpiry');
    const cardCvvInput = document.getElementById('cardCvv');

    if (paymentMethodSelect && cardPaymentFields) {
        paymentMethodSelect.addEventListener('change', function () {
            if (this.value === 'Card') {
                cardPaymentFields.style.display = 'block';
                if (cardNameInput) cardNameInput.required = true;
                if (cardNumberInput) cardNumberInput.required = true;
                if (cardExpiryInput) cardExpiryInput.required = true;
                if (cardCvvInput) cardCvvInput.required = true;
            } else {
                cardPaymentFields.style.display = 'none';
                if (cardNameInput) cardNameInput.required = false;
                if (cardNumberInput) cardNumberInput.required = false;
                if (cardExpiryInput) cardExpiryInput.required = false;
                if (cardCvvInput) cardCvvInput.required = false;
                
                // Clear values when switched back to Cash
                if (cardNameInput) cardNameInput.value = '';
                if (cardNumberInput) cardNumberInput.value = '';
                if (cardExpiryInput) cardExpiryInput.value = '';
                if (cardCvvInput) cardCvvInput.value = '';
            }
        });
    }

    // Format Card Number (adds space every 4 digits)
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let formatted = '';
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) {
                    formatted += ' ';
                }
                formatted += value[i];
            }
            e.target.value = formatted;
        });
    }

    // Format Expiry Date (MM/YY)
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/[^0-9]/gi, '');
            if (value.length > 2) {
                e.target.value = value.substring(0, 2) + '/' + value.substring(2, 4);
            } else {
                e.target.value = value;
            }
        });
    }

    // Format CVV (Numbers only)
    if (cardCvvInput) {
        cardCvvInput.addEventListener('input', function (e) {
            e.target.value = e.target.value.replace(/[^0-9]/gi, '');
        });
    }
});