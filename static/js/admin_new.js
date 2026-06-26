// ================= admin_new.js =================
console.log("admin JS loaded");

const convertDriveUrl = (url) => {
    if (!url) return '';
    let fileId = '';
    if (url.includes('drive.google.com')) {
        const matchD = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (matchD && matchD[1]) {
            fileId = matchD[1];
        } else {
            const matchId = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
            if (matchId && matchId[1]) {
                fileId = matchId[1];
            }
        }
    }
    if (fileId) {
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`;
    }
    return url;
};

window.previewImageModal = function(imageUrl, itemName) {
    if (!imageUrl) return;
    const resolved = convertDriveUrl(imageUrl);
    const modal = document.createElement('div');
    modal.className = 'deal-popup-overlay';
    modal.style.zIndex = '99999';
    modal.innerHTML = `
        <div class="deal-popup" style="max-width: 500px; padding: 20px; text-align: center; border: 2px solid #c9a84c; background: #031411; border-radius: 12px; box-shadow: 0 0 30px rgba(201, 168, 76, 0.4); position: relative;">
            <span class="close-popup" style="position: absolute; right: 15px; top: 15px; font-size: 24px; color: #c9a84c; cursor: pointer;">✕</span>
            <h3 style="color: #c9a84c; font-family: Playfair Display, serif; font-size: 1.5rem; margin-top: 0; margin-bottom: 15px;">Image Preview: ${itemName}</h3>
            <img src="${resolved}" style="width: 100%; max-height: 400px; object-fit: contain; border-radius: 8px; border: 1px solid #10463b;" onerror="this.src='https://via.placeholder.com/500x300/111/c9a84c?text=Error+Loading+Image'">
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.close-popup').onclick = () => modal.remove();
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
};

window.orders = window.orders || [];

const openAdminBtn = document.getElementById('open-admin');
const adminModal = document.getElementById('admin-modal');
const passwordModal = document.getElementById('admin-password-modal');
const closeAdminModalBtn = document.getElementById('close-admin-modal');
const closePasswordModalBtn = document.getElementById('close-password-modal');
const roleBtns = document.querySelectorAll('.role-btn');
const dashboardContainer = document.getElementById('dashboard-container');
const managerView = document.getElementById('manager-view');
const chefView = document.getElementById('chef-view');
const deliveryView = document.getElementById('delivery-view');
const passwordForm = document.getElementById('password-form');
const staffIdInput = document.getElementById('admin-staff-id'); // Read staff ID input element
const passwordInput = document.getElementById('admin-password');
const passwordError = document.getElementById('password-error');
const passwordRoleLabel = document.getElementById('password-role-label');

let selectedRole = null;
let loggedInStaffId = null; // Globally cache identity to query task views

openAdminBtn?.addEventListener('click', () => { adminModal.classList.add('active'); });
closeAdminModalBtn?.addEventListener('click', () => { adminModal.classList.remove('active'); });
closePasswordModalBtn?.addEventListener('click', () => { passwordModal.classList.remove('active'); });

roleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        selectedRole = e.currentTarget.dataset.role;
        adminModal.classList.remove('active');
        
        // Safety lock: Clear any previous session state when entering a new login context
        sessionStorage.removeItem('loggedInStaffId');
        loggedInStaffId = null;
        
        passwordRoleLabel.textContent = `Login as ${selectedRole.toUpperCase()}`;
        passwordError.style.display = "none";
        passwordForm.reset();
        passwordModal.classList.add('active');
    });
});

passwordForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const staffId = staffIdInput.value.trim();
    const password = passwordInput.value;

    // Fallback block for open root manager account tracking profile bypass
    if (selectedRole === "manager" && staffId === "0" && password === "admin123") {
        passwordModal.classList.remove('active');
        loggedInStaffId = 0;
        openDashboard("manager");
        return;
    }

    // Call authentication gateway verification endpoint
    fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: staffId, password: password, role: selectedRole })
    })
        .then(res => res.json())
        .then(data => {
            if (data.auth) {
                passwordModal.classList.remove('active');
                loggedInStaffId = staffId; // Store verified identity mapping
                openDashboard(selectedRole);
            } else {
                passwordError.textContent = data.message || "Invalid Authentication Credentials.";
                passwordError.style.display = "block";
            }
        });
});

// On page load or on hash change, navigate accordingly
window.addEventListener('load', () => {
    // Restore loggedInStaffId from sessionStorage
    const savedStaffId = sessionStorage.getItem('loggedInStaffId');
    if (savedStaffId) {
        loggedInStaffId = savedStaffId;
    }
    
    // Check initial hash on startup
    handleRouting();
});

window.addEventListener('hashchange', () => {
    handleRouting();
});

