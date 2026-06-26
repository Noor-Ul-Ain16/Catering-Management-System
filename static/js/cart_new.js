// ==========================================
// CATERING BUSINESS MANAGEMENT SYSTEM - CART
// ==========================================

window.cart = [];

// Helper functions for metric conversion and default values
function convertBaseToSelected(val, baseUnit, selectedUnit) {
    if (baseUnit === 'g' && selectedUnit === 'kg') {
        return val / 1000;
    }
    if (baseUnit === 'ml' && selectedUnit === 'litre') {
        return val / 1000;
    }
    return val;
}

function convertSelectedToBase(val, baseUnit, selectedUnit) {
    if (baseUnit === 'g' && selectedUnit === 'kg') {
        return val * 1000;
    }
    if (baseUnit === 'ml' && selectedUnit === 'litre') {
        return val * 1000;
    }
    return val;
}

function getDefaultQty(item) {
    return convertBaseToSelected(item.base_size, item.base_unit, item.selected_unit);
}

const cartDrawer = document.getElementById('cart-drawer');
const openCartBtn = document.getElementById('open-cart');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartCountBadge = document.getElementById('cart-count');
const cartSubtotalPrice = document.getElementById('cart-subtotal-price');
const processOrderBtn = document.getElementById('process-order');
const checkoutModal = document.getElementById('checkout-modal');
const closeCheckoutModalBtn = document.getElementById('close-checkout-modal');

// ============================
// OPEN / CLOSE CART DRAWER
// ============================
if (openCartBtn) {
    openCartBtn.addEventListener('click', () => {
        cartDrawer.classList.add('open');
    });
}

if (closeCartBtn) {
    closeCartBtn.addEventListener('click', () => {
        cartDrawer.classList.remove('open');
    });
}

// ============================
// STATE STORAGE MUTATOR (ADD TO CART)
// ============================
window.addToCart = function (id, name, price, type, serving_size = 1, serving_unit = 'serving') {
    const existingItem = window.cart.find(
        item => item.id === id && item.type === type
    );

    if (existingItem) {
        // Add one serving size in the current selected unit
        const addedQty = convertBaseToSelected(serving_size, existingItem.base_unit, existingItem.selected_unit);
        existingItem.qty += addedQty;
    } else {
        window.cart.push({
            id: id,
            name: name,
            price: price,
            type: type,
            qty: serving_size, // Starts from default serving_size!
            base_size: serving_size,
            base_unit: serving_unit,
            selected_unit: serving_unit
        });
    }

    window.updateCartUI();
    if (cartDrawer) {
        cartDrawer.classList.add('open');
    }
};

// ============================
// REAL-TIME RENDERING ENGINE
// ============================
window.updateCartUI = function () {
    // Badge calculation: count of unique items and deals in the cart
    const totalItems = window.cart.length;
    if (cartCountBadge) {
        cartCountBadge.textContent = totalItems;
    }

    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = '';

    // Cart emptiness safeguard
    if (window.cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="color: var(--text-muted); text-align:center; padding: 20px 0;">Your cart is empty.</p>';
        if (cartSubtotalPrice) cartSubtotalPrice.textContent = 'Rs. 0';
        return;
    }

    let subtotal = 0;

    // Interactive node injection loop
    window.cart.forEach((item, index) => {
        const itemTotal = calculateItemTotal(item);
        subtotal += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.style.display = 'flex';
        cartItem.style.justifyContent = 'between';
        cartItem.style.alignItems = 'center';
        cartItem.style.marginBottom = '15px';
        cartItem.style.borderBottom = '1px solid #222';
        cartItem.style.paddingBottom = '10px';

        cartItem.innerHTML = `
            <div class="cart-item-info" style="flex: 1;">
                <h4 style="margin: 0 0 5px 0; color: #fff;">${item.name}</h4>
                <span class="cart-item-price" style="font-size: 13px; color: var(--gold-primary);">
                    Rs. ${item.price} per ${item.base_size}${item.base_unit}
                </span>
                <div class="cart-total-line" style="font-size: 14px; margin-top: 4px; font-weight: bold; color: #fff;">
                    Total: Rs. ${itemTotal}
                </div>
            </div>
            <div class="cart-item-controls" style="display: flex; align-items: center; gap: 8px;">
                <input 
                    type="number" 
                    min="${getDefaultQty(item)}" 
                    step="${item.selected_unit === 'kg' || item.selected_unit === 'litre' ? '0.01' : '1'}" 
                    value="${item.qty}" 
                    class="qty-input"
                    style="width: 60px; padding: 4px; background: #111; border: 1px solid var(--gold-primary); color: #fff; text-align: center; border-radius: 4px;"
                    onchange="changeQty(${index}, this.value)"
                >
                <select 
                    class="unit-select"
                    style="padding: 4px; background: #111; border: 1px solid var(--gold-primary); color: #fff; border-radius: 4px;"
                    onchange="changeUnit(${index}, this.value)"
                >
                    ${getUnitOptions(item.base_unit, item.selected_unit)}
                </select>
                <button 
                    class="cart-item-remove"
                    style="background: transparent; border: none; color: #ff4d4d; cursor: pointer; font-size: 16px; margin-left: 5px;"
                    onclick="removeItem(${index})"
                >✕</button>
            </div>
        `;
        cartItemsContainer.appendChild(cartItem);
    });

    if (cartSubtotalPrice) {
        cartSubtotalPrice.textContent = `Rs. ${subtotal}`;
    }
};

