// Load product data from HTML
let productsData = [];
const productDataElement = document.getElementById('product-data');
if (productDataElement) {
    productsData = JSON.parse(productDataElement.textContent);
} else {
    console.error("Product data not found in HTML");
}

const categoryList = ["All Categories", "T-shirts", "Blouses & Shirts", "Pants", "Sweatshirts & Hoodies", "Jeans", "Dresses", "Vests", "Shorts", "Tops", "Jumpsuits", "Aso Oke", "Skirts"];

let currentCategory = "All Categories";
let currentSort = "default";
let cart = JSON.parse(localStorage.getItem('sassyfits_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('sassyfits_wishlist')) || [];

function saveCart() { localStorage.setItem('sassyfits_cart', JSON.stringify(cart)); updateCartUI(); }
function saveWishlist() { localStorage.setItem('sassyfits_wishlist', JSON.stringify(wishlist)); updateWishlistUI(); }

function filterProducts() {
    let filtered = [...productsData];
    if (currentCategory !== "All Categories") {
        filtered = filtered.filter(p => p.categoryType === currentCategory);
    }
    return filtered;
}

function sortProducts(products) {
    const sorted = [...products];
    if (currentSort === 'price-asc') sorted.sort((a,b) => a.price - b.price);
    else if (currentSort === 'price-desc') sorted.sort((a,b) => b.price - a.price);
    return sorted;
}

function renderProducts() {
    let filtered = filterProducts();
    let sorted = sortProducts(filtered);
    document.getElementById('resultsCount').innerText = `Showing ${sorted.length} Pins`;
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = sorted.map(p => `
        <div class="product-card" data-id="${p.id}">
            <div class="product-image">
                <img src="${p.image}" alt="${p.name}" loading="lazy">
                <div class="sale-badge">SALE</div>
                <div class="wishlist-btn ${wishlist.some(w => w.id === p.id) ? 'active' : ''}" data-id="${p.id}">
                    <i class="fas fa-heart"></i>
                </div>
                <div class="quick-view" data-id="${p.id}">Quick view</div>
            </div>
            <div class="product-info">
                <div class="product-title">${p.name} • ${p.color}</div>
                <div class="product-meta"><span class="product-category-badge">${p.displayCategory}</span></div>
                <div class="price-row"><span class="current-price">₵${p.price.toFixed(2)}</span><span class="original-price">₵${p.originalPrice.toFixed(2)}</span></div>
                <button class="add-to-cart" data-id="${p.id}">Add to bag</button>
            </div>
        </div>
    `).join('');
    attachCardEvents();
}

function attachCardEvents() {
    document.querySelectorAll('.add-to-cart').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); addToCart(parseInt(btn.dataset.id)); }));
    document.querySelectorAll('.wishlist-btn').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); toggleWishlist(parseInt(btn.dataset.id)); }));
    document.querySelectorAll('.quick-view').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); openQuickView(parseInt(btn.dataset.id)); }));
}

function addToCart(pid) {
    const product = productsData.find(p => p.id === pid);
    const existing = cart.find(i => i.id === pid);
    if(existing) existing.quantity++;
    else cart.push({ ...product, quantity: 1 });
    saveCart();
    openCart();
}

function toggleWishlist(pid) {
    const exists = wishlist.some(w => w.id === pid);
    if(exists) wishlist = wishlist.filter(w => w.id !== pid);
    else wishlist.push(productsData.find(p => p.id === pid));
    saveWishlist();
    renderProducts();
    renderWishlistSidebar();
}

function updateCartUI() {
    document.getElementById('cartCount').innerText = cart.reduce((s,i) => s + i.quantity, 0);
    renderCartSidebar();
}
function updateWishlistUI() { document.getElementById('wishlistCount').innerText = wishlist.length; renderWishlistSidebar(); }