function handleRouting() {
    const hash = window.location.hash;
    
    if (hash === '#manager' && loggedInStaffId !== null) {
        openDashboardDirect("manager");
    } else if (hash === '#chef' && loggedInStaffId !== null) {
        openDashboardDirect("chef");
    } else if (hash === '#delivery' && loggedInStaffId !== null) {
        openDashboardDirect("delivery");
    } else {
        // Default to home page
        showHomePage();
    }
}

// Redirects or forces home page display
function showHomePage() {
    window.location.hash = '#home';
    
    document.getElementById('hero').style.display = 'block';
    const menuMain = document.getElementById('menu-main');
    if (menuMain) menuMain.style.display = 'block';
    const dealsSection = document.getElementById('deals');
    if (dealsSection) dealsSection.style.display = 'block';
    
    dashboardContainer.classList.add('hidden');
    managerView.classList.add('hidden');
    chefView.classList.add('hidden');
    deliveryView.classList.add('hidden');
}

// Function to open dashboard from UI (sets hash and triggers routing)
function openDashboard(role) {
    sessionStorage.setItem('loggedInStaffId', loggedInStaffId);
    window.location.hash = `#${role}`;
}

// Internal function to actually render the dashboard view
function openDashboardDirect(role) {
    document.getElementById('hero').style.display = 'none';
    const menuMain = document.getElementById('menu-main');
    if (menuMain) menuMain.style.display = 'none';
    const dealsSection = document.getElementById('deals');
    if (dealsSection) dealsSection.style.display = 'none';

    dashboardContainer.classList.remove('hidden');
    managerView.classList.add('hidden');
    chefView.classList.add('hidden');
    deliveryView.classList.add('hidden');

    if (role === "manager") { managerView.classList.remove('hidden'); loadManager(); }
    if (role === "chef") { chefView.classList.remove('hidden'); loadChef(); }
    if (role === "delivery") { deliveryView.classList.remove('hidden'); loadDelivery(); }

    // Fetch and display active staff profile name
    if (loggedInStaffId !== null) {
        fetch(`/api/staff/name/${loggedInStaffId}`)
            .then(res => res.json())
            .then(data => {
                const name = data.success ? data.name : `Staff #${loggedInStaffId}`;
                const managerSpan = document.getElementById('manager-staff-name');
                const chefSpan = document.getElementById('chef-staff-name');
                const deliverySpan = document.getElementById('delivery-staff-name');
                
                if (managerSpan) managerSpan.innerHTML = `<span style="display:inline-block; width:8px; height:8px; background-color:#2ecc71; border-radius:50%; box-shadow: 0 0 6px #2ecc71;"></span> Active Session: <strong>${name}</strong> (ID: ${loggedInStaffId})`;
                if (chefSpan) chefSpan.innerHTML = `<span style="display:inline-block; width:8px; height:8px; background-color:#2ecc71; border-radius:50%; box-shadow: 0 0 6px #2ecc71;"></span> Active Session: <strong>${name}</strong> (ID: ${loggedInStaffId})`;
                if (deliverySpan) deliverySpan.innerHTML = `<span style="display:inline-block; width:8px; height:8px; background-color:#2ecc71; border-radius:50%; box-shadow: 0 0 6px #2ecc71;"></span> Active Session: <strong>${name}</strong> (ID: ${loggedInStaffId})`;
            });
    }
}

window.exitDashboard = function() {
    sessionStorage.removeItem('loggedInStaffId');
    loggedInStaffId = null;
    window.location.hash = '#home';
};

function loadManager() {
    loadMenuTable();
    loadBaseDealsTable();
    loadMenuDealsTable();
    loadOrdersTable();
    loadStaffTable();
    loadChefManagesTable();
    loadDeliveryManagesTable();
    
    // Automatically show the first tab by default on manager dashboard loading
    const firstTab = document.querySelector('.manager-tabs .tab-btn');
    if (firstTab) {
        firstTab.click();
    }
}

window.showManagerTab = function (tabName, btnElement) {
    // Hide all manager console dashboard sections
    document.querySelectorAll('#manager-view .dashboard-section').forEach(sec => {
        sec.style.display = 'none';
    });
    // Show only the requested target section
    const activeSec = document.getElementById('m-section-' + tabName);
    if (activeSec) {
        activeSec.style.display = 'block';
    }
    // Update visual active state indicators across tab buttons
    document.querySelectorAll('.manager-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (btnElement) {
        btnElement.classList.add('active');
    }
};

