/**
 * EarthenKnot Global Script
 */

// Initialize Cart from LocalStorage or SessionStorage
function getCartItems() {
  try {
    const saved = localStorage.getItem('earthenknot_cart');
    if (saved) return JSON.parse(saved);
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
  if (lower.includes('pillow') || lower.includes('cushion') || lower.includes('ivory')) {
    return 'product.html?id=ivory-lace-crochet-pillow';
  }
  if (lower.includes('sweatshirt') || lower.includes('striped') || lower.includes('ocean')) {
    return 'product.html?id=striped-crochet-sweatshirt';
  }
  return 'collections.html';
}

function addToCart(name, price, img, url) {
  cartItems = getCartItems();
  let itemName = typeof name === 'string' && name ? name : null;
  let itemPrice = typeof price === 'number' ? price : null;
  let itemImg = typeof img === 'string' && img ? img : null;
  let itemUrl = typeof url === 'string' && url ? url : null;

  // Auto-detect from surrounding card if clicked inside a product card
  if (window.event && window.event.target) {
    const card = window.event.target.closest('.product-card');
    if (card) {
      if (!itemName) itemName = card.querySelector('h3')?.textContent?.trim();
      if (!itemPrice) {
        const priceEl = card.querySelector('.discount-price') || card.querySelector('p');
        const priceTxt = priceEl?.textContent?.trim();
        if (priceTxt) itemPrice = Number(priceTxt.replace(/[^0-9.]/g, ''));
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
      if (!itemPrice) itemPrice = Number(String(productsData[pid].price).replace(/[^0-9.]/g, '')) || 3200;
      if (!itemImg) itemImg = productsData[pid].image;
      if (!itemUrl) itemUrl = `product.html?id=${pid}`;
    }
  }

  itemName = itemName || 'Handcrafted Earth Crochet Creation';
  itemPrice = itemPrice || 2499;
  itemImg = itemImg || 'assets/hero-bag.jpg';
  itemUrl = resolveProductUrl(itemName, itemUrl);

  const existing = cartItems.find(item => item.name === itemName);
  if (existing) {
    showCartWarningToast(`Since each piece is hand-stitched one-by-one, you can only order 1 of this item! 🤎`);
    return;
  } else {
    cartItems.push({
      id: 'ek-' + Date.now().toString(36),
      name: itemName,
      price: itemPrice,
      qty: 1,
      img: itemImg,
      url: itemUrl
    });
  }

  saveCartItems(cartItems);
  animateCartBadge();
  showCartToast(itemName);
}

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
        <strong style="display:block;font-size:0.88rem;color:var(--secondary);">Slow-Made Limit 🤎</strong>
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
          <span>Earthen Knot</span>
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
        <a href="wishlist.html" class="mobile-drawer-link">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          <span>Wishlist</span>
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

  // ===== Global Search =====
  const searchBtn = document.getElementById('global-search-btn');
  const searchInput = document.getElementById('global-search-input');
  const searchResults = document.getElementById('search-results-dropdown');

  if (searchBtn && searchInput && searchResults) {
    // Toggle expand on icon click
    searchBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      searchInput.classList.toggle('active');
      if (searchInput.classList.contains('active')) {
        searchInput.focus();
      } else {
        searchInput.value = '';
        searchResults.classList.remove('active');
        searchResults.innerHTML = '';
      }
    });

    // Live search as user types
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();
      if (query.length < 2) {
        searchResults.classList.remove('active');
        searchResults.innerHTML = '';
        return;
      }

      const matches = [];
      for (const [id, product] of Object.entries(productsData)) {
        if (product.name.toLowerCase().includes(query)) {
          matches.push({ id, ...product });
        }
      }

      if (matches.length > 0) {
        searchResults.innerHTML = matches.map(p => {
          const filterStyle = p.filter ? `filter: ${p.filter};` : '';
          return `<a href="product.html?id=${p.id}" class="search-result-item">
            <img src="${p.image}" alt="${p.name}" style="${filterStyle}">
            <div class="search-result-info">
              <span class="result-name">${p.name}</span>
              <span class="result-price">${p.price}</span>
            </div>
          </a>`;
        }).join('');
        searchResults.classList.add('active');
      } else {
        searchResults.innerHTML = '<div class="search-no-results">No products found</div>';
        searchResults.classList.add('active');
      }
    });

    // Close search when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.global-search-container')) {
        searchInput.classList.remove('active');
        searchInput.value = '';
        searchResults.classList.remove('active');
        searchResults.innerHTML = '';
      }
    });

    // Prevent clicks inside search from closing it
    searchInput.addEventListener('click', (e) => e.stopPropagation());
    searchResults.addEventListener('click', (e) => e.stopPropagation());
  }

  // Initialize Product Reactions
  initProductReactions();
});