// ============================
// MUTATOR BRIDGE CONTROL PIPELINES
// ============================
window.changeQty = function (index, qty) {
    if (window.cart[index]) {
        const item = window.cart[index];
        const defaultQty = getDefaultQty(item);
        let parsed = parseFloat(qty);
        
        if (isNaN(parsed) || parsed < defaultQty) {
            parsed = defaultQty;
        }
        
        item.qty = parsed;
        window.updateCartUI();
    }
};

window.changeUnit = function (index, unit) {
    if (window.cart[index]) {
        const item = window.cart[index];
        const oldUnit = item.selected_unit;
        item.selected_unit = unit;
        
        // Convert quantity to match new unit
        if (oldUnit === 'g' && unit === 'kg') {
            item.qty = item.qty / 1000;
        } else if (oldUnit === 'kg' && unit === 'g') {
            item.qty = item.qty * 1000;
        } else if (oldUnit === 'ml' && unit === 'litre') {
            item.qty = item.qty / 1000;
        } else if (oldUnit === 'litre' && unit === 'ml') {
            item.qty = item.qty * 1000;
        }
        
        // Make sure it starts from the default value
        const defaultQty = getDefaultQty(item);
        if (item.qty < defaultQty) {
            item.qty = defaultQty;
        }
        
        window.updateCartUI();
    }
};

window.removeItem = function (index) {
    if (window.cart[index]) {
        window.cart.splice(index, 1);
        window.updateCartUI();
    }
};

// ============================
// UNIT SELECT VARIANT GENERATOR
// ============================
function getUnitOptions(baseUnit, selectedUnit) {
    if (baseUnit === 'g') {
        return `
            <option value="g" ${selectedUnit === 'g' ? 'selected' : ''}>Gram</option>
            <option value="kg" ${selectedUnit === 'kg' ? 'selected' : ''}>Kilogram</option>
        `;
    }
    if (baseUnit === 'ml') {
        return `
            <option value="ml" ${selectedUnit === 'ml' ? 'selected' : ''}>Milliliter</option>
            <option value="litre" ${selectedUnit === 'litre' ? 'selected' : ''}>Liter</option>
        `;
    }
    return `<option value="${baseUnit}">${baseUnit}</option>`;
}

// ============================
// METRIC INTER-CONVERSION COMPUTATION ENGINE
// ============================
function calculateItemTotal(item) {
    let enteredQty = item.qty;

    // Convert KG scaling metrics to localized database scaling units
    if (item.selected_unit === 'kg') {
        enteredQty *= 1000;
    }
    // Convert Liters scaling metrics to Milliliters
    if (item.selected_unit === 'litre') {
        enteredQty *= 1000;
    }

    const servings = enteredQty / item.base_size;
    return Math.ceil(servings * item.price);
}

// ============================
// BILLING STAGE TRIGGER INTERCEPTOR
// ============================
if (processOrderBtn) {
    processOrderBtn.addEventListener('click', () => {
        if (window.cart.length === 0) {
            alert("Please add items to your cart first.");
            return;
        }
        if (cartDrawer) {
            cartDrawer.classList.remove('open');
        }
        if (checkoutModal) {
            checkoutModal.classList.add('active');
            // Trigger synchronization update on summary block
            if (window.syncCheckoutSummary) {
                window.syncCheckoutSummary();
            }
        }
    });
}

if (closeCheckoutModalBtn) {
    closeCheckoutModalBtn.addEventListener('click', () => {
        if (checkoutModal) {
            checkoutModal.classList.remove('active');
        }
    });
}

// ============================
// INTERCEPTIVE CLICK ACTION LISTENERS
// ============================
document.addEventListener('click', (e) => {
    // Menu items structural routing intercept
    if (e.target.classList.contains('add-to-cart-btn')) {
        const id = parseInt(e.target.getAttribute('data-id'), 10);
        const name = e.target.getAttribute('data-name');
        const priceStr = e.target.getAttribute('data-price');
        const price = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);

        const servingSize = parseFloat(e.target.getAttribute('data-serving-size')) || 1;
        const unit = e.target.getAttribute('data-unit') || 'pcs';

        window.addToCart(id, name, price, 'menu', servingSize, unit);
    }

    // Direct dynamic routing deal model hook intercept
    if (e.target.id === 'add-deal-to-cart') {
        const titleElement = document.getElementById('deal-modal-title');
        const priceElement = document.getElementById('deal-modal-price');

        if (titleElement && priceElement) {
            const title = titleElement.innerText;
            const priceStr = priceElement.innerText;
            const price = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);

            window.addToCart(title, title, price, 'deal', 1, 'pack');
        }

        const modal = document.getElementById('deal-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
});

// Run immediate UI component stabilization check
window.updateCartUI();