// ================= MENU TABLE WITH UNIT =================
function loadMenuTable() {
    const menuTable = document.getElementById('menu-table');
    fetch('/api/menu')
        .then(res => res.json())
        .then(data => {
            let html = `
            <tr>
                <th>Item ID</th>
                <th>Image Preview</th>
                <th>Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Serving Size</th>
                <th>Price</th>
                <th>Picture URL</th>
                <th>Save</th>
                <th>Delete</th>
            </tr>
            `;
            data.data.forEach(item => {
                const resolvedPreview = convertDriveUrl(item.pictures_url);
                const previewImg = item.pictures_url 
                    ? `<img src="${resolvedPreview}" width="50" height="40" style="object-fit:cover; border-radius:4px; cursor:pointer;" onclick="window.previewImageModal('${item.pictures_url}', '${item.name.replace(/'/g, "\\'")}')" title="Click to view large preview" onerror="this.src='https://via.placeholder.com/50x40/111/c9a84c?text=Error'">` 
                    : `<span>No Image</span>`;
                html += `
                <tr>
                    <td><strong>${item.id}</strong></td>
                    <td style="text-align:center;">${previewImg}</td>
                    <td><input id="m-name-${item.id}" value="${item.name}"></td>
                    <td><input id="m-category-${item.id}" value="${item.category}"></td>
                    <td><input id="m-unit-${item.id}" value="${item.unit}" style="width:60px;"></td>
                    <td><input id="m-size-${item.id}" type="number" value="${item.serving_size}" style="width:60px;"></td>
                    <td><input id="m-price-${item.id}" value="${item.price}" style="width:80px;"></td>
                    <td><input id="m-url-${item.id}" value="${item.pictures_url}" placeholder="Paste Image URL"></td>
                    <td><button onclick="saveMenu(${item.id})">Save</button></td>
                    <td><button class="btn-danger" onclick="deleteMenu(${item.id})">Delete</button></td>
                </tr>
                `;
            });
            html += `
            <tr style="background-color: #0f3d32;">
                <td>NEW</td>
                <td>-</td>
                <td><input id="new-menu-name" placeholder="Name"></td>
                <td><input id="new-menu-category" placeholder="Category"></td>
                <td><input id="new-menu-unit" placeholder="Unit" value="pcs" style="width:60px;"></td>
                <td><input id="new-menu-size" type="number" placeholder="Size" value="1" style="width:60px;"></td>
                <td><input id="new-menu-price" placeholder="Price" style="width:80px;"></td>
                <td><input id="new-menu-url" placeholder="Picture URL"></td>
                <td colspan="2"><button style="width:100%;" onclick="insertMenu()">Insert Item</button></td>
            </tr>
            `;
            menuTable.innerHTML = html;
        });
}

window.saveMenu = function (id) {
    fetch('/api/update-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: id,
            name: document.getElementById(`m-name-${id}`).value,
            category: document.getElementById(`m-category-${id}`).value,
            unit: document.getElementById(`m-unit-${id}`).value,
            serving_size: document.getElementById(`m-size-${id}`).value,
            price: document.getElementById(`m-price-${id}`).value,
            pictures_url: document.getElementById(`m-url-${id}`).value
        })
    }).then(res => res.json()).then(data => { if (data.success) { alert("Menu item saved!"); loadMenuTable(); } });
};

window.insertMenu = function () {
    fetch('/api/insert-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: document.getElementById('new-menu-name').value,
            category: document.getElementById('new-menu-category').value,
            unit: document.getElementById('new-menu-unit').value,
            serving_size: document.getElementById('new-menu-size').value,
            price: document.getElementById('new-menu-price').value,
            pictures_url: document.getElementById('new-menu-url').value
        })
    }).then(res => res.json()).then(data => { if (data.success) { alert("Inserted menu item!"); loadMenuTable(); } });
};

window.deleteMenu = function (id) {
    if (!confirm("Delete this menu item?")) return;
    fetch(`/api/delete-menu/${id}`, { method: 'DELETE' }).then(res => res.json()).then(data => { if (data.success) loadMenuTable(); });
};