// Product Stories Data
const productsData = {
  'ivory-lace-crochet-pillow': {
    name: 'Leafy Pattern Pillow Cover',
    price: '₹3,999.00',
    originalPrice: '',
    image: 'assets/pillow-1.jpg',
    images: ['assets/pillow-1.jpg', 'assets/pillow-2.jpg', 'assets/pillow-3.jpg'],
    stitchCount: '14,200 hand loops',
    stitchTime: '12 hours of craft',
    hookSize: '4.5mm bamboo hook',
    fiberType: '100% Organic Cotton',
    story: "Handcrafted with intricate vintage lace motifs in natural ivory cotton yarn, this artisan crochet cushion cover brings timeless texture and warmth to your living sanctuary. Each pillow cover features exquisite shell stitches, dimensional floral clusters, and delicate openwork lacework inspired by heirloom crochet artistry. Soft to the touch yet beautifully structured with a crisp cotton lining, it adds instant cozy elegance to any sofa, armchair, or bedroom retreat."
  },
  'macrame-weave-crochet-pillow': {
    name: 'Square Pattern Pillow Cover',
    price: '₹2,999.00',
    originalPrice: '',
    image: 'assets/pillow-crochet-1.jpg',
    images: ['assets/pillow-crochet-1.jpg', 'assets/pillow-crochet-2.jpg'],
    stitchCount: '8,900 hand loops',
    stitchTime: '8 hours of craft',
    hookSize: '5.0mm wooden hook',
    fiberType: '100% Natural Cotton Cord',
    story: "A stunning handcrafted pillow cover woven in a delicate open-grid macramé pattern using soft natural ivory cotton yarn. Each knot is tied by hand, creating a beautifully textured lattice that lets light filter through the weave. The subtle cream tones and organic cotton feel make it a versatile piece that complements any bohemian, minimal, or nature-inspired interior. A cozy, artisan touch for your sofa, bed, or reading nook."
  },
  'striped-crochet-sweatshirt': {
    name: 'White-Blue Striped Sweatshirt',
    price: '₹2,999.00',
    originalPrice: '',
    image: 'assets/sweatshirt-1.jpg',
    images: ['assets/sweatshirt-1.jpg', 'assets/sweatshirt-2.jpg'],
    stitchCount: '34,500 hand loops',
    stitchTime: '15 Hours',
    hookSize: '4.0mm bamboo hook',
    fiberType: '8 ply cotton yarn, 3 mm thick',
    story: "Handcrafted with soft ocean blue and cream cotton yarn, this striped crochet sweatshirt blends relaxed coastal charm with heirloom craftsmanship. Designed with an effortless drop-shoulder silhouette and airy open-weave stitches, it is perfect for layering year-round. Featuring ribbed trim and artisanal stitching throughout, each sweatshirt is woven with meticulous attention to detail."
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
    story: "Handcrafted with a wonderfully soft acrylic and wool blend yarn in beautiful gradient lavender and violet hues. This scarf features an intricate openwork chevron-lace stitch pattern that provides both warmth and a lightweight, flowing drape. Finished with a lush, hand-knotted fringe at both ends, it brings a pop of artisanal charm and cozy color to any chilly day outfit."
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
    story: "A beautifully detailed sleeveless crochet crop top handcrafted in deep midnight black cotton yarn. Featuring an open-mesh grid pattern across the upper chest and shoulders, transitioning into a dense, beautifully textured solid stitch bodice. Designed with a clean-cut scoop neck and a subtle open-knit border at the hem, this lightweight knit brings an effortless, sophisticated artisanal touch to any warm-weather style."
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
    story: "A cozy and charming long-sleeve striped pullover handcrafted in soft bubblegum pink and ivory white premium cotton yarn. Woven in a beautiful openwork trellis crochet stitch that balances warmth with breathability, this sweater features a relaxed boat neckline, drop shoulders, and elegant solid ribbed borders at the cuffs and hem. Its cheerful colors and intricate stitchwork make it a standout artisan piece for any modern knitwear collection."
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
    story: "A charming, handcrafted heart-pattern pouch woven with soft premium cotton yarn. Features a contrast lavender heart motif on a warm cream background, complete with a secure wood button closure at the top. Perfect as an artisan coin purse, makeup pouch, or style accessory."
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
    story: "A cozy, double-knit ribbed beanie handcrafted with premium acrylic wool blend. Features a modern split color scheme with a heather-gray crown and a wide, folded cream brim. Elastic fit ensures warmth and comfort for chilly weather."
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
    story: "A classic ribbed-stitch beanie crocheted in a beautiful slate gray color. Handcrafted with thick, insulating acrylic-wool yarn, it features a thick folded brim and high elasticity for a comfortable, everyday fit."
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
    story: "A classic ribbed beanie handcrafted in a warm ivory-cream cotton yarn. Featuring a comfortable folded brim and a stretchy ribbed knit pattern, this beanie is perfect for everyday winter styling and outdoor coziness."
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
    story: "A beautiful set of three handmade crochet scrunchies, including two cream and one dusty rose/mauve scrunchie. Soft, gentle on hair, and handcrafted using premium organic cotton yarn."
  }
};

