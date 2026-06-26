/* --------------------------- CATEGORY NORMALIZATION MAP ----------------------------*/
const categoryMap = {
    starters: 'starters',
    rice: 'rice',
    chinese: 'chinese',
    saalan: 'curries',
    vegetable: 'miscellaneous',
    bbq: 'barbecues',
    kabab: 'kebabs',
    roties: 'bread-roti',
    dessert: 'desserts',
    drinks: 'drinks'
};

/* --------------------------- FIXED DISPLAY ORDER ----------------------------*/
const categoryOrder = [
    'starters',
    'rice',
    'chinese',
    'curries',
    'miscellaneous',
    'barbecues',
    'kebabs',
    'bread-roti',
    'desserts',
    'drinks'
];

document.addEventListener('DOMContentLoaded', () => {

    const convertDriveUrl = (url) => {
        if (!url) return '';
        
        let fileId = '';
        if (url.includes('drive.google.com')) {
            // Match /d/ID format
            const matchD = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (matchD && matchD[1]) {
                fileId = matchD[1];
            } else {
                // Match open?id=ID format
                const matchId = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
                if (matchId && matchId[1]) {
                    fileId = matchId[1];
                }
            }
        }
        
        if (fileId) {
            // Google's unthrottled high-speed thumbnail server. Bypasses 2024 locks and works 100% in browsers!
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`;
        }
        
        return url;
    };

    /* =========================================================
       MENU RENDERING
    ========================================================= */

    const renderMenu = (menuObj) => {

        document.querySelectorAll('.menu-grid').forEach(grid => {
            grid.innerHTML = '';
        });

        categoryOrder.forEach(category => {

            const items = menuObj[category];
            const grid = document.getElementById('grid-' + category);

            if (!grid || !items) return;

            items.forEach(item => {

                const card = document.createElement('div');
                card.className = 'menu-card';

                const resolvedImg = item.pictures_url
                    ? convertDriveUrl(item.pictures_url)
                    : `https://via.placeholder.com/300x180/111/c9a84c?text=${encodeURIComponent(item.name)}`;

                card.innerHTML = `
                    <img src="${resolvedImg}" 
                         class="menu-card-img"
                         onerror="this.src='https://via.placeholder.com/300x180/111/c9a84c?text=${encodeURIComponent(item.name)}'">

                    <div class="menu-card-content">

                        <div class="menu-card-header">
                            <h3 class="menu-card-title">${item.name}</h3>
                            <span class="menu-card-price">Rs. ${item.price}</span>
                        </div>

                        <p class="menu-card-desc" style="font-weight: 500; color: var(--gold-light);">
                            Serving Size: ${item.serving_size || 1} ${item.unit || 'pcs'}
                        </p>

                        <button class="add-to-cart-btn btn btn-gold-fill"
                            data-id="${item.id}"
                            data-name="${item.name}"
                            data-price="${item.price}"
                            data-serving-size="${item.serving_size || 1}"
                            data-unit="${item.unit || 'pcs'}">
                            Add to Cart
                        </button>

                    </div>
                `;

                grid.appendChild(card);
            });
        });
    };

    /* =========================================================
       DEALS RENDERING
    ========================================================= */

    const dealsContainer = document.getElementById('grid-deals');

    const renderDeals = (deals) => {

        if (!dealsContainer) return;

        dealsContainer.innerHTML = '';

        deals.forEach(deal => {

            const dealCard = document.createElement('div');
            dealCard.className = 'deal-card';

            const image = deal.pictures_url
                ? convertDriveUrl(deal.pictures_url)
                : `https://via.placeholder.com/350x200/111/c9a84c?text=${encodeURIComponent(deal.deal_name)}`;

            const itemsHTML = deal.items
                ? deal.items.map(i => `<li>${i.quantity || 1} × ${i.item_name}</li>`).join('')
                : '<li>No Items Found</li>';

            dealCard.innerHTML = `
                <img src="${image}" class="deal-card-img">

                <div class="deal-card-content">

                    <h3 class="deal-card-title">${deal.deal_name}</h3>

                    <p class="deal-card-price">
                        Rs. ${deal.total_price || 0}
                    </p>

                    <button class="btn btn-gold-fill view-deal-btn">
                        View Deal
                    </button>

                </div>
            `;

            dealCard.querySelector('.view-deal-btn').addEventListener('click', () => {
                renderDealDetails(deal);
            });

            dealsContainer.appendChild(dealCard);
        });
    };
    
    const renderDealDetails = (deal) => {
        const image = deal.pictures_url
            ? convertDriveUrl(deal.pictures_url)
            : `https://via.placeholder.com/350x200/111/c9a84c?text=${encodeURIComponent(deal.deal_name)}`;
            
        const itemsHTML = deal.items
            ? deal.items.map(i => `<li>${i.quantity || 1} × ${i.item_name}</li>`).join('')
            : '<li>No Items Found</li>';
            
        const modal = document.createElement('div');
        modal.className = 'deal-popup-overlay';
        modal.innerHTML = `
            <div class="deal-popup">
                <span class="close-popup">✕</span>
                <img src="${image}" class="deal-popup-img" />
                <h2>${deal.deal_name}</h2>
                <p class="deal-popup-desc">Enjoy this specially curated combination of premium dishes designed for a complete culinary experience.</p>
                <ul class="deal-items-list">${itemsHTML}</ul>
                <p class="deal-popup-price">Total: Rs. ${deal.total_price || 0}</p>
                <button class="add-deal-cart-btn btn btn-gold-fill">Add Deal To Cart</button>
            </div>
        `;
        
        const addDealBtn = modal.querySelector('.add-deal-cart-btn');
        if (addDealBtn) {
            addDealBtn.addEventListener('click', () => {
                const id = deal.deal_id;
                const title = deal.deal_name;
                const price = deal.total_price || 0;
                window.addToCart(id, title, price, 'deal', 1, 'pack');
                modal.remove();
            });
        }
        
        document.body.appendChild(modal);
        modal.querySelector('.close-popup').onclick = () => {
            modal.remove();
        };

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    };

    /* =========================================================
       FETCH MENU
    ========================================================= */

    fetch('/api/menu')
        .then(res => res.json())
        .then(data => {

            if (data.success && data.data.length > 0) {

                const dbMenuData = {};

                data.data.forEach(item => {

                    let cat = item.category.toLowerCase().trim();

                    cat = categoryMap[cat] || cat;

                    if (!dbMenuData[cat]) {
                        dbMenuData[cat] = [];
                    }

                    dbMenuData[cat].push(item);
                });

                renderMenu(dbMenuData);

                window.menuData = dbMenuData;

            }
        })
        .catch(err => {
            console.error(err);
        });

    /* =========================================================
       FETCH DEALS
    ========================================================= */

    fetch(`/api/menudeals/full?t=${new Date().getTime()}`)
        .then(res => res.json())
        .then(data => {

            if (data.success) {
                renderDeals(data.data);
            }

        })
        .catch(err => {
            console.error("Deals fetch failed", err);
        });

    /* =========================================================
       NAVBAR EFFECT
    ========================================================= */

    const navbar = document.getElementById('navbar');

    if (navbar) {

        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });

    }

});