// ================= BASE DEALS TABLE =================
function loadBaseDealsTable() {
    const table = document.getElementById('base-deals-table');
    if (!table) return;
    fetch('/api/base-deals')
        .then(res => res.json())
        .then(data => {
            let html = `
            <tr>
                <th>Deal ID</th>
                <th>Image Preview</th>
                <th>Deal Name</th>
                <th>Pictures URL</th>
                <th>Save</th>
                <th>Delete</th>
            </tr>
            `;
            data.data.forEach(deal => {
                const resolvedPreview = convertDriveUrl(deal.pictures_url);
                const previewImg = deal.pictures_url 
                    ? `<img src="${resolvedPreview}" width="60" height="40" style="object-fit:cover; border-radius:4px; cursor:pointer;" onclick="window.previewImageModal('${deal.pictures_url}', '${deal.deal_name.replace(/'/g, "\\'")}')" title="Click to view large preview" onerror="this.src='https://via.placeholder.com/60x40/111/c9a84c?text=Error'">` 
                    : `<span>No Image</span>`;
                html += `
                <tr>
                    <td><strong>${deal.deal_id}</strong></td>
                    <td style="text-align:center;">${previewImg}</td>
                    <td><input id="bd-name-${deal.deal_id}" value="${deal.deal_name}"></td>
                    <td><input id="bd-url-${deal.deal_id}" value="${deal.pictures_url}" placeholder="Paste Pictures URL"></td>
                    <td><button onclick="saveBaseDeal(${deal.deal_id})">Save</button></td>
                    <td><button class="btn-danger" onclick="deleteBaseDeal(${deal.deal_id})">Delete</button></td>
                </tr>
                `;
            });
            html += `
            <tr style="background-color: #0f3d32;">
                <td>NEW</td>
                <td>-</td>
                <td><input id="new-bd-name" placeholder="Deal Name"></td>
                <td><input id="new-bd-url" placeholder="Pictures URL"></td>
                <td colspan="2"><button style="width:100%;" onclick="insertBaseDeal()">Insert Deal</button></td>
            </tr>
            `;
            table.innerHTML = html;
        });
}

window.saveBaseDeal = function(dealId) {
    const name = document.getElementById(`bd-name-${dealId}`).value;
    const url = document.getElementById(`bd-url-${dealId}`).value;
    fetch('/api/update-base-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal_id: dealId, name: name, pictures_url: url })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("Base deal saved!");
            loadBaseDealsTable();
            if (typeof loadMenuDealsTable === 'function') loadMenuDealsTable();
        } else {
            alert("Error: " + data.message);
        }
    });
};

window.insertBaseDeal = function() {
    const name = document.getElementById('new-bd-name').value;
    const url = document.getElementById('new-bd-url').value;
    fetch('/api/insert-base-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, pictures_url: url })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("Base deal inserted!");
            loadBaseDealsTable();
            if (typeof loadMenuDealsTable === 'function') loadMenuDealsTable();
        } else {
            alert("Error: " + data.message);
        }
    });
};

