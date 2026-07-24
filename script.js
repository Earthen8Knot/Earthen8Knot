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
      font-family: 'Inter', sans-serif;
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
      font-family: 'Inter', sans-serif;
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
    <svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:none;stroke:#A3B18A;stroke-width:2.5;">
      <polyline points="20 6 9 17 4 12"></polyline>
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

  // ===== Responsive Mobile Navigation Toggle =====
  const navbar = document.getElementById('main-nav') || document.querySelector('.navbar');
  const navLinks = document.querySelector('.nav-links');
  const navActions = document.querySelector('.nav-actions');

  if (navbar && navLinks && navActions && !document.querySelector('.mobile-menu-btn')) {
    const menuBtn = document.createElement('button');
    menuBtn.className = 'mobile-menu-btn';
    menuBtn.setAttribute('aria-label', 'Toggle Navigation Menu');
    menuBtn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    `;
    navActions.appendChild(menuBtn);

    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navLinks.classList.toggle('open');
      menuBtn.innerHTML = isOpen ? `
        <svg viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      ` : `
        <svg viewBox="0 0 24 24">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      `;
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-links') && !e.target.closest('.mobile-menu-btn')) {
        navLinks.classList.remove('open');
        menuBtn.innerHTML = `
          <svg viewBox="0 0 24 24">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        `;
      }
    });

  }
  
  // Dropdown Menu Click Toggle (Handles both Desktop & Mobile)
  const dropBtns = document.querySelectorAll('.dropbtn');
  dropBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
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
    });
  });

  // Close dropdown if clicking outside
  window.addEventListener('click', (e) => {
    if (!e.target.matches('.dropbtn')) {
      const dropdowns = document.querySelectorAll('.dropdown-content');
      dropdowns.forEach(content => {
        if (content.classList.contains('show')) {
          content.classList.remove('show');
        }
      });
    }
  });

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
});

// Product Stories Data
const productsData = {
  'ivory-lace-crochet-pillow': {
    name: 'Ivory Lace Crochet Pillow Cover',
    price: '₹1,299.00',
    originalPrice: '₹1,899.00',
    image: 'assets/pillow-1.jpg',
    images: ['assets/pillow-1.jpg', 'assets/pillow-2.jpg', 'assets/pillow-3.jpg'],
    story: "Handcrafted with intricate vintage lace motifs in natural ivory cotton yarn, this artisan crochet cushion cover brings timeless texture and warmth to your living sanctuary. Each pillow cover features exquisite shell stitches, dimensional floral clusters, and delicate openwork lacework inspired by heirloom crochet artistry. Soft to the touch yet beautifully structured with a crisp cotton lining, it adds instant cozy elegance to any sofa, armchair, or bedroom retreat."
  },
  'macrame-weave-crochet-pillow': {
    name: 'Macramé Weave Crochet Pillow Cover',
    price: '₹1,299.00',
    originalPrice: '₹1,899.00',
    image: 'assets/pillow-crochet-1.jpg',
    images: ['assets/pillow-crochet-1.jpg', 'assets/pillow-crochet-2.jpg'],
    story: "A stunning handcrafted pillow cover woven in a delicate open-grid macramé pattern using soft natural ivory cotton yarn. Each knot is tied by hand, creating a beautifully textured lattice that lets light filter through the weave. The subtle cream tones and organic cotton feel make it a versatile piece that complements any bohemian, minimal, or nature-inspired interior. A cozy, artisan touch for your sofa, bed, or reading nook."
  },
  'striped-crochet-sweatshirt': {
    name: 'Ocean Blue Striped Crochet Sweatshirt',
    price: '₹1,299.00',
    originalPrice: '₹1,899.00',
    image: 'assets/sweatshirt-1.jpg',
    images: ['assets/sweatshirt-1.jpg', 'assets/sweatshirt-2.jpg'],
    story: "Handcrafted with soft ocean blue and cream cotton yarn, this striped crochet sweatshirt blends relaxed coastal charm with heirloom craftsmanship. Designed with an effortless drop-shoulder silhouette and airy open-weave stitches, it is perfect for layering year-round. Featuring ribbed trim and artisanal stitching throughout, each sweatshirt is woven with meticulous attention to detail."
  },
  'lavender-fringe-crochet-scarf': {
    name: 'Lavender Fringe Crochet Scarf',
    price: '₹1,299.00',
    originalPrice: '₹1,899.00',
    image: 'assets/lavender-fringe-crochet-scarf.jpg',
    soldOut: true,
    story: "Handcrafted with a wonderfully soft acrylic and wool blend yarn in beautiful gradient lavender and violet hues. This scarf features an intricate openwork chevron-lace stitch pattern that provides both warmth and a lightweight, flowing drape. Finished with a lush, hand-knotted fringe at both ends, it brings a pop of artisanal charm and cozy color to any chilly day outfit."
  },
  'midnight-mesh-crochet-top': {
    name: 'Midnight Mesh Crochet Top',
    price: '₹1,299.00',
    originalPrice: '₹1,899.00',
    image: 'assets/black-crochet-top-1.jpg',
    images: ['assets/black-crochet-top-1.jpg', 'assets/black-crochet-top-2.jpg'],
    soldOut: true,
    story: "A beautifully detailed sleeveless crochet crop top handcrafted in deep midnight black cotton yarn. Featuring an open-mesh grid pattern across the upper chest and shoulders, transitioning into a dense, beautifully textured solid stitch bodice. Designed with a clean-cut scoop neck and a subtle open-knit border at the hem, this lightweight knit brings an effortless, sophisticated artisanal touch to any warm-weather style."
  },
  'blossom-striped-crochet-sweater': {
    name: 'Blossom Striped Crochet Sweater',
    price: '₹1,299.00',
    originalPrice: '₹1,899.00',
    image: 'assets/pink-striped-sweater-1.jpg',
    images: ['assets/pink-striped-sweater-1.jpg', 'assets/pink-striped-sweater-2.jpg'],
    soldOut: true,
    story: "A cozy and charming long-sleeve striped pullover handcrafted in soft bubblegum pink and ivory white premium cotton yarn. Woven in a beautiful openwork trellis crochet stitch that balances warmth with breathability, this sweater features a relaxed boat neckline, drop shoulders, and elegant solid ribbed borders at the cuffs and hem. Its cheerful colors and intricate stitchwork make it a standout artisan piece for any modern knitwear collection."
  },
  'sweetheart-crochet-pouch': {
    name: 'Sweetheart Crochet Pouch',
    price: '₹899.00',
    image: 'assets/heart-pouch.jpg',
    soldOut: true,
    story: "A charming, handcrafted heart-pattern pouch woven with soft premium cotton yarn. Features a contrast lavender heart motif on a warm cream background, complete with a secure wood button closure at the top. Perfect as an artisan coin purse, makeup pouch, or style accessory."
  },
  'gray-cream-beanie': {
    name: 'Dual-Tone Ribbed Beanie',
    price: '₹899.00',
    image: 'assets/gray-cream-beanie.jpg',
    soldOut: true,
    story: "A cozy, double-knit ribbed beanie handcrafted with premium acrylic wool blend. Features a modern split color scheme with a heather-gray crown and a wide, folded cream brim. Elastic fit ensures warmth and comfort for chilly weather."
  },
  'gray-ribbed-beanie': {
    name: 'Artisan Ribbed Knit Beanie',
    price: '₹899.00',
    image: 'assets/gray-ribbed-beanie.jpg',
    soldOut: true,
    story: "A classic ribbed-stitch beanie crocheted in a beautiful slate gray color. Handcrafted with thick, insulating acrylic-wool yarn, it features a thick folded brim and high elasticity for a comfortable, everyday fit."
  },
  'ivory-beanie': {
    name: 'Ivory Ribbed Knit Beanie',
    price: '₹899.00',
    image: 'assets/ivory-beanie.jpg',
    soldOut: true,
    story: "A classic ribbed beanie handcrafted in a warm ivory-cream cotton yarn. Featuring a comfortable folded brim and a stretchy ribbed knit pattern, this beanie is perfect for everyday winter styling and outdoor coziness."
  },
  'scrunchies-set': {
    name: 'Artisan Crochet Scrunchies Set',
    price: '₹899.00',
    image: 'assets/scrunchies-set.jpg',
    soldOut: true,
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
        <div class="product-header">
          <h1 style="font-size: 2.2rem; color: var(--text); font-family: 'Outfit', sans-serif; font-weight: 500; margin: 0;">${product.name}</h1>
          <button id="zoom-toggle-btn" style="padding: 0.5rem 1rem; font-size: 0.9rem; border-radius: 8px; border: 1px solid var(--secondary); background: transparent; color: var(--secondary); cursor: pointer; transition: all 0.3s; box-shadow: var(--shadow-sm);">🔍 Enable Zoom</button>
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
        <h2 style="font-size: 2rem; margin-bottom: 2rem; color: var(--primary-dark); font-family: 'Outfit', sans-serif; font-weight: 600;">The Story Behind It</h2>
        <div class="story-text" style="text-align: left; font-size: 1.2rem;">${product.story}</div>
        
        ${product.videoUrl ? `
        <h2 style="font-size: 2rem; margin: 4rem 0 2rem 0; color: var(--primary-dark); font-family: 'Outfit', sans-serif; font-weight: 600;">The Making Of</h2>
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
