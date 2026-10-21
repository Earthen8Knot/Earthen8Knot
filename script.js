/**
 * EarthenKnot Global Script
 */

// Initialize Cart from LocalStorage or SessionStorage
function getCartItems() {
  try {
    const saved = localStorage.getItem('earthenknot_cart');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

function saveCartItems(items) {
  localStorage.setItem('earthenknot_cart', JSON.stringify(items));
  const totalQty = items.reduce((sum, item) => sum + (item.qty || 1), 0);
  sessionStorage.setItem('cartCount', totalQty);
  cartCount = totalQty;
  updateCartBadge();
}

let cartItems = getCartItems();
let cartCount = cartItems.reduce((sum, item) => sum + (item.qty || 1), 0);
updateCartBadge();

function resolveProductUrl(itemName, passedUrl) {
  if (passedUrl && typeof passedUrl === 'string') return passedUrl;
  if (!itemName) return 'collections.html';
  const lower = itemName.toLowerCase();
  for (const [id, prod] of Object.entries(productsData || {})) {
    if (prod.name.toLowerCase() === lower) {
      return `product.html?id=${id}`;
    }
  }
  if (lower.includes('phone') || (lower.includes('pearl') && lower.includes('pouch'))) {
    return 'product.html?id=pearl-crochet-phone-pouch';
  }
  if (lower.includes('tablet') || lower.includes('ipad') || (lower.includes('striped') && lower.includes('sleeve'))) {
    return 'product.html?id=striped-crochet-tablet-sleeve';
  }
  if (lower.includes('rose') || lower.includes('pearl') || lower.includes('sling')) {
    return 'product.html?id=rose-pearl-crochet-sling-bag';
  }
  if (lower.includes('sweatshirt') || lower.includes('striped') || lower.includes('ocean')) {
    return 'product.html?id=striped-crochet-sweatshirt';
  }
  return 'collections.html';
}

function addToCart(name, price, img, url, quantityToAdd) {
  cartItems = getCartItems();
  let itemName = typeof name === 'string' && name ? name : null;
  let itemPrice = typeof price === 'number' ? price : null;
  let itemImg = typeof img === 'string' && img ? img : null;
  let itemUrl = typeof url === 'string' && url ? url : null;
  const addQty = typeof quantityToAdd === 'number' && quantityToAdd > 0 ? Math.min(3, quantityToAdd) : 1;

  // Auto-detect from surrounding card if clicked inside a product card
  if (window.event && window.event.target) {
    const card = window.event.target.closest('.product-card');
    if (card) {
      if (!itemName) itemName = card.querySelector('h3')?.textContent?.trim();
      if (itemPrice === null || itemPrice === undefined || isNaN(itemPrice)) {
        const priceEl = card.querySelector('.discount-price') || card.querySelector('p');
        const priceTxt = priceEl?.textContent?.trim();
        if (priceTxt) {
          const pVal = Number(priceTxt.replace(/[^0-9.]/g, ''));
          if (!isNaN(pVal)) itemPrice = pVal;
        }
      }
      if (!itemImg) itemImg = card.querySelector('img')?.getAttribute('src');
      if (!itemUrl) itemUrl = card.querySelector('a')?.getAttribute('href');
    }
  }

  // Auto-detect from product page url if on product.html
  if (window.location.pathname.includes('product.html')) {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('id');
    if (pid && typeof productsData !== 'undefined' && productsData[pid]) {
      if (!itemName) itemName = productsData[pid].name;
      if (itemPrice === null || itemPrice === undefined || isNaN(itemPrice)) {
        const pVal = Number(String(productsData[pid].price).replace(/[^0-9.]/g, ''));
        if (!isNaN(pVal)) itemPrice = pVal;
      }
      if (!itemImg) itemImg = productsData[pid].image;
      if (!itemUrl) itemUrl = `product.html?id=${pid}`;
    }
  }

  itemName = itemName || 'Handcrafted Earth Crochet Creation';
  if (itemPrice === null || itemPrice === undefined || isNaN(itemPrice)) itemPrice = 0;
  itemImg = itemImg || 'assets/hero-bag.jpg';
  itemUrl = resolveProductUrl(itemName, itemUrl);

  const existing = cartItems.find(item => item.name === itemName);
  if (existing) {
    const currentQty = Number(existing.qty) || 1;
    if (currentQty >= 3) {
      showCartWarningToast(`You can order up to a maximum of 3 pieces of "${itemName}"!`);
      return;
    }
    const newQty = Math.min(3, currentQty + addQty);
    existing.qty = newQty;
    saveCartItems(cartItems);
    animateCartBadge();
    showCartToast(`${itemName} (Qty: ${newQty})`);
    return;
  } else {
    const initialQty = Math.min(3, Math.max(1, addQty));
    cartItems.push({
      id: 'ek-' + Date.now().toString(36),
      name: itemName,
      price: itemPrice,
      qty: initialQty,
      img: itemImg,
      url: itemUrl
    });
  }

  saveCartItems(cartItems);
  animateCartBadge();
  const addedItem = cartItems.find(item => item.name === itemName);
  showCartToast(addedItem && addedItem.qty > 1 ? `${itemName} (Qty: ${addedItem.qty})` : itemName);
}

function requestRemake(productName, productUrl) {
  let name = typeof productName === 'string' && productName ? productName : '';
  let prodUrl = typeof productUrl === 'string' && productUrl ? productUrl : '';

  if (window.event && window.event.target) {
    const card = window.event.target.closest('.product-card');
    if (card) {
      if (!name) name = card.querySelector('h3')?.textContent?.trim() || '';
      if (!prodUrl) {
        const link = card.querySelector('a')?.getAttribute('href');
        if (link) {
          const origin = (window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file://')) ? window.location.origin : 'https://earthenknot.in';
          prodUrl = `${origin}/${link.replace(/^\//, '')}`;
        }
      }
    }
  }

  if (window.location.pathname.includes('product.html')) {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('id');
    if (pid && typeof productsData !== 'undefined' && productsData[pid]) {
      if (!name) name = productsData[pid].name;
    }
    if (!prodUrl) {
      const origin = (window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file://')) ? window.location.origin : 'https://earthenknot.in';
      if (pid) {
        prodUrl = `${origin}/product.html?id=${pid}`;
      } else {
        prodUrl = window.location.href;
      }
    }
  }

  if (!prodUrl && name && typeof resolveProductUrl === 'function') {
    const rel = resolveProductUrl(name);
    if (rel && rel !== 'collections.html') {
      const origin = (window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file://')) ? window.location.origin : 'https://earthenknot.in';
      prodUrl = `${origin}/${rel.replace(/^\//, '')}`;
    }
  }

  let text = 'I want to request a remake this product';
  if (name) {
    text += `: ${name}`;
  }
  if (prodUrl) {
    text += `\n${prodUrl}`;
  }

  const phone = '918468937613';
  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  const newTab = window.open(waUrl, '_blank');
  if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
    window.location.href = waUrl;
  }
}
window.requestRemake = requestRemake;

function showCartWarningToast(message) {
  let toast = document.getElementById('cart-toast-msg');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cart-toast-msg';
    toast.style.cssText = `
      position: fixed;
      bottom: 25px;
      right: 25px;
      background: white;
      color: var(--text);
      border: 1.5px solid var(--secondary);
      padding: 14px 22px;
      border-radius: 14px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.12);
      font-family: 'Quicksand', sans-serif;
      font-size: 0.95rem;
      z-index: 10000;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.75rem;">
      <div style="background:var(--secondary);color:white;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:0.9rem;">!</div>
      <div>
        <strong style="display:block;font-size:0.88rem;color:var(--secondary);">Quantity Limit (Max 3) <svg class="heart-terracotta" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></strong>
        <span style="font-size:0.8rem;color:var(--text-light);">${message}</span>
      </div>
    </div>
  `;
  setTimeout(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  }, 50);
  
  if (window._toastTimeout) clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';
  }, 4000);
}

function showCartToast(itemName) {
  let toast = document.getElementById('cart-toast-msg');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cart-toast-msg';
    toast.style.cssText = `
      position: fixed;
      bottom: 25px;
      right: 25px;
      background: rgba(44, 53, 36, 0.95);
      color: #fff;
      padding: 14px 22px;
      border-radius: 14px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      font-family: 'Quicksand', sans-serif;
      font-size: 0.95rem;
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 10px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.15);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <svg class="toast-yarn-ball" viewBox="0 0 100 100" style="width:26px;height:26px;fill:none;stroke:#A3B18A;stroke-width:4;margin-right:4px;">
      <circle cx="50" cy="50" r="30"/>
      <path d="M25 35 Q40 60 70 35" />
      <path d="M30 65 Q50 35 75 60" />
      <path d="M50 20 Q50 50 50 80" />
      <path d="M20 50 Q50 50 80 50" />
      <path d="M78 60 Q90 65 95 80" stroke-width="2.5" />
    </svg>
    <span>Added <strong>${itemName}</strong> to cart!</span>
    <a href="checkout.html" style="color:#A3B18A;font-weight:600;margin-left:8px;text-decoration:underline;">View Cart</a>
  `;
  setTimeout(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  }, 10);

  clearTimeout(window._cartToastTimer);
  window._cartToastTimer = setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';
  }, 3500);
}