window.deleteBaseDeal = function(dealId) {
    if (!confirm("Deleting this base deal will also delete all item assignments for this deal. Proceed?")) return;
    fetch(`/api/delete-base-deal/${dealId}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("Base deal deleted!");
            loadBaseDealsTable();
            if (typeof loadMenuDealsTable === 'function') loadMenuDealsTable();
        } else {
            alert("Error: " + data.message);
        }
    });
};

// ================= MENU DEALS =================
function loadMenuDealsTable() {
    const dealTable = document.getElementById('deal-table');
    if (!dealTable) return;
    fetch('/api/deal-items')
        .then(res => res.json())
        .then(data => {
            let html = `<tr><th>Deal ID</th><th>Item ID</th><th>Quantity</th><th>Unit</th><th>Save</th><th>Delete</th></tr>`;
            data.data.forEach(d => {
                html += `
                <tr>
                    <td><input id="deal-id-${d.deal_id}-${d.item_id}" value="${d.deal_id}" disabled></td>
                    <td><input id="deal-item-id-${d.deal_id}-${d.item_id}" value="${d.item_id}" disabled></td>
                    <td><input id="deal-qty-${d.deal_id}-${d.item_id}" value="${d.quantity}"></td>
                    <td><input id="deal-unit-${d.deal_id}-${d.item_id}" value="${d.unit}"></td>
                    <td><button onclick="saveDealItem(${d.deal_id}, ${d.item_id})">Save</button></td>
                    <td><button class="btn-danger" onclick="deleteDealItem(${d.deal_id}, ${d.item_id})">Delete</button></td>
                </tr>
                `;
            });
            html += `
            <tr style="background-color: #0f3d32;">
                <td><input id="new-deal-id" placeholder="Deal ID"></td>
                <td><input id="new-deal-item-id" placeholder="Item ID"></td>
                <td><input id="new-deal-qty" placeholder="Quantity"></td>
                <td><input id="new-deal-unit" placeholder="Unit"></td>
                <td colspan="2"><button style="width:100%;" onclick="insertDealItem()">Add Item to Deal</button></td>
            </tr>
            `;
            dealTable.innerHTML = html;
        });
}

window.saveDealItem = function (dealId, itemId) {
    fetch('/api/update-deal-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            deal_id: dealId, item_id: itemId,
            quantity: document.getElementById(`deal-qty-${dealId}-${itemId}`).value,
            unit: document.getElementById(`deal-unit-${dealId}-${itemId}`).value
        })
    }).then(res => res.json()).then(data => { if (data.success) alert("Deal item updated!"); });
};

window.insertDealItem = function () {
    const dealId = document.getElementById('new-deal-id').value;
    const itemId = document.getElementById('new-deal-item-id').value;
    const qty = document.getElementById('new-deal-qty').value;
    const unit = document.getElementById('new-deal-unit').value;
    
    if (!dealId || !itemId || !qty) {
        alert("Please fill in Deal ID, Item ID, and Quantity!");
        return;
    }
    
    fetch('/api/insert-deal-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            deal_id: dealId,
            item_id: itemId,
            quantity: qty,
            unit: unit
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("Item added to deal successfully!");
            loadMenuDealsTable();
            // Clear inputs
            document.getElementById('new-deal-id').value = '';
            document.getElementById('new-deal-item-id').value = '';
            document.getElementById('new-deal-qty').value = '';
            document.getElementById('new-deal-unit').value = '';
        } else {
            alert("Error adding item to deal: " + data.message);
        }
    });
};

window.deleteDealItem = function (dealId, itemId) {
    fetch('/api/delete-deal-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal_id: dealId, item_id: itemId })
    }).then(res => res.json()).then(data => { if (data.success) loadMenuDealsTable(); });
};

// ================= ORDERS =================
function loadOrdersTable() {
    const orderTable = document.getElementById('order-table');
    fetch('/api/admin/manager')
        .then(res => res.json())
        .then(data => {
            let html = `<tr><th>Order ID</th><th>Customer</th><th>Total Bill</th><th>Status Mapping</th></tr>`;
            data.data.forEach(o => {
                html += `
                <tr>
                    <td>${o.id}</td>
                    <td>${o.customer.name}</td>
                    <td>Rs ${o.order.total}</td>
                    <td>
                        <select onchange="assignOrder(${o.id}, this.value)">
                            <option value="Pending" ${o.status === "Pending" ? "selected" : ""}>Pending</option>
                            <option value="Confirmed" ${o.status === "Confirmed" ? "selected" : ""}>Confirmed</option>
                            <option value="Prepared" ${o.status === "Prepared" ? "selected" : ""}>Prepared</option>
                            <option value="Completed" ${o.status === "Completed" ? "selected" : ""}>Completed</option>
                            <option value="Delivered" ${o.status === "Delivered" ? "selected" : ""}>Delivered</option>
                        </select>
                    </td>
                </tr>
                `;
            });
            orderTable.innerHTML = html;
        });
}

window.assignOrder = function (orderId, status) {
    fetch('/api/update-order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: status })
    }).then(res => res.json()).then(data => { if (data.success) loadOrdersTable(); });
};

// ================= CLEAN VIEW STAFF TABLE WITH TICKS & PASSWORDS =================
function loadStaffTable() {
    const staffTable = document.getElementById('staff-table');
    fetch('/api/staff')
        .then(res => res.json())
        .then(data => {
            let html = `
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Salary</th>
                <th style="text-align:center; width:60px;">Mgr</th>
                <th style="text-align:center; width:60px;">Chef</th>
                <th style="text-align:center; width:60px;">Delv</th>
                <th>Link Role</th>
                <th>Password Key</th>
                <th>Save Changes</th>
                <th>Delete Completely</th>
            </tr>
            `;
            data.data.forEach(staff => {
                const managerTick = staff.is_manager ? `<b style="color:#2ed573; font-size:1.3rem;">✔</b>` : ``;
                const chefTick = staff.is_chef ? `<b style="color:#2ed573; font-size:1.3rem;">✔</b>` : ``;
                const deliveryTick = staff.is_delivery ? `<b style="color:#2ed573; font-size:1.3rem;">✔</b>` : ``;

                html += `
                <tr>
                    <td><strong>${staff.id}</strong></td>
                    <td><input id="staff-name-${staff.id}" value="${staff.name}"></td>
                    <td><input id="staff-salary-${staff.id}" value="${staff.salary}" style="width:80px;"></td>
                    
                    <td style="text-align:center; vertical-align:middle;">${managerTick}</td>
                    <td style="text-align:center; vertical-align:middle;">${chefTick}</td>
                    <td style="text-align:center; vertical-align:middle;">${deliveryTick}</td>
                    
                    <td>
                        <select onchange="addStaffSubtypeRole(${staff.id}, this.value); this.value='';">
                            <option value="">-- Assign To --</option>
                            <option value="manager">Manager Table</option>
                            <option value="chef">Chef Table</option>
                            <option value="delivery">Delivery Table</option>
                        </select>
                    </td>
                    <td><input id="staff-pass-${staff.id}" value="${staff.password}" style="width:90px;" type="text"></td>
                    
                    <td><button onclick="saveStaff(${staff.id})">Save Row</button></td>
                    <td><button class="btn-danger" onclick="deleteStaff(${staff.id})">Delete</button></td>
                </tr>
                `;
            });

            html += `
            <tr style="background-color: #0f3d32;">
                <td>NEW</td>
                <td><input id="new-staff-name" placeholder="Staff Name"></td>
                <td><input id="new-staff-salary" placeholder="Salary" style="width:80px;"></td>
                <td colspan="3" style="text-align:right; font-weight:bold; color:#f1c40f; padding-right:10px;">Subtable:</td>
                <td>
                    <select id="new-staff-role" style="width: 100%; padding: 4px;">
                        <option value="manager">Manager</option>
                        <option value="chef">Chef Staff</option>
                        <option value="delivery">Delivery Staff</option>
                    </select>
                </td>
                <td><input id="new-staff-pass" placeholder="Password" value="123" style="width:90px;"></td>
                <td colspan="2"><button style="width:100%;" onclick="insertStaff()">Insert Staff Member</button></td>
            </tr>
            `;
            staffTable.innerHTML = html;
        });
}

window.addStaffSubtypeRole = function (id, role) {
    if (!role) return;
    fetch('/api/staff/assign-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: id, role: role })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert(`Linked staff ID #${id} successfully.`);
                loadStaffTable();
            } else {
                alert("Role Assignment Blocked: " + data.message);
            }
        });
};