function renderProductPage() {
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
          <h1 style="font-size: 2.2rem; color: var(--text); font-family: 'Quicksand', sans-serif; font-weight: 500; margin: 0;">${product.name}</h1>
          <div style="display:flex; gap:0.5rem; align-items:center;">
            <button id="product-reaction-btn" class="reaction-btn-detail" data-id="${productId}" style="padding: 0.5rem 1.1rem; font-size: 0.9rem; border-radius: 8px; border: 1px solid rgba(0,0,0,0.08); background: var(--surface); cursor: pointer; transition: all 0.3s; box-shadow: var(--shadow-sm); display:flex; align-items:center; gap:6px; font-family:'Quicksand',sans-serif; font-weight:600;"></button>
            <button id="zoom-toggle-btn" style="padding: 0.5rem 1rem; font-size: 0.9rem; border-radius: 8px; border: 1px solid var(--secondary); background: transparent; color: var(--secondary); cursor: pointer; transition: all 0.3s; box-shadow: var(--shadow-sm);">🔍 Enable Zoom</button>
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
            <p style="font-size: 1.8rem; color: var(--primary); font-weight: 700; margin: 0;">${product.price}</p>
            ${product.originalPrice ? `<span style="background: rgba(163, 177, 138, 0.25); color: var(--primary-dark); font-size: 0.85rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: 6px; border: 1px solid rgba(163, 177, 138, 0.4);">Save ₹600</span>` : ''}
            ${product.soldOut ? `<span class="sold-out-badge" style="font-size: 0.8rem; padding: 0.25rem 0.75rem;">Sold Out</span>` : ''}
          </div>
          ${product.soldOut ? `
            <button class="btn btn-secondary" style="padding: 1rem 3rem; font-size: 1.1rem; border-radius: 30px; white-space: nowrap; cursor: pointer; transition: all 0.3s;" onclick="addToCart()">Request a Remake</button>
          ` : `
            <button class="btn btn-primary" style="padding: 1rem 3rem; font-size: 1.1rem; border-radius: 30px; box-shadow: 0 4px 10px rgba(108, 120, 92, 0.2); white-space: nowrap;" onclick="addToCart()">Add to Cart</button>
          `}
        </div>
        ${product.soldOut ? `
        <div class="collection-note" style="margin-top: 2rem; margin-bottom: 0;">
          <span class="collection-note-title">Note!</span> Loved something that’s sold out? Just <a href="contact.html" style="text-decoration: underline; color: inherit; font-weight: 500; transition: color 0.3s ease;" onmouseover="this.style.color='var(--secondary)'" onmouseout="this.style.color='inherit'">drop us a message</a> and let us know — you can always request a reorder
        </div>
        ` : ''}
      </div>

      <div class="product-bio-wrapper" style="max-width: 800px; margin: 0 auto; padding: 3rem 0; border-top: 1px solid rgba(0,0,0,0.05); text-align: center;">
        <h2 style="font-size: 2rem; margin-bottom: 2rem; color: var(--primary-dark); font-family: 'Quicksand', sans-serif; font-weight: 600;">The Story Behind It</h2>
        <div class="story-text" style="text-align: left; font-size: 1.2rem; line-height: 1.7; color: var(--text-light);">${product.story}</div>
        
        <!-- Artisan Craftsmanship Details -->
        <div style="background: var(--bg-secondary); border-radius: 16px; padding: 2.5rem; margin-top: 3.5rem; text-align: left; box-shadow: var(--shadow-sm); border: 1px solid rgba(0,0,0,0.03);">
          <h3 style="font-size: 1.35rem; color: var(--primary-dark); font-family: 'Quicksand', sans-serif; font-weight: 600; margin-top: 0; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.65rem;">
            <svg viewBox="0 0 24 24" style="width: 24px; height: 24px; stroke: currentColor; fill: none; stroke-width: 2;" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 0 0-7.3 16.8M12 22a10 10 0 0 0 7.3-16.8"/><path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4z"/></svg>
            Artisan Craftsmanship Details
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1.5rem;">
            <div>
              <span style="display: block; font-size: 0.8rem; color: var(--text-light); font-weight: 500; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 0.25rem;">Stitching Labor</span>
              <strong style="font-size: 1.1rem; color: var(--text); font-family: 'Quicksand', sans-serif; font-weight: 600;">${product.stitchTime || '10 hours'}</strong>
            </div>
            <div>
              <span style="display: block; font-size: 0.8rem; color: var(--text-light); font-weight: 500; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 0.25rem;">Hook Utilized</span>
              <strong style="font-size: 1.1rem; color: var(--text); font-family: 'Quicksand', sans-serif; font-weight: 600;">${product.hookSize || '4.5mm hook'}</strong>
            </div>
            <div>
              <span style="display: block; font-size: 0.8rem; color: var(--text-light); font-weight: 500; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 0.25rem;">Yarn Info</span>
              <strong style="font-size: 1.1rem; color: var(--text); font-family: 'Quicksand', sans-serif; font-weight: 600;">${product.fiberType || '100% Organic Cotton'}</strong>
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
    document.title = `${product.name} - Earthen8Knot`;

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

// Initialize and handle Favorite/Wishlist System
function initWishlistSystem() {
  let wishlist = [];
  
  // Load initial local guest wishlist
  try {
    const saved = localStorage.getItem('earthenknot_favorites');
    if (saved) wishlist = JSON.parse(saved);
  } catch (e) {
    wishlist = [];
  }

  // Helper to trigger floating emoji particles (tactile micro-interaction)
  function triggerHeartBurst(x, y) {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = `${x}px`;
    container.style.top = `${y}px`;
    container.style.pointerEvents = 'none';
    container.style.zIndex = '99999';
    document.body.appendChild(container);

    const emojis = ['❤️', '💖', '✨'];
    for (let i = 0; i < 4; i++) {
      const p = document.createElement('span');
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      p.style.position = 'absolute';
      p.style.fontSize = `${14 + Math.random() * 8}px`;
      p.style.transition = 'all 0.8s ease-out';
      p.style.transform = 'translate(-50%, -50%)';
      container.appendChild(p);

      const angle = (Math.random() * Math.PI * 1.5) - Math.PI * 0.75;
      const dist = 30 + Math.random() * 40;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist - 30;

      setTimeout(() => {
        p.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0.2)`;
        p.style.opacity = '0';
      }, 20);
    }
    setTimeout(() => container.remove(), 1000);
  }

  // Toast feedback helper
  function showFeedbackToast(msg, isError = false) {
    let toast = document.getElementById('wishlist-feedback-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'wishlist-feedback-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 25px;
        left: 25px;
        padding: 12px 20px;
        border-radius: 12px;
        color: #fff;
        font-family: 'Quicksand', sans-serif;
        font-size: 0.9rem;
        font-weight: 600;
        z-index: 10001;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: var(--shadow-md);
        transition: all 0.35s ease;
        transform: translateY(100px);
        opacity: 0;
      `;
      document.body.appendChild(toast);
    }
    toast.style.background = isError ? '#ef4444' : 'var(--secondary)';
    toast.innerHTML = isError ? `⚠️ ${msg}` : `❤️ ${msg}`;
    
    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    }, 10);

    clearTimeout(window._wishlistToastTimer);
    window._wishlistToastTimer = setTimeout(() => {
      toast.style.transform = 'translateY(100px)';
      toast.style.opacity = '0';
    }, 2800);
  }

  // Toggle favorite trigger
  window.toggleFavorite = async function(productId, e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const index = wishlist.indexOf(productId);
    const hasFav = index !== -1;
    const targets = document.querySelectorAll(`[data-fav-id="${productId}"]`);

    // Set buttons to loading status locally
    targets.forEach(el => el.classList.add('loading'));

    if (hasFav) {
      wishlist.splice(index, 1);
    } else {
      wishlist.push(productId);
      if (e) triggerHeartBurst(e.clientX, e.clientY);
    }

    // Save to LocalStorage
    localStorage.setItem('earthenknot_favorites', JSON.stringify(wishlist));

    // Firebase Firestore Sync
    const auth = window.firebaseAuth;
    const db = window.firebaseDb;
    const user = auth ? auth.currentUser : null;

    if (user && db) {
      try {
        const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js");
        const docRef = doc(db, "users", user.uid);
        await setDoc(docRef, { favorites: wishlist }, { merge: true });
        showFeedbackToast(hasFav ? "Removed from your account" : "Saved to your account");
      } catch (err) {
        console.error("Firestore sync failed:", err);
        showFeedbackToast("Failed to sync with account. Saving locally.", true);
        // Revert local state
        if (hasFav) {
          wishlist.push(productId);
        } else {
          const revertIdx = wishlist.indexOf(productId);
          if (revertIdx !== -1) wishlist.splice(revertIdx, 1);
        }
        localStorage.setItem('earthenknot_favorites', JSON.stringify(wishlist));
      }
    } else {
      showFeedbackToast(hasFav ? "Removed from wishlist" : "Saved to wishlist");
    }

    // Remove loading indicators and refresh active classes
    targets.forEach(el => el.classList.remove('loading'));
    syncAllHeartButtons();

    // If we are on the wishlist page, re-render it dynamically!
    if (typeof renderWishlistPage === 'function') {
      renderWishlistPage();
    }
  };

  function syncAllHeartButtons() {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
      const link = card.querySelector('a[href*="product.html?id="]');
      if (!link) return;

      let productId = '';
      try {
        const url = new URL(link.href, window.location.href);
        productId = url.searchParams.get('id');
      } catch (err) {
        const match = link.href.match(/id=([^&]+)/);
        if (match) productId = match[1];
      }

      if (!productId) return;

      let btn = card.querySelector('.wishlist-btn');
      if (!btn) {
        btn = document.createElement('button');
        btn.className = 'wishlist-btn';
        btn.setAttribute('tabindex', '0');
        btn.onclick = (e) => toggleFavorite(productId, e);
        
        const titleEl = card.querySelector('h3');
        const productName = titleEl ? titleEl.textContent : 'Product';
        btn.setAttribute('data-fav-id', productId);
        btn.setAttribute('data-product-name', productName);
        
        btn.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        `;
        card.appendChild(btn);
      }

      const isFav = wishlist.includes(productId);
      const productName = btn.getAttribute('data-product-name') || 'product';
      btn.setAttribute('aria-label', isFav ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`);
      
      if (isFav) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const detailBtn = document.getElementById('product-reaction-btn');
    if (detailBtn) {
      const productId = detailBtn.getAttribute('data-id');
      if (productId) {
        const isFav = wishlist.includes(productId);
        detailBtn.setAttribute('data-fav-id', productId);
        detailBtn.innerHTML = `
          <svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:${isFav ? 'currentColor' : 'none'};stroke-width:2.2;transition:all 0.3s;vertical-align:middle;margin-right:4px;">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span>${isFav ? 'Wishlisted' : 'Add to Wishlist'}</span>
        `;
        detailBtn.onclick = (e) => toggleFavorite(productId, e);
        detailBtn.style.borderColor = isFav ? 'rgba(224, 90, 71, 0.25)' : 'rgba(0,0,0,0.08)';
        detailBtn.style.background = isFav ? '#fff5f5' : 'var(--surface)';
        detailBtn.style.color = isFav ? '#e05a47' : 'var(--text)';
      }
    }
  }

  window.addEventListener('auth-state-changed', async (e) => {
    const user = e.detail.user;
    const db = window.firebaseDb;

    if (user && db) {
      try {
        const { doc, getDoc, setDoc } = await import("https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js");
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        let cloudFavs = [];
        if (docSnap.exists() && docSnap.data().favorites) {
          cloudFavs = docSnap.data().favorites;
        }

        const mergedFavs = Array.from(new Set([...cloudFavs, ...wishlist]));
        wishlist = mergedFavs;

        localStorage.setItem('earthenknot_favorites', JSON.stringify(wishlist));
        await setDoc(docRef, { favorites: wishlist }, { merge: true });
      } catch (err) {
        console.error("Failed to load user favorites from Firestore:", err);
      }
    } else {
      try {
        const saved = localStorage.getItem('earthenknot_favorites');
        wishlist = saved ? JSON.parse(saved) : [];
      } catch (err) {
        wishlist = [];
      }
    }
    syncAllHeartButtons();
  });

  syncAllHeartButtons();

  const observer = new MutationObserver(() => {
    syncAllHeartButtons();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// ----------------------------------------------------
// FLOATING WHATSAPP BUTTON (Applies globally to all pages)
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const waBtn = document.createElement('a');
  waBtn.href = "https://wa.me/917517592373?text=Hi EarthenKnot, I need help with my order!";
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