function updateCartBadge() {
  const countEl = document.getElementById('cart-count');
  if (countEl) {
    countEl.textContent = cartCount;
  }
}

function animateCartBadge() {
  const countEl = document.getElementById('cart-count');
  if (countEl) {
    countEl.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    countEl.style.transform = 'scale(1.5)';
    setTimeout(() => {
      countEl.style.transform = 'scale(1)';
    }, 250);
  }
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('main-nav');
  if (navbar) {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
});

// Simple fade-in intersection observer for scroll animations
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in');
      entry.target.style.opacity = 1;
      entry.target.style.animation = 'fadeIn 0.8s ease forwards';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  animatedElements.forEach(el => observer.observe(el));

  // ===== Responsive Mobile Navigation Toggle & Drawer =====
  const navbar = document.getElementById('main-nav') || document.querySelector('.navbar');
  const navLinks = document.querySelector('.nav-links');
  const navActions = document.querySelector('.nav-actions');

  if (navbar && navLinks) {
    // 0. Fix Stacking Context Bug on Mobile
    // Move navLinks to body on mobile so it can overlay the navbar and backdrop correctly.
    const handleNavReparenting = () => {
      if (window.innerWidth <= 850) {
        if (navLinks.parentElement !== document.body) {
          document.body.appendChild(navLinks);
        }
      } else {
        if (navLinks.parentElement !== navbar) {
          navbar.insertBefore(navLinks, navActions);
        }
      }
    };
    handleNavReparenting();
    window.addEventListener('resize', handleNavReparenting);
    // 1. Ensure Backdrop exists in body
    let backdrop = document.querySelector('.mobile-nav-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'mobile-nav-backdrop';
      document.body.appendChild(backdrop);
    }

    // 2. Ensure Mobile Drawer Header exists inside navLinks
    if (!navLinks.querySelector('.mobile-drawer-header')) {
      const drawerHeader = document.createElement('div');
      drawerHeader.className = 'mobile-drawer-header';
      drawerHeader.innerHTML = `
        <div class="mobile-drawer-brand">
          <img src="assets/logo.png" alt="Earthen Knot">
          <span style="font-family: 'Ribeye', cursive, serif; font-size: 1.5rem; color: #728465;">Earthen<span style="color: #c9783c;">Knot</span></span>
        </div>
        <button class="mobile-drawer-close" aria-label="Close menu">
          <svg viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;
      navLinks.insertBefore(drawerHeader, navLinks.firstChild);
    }

    // 3. Ensure Mobile Drawer Shortcuts Footer exists inside navLinks
    if (!navLinks.querySelector('.mobile-drawer-footer')) {
      const drawerFooter = document.createElement('div');
      drawerFooter.className = 'mobile-drawer-footer';
      drawerFooter.innerHTML = `
        <div class="mobile-drawer-divider"></div>
        <div class="mobile-drawer-section-label">Account & Orders</div>
        <a href="my-orders.html" class="mobile-drawer-link">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          <span>My Orders</span>
        </a>
        <a href="auth.html" class="mobile-drawer-link" id="mobile-drawer-auth-item">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span id="mobile-drawer-auth-text">Sign In / Account</span>
        </a>
        <a href="policies.html" class="mobile-drawer-link">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          <span>Shipping & Policies</span>
        </a>
      `;
      navLinks.appendChild(drawerFooter);
    }

    // 4. Ensure Mobile Hamburger Toggle Button exists in navActions
    let menuBtn = document.getElementById('mobile-menu-btn') || document.querySelector('.mobile-menu-btn');
    if (!menuBtn && navActions) {
      menuBtn = document.createElement('button');
      menuBtn.className = 'mobile-menu-btn';
      menuBtn.id = 'mobile-menu-btn';
      menuBtn.setAttribute('aria-label', 'Toggle Navigation Menu');
      menuBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      `;
      navActions.appendChild(menuBtn);
    }

    const closeMobileMenu = () => {
      navLinks.classList.remove('open');
      if (backdrop) backdrop.classList.remove('active');
      document.body.classList.remove('nav-menu-open');
      if (menuBtn) {
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.innerHTML = `
          <svg viewBox="0 0 24 24">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        `;
      }
    };

    const openMobileMenu = () => {
      navLinks.classList.add('open');
      if (backdrop) backdrop.classList.add('active');
      document.body.classList.add('nav-menu-open');
      if (menuBtn) {
        menuBtn.setAttribute('aria-expanded', 'true');
        menuBtn.innerHTML = `
          <svg viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        `;
      }
    };

    if (menuBtn) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (navLinks.classList.contains('open')) {
          closeMobileMenu();
        } else {
          openMobileMenu();
        }
      });
    }

    // Close button inside drawer
    const drawerCloseBtn = navLinks.querySelector('.mobile-drawer-close');
    if (drawerCloseBtn) {
      drawerCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeMobileMenu();
      });
    }

    // Close menu when tapping on backdrop
    if (backdrop) {
      backdrop.addEventListener('click', closeMobileMenu);
    }

    // Close menu on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        closeMobileMenu();
      }
    });

    // Close drawer when clicking any page navigation link inside drawer
    navLinks.querySelectorAll('a:not(.dropbtn)').forEach(link => {
      link.addEventListener('click', () => {
        setTimeout(closeMobileMenu, 150);
      });
    });

    // Dropdown Menu Click Toggle (Handles both Desktop & Mobile)
    const dropBtns = document.querySelectorAll('.dropbtn');
    dropBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const isMobile = window.innerWidth <= 850;
        if (isMobile) {
          e.preventDefault();
          e.stopPropagation();
          const dropdownContent = btn.nextElementSibling;
          if (dropdownContent && dropdownContent.classList.contains('dropdown-content')) {
            const isShown = dropdownContent.classList.toggle('show');
            // Close all other open dropdowns first (if any)
            document.querySelectorAll('.dropdown-content.show').forEach(el => {
              if (el !== dropdownContent) el.classList.remove('show');
            });
          }
        }
      });
    });

    // Close dropdown if clicking outside dropdown
    window.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-content.show').forEach(content => {
          content.classList.remove('show');
        });
      }
    });
  }

  // Initialize Product Reactions
  initProductReactions();
});