window.saveStaff = function (id) {
    fetch('/api/update-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: id,
            name: document.getElementById(`staff-name-${id}`).value,
            salary: document.getElementById(`staff-salary-${id}`).value,
            password: document.getElementById(`staff-pass-${id}`).value
        })
    }).then(res => res.json()).then(data => { if (data.success) { alert("Staff row saved!"); loadStaffTable(); } });
};

window.insertStaff = function () {
    const name = document.getElementById('new-staff-name').value.trim();
    const salary = document.getElementById('new-staff-salary').value.trim();
    const role = document.getElementById('new-staff-role').value;
    const password = document.getElementById('new-staff-pass').value.trim();
    if (!name) return alert("Name field cannot be left blank");

    fetch('/api/insert-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, salary, role, password })
    }).then(res => res.json()).then(data => { if (data.success) { alert("Staff registered completely!"); loadStaffTable(); } });
};

window.deleteStaff = function (id) {
    if (!confirm("Delete staff member entirely?")) return;
    fetch(`/api/delete-staff/${id}`, { method: 'DELETE' }).then(res => res.json()).then(data => { if (data.success) loadStaffTable(); });
};

// ================= CHEFMANAGESORDER =================
function loadChefManagesTable() {
    const table = document.getElementById('chef-manages-table');
    if (!table) return;
    fetch('/api/chef-manages')
        .then(res => res.json())
        .then(data => {
            let html = `<tr><th>Order ID</th><th>Chef Staff ID</th><th>Update Assignment</th><th>De-assign</th></tr>`;
            data.data.forEach(cm => {
                html += `
                <tr>
                    <td><input id="cm-order-${cm.order_id}-${cm.chef_id}" value="${cm.order_id}" disabled></td>
                    <td><input id="cm-chef-${cm.order_id}-${cm.chef_id}" value="${cm.chef_id}"></td>
                    <td><button onclick="saveChefManage(${cm.order_id}, ${cm.chef_id})">Update</button></td>
                    <td><button class="btn-danger" onclick="deleteChefManage(${cm.order_id}, ${cm.chef_id})">Delete</button></td>
                </tr>
                `;
            });
            html += `
            <tr style="background-color: #0f3d32;">
                <td><input id="new-cm-order" placeholder="Order ID"></td>
                <td><input id="new-cm-chef" placeholder="Chef ID"></td>
                <td colspan="2"><button style="width:100%;" onclick="insertChefManage()">Assign Chef</button></td>
            </tr>
            `;
            table.innerHTML = html;
        });
}

window.saveChefManage = function (orderId, oldChefId) {
    const newChefId = document.getElementById(`cm-chef-${orderId}-${oldChefId}`).value;
    fetch('/api/update-chef-manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, chef_id: newChefId })
    }).then(res => res.json()).then(data => { if (data.success) loadChefManagesTable(); });
};

window.insertChefManage = function () {
    fetch('/api/insert-chef-manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: document.getElementById('new-cm-order').value, chef_id: document.getElementById('new-cm-chef').value })
    }).then(res => res.json()).then(data => { if (data.success) loadChefManagesTable(); });
};

window.deleteChefManage = function (orderId, chefId) {
    fetch('/api/delete-chef-manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, chef_id: chefId })
    }).then(res => res.json()).then(data => { if (data.success) loadChefManagesTable(); });
};