function renderCartSidebar() {
    const container = document.getElementById('cartItemsList');
    if(cart.length === 0) { container.innerHTML = '<div style="text-align:center; padding:40px;">Your bag is empty 🌸</div>'; document.getElementById('cartTotalAmount').innerText = '0.00'; return; }
    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="item-details">
                <div class="item-title">${item.name} (${item.color})</div>
                <div class="item-price">₵${item.price.toFixed(2)}</div>
                <div class="quantity-control"><button class="qty-btn" data-id="${item.id}" data-delta="-1">-</button><span>${item.quantity}</span><button class="qty-btn" data-id="${item.id}" data-delta="1">+</button></div>
                <div class="remove-link" data-id="${item.id}">Remove</div>
            </div>
        </div>
    `).join('');
    const total = cart.reduce((sum,i) => sum + (i.price * i.quantity), 0);
    document.getElementById('cartTotalAmount').innerText = total.toFixed(2);
    document.querySelectorAll('.qty-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id), delta = parseInt(btn.dataset.delta); updateQuantity(id, delta); }));
    document.querySelectorAll('.remove-link').forEach(btn => btn.addEventListener('click', (e) => { removeFromCart(parseInt(btn.dataset.id)); }));
}

function renderWishlistSidebar() {
    const container = document.getElementById('wishlistItemsList');
    if(wishlist.length === 0) { container.innerHTML = '<div style="text-align:center; padding:40px;">Save your sassy picks 💖</div>'; return; }
    container.innerHTML = wishlist.map(w => `
        <div class="wishlist-item">
            <img src="${w.image}" alt="${w.name}">
            <div class="item-details">
                <div class="item-title">${w.name} (${w.color})</div>
                <div class="item-price">₵${w.price.toFixed(2)}</div>
                <button class="add-to-cart mini-cart-add" data-id="${w.id}" style="background:#d9467a; border:none; padding:6px 12px; border-radius:30px; color:white; margin:6px 0; cursor:pointer; font-size:12px;">Add to bag</button>
                <div class="remove-link wish-remove" data-id="${w.id}">Remove</div>
            </div>
        </div>
    `).join('');
    document.querySelectorAll('.mini-cart-add').forEach(btn => btn.addEventListener('click', (e) => { addToCart(parseInt(btn.dataset.id)); document.getElementById('wishlistSidebar').classList.remove('open'); overlay.classList.remove('active'); }));
    document.querySelectorAll('.wish-remove').forEach(btn => btn.addEventListener('click', (e) => { toggleWishlist(parseInt(btn.dataset.id)); renderWishlistSidebar(); renderProducts(); }));
}

function updateQuantity(id, delta) { const idx = cart.findIndex(i => i.id === id); if(idx !== -1) { cart[idx].quantity += delta; if(cart[idx].quantity <= 0) cart.splice(idx,1); saveCart(); renderCartSidebar(); updateCartUI(); } }
function removeFromCart(id) { cart = cart.filter(i => i.id !== id); saveCart(); renderCartSidebar(); updateCartUI(); }

function openCart() { document.getElementById('cartSidebar').classList.add('open'); overlay.classList.add('active'); }
function openWishlist() { document.getElementById('wishlistSidebar').classList.add('open'); overlay.classList.add('active'); }

function showContactModal() {
    document.getElementById('contactModal').classList.add('open');
    overlay.classList.add('active');
}

function closeContactModal() {
    document.getElementById('contactModal').classList.remove('open');
    overlay.classList.remove('active');
}

function openQuickView(pid) {
    const p = productsData.find(p => p.id === pid);
    const modalBody = document.getElementById('quickViewBody');
    modalBody.innerHTML = `<div class="modal-flex"><div class="modal-img"><img src="${p.image}" alt="${p.name}"></div><div class="modal-info"><h2>${p.name} <span style="color:#d9467a">${p.color}</span></h2><div class="product-meta">${p.displayCategory}</div><div class="price-row"><span class="current-price">₵${p.price.toFixed(2)}</span><span class="original-price">₵${p.originalPrice.toFixed(2)}</span></div><p>Get ready to slay! Perfect for any occasion.</p><button class="add-to-cart" data-id="${p.id}" style="max-width:200px; margin-top:16px; background:#d9467a; color:white;">Add to bag</button></div></div>`;
    document.getElementById('quickViewModal').classList.add('open');
    overlay.classList.add('active');
    const addBtn = modalBody.querySelector('.add-to-cart');
    if(addBtn) addBtn.addEventListener('click', () => { addToCart(p.id); document.getElementById('quickViewModal').classList.remove('open'); overlay.classList.remove('active'); });
}

function renderCategories() {
    const container = document.getElementById('categoriesList');
    container.innerHTML = categoryList.map(cat => `<button class="cat-btn ${currentCategory === cat ? 'active' : ''}" data-category="${cat}">${cat}</button>`).join('');
    document.querySelectorAll('.cat-btn').forEach(btn => btn.addEventListener('click', () => {
        currentCategory = btn.dataset.category;
        renderCategories();
        renderProducts();
    }));
}

// Event listeners
document.getElementById('sortSelect').addEventListener('change', (e) => { currentSort = e.target.value; renderProducts(); });
document.getElementById('cartIconBtn').addEventListener('click', openCart);
document.getElementById('wishlistIconBtn').addEventListener('click', openWishlist);
document.getElementById('closeCartBtn').addEventListener('click', () => { document.getElementById('cartSidebar').classList.remove('open'); overlay.classList.remove('active'); });
document.getElementById('closeWishlistBtn').addEventListener('click', () => { document.getElementById('wishlistSidebar').classList.remove('open'); overlay.classList.remove('active'); });
document.getElementById('checkoutBtn').addEventListener('click', () => { 
    if(cart.length === 0) {
        alert("Your cart is empty. Add some sassy pieces!");
        return;
    }
    showContactModal(); 
});
document.getElementById('closeContactBtn').addEventListener('click', closeContactModal);
overlay.addEventListener('click', () => { 
    document.getElementById('cartSidebar').classList.remove('open'); 
    document.getElementById('wishlistSidebar').classList.remove('open'); 
    document.getElementById('quickViewModal').classList.remove('open');
    document.getElementById('contactModal').classList.remove('open');
    overlay.classList.remove('active'); 
});
document.getElementById('modalCloseBtn').addEventListener('click', () => { document.getElementById('quickViewModal').classList.remove('open'); overlay.classList.remove('active'); });

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
if(localStorage.getItem('sassyfits_theme') === 'dark') document.body.classList.add('dark');
themeToggle.addEventListener('click', () => { document.body.classList.toggle('dark'); localStorage.setItem('sassyfits_theme', document.body.classList.contains('dark') ? 'dark' : 'light'); themeToggle.innerHTML = document.body.classList.contains('dark') ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>'; });
themeToggle.innerHTML = document.body.classList.contains('dark') ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

renderCategories();
renderProducts();
updateCartUI();
updateWishlistUI();