// Product Stories Data
const productsData = {
  'striped-crochet-sweatshirt': {
    name: 'White-Blue Striped Sweatshirt',
    price: '₹2,899.00',
    originalPrice: '',
    image: 'assets/sweatshirt-1.jpg',
    images: ['assets/sweatshirt-1.jpg', 'assets/sweatshirt-2.jpg'],
    soldOut: false,
    stitchCount: '34,500 hand loops',
    stitchTime: '15 Hours',
    hookSize: '4.0mm bamboo hook',
    fiberType: '8 ply cotton yarn, 3 mm thick',
    size: 'Size M (Medium Top)',
    sizeDetails: 'Handcrafted relaxed drop-shoulder crochet top in Size M (Medium). Chest: 38"–40" | Total Length: 22" | Sleeve Length: 21". Comfortably tailored for standard size M with a breathable, flattering drape.'
  },
  'rose-pearl-crochet-sling-bag': {
    name: 'Rose & Pearl Crochet Sling Bag',
    price: '₹2,649.00',
    originalPrice: '',
    image: 'assets/rose-pearl-bag-1-v2.jpg',
    images: ['assets/rose-pearl-bag-1-v2.jpg', 'assets/rose-pearl-bag-2-v2.jpg'],
    soldOut: false,
    stitchCount: '16,200 hand loops',
    stitchTime: '14 hours of craft',
    hookSize: '3.5mm ergonomic hook',
    fiberType: '100% Cotton Thread & Faux Pearl Beads',
    size: '8" × 7" (20 × 18 cm)',
    sizeDetails: 'Artisan handcrafted round sling bag featuring a blooming 3D crochet rose motif adorned with lustrous pearls, a ribbed cotton border, and an elegant crossbody shoulder strap intertwined with delicate pearls (strap drop: ~20" / 50 cm). Handcrafted with 100% cotton thread. Perfectly sized for your smartphone, cards, keys, and daily essentials.'
  },
  'pearl-crochet-phone-pouch': {
    name: 'Pearl Crochet Phone Sling Pouch',
    price: '₹699.00',
    originalPrice: '',
    image: 'assets/pearl-phone-pouch.jpg',
    soldOut: false,
    stitchCount: '9,400 hand loops',
    stitchTime: '8.5 hours of craft',
    hookSize: '3.5mm ergonomic hook',
    fiberType: '100% Acrylic Yarn & Faux Pearl Beads',
    size: '7.5" × 4.5" (19 × 11.5 cm)',
    sizeDetails: 'Artisan handcrafted ribbed vertical sling pouch designed to snugly fit smartphones, cards, and daily essentials. Features a fold-over flap with a pearl-clustered toggle loop closure, and a delicate crochet crossbody shoulder strap intertwined with lustrous pearls (strap drop: ~20" / 50 cm). Handcrafted with 100% acrylic yarn.'
  },
  'striped-crochet-tablet-sleeve': {
    name: 'Striped Crochet Tablet Sleeve',
    price: '₹849.00',
    originalPrice: '',
    image: 'assets/striped-tablet-sleeve-1.jpg',
    images: ['assets/striped-tablet-sleeve-1.jpg', 'assets/striped-tablet-sleeve-2.jpg'],
    soldOut: false,
    stitchCount: '12,800 hand loops',
    stitchTime: '10 hours of craft',
    hookSize: '3.0mm crochet hook',
    fiberType: '100% Acrylic Yarn',
    size: '10.5" × 8" (26.5 × 20 cm)',
    sizeDetails: 'Artisan handcrafted ribbed tablet sleeve featuring blue and cream vertical stripes, dual metal snap button closures, and a secure fold-over flap. Hand-stitched with 100% acrylic yarn using a 3.0mm hook. Fits standard iPads, Kindles, and tablets up to 11 inches with cushioned scratch protection.'
  },
  'lavender-fringe-crochet-scarf': {
    name: 'Lavender Fringe Crochet Scarf',
    price: '₹1,299.00',
    originalPrice: '₹1,899.00',
    image: 'assets/lavender-fringe-crochet-scarf.jpg',
    soldOut: true,
    stitchCount: '18,600 hand loops',
    stitchTime: '15 hours of craft',
    hookSize: '5.5mm aluminum hook',
    fiberType: '70% Wool, 30% Acrylic',
    size: '65" Length × 8.5" Width',
    sizeDetails: 'Total Length: 65 inches (including hand-knotted fringe) | Width: 8.5 inches. Generous length allows for single loop, double wrap, or draped styling.'
  },
  'midnight-mesh-crochet-top': {
    name: 'Midnight Mesh Crochet Top',
    price: '₹1,299.00',
    originalPrice: '₹1,899.00',
    image: 'assets/black-crochet-top-1.jpg',
    images: ['assets/black-crochet-top-1.jpg', 'assets/black-crochet-top-2.jpg'],
    soldOut: true,
    stitchCount: '22,400 hand loops',
    stitchTime: '18 hours of craft',
    hookSize: '3.5mm steel hook',
    fiberType: '100% Egyptian Cotton',
    size: 'Size S/M (Bust 32"–36")',
    sizeDetails: 'Sleeveless cropped silhouette. Bust: 32"–36" | Total Length: 17". Handcrafted with natural stitch flexibility to flatter sizes Small through Medium.'
  },
  'blossom-striped-crochet-sweater': {
    name: 'Blossom Striped Crochet Sweater',
    price: '₹1,299.00',
    originalPrice: '₹1,899.00',
    image: 'assets/pink-striped-sweater-1.jpg',
    images: ['assets/pink-striped-sweater-1.jpg', 'assets/pink-striped-sweater-2.jpg'],
    soldOut: true,
    stitchCount: '38,000 hand loops',
    stitchTime: '28 hours of craft',
    hookSize: '4.0mm bamboo hook',
    fiberType: '85% Cotton, 15% Milk Fiber',
    size: 'Free Size / Relaxed Fit',
    sizeDetails: 'Airy trellis-knit pullover. Chest: 38"–42" | Total Length: 23" | Sleeve Length: 22". Breathable, flexible stretch suitable for sizes S through L.'
  },
  'sweetheart-crochet-pouch': {
    name: 'Sweetheart Crochet Pouch',
    price: '₹899.00',
    image: 'assets/heart-pouch.jpg',
    soldOut: true,
    stitchCount: '3,400 hand loops',
    stitchTime: '3.5 hours of craft',
    hookSize: '3.5mm steel hook',
    fiberType: '100% Organic Cotton',
    size: '6" × 5" (15 × 12.5 cm)',
    sizeDetails: 'Width: 6 inches (15 cm) | Height: 5 inches (12.5 cm). Compact size with wood button closure; ideal for cards, coins, cosmetics, or everyday small essentials.'
  },
  'gray-cream-beanie': {
    name: 'Dual-Tone Ribbed Beanie',
    price: '₹899.00',
    image: 'assets/gray-cream-beanie.jpg',
    soldOut: true,
    stitchCount: '6,200 hand loops',
    stitchTime: '5 hours of craft',
    hookSize: '5.0mm aluminum hook',
    fiberType: '60% Acrylic, 40% Merino Wool',
    size: 'One Size (Fits Head 20"–22")',
    sizeDetails: 'Standard Adult Free Size. Head Circumference: 20"–22" | Folded Brim Height: 8.5". Double-knit ribbed structure provides adaptive, cozy stretch.'
  },
  'gray-ribbed-beanie': {
    name: 'Artisan Ribbed Knit Beanie',
    price: '₹899.00',
    image: 'assets/gray-ribbed-beanie.jpg',
    soldOut: true,
    stitchCount: '5,800 hand loops',
    stitchTime: '4.5 hours of craft',
    hookSize: '5.0mm aluminum hook',
    fiberType: '60% Acrylic, 40% Merino Wool',
    size: 'One Size (Fits Head 20"–22")',
    sizeDetails: 'Standard Adult Free Size. Head Circumference: 20"–22" | Folded Brim Height: 8.5". Elastic ribbed knit ensures a secure, warm fit.'
  },
  'ivory-beanie': {
    name: 'Ivory Ribbed Knit Beanie',
    price: '₹899.00',
    image: 'assets/ivory-beanie.jpg',
    soldOut: true,
    stitchCount: '5,800 hand loops',
    stitchTime: '4.5 hours of craft',
    hookSize: '4.5mm bamboo hook',
    fiberType: '100% Premium Cotton',
    size: 'One Size (Fits Head 20"–22")',
    sizeDetails: 'Standard Adult Free Size. Head Circumference: 20"–22" | Folded Brim Height: 8.5". Breathable, all-natural cotton stretch.'
  },
  'scrunchies-set': {
    name: 'Artisan Crochet Scrunchies Set',
    price: '₹899.00',
    image: 'assets/scrunchies-set.jpg',
    soldOut: true,
    stitchCount: '1,800 hand loops',
    stitchTime: '2 hours of craft',
    hookSize: '3.5mm steel hook',
    fiberType: '100% Combed Cotton',
    size: 'Set of 3 (Diameter 4.5")',
    sizeDetails: 'Set of 3 handmade scrunchies. Outer Diameter: ~4.5 inches (11.5 cm) unstretched | Stretches smoothly up to 8 inches without snagging.'
  }
};