// ================= DELIVERYSTAFFMANAGESORDER =================
function loadDeliveryManagesTable() {
    const table = document.getElementById('delivery-manages-table');
    if (!table) return;
    fetch('/api/delivery-manages')
        .then(res => res.json())
        .then(data => {
            let html = `<tr><th>Order ID</th><th>Delivery Staff ID</th><th>Update Assignment</th><th>De-assign</th></tr>`;
            data.data.forEach(dm => {
                html += `
                <tr>
                    <td><input id="dm-order-${dm.order_id}-${dm.delivery_id}" value="${dm.order_id}" disabled></td>
                    <td><input id="dm-delivery-${dm.order_id}-${dm.delivery_id}" value="${dm.delivery_id}"></td>
                    <td><button onclick="saveDeliveryManage(${dm.order_id}, ${dm.delivery_id})">Update</button></td>
                    <td><button class="btn-danger" onclick="deleteDeliveryManage(${dm.order_id}, ${dm.delivery_id})">Delete</button></td>
                </tr>
                `;
            });
            html += `
            <tr style="background-color: #0f3d32;">
                <td><input id="new-dm-order" placeholder="Order ID"></td>
                <td><input id="new-dm-delivery" placeholder="Delivery ID"></td>
                <td colspan="2"><button style="width:100%;" onclick="insertDeliveryManage()">Assign Delivery</button></td>
            </tr>
            `;
            table.innerHTML = html;
        });
}

window.saveDeliveryManage = function (orderId, oldDeliveryId) {
    const newDeliveryId = document.getElementById(`dm-delivery-${orderId}-${oldDeliveryId}`).value;
    fetch('/api/update-delivery-manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, delivery_id: newDeliveryId })
    }).then(res => res.json()).then(data => { if (data.success) loadDeliveryManagesTable(); });
};

window.insertDeliveryManage = function () {
    fetch('/api/insert-delivery-manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: document.getElementById('new-dm-order').value, delivery_id: document.getElementById('new-dm-delivery').value })
    }).then(res => res.json()).then(data => { if (data.success) loadDeliveryManagesTable(); });
};

window.deleteDeliveryManage = function (orderId, deliveryId) {
    fetch('/api/delete-delivery-manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, delivery_id: deliveryId })
    }).then(res => res.json()).then(data => { if (data.success) loadDeliveryManagesTable(); });
};

// ================= PERSONALIZED CHEF DASHBOARD =================
// ================= PERSONALIZED CHEF DASHBOARD =================
function loadChef() {
    const div = document.getElementById('chef-orders');
    // Passes the loggedInStaffId parameter context into the localized routing system
    fetch(`/api/admin/chef/${loggedInStaffId}?t=${new Date().getTime()}`)
        .then(res => res.json())
        .then(data => {
            let html = `<table><tr><th>Order ID</th><th>Items & Quantities (To Prepare)</th><th>Deadline (Date & Time)</th><th style="text-align:center;">Mark Prepared</th></tr>`;
            if (data && data.data) {
                data.data.forEach(o => {
                    const isPrepared = o.status === "Prepared" || o.status === "Completed" || o.status === "Delivered";
                    const checkboxHtml = isPrepared 
                        ? `<input type="checkbox" checked disabled style="width:20px; height:20px; cursor:default;">` 
                        : `<input type="checkbox" onchange="window.chefComplete(${o.id}, this)" style="width:20px; height:20px; cursor:pointer;">`;

                    html += `
                    <tr>
                        <td style="font-weight:bold; font-size:1.1rem;">#${o.id}</td>
                        <td><b style="color:#f1c40f; font-size:1.05rem;">${o.items_summary || 'No Items'}</b></td>
                        <td style="color:#ff6b6b; font-weight:bold; font-size:1.05rem;">${o.due_date} &nbsp;|&nbsp; ${o.due_time}</td>
                        <td style="text-align:center;">${checkboxHtml}</td>
                    </tr>
                    `;
                });
            }
            html += `</table>`;
            div.innerHTML = html;
        })
        .catch(err => {
            console.error("Error loading chef view:", err);
            div.innerHTML = `<p style="color:red;">Failed to load data. Please refresh.</p>`;
        });
}

window.chefComplete = function (orderId, checkboxObj) {
    if (!checkboxObj.checked) return;
    checkboxObj.disabled = true;
    
    fetch('/api/update-order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: 'Prepared' })
    })
    .then(res => res.json())
    .then(data => { 
        if (data.success) { 
            alert("Dishes ready! Status updated."); 
            loadChef(); 
        } else {
            alert("Failed to update status: " + data.message);
            checkboxObj.checked = false;
            checkboxObj.disabled = false;
        }
    })
    .catch(err => {
        console.error("Tick error:", err);
        alert("Network error updating status.");
        checkboxObj.checked = false;
        checkboxObj.disabled = false;
    });
};