function renderProductPage() {
  window._productDetailQty = 1;
  const container = document.getElementById('product-detail-container');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  const product = productsData[productId];

  if (product) {
    const imagesToUse = product.images || [product.image];
    // Create the thumbnails HTML
    let thumbnailsHTML = '';
    if (imagesToUse.length > 1) {
      thumbnailsHTML = '<div class="thumbnails">';
      imagesToUse.forEach((imgUrl, index) => {
        // Only apply brightness drop if it is a duplicate placeholder image
        const filterStr = product.filter ? product.filter : '';
        const isDuplicate = imgUrl === imagesToUse[0] && index > 0;
        const thumbFilter = isDuplicate ? `${filterStr} brightness(${1 - (index * 0.1)})` : filterStr;
        thumbnailsHTML += `<img src="${imgUrl}" alt="${product.name} angle ${index + 1}" class="thumbnail ${index === 0 ? 'active' : ''}" style="filter: ${thumbFilter};" data-index="${index}" data-filter="${thumbFilter}">`;
      });
      thumbnailsHTML += '</div>';
    }

    container.innerHTML = `
      <div style="max-width: 720px; margin: 0 auto; margin-bottom: 4rem;">
        <div class="product-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
          <h1 style="font-size: 2.2rem; color: var(--primary-dark); font-family: 'Quicksand', sans-serif; font-weight: 600; margin: 0;">${product.name}</h1>
          <div style="display:flex; gap:0.5rem; align-items:center;">
            
            <button id="zoom-toggle-btn" style="padding: 0.5rem 1rem; font-size: 0.9rem; border-radius: 8px; border: 1.5px solid var(--secondary); background: transparent; color: var(--secondary); cursor: pointer; transition: all 0.3s; box-shadow: var(--shadow-sm); font-weight: 600;">🔍 Enable Zoom</button>
          </div>
        </div>
        <div class="product-gallery" style="margin-bottom: 3rem;">
          <div class="main-image-container" id="main-image-container">
            <img src="${imagesToUse[0]}" id="main-product-image" alt="${product.name}" style="filter: ${product.filter || 'none'};">
            
          </div>
          ${thumbnailsHTML}
        </div>
        
        <div class="product-action-bar-responsive" style="display: flex; align-items: center; justify-content: space-between; padding: 1.5rem 2rem; background: var(--surface); border-radius: 16px; box-shadow: var(--shadow-sm); border: 1px solid rgba(0,0,0,0.05); text-align: left;">
          <div style="display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap;">
            ${product.originalPrice ? `<span style="font-size: 1.25rem; color: var(--text-light); text-decoration: line-through; opacity: 0.75;">${product.originalPrice}</span>` : ''}
            <p style="font-size: 1.8rem; color: var(--secondary); font-weight: 700; margin: 0;">${product.price}</p>
            ${product.originalPrice ? `<span style="background: rgba(201, 120, 60, 0.12); color: var(--secondary-dark); font-size: 0.85rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: 6px; border: 1px solid rgba(201, 120, 60, 0.3);">Save ₹600</span>` : ''}
            ${product.soldOut ? `<span class="sold-out-badge" style="font-size: 0.8rem; padding: 0.25rem 0.75rem;">Sold Out</span>` : ''}
          </div>
          ${product.soldOut ? `
            <button class="btn btn-secondary" style="padding: 1rem 3rem; font-size: 1.1rem; border-radius: 30px; white-space: nowrap; cursor: pointer; transition: all 0.3s;" onclick="requestRemake('${product.name}')">Request a Remake</button>
          ` : `
            <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
              <div class="qty-stepper-btn-group" style="padding: 4px 10px; gap: 8px;">
                <button type="button" class="qty-btn" onclick="adjustProductDetailQty(-1)" aria-label="Decrease quantity" style="font-size: 1.15rem;">−</button>
                <span id="detail-qty-display" class="qty-display" style="font-size: 1rem; min-width: 20px; text-align: center; font-weight: 700;">1</span>
                <button type="button" class="qty-btn" onclick="adjustProductDetailQty(1)" aria-label="Increase quantity" style="font-size: 1.15rem;">+</button>
              </div>
              <button class="btn btn-primary" style="padding: 0.85rem 2.2rem; font-size: 1.05rem; border-radius: 30px; box-shadow: 0 4px 10px rgba(114, 132, 101, 0.2); white-space: nowrap; font-weight: 600;" onclick="addProductDetailToCart('${product.name}', ${Number(String(product.price).replace(/[^0-9.]/g, ''))}, '${imagesToUse[0]}')">Add to Cart</button>
            </div>
          `}
        </div>
        ${product.soldOut ? `
        <div class="collection-note" style="margin-top: 2rem; margin-bottom: 0;">
          <span class="collection-note-title">Note!</span> Loved something that’s sold out? You can <a href="javascript:void(0)" onclick="requestRemake('${product.name}')" style="text-decoration: underline; color: inherit; font-weight: 500; transition: color 0.3s ease;" onmouseover="this.style.color='var(--secondary)'" onmouseout="this.style.color='inherit'">request a remake on WhatsApp</a> and let us know!
        </div>
        ` : ''}
      </div>

      <div class="product-bio-wrapper" style="max-width: 800px; margin: 0 auto; padding: 3rem 0; border-top: 1px solid rgba(0,0,0,0.05); text-align: center;">
        <h2 style="font-size: 2rem; margin-bottom: 1.75rem; color: var(--primary-dark); font-family: 'Quicksand', sans-serif; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.65rem;">
          <svg viewBox="0 0 24 24" style="width: 26px; height: 26px; stroke: currentColor; fill: none; stroke-width: 2;" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.3 15.3l-6.6 6.6c-.4.4-1 .4-1.4 0l-9.9-9.9c-.2-.2-.3-.4-.3-.7V4c0-.6.4-1 1-1h7.3c.3 0 .5.1.7.3l9.9 9.9c.4.4.4 1 0 1.4z"></path>
            <circle cx="7.5" cy="7.5" r="1.5"></circle>
          </svg>
          Size Info
        </h2>
        <div class="size-info-card" style="background: var(--surface); border: 1px solid rgba(114, 132, 101, 0.18); border-radius: 16px; padding: 2rem 2.5rem; text-align: left; box-shadow: var(--shadow-sm); max-width: 650px; margin: 0 auto;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 1px solid rgba(114, 132, 101, 0.12); padding-bottom: 0.85rem;">
            <span style="font-size: 0.8rem; color: var(--primary-dark); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; background: rgba(114, 132, 101, 0.1); padding: 0.3rem 0.8rem; border-radius: 20px;">Dimensions & Fit</span>
          </div>
          <p style="font-size: 1.3rem; font-weight: 700; color: var(--primary-dark); margin: 0 0 0.6rem 0; font-family: 'Quicksand', sans-serif;">${product.size || 'Standard Size'}</p>
          <p style="font-size: 1.05rem; line-height: 1.7; color: var(--text); margin: 0;">${product.sizeDetails || ''}</p>
        </div>
        
        <!-- Material Used -->
        <div style="background: var(--bg-secondary); border-radius: 16px; padding: 2.5rem; margin-top: 3rem; text-align: left; box-shadow: var(--shadow-sm); border: 1px solid rgba(0,0,0,0.03);">
          <h3 style="font-size: 1.35rem; color: var(--primary-dark); font-family: 'Quicksand', sans-serif; font-weight: 600; margin-top: 0; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.65rem;">
            <svg viewBox="0 0 24 24" style="width: 24px; height: 24px; stroke: currentColor; fill: none; stroke-width: 2;" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 0 0-7.3 16.8M12 22a10 10 0 0 0 7.3-16.8"/><path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4z"/></svg>
            Material Used
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1.5rem;">
            <div>
              <span style="display: block; font-size: 0.8rem; color: var(--text-light); font-weight: 500; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 0.25rem;">Size / Fit</span>
              <strong style="font-size: 1.05rem; color: var(--text); font-family: 'Quicksand', sans-serif; font-weight: 600;">${product.size || 'Standard'}</strong>
            </div>
            <div>
              <span style="display: block; font-size: 0.8rem; color: var(--text-light); font-weight: 500; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 0.25rem;">Stitching Labor</span>
              <strong style="font-size: 1.05rem; color: var(--text); font-family: 'Quicksand', sans-serif; font-weight: 600;">${product.stitchTime || '10 hours'}</strong>
            </div>
            <div>
              <span style="display: block; font-size: 0.8rem; color: var(--text-light); font-weight: 500; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 0.25rem;">Hook Utilized</span>
              <strong style="font-size: 1.05rem; color: var(--text); font-family: 'Quicksand', sans-serif; font-weight: 600;">${product.hookSize || '4.5mm hook'}</strong>
            </div>
            <div>
              <span style="display: block; font-size: 0.8rem; color: var(--text-light); font-weight: 500; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 0.25rem;">Yarn Info</span>
              <strong style="font-size: 1.05rem; color: var(--text); font-family: 'Quicksand', sans-serif; font-weight: 600;">${product.fiberType || '100% Organic Cotton'}</strong>
            </div>
          </div>
        </div>
        
        ${product.videoUrl ? `
        <h2 style="font-size: 2rem; margin: 4rem 0 2rem 0; color: var(--primary-dark); font-family: 'Quicksand', sans-serif; font-weight: 600;">The Making Of</h2>
        <div class="video-container short" style="margin: 0 auto;">
          <iframe src="${product.videoUrl}" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        </div>
        ` : ''}
      </div>
    `;
    document.title = `${product.name} - EarthenKnot`;

    // Initialize gallery and zoom functionality
    initGalleryZoom();

  } else {
    container.innerHTML = `<h1 style="grid-column: 1/-1; text-align: center; color: var(--text-light); font-weight: 400; margin-top: 2rem;">Product not found or has been discontinued.</h1>`;
  }
}

function initGalleryZoom() {
  const mainContainer = document.getElementById('main-image-container');
  const mainImage = document.getElementById('main-product-image');
  const thumbnails = document.querySelectorAll('.thumbnail');
  const zoomBtn = document.getElementById('zoom-toggle-btn');
  
  let zoomEnabled = false;

  if (zoomBtn) {
    zoomBtn.addEventListener('click', function() {
      zoomEnabled = !zoomEnabled;
      if (zoomEnabled) {
        this.textContent = '🔍 Disable Zoom';
        this.style.background = 'var(--secondary)';
        this.style.color = 'white';
        if (mainContainer) mainContainer.style.cursor = 'zoom-in';
      } else {
        this.textContent = '🔍 Enable Zoom';
        this.style.background = 'transparent';
        this.style.color = 'var(--secondary)';
        if (mainContainer) {
          mainContainer.style.cursor = 'default';
          // Reset transform when disabled
          mainImage.style.transformOrigin = 'center center';
          mainImage.style.transform = 'scale(1)';
        }
      }
    });
  }

  if (thumbnails.length > 0) {
    thumbnails.forEach(thumb => {
      thumb.addEventListener('click', function () {
        // Remove active class from all
        thumbnails.forEach(t => t.classList.remove('active'));
        // Add to clicked
        this.classList.add('active');
        // Update main image source and filter to match the thumbnail
        mainImage.src = this.src;
        mainImage.style.filter = this.getAttribute('data-filter') || 'none';
      });
    });
  }

  if (mainContainer && mainImage) {
    mainContainer.style.cursor = 'default'; // set explicit initial cursor

    mainContainer.addEventListener('mousemove', function (e) {
      if (!zoomEnabled) return;

      const rect = mainContainer.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within the element
      const y = e.clientY - rect.top; // y position within the element

      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;

      mainImage.style.transformOrigin = `${xPercent}% ${yPercent}%`;
      mainImage.style.transform = 'scale(2.5)';
    });

    mainContainer.addEventListener('mouseleave', function () {
      if (!zoomEnabled) return;
      // Reset transform when mouse leaves
      mainImage.style.transformOrigin = 'center center';
      mainImage.style.transform = 'scale(1)';
    });
  }
}