// ================= PERSONALIZED DELIVERY DASHBOARD =================
function loadDelivery() {
    const div = document.getElementById('delivery-orders');
    // Passes the loggedInStaffId parameter context into the localized routing system
    fetch(`/api/admin/delivery/${loggedInStaffId}?t=${new Date().getTime()}`)
        .then(res => res.json())
        .then(data => {
            let html = `<table><tr><th>Order ID</th><th>Customer Name & Phone</th><th>Delivery Address</th><th>Payment Method</th><th>Payment Status</th><th>Total Amount</th><th>Deadline (Date & Time)</th><th style="text-align:center;">Mark Delivered</th></tr>`;
            if (data && data.data) {
                data.data.forEach(o => {
                    const payMethod = o.payment_method || 'Cash';
                    const isCOD = payMethod.toLowerCase().includes('cash') || payMethod.toLowerCase().includes('cod');
                    const codLabel = isCOD ? `<span style="color:#ff4757; font-weight:bold;">COD</span>` : `<span style="color:#2ed573;">Paid Online</span>`;
                    
                    const payStatus = o.payment_status || 'Pending';
                    const payStatusLabel = payStatus.toLowerCase() === 'paid' 
                        ? `<span style="background:#2ed573; color:white; padding:2px 8px; border-radius:20px; font-size:12px; font-weight:bold;">Paid</span>`
                        : `<span style="background:#ff9f43; color:white; padding:2px 8px; border-radius:20px; font-size:12px; font-weight:bold;">Pending</span>`;

                    const total = (o.order && o.order.total) ? o.order.total : 0;
                    const amountDisplay = `<strong>Rs. ${total}</strong>`;
                    
                    const cName = (o.customer && o.customer.name) ? o.customer.name : 'Unknown';
                    const cPhone = (o.customer && o.customer.phone) ? o.customer.phone : 'N/A';
                    const cPhoneSec = (o.customer && o.customer.phone_secondary) ? o.customer.phone_secondary : 'N/A';
                    const cAddress = (o.customer && o.customer.address) ? o.customer.address : 'N/A';

                    const isDelivered = o.status === "Delivered";
                    const checkboxHtml = isDelivered 
                        ? `<input type="checkbox" checked disabled style="width:20px; height:20px; cursor:default;">` 
                        : `<input type="checkbox" onchange="window.deliveryComplete(${o.id}, this)" style="width:20px; height:20px; cursor:pointer;">`;

                    html += `
                    <tr>
                        <td style="font-weight:bold; font-size:1.1rem;">#${o.id}</td>
                        <td>
                            <b>${cName}</b><br>
                            <span style="font-size: 0.85rem; color: #a4b0be;">Pri:</span> <a href="tel:${cPhone}" style="color:#3498db; text-decoration:none; font-weight:600;">${cPhone}</a><br>
                            <span style="font-size: 0.85rem; color: #a4b0be;">Sec:</span> <a href="tel:${cPhoneSec}" style="color:#2ecc71; text-decoration:none; font-weight:600;">${cPhoneSec}</a>
                        </td>
                        <td><span style="color:#e67e22; font-weight:500;">${cAddress}</span></td>
                        <td>${codLabel}</td>
                        <td style="text-align:center;">${payStatusLabel}</td>
                        <td>${amountDisplay}</td>
                        <td style="color:#ff6b6b; font-weight:bold; font-size:1.05rem;">${o.due_date} &nbsp;|&nbsp; ${o.due_time}</td>
                        <td style="text-align:center;">${checkboxHtml}</td>
                    </tr>
                    `;
                });
            }
            html += `</table>`;
            div.innerHTML = html;
        })
        .catch(err => {
            console.error("Error loading delivery view:", err);
            div.innerHTML = `<p style="color:red;">Failed to load delivery data. Please refresh.</p>`;
        });
}

window.deliveryComplete = function (orderId, checkboxObj) {
    if (!checkboxObj.checked) return;
    checkboxObj.disabled = true;
    fetch('/api/update-order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: 'Delivered' })
    }).then(res => res.json()).then(data => {
        if (data.success) {
            alert("Order #" + orderId + " marked as Delivered and Payment updated to Paid.");
            loadDelivery();
        } else {
            alert("Failed to update status: " + data.message);
            checkboxObj.checked = false;
            checkboxObj.disabled = false;
        }
    }).catch(err => {
        console.error(err);
        checkboxObj.checked = false;
        checkboxObj.disabled = false;
    });
};