window._productDetailQty = 1;
window.adjustProductDetailQty = function(delta) {
  let qty = window._productDetailQty || 1;
  qty += delta;
  if (qty < 1) qty = 1;
  if (qty > 3) {
    qty = 3;
    if (typeof showCartWarningToast === 'function') {
      showCartWarningToast('You can order up to a maximum of 3 pieces of this product!');
    }
  }
  window._productDetailQty = qty;
  const disp = document.getElementById('detail-qty-display');
  if (disp) disp.textContent = qty;
};

window.addProductDetailToCart = function(name, price, img) {
  const qty = window._productDetailQty || 1;
  addToCart(name, price, img, null, qty);
};

// ----------------------------------------------------
// FLOATING WHATSAPP BUTTON (Applies globally to all pages)
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const waBtn = document.createElement('a');
  waBtn.href = "https://wa.me/918468937613?text=Hi EarthenKnot, I need help with my order!";
  waBtn.target = "_blank";
  waBtn.rel = "noopener noreferrer";
  waBtn.setAttribute('aria-label', 'Chat with us on WhatsApp');
  waBtn.style.cssText = `
    position: fixed;
    bottom: 25px;
    right: 25px;
    width: 58px;
    height: 58px;
    background-color: #25D366;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(37, 211, 102, 0.4);
    z-index: 9999;
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  `;
  
  waBtn.innerHTML = `
    <svg viewBox="0 0 24 24" style="width: 32px; height: 32px; fill: white;">
      <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.127.55 4.195 1.59 6.015L.302 22.78l4.871-1.278A11.968 11.968 0 0 0 12.031 24c6.646 0 12.031-5.385 12.031-12.031S18.677 0 12.031 0zm0 21.986c-1.8 0-3.565-.483-5.116-1.4l-.367-.217-3.619.948.966-3.528-.239-.381A9.974 9.974 0 0 1 2.045 12.03c0-5.513 4.488-10.001 10.001-10.001 5.513 0 10.001 4.488 10.001 10.001 0 5.513-4.488 10.001-10.001 10.001zm5.492-7.502c-.302-.151-1.782-.879-2.059-.979-.277-.101-.479-.151-.68.151-.202.302-.779.979-.955 1.18-.176.201-.352.227-.654.076-2.106-.926-3.488-2.121-4.321-4.045-.075-.151-.002-.278.075-.378.076-.1.202-.226.302-.377.101-.151.126-.252.202-.428.076-.176.025-.327-.051-.478-.076-.151-.68-1.637-.932-2.241-.244-.591-.493-.51-.68-.521h-.579c-.202 0-.528.076-.805.378-.277.302-1.057 1.032-1.057 2.518 0 1.486 1.082 2.921 1.233 3.123.151.201 2.127 3.245 5.157 4.555.72.311 1.282.497 1.721.636.723.23 1.381.197 1.9.119.58-.088 1.782-.729 2.034-1.433.252-.704.252-1.308.176-1.433-.075-.126-.277-.202-.579-.353z"/>
    </svg>
  `;

  waBtn.onmouseover = () => {
    waBtn.style.transform = 'scale(1.1)';
    waBtn.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.6)';
  };
  waBtn.onmouseout = () => {
    waBtn.style.transform = 'scale(1)';
    waBtn.style.boxShadow = '0 4px 15px rgba(37, 211, 102, 0.4)';
  };

  document.body.appendChild(waBtn);
  
  // Inject "Shipping Partner: Delhivery" into footer
  const footer = document.querySelector('footer');
  if (footer) {
    const shippingBadge = document.createElement('div');
    shippingBadge.style.cssText = 'text-align: center; margin-top: 2rem; display: flex; justify-content: center; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: var(--text-light); font-weight: 500;';
    shippingBadge.innerHTML = `
      <svg viewBox="0 0 24 24" style="width: 18px; height: 18px; fill: none; stroke: var(--secondary); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
      <span>Shipping Partner: <strong style="color: var(--primary-dark); font-family: 'Playfair Display', serif; font-size: 1rem; letter-spacing: 0.5px;">Delhivery</strong></span>
    `;
    const copyrightDiv = Array.from(footer.children).find(el => el.innerHTML && el.innerHTML.includes('&copy;'));
    if (copyrightDiv) {
      footer.insertBefore(shippingBadge, copyrightDiv);
      copyrightDiv.style.marginTop = '1rem'; 
    } else {
      footer.appendChild(shippingBadge);
    }
  }
});
