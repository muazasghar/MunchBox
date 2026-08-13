const Cart = {
  STORAGE_KEY: 'munchbox_cart',
  DELIVERY_FEE: 2.99,

  getItems() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  },

  saveItems(items) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    this.updateCartBadge();
  },

  addLineItem(lineItem, quantity = 1) {
    const items = this.getItems();
    const existing = items.find((i) => i.id === lineItem.id);

    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ ...lineItem, quantity });
    }

    this.saveItems(items);
    return items;
  },

  addItem(menuItem, quantity = 1, variation = null) {
    const lineItem = buildCartLineItem(menuItem, variation, quantity);
    const items = this.getItems();
    const existing = items.find((i) => i.id === lineItem.id);

    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push(lineItem);
    }

    this.saveItems(items);
    return items;
  },

  removeItem(id) {
    const items = this.getItems().filter((i) => i.id !== id);
    this.saveItems(items);
    return items;
  },

  updateQuantity(id, quantity) {
    const items = this.getItems();
    const item = items.find((i) => i.id === id);

    if (item) {
      if (quantity <= 0) {
        return this.removeItem(id);
      }
      item.quantity = quantity;
      this.saveItems(items);
    }

    return items;
  },

  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.updateCartBadge();
  },

  getItemCount() {
    return this.getItems().reduce((sum, item) => sum + item.quantity, 0);
  },

  getSubtotal() {
    return this.getItems().reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getDeliveryFee(orderType) {
    return orderType === 'delivery' ? this.DELIVERY_FEE : 0;
  },

  getTotal(orderType) {
    return this.getSubtotal() + this.getDeliveryFee(orderType);
  },

  updateCartBadge() {
    const badge = document.querySelector('.navbar__cart-count');
    if (!badge) return;

    const count = this.getItemCount();
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
  },

  formatPrice(amount) {
    return `$${amount.toFixed(2)}`;
  },
};

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), 2500);
}

function initNavbar() {
  const toggle = document.querySelector('.navbar__menu-toggle');
  const mobileNav = document.querySelector('.navbar__mobile-nav');

  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
    });

    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => mobileNav.classList.remove('open'));
    });
  }

  Cart.updateCartBadge();

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar__nav a, .navbar__mobile-nav a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

function validatePhone(phone) {
  return /^[\d\s\-+()]{7,20}$/.test(phone.trim());
}

const FOOD_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop';

function handleFoodImageError(event) {
  const img = event.target;
  if (img.dataset.fallbackApplied === 'true') return;
  img.dataset.fallbackApplied = 'true';
  img.src = FOOD_IMAGE_FALLBACK;
}

function roundPrice(amount) {
  return Math.round(amount * 100) / 100;
}

function isPizzaItem(item) {
  return item.category === 'Pizza' || item.customizable === true;
}

const PIZZA_CRUST_OPTIONS = [
  { id: 'regular', name: 'Regular', price: 0 },
  { id: 'thin', name: 'Thin Crust', price: 0 },
  { id: 'stuffed', name: 'Stuffed Crust', price: 2.0 },
];

const PIZZA_VEGETABLE_TOPPINGS = [
  { id: 'mushrooms', name: 'Mushrooms', price: 0 },
  { id: 'onions', name: 'Onions', price: 0 },
  { id: 'bell-peppers', name: 'Bell Peppers', price: 0 },
  { id: 'olives', name: 'Olives', price: 0 },
  { id: 'tomatoes', name: 'Tomatoes', price: 0 },
  { id: 'jalapenos', name: 'Jalapeños', price: 0 },
  { id: 'spinach', name: 'Spinach', price: 0 },
  { id: 'corn', name: 'Sweet Corn', price: 0 },
];

const PIZZA_EXTRA_TOPPINGS = [
  { id: 'chicken', name: 'Chicken', price: 1.99 },
  { id: 'meat', name: 'Meat', price: 2.49 },
  { id: 'pepperoni', name: 'Pepperoni', price: 1.79 },
  { id: 'cheese', name: 'Cheese', price: 1.49 },
];

function buildPizzaSizes(basePrice) {
  return [
    { id: 'small', name: 'Small', price: roundPrice(basePrice * 0.78) },
    { id: 'medium', name: 'Medium', price: roundPrice(basePrice) },
    { id: 'large', name: 'Large', price: roundPrice(basePrice * 1.28) },
    { id: 'xl', name: 'XL', price: roundPrice(basePrice * 1.48) },
  ];
}

function calculatePizzaPrice(size, crust, vegetables, extraToppings = []) {
  const extraTotal = extraToppings.reduce((sum, topping) => sum + topping.price, 0);
  return roundPrice(size.price + crust.price + extraTotal);
}

function buildCartLineItem(menuItem, variation, quantity) {
  if (variation) {
    return {
      id: `${menuItem.id}-${variation.id}`,
      name: `${menuItem.name} (${variation.name})`,
      price: variation.price,
      image: menuItem.image,
      quantity,
    };
  }

  return {
    id: menuItem.id,
    name: menuItem.name,
    price: menuItem.price,
    image: menuItem.image,
    quantity,
  };
}

function buildPizzaCartLineItem(menuItem, config) {
  const { size, crust, vegetables, extraToppings } = config;
  const price = calculatePizzaPrice(size, crust, vegetables, extraToppings);
  const vegIds = vegetables
    .map((t) => t.id)
    .sort()
    .join(',');
  const extraIds = extraToppings
    .map((t) => t.id)
    .sort()
    .join(',');
  const id = `${menuItem.id}-${size.id}-${crust.id}-${vegIds || 'no-veg'}-${extraIds || 'no-extra'}`;

  const detailParts = [`${size.name} size`, `${crust.name} crust`];
  if (vegetables.length) {
    detailParts.push(`Veggies: ${vegetables.map((t) => t.name).join(', ')}`);
  }
  if (extraToppings.length) {
    detailParts.push(`Extra: ${extraToppings.map((t) => t.name).join(', ')}`);
  }

  return {
    id,
    name: menuItem.name,
    detail: detailParts.join(' · '),
    price,
    image: menuItem.image,
    customization: {
      size: size.name,
      crust: crust.name,
      vegetables: vegetables.map((t) => t.name),
      extraToppings: extraToppings.map((t) => t.name),
    },
  };
}

function formatPizzaSummary(config) {
  const parts = [config.size.name, config.crust.name];
  if (config.vegetables.length) {
    parts.push(config.vegetables.map((t) => t.name).join(', '));
  }
  if (config.extraToppings.length) {
    parts.push(`+ ${config.extraToppings.map((t) => t.name).join(', ')}`);
  }
  return parts.join(' · ');
}

function formatCustomizationDetail(customization) {
  if (!customization) return '';

  const parts = [`${customization.size} size`, `${customization.crust} crust`];
  if (customization.vegetables?.length) {
    parts.push(`Veggies: ${customization.vegetables.join(', ')}`);
  }
  if (customization.extraToppings?.length) {
    parts.push(`Extra: ${customization.extraToppings.join(', ')}`);
  }
  return parts.join(' · ');
}

function getItemDisplayPrice(item) {
  if (isPizzaItem(item)) {
    const sizes = buildPizzaSizes(item.price);
    return `From ${Cart.formatPrice(sizes[0].price)}`;
  }

  if (item.variations?.length) {
    const minPrice = Math.min(...item.variations.map((v) => v.price));
    return `From ${Cart.formatPrice(minPrice)}`;
  }

  return Cart.formatPrice(item.price);
}

function showPizzaCustomizer(item, quantity) {
  return new Promise((resolve, reject) => {
    const sizes = buildPizzaSizes(item.price);
    let selectedSize = sizes[1];
    let selectedCrust = PIZZA_CRUST_OPTIONS[0];
    const selectedVegetables = new Map();
    const selectedExtraToppings = new Map();

    const overlay = document.createElement('div');
    overlay.className = 'variation-modal-overlay pizza-modal-overlay';
    overlay.innerHTML = `
      <div class="variation-modal pizza-modal" role="dialog" aria-modal="true" aria-labelledby="pizza-modal-title">
        <h3 id="pizza-modal-title" class="variation-modal__title">${item.name}</h3>
        <p class="variation-modal__subtitle">Customize your pizza before adding to cart</p>

        <div class="pizza-modal__section">
          <h4 class="pizza-modal__label">Size</h4>
          <div class="pizza-size-grid">
            ${sizes
              .map(
                (size, index) => `
              <button type="button" class="pizza-size-option${index === 1 ? ' active' : ''}" data-size-id="${size.id}">
                <span class="pizza-size-option__name">${size.name}</span>
                <span class="pizza-size-option__price">${Cart.formatPrice(size.price)}</span>
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <div class="pizza-modal__section">
          <h4 class="pizza-modal__label">Crust</h4>
          <div class="variation-modal__options">
            ${PIZZA_CRUST_OPTIONS.map(
              (crust, index) => `
              <button type="button" class="variation-option pizza-crust-option${index === 0 ? ' active' : ''}" data-crust-id="${crust.id}">
                <span class="variation-option__name">${crust.name}</span>
                <span class="variation-option__price">${crust.price ? `+${Cart.formatPrice(crust.price)}` : 'Included'}</span>
              </button>
            `
            ).join('')}
          </div>
        </div>

        <div class="pizza-modal__section">
          <h4 class="pizza-modal__label">Vegetable Toppings <span class="pizza-modal__hint">Free — select multiple</span></h4>
          <div class="pizza-topping-grid">
            ${PIZZA_VEGETABLE_TOPPINGS.map(
              (topping) => `
              <button type="button" class="pizza-topping-chip pizza-topping-chip--veg" data-topping-type="veg" data-topping-id="${topping.id}" aria-pressed="false">
                ${topping.name}
              </button>
            `
            ).join('')}
          </div>
        </div>

        <div class="pizza-modal__section">
          <h4 class="pizza-modal__label">Extra Toppings <span class="pizza-modal__hint">Premium add-ons</span></h4>
          <div class="pizza-extra-grid">
            ${PIZZA_EXTRA_TOPPINGS.map(
              (topping) => `
              <button type="button" class="pizza-extra-option" data-topping-type="extra" data-topping-id="${topping.id}" aria-pressed="false">
                <span class="pizza-extra-option__name">${topping.name}</span>
                <span class="pizza-extra-option__price">+${Cart.formatPrice(topping.price)}</span>
              </button>
            `
            ).join('')}
          </div>
        </div>

        <div class="pizza-modal__summary">
          <p class="variation-modal__qty">Quantity: <strong>${quantity}</strong></p>
          <p class="pizza-modal__total">Total: <strong id="pizza-live-price">${Cart.formatPrice(calculatePizzaPrice(selectedSize, selectedCrust, [], []))}</strong> each</p>
        </div>

        <div class="variation-modal__actions">
          <button type="button" class="btn btn--outline pizza-modal__cancel">Cancel</button>
          <button type="button" class="btn btn--primary pizza-modal__confirm">Add to Cart</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));

    const livePrice = overlay.querySelector('#pizza-live-price');

    function updateLivePrice() {
      const vegetables = Array.from(selectedVegetables.values());
      const extraToppings = Array.from(selectedExtraToppings.values());
      livePrice.textContent = Cart.formatPrice(
        calculatePizzaPrice(selectedSize, selectedCrust, vegetables, extraToppings)
      );
    }

    overlay.querySelectorAll('.pizza-size-option').forEach((button) => {
      button.addEventListener('click', () => {
        overlay.querySelectorAll('.pizza-size-option').forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');
        selectedSize = sizes.find((size) => size.id === button.dataset.sizeId);
        updateLivePrice();
      });
    });

    overlay.querySelectorAll('.pizza-crust-option').forEach((button) => {
      button.addEventListener('click', () => {
        overlay.querySelectorAll('.pizza-crust-option').forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');
        selectedCrust = PIZZA_CRUST_OPTIONS.find((crust) => crust.id === button.dataset.crustId);
        updateLivePrice();
      });
    });

    overlay.querySelectorAll('[data-topping-type="veg"]').forEach((button) => {
      button.addEventListener('click', () => {
        const topping = PIZZA_VEGETABLE_TOPPINGS.find((t) => t.id === button.dataset.toppingId);
        if (selectedVegetables.has(topping.id)) {
          selectedVegetables.delete(topping.id);
          button.classList.remove('active');
          button.setAttribute('aria-pressed', 'false');
        } else {
          selectedVegetables.set(topping.id, topping);
          button.classList.add('active');
          button.setAttribute('aria-pressed', 'true');
        }
        updateLivePrice();
      });
    });

    overlay.querySelectorAll('[data-topping-type="extra"]').forEach((button) => {
      button.addEventListener('click', () => {
        const topping = PIZZA_EXTRA_TOPPINGS.find((t) => t.id === button.dataset.toppingId);
        if (selectedExtraToppings.has(topping.id)) {
          selectedExtraToppings.delete(topping.id);
          button.classList.remove('active');
          button.setAttribute('aria-pressed', 'false');
        } else {
          selectedExtraToppings.set(topping.id, topping);
          button.classList.add('active');
          button.setAttribute('aria-pressed', 'true');
        }
        updateLivePrice();
      });
    });

    function closeModal() {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 200);
    }

    overlay.querySelector('.pizza-modal__cancel').addEventListener('click', () => {
      closeModal();
      reject(new Error('cancelled'));
    });

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        closeModal();
        reject(new Error('cancelled'));
      }
    });

    overlay.querySelector('.pizza-modal__confirm').addEventListener('click', () => {
      closeModal();
      resolve({
        size: selectedSize,
        crust: selectedCrust,
        vegetables: Array.from(selectedVegetables.values()),
        extraToppings: Array.from(selectedExtraToppings.values()),
      });
    });
  });
}

function showVariationPicker(item, quantity) {
  return new Promise((resolve, reject) => {
    let selected = item.variations[0];

    const overlay = document.createElement('div');
    overlay.className = 'variation-modal-overlay';
    overlay.innerHTML = `
      <div class="variation-modal" role="dialog" aria-modal="true" aria-labelledby="variation-modal-title">
        <h3 id="variation-modal-title" class="variation-modal__title">${item.name}</h3>
        <p class="variation-modal__subtitle">Choose Regular or Large</p>
        <div class="variation-modal__options">
          ${item.variations
            .map(
              (variation, index) => `
            <button type="button" class="variation-option${index === 0 ? ' active' : ''}" data-variation-id="${variation.id}">
              <span class="variation-option__name">${variation.name}</span>
              <span class="variation-option__price">${Cart.formatPrice(variation.price)}</span>
            </button>
          `
            )
            .join('')}
        </div>
        <p class="variation-modal__qty">Quantity: <strong>${quantity}</strong></p>
        <div class="variation-modal__actions">
          <button type="button" class="btn btn--outline variation-modal__cancel">Cancel</button>
          <button type="button" class="btn btn--primary variation-modal__confirm">Add to Cart</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));

    const optionButtons = overlay.querySelectorAll('.variation-option');

    optionButtons.forEach((button) => {
      button.addEventListener('click', () => {
        optionButtons.forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');
        selected = item.variations.find((v) => v.id === button.dataset.variationId);
      });
    });

    function closeModal() {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 200);
    }

    overlay.querySelector('.variation-modal__cancel').addEventListener('click', () => {
      closeModal();
      reject(new Error('cancelled'));
    });

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        closeModal();
        reject(new Error('cancelled'));
      }
    });

    overlay.querySelector('.variation-modal__confirm').addEventListener('click', () => {
      closeModal();
      resolve(selected);
    });
  });
}

async function handleAddToCart(item, quantity, qtyValue) {
  if (isPizzaItem(item)) {
    try {
      const config = await showPizzaCustomizer(item, quantity);
      const lineItem = buildPizzaCartLineItem(item, config);
      Cart.addLineItem(lineItem, quantity);
      showToast(`Added ${quantity}× ${item.name} (${formatPizzaSummary(config)}) to cart!`);
    } catch {
      return quantity;
    }
  } else if (item.variations?.length) {
    try {
      const variation = await showVariationPicker(item, quantity);
      Cart.addItem(item, quantity, variation);
      showToast(`Added ${quantity}× ${item.name} (${variation.name}) to cart!`);
    } catch {
      return quantity;
    }
  } else {
    Cart.addItem(item, quantity);
    showToast(`Added ${quantity}× ${item.name} to cart!`);
  }

  if (qtyValue) qtyValue.textContent = '1';
  return 1;
}

function createMenuCard(item) {
  const card = document.createElement('article');
  card.className = 'menu-card';
  if (item.category) card.dataset.category = item.category;
  card.innerHTML = `
    <img class="menu-card__image" src="${item.image}" alt="${item.name}" loading="lazy" onerror="handleFoodImageError(event)">
    <div class="menu-card__body">
      <div class="menu-card__header">
        <h3 class="menu-card__name">${item.name}</h3>
        <span class="menu-card__price">${getItemDisplayPrice(item)}</span>
      </div>
      <p class="menu-card__desc">${item.description}</p>
      <div class="menu-card__actions">
        <div class="qty-selector">
          <button type="button" class="qty-selector__btn" data-action="decrease" aria-label="Decrease quantity">−</button>
          <span class="qty-selector__value">1</span>
          <button type="button" class="qty-selector__btn" data-action="increase" aria-label="Increase quantity">+</button>
        </div>
        <button type="button" class="btn btn--primary btn--sm menu-card__add-btn">Add to Cart</button>
      </div>
    </div>
  `;

  const qtyValue = card.querySelector('.qty-selector__value');
  let quantity = 1;

  card.querySelector('[data-action="decrease"]').addEventListener('click', () => {
    if (quantity > 1) {
      quantity--;
      qtyValue.textContent = quantity;
    }
  });

  card.querySelector('[data-action="increase"]').addEventListener('click', () => {
    if (quantity < 99) {
      quantity++;
      qtyValue.textContent = quantity;
    }
  });

  card.querySelector('.menu-card__add-btn').addEventListener('click', async () => {
    quantity = await handleAddToCart(item, quantity, qtyValue);
  });

  return card;
}

/* ── Home page ── */

const POPULAR_IDS = [
  'burger-double-cheese',
  'pizza-pepperoni',
  'side-fries',
  'dessert-brownie',
];

async function loadPopularItems() {
  const container = document.getElementById('popular-items');
  if (!container) return;

  try {
    const response = await fetch('/api/menu');
    if (!response.ok) throw new Error('Failed to load menu');

    const menu = await response.json();
    const popular = menu.filter((item) => POPULAR_IDS.includes(item.id));

    container.innerHTML = '';
    popular.forEach((item) => container.appendChild(createMenuCard(item)));
  } catch {
    container.innerHTML = `
      <div class="alert alert--error" style="grid-column: 1 / -1;">
        Could not load menu items. Please try again later.
      </div>
    `;
  }
}

/* ── Menu page ── */

const CATEGORIES = ['All', 'Burgers', 'Pizza', 'Sides', 'Drinks', 'Desserts'];

let allMenuItems = [];
let activeCategory = 'All';

function renderCategoryFilters() {
  const container = document.getElementById('category-filters');
  if (!container) return;

  container.innerHTML = CATEGORIES.map(
    (cat) =>
      `<button type="button" class="menu-category-btn${cat === activeCategory ? ' active' : ''}" data-category="${cat}">${cat}</button>`
  ).join('');

  container.querySelectorAll('.menu-category-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.category;
      renderCategoryFilters();
      renderMenu();
    });
  });
}

function renderMenu() {
  const container = document.getElementById('menu-container');
  if (!container) return;

  const filtered =
    activeCategory === 'All'
      ? allMenuItems
      : allMenuItems.filter((item) => item.category === activeCategory);

  if (filtered.length === 0) {
    container.innerHTML = '<p class="section__subtitle">No items in this category.</p>';
    return;
  }

  if (activeCategory !== 'All') {
    container.innerHTML = `
      <div class="menu-section">
        <h2 class="menu-section__title">${activeCategory}</h2>
        <div class="menu-grid" id="menu-grid"></div>
      </div>
    `;
    const grid = document.getElementById('menu-grid');
    filtered.forEach((item) => grid.appendChild(createMenuCard(item)));
    return;
  }

  const grouped = {};
  CATEGORIES.slice(1).forEach((cat) => {
    grouped[cat] = allMenuItems.filter((item) => item.category === cat);
  });

  container.innerHTML = '';
  CATEGORIES.slice(1).forEach((cat) => {
    if (grouped[cat].length === 0) return;

    const section = document.createElement('div');
    section.className = 'menu-section';
    section.id = cat.toLowerCase();
    section.innerHTML = `<h2 class="menu-section__title">${cat}</h2>`;

    const grid = document.createElement('div');
    grid.className = 'menu-grid';
    grouped[cat].forEach((item) => grid.appendChild(createMenuCard(item)));
    section.appendChild(grid);
    container.appendChild(section);
  });
}

async function loadMenu() {
  const container = document.getElementById('menu-container');
  if (!container) return;

  try {
    const response = await fetch('/api/menu');
    if (!response.ok) throw new Error('Failed to load menu');

    allMenuItems = await response.json();
    renderCategoryFilters();
    renderMenu();
  } catch {
    container.innerHTML = `
      <div class="alert alert--error">
        Could not load the menu. Please refresh the page or try again later.
      </div>
    `;
  }
}

/* ── Cart page ── */

let orderType = 'takeaway';

function renderCartItems() {
  const container = document.getElementById('cart-items-container');
  const items = Cart.getItems();

  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty__icon">🛒</div>
        <p class="cart-empty__text">Your cart is empty. Add some delicious items from our menu!</p>
        <a href="/menu.html" class="btn btn--primary">Browse Menu</a>
      </div>
    `;
    document.getElementById('place-order-btn').disabled = true;
    updateSummary();
    return;
  }

  document.getElementById('place-order-btn').disabled = false;

  container.innerHTML = '<div class="cart-items"></div>';
  const list = container.querySelector('.cart-items');

  items.forEach((item) => {
    const el = document.createElement('div');
    el.className = 'cart-item';
    const detailHtml = item.detail
      ? `<p class="cart-item__detail">${item.detail}</p>`
      : item.customization
        ? `<p class="cart-item__detail">${formatCustomizationDetail(item.customization)}</p>`
        : '';

    el.innerHTML = `
      <img class="cart-item__image" src="${item.image}" alt="${item.name}" onerror="handleFoodImageError(event)">
      <div class="cart-item__info">
        <p class="cart-item__name">${item.name}</p>
        ${detailHtml}
        <p class="cart-item__price">${Cart.formatPrice(item.price)} each</p>
      </div>
      <div class="cart-item__actions">
        <div class="qty-selector">
          <button type="button" class="qty-selector__btn" data-action="decrease" aria-label="Decrease quantity">−</button>
          <span class="qty-selector__value">${item.quantity}</span>
          <button type="button" class="qty-selector__btn" data-action="increase" aria-label="Increase quantity">+</button>
        </div>
        <p class="cart-item__price">${Cart.formatPrice(item.price * item.quantity)}</p>
        <button type="button" class="cart-item__remove" data-id="${item.id}">Remove</button>
      </div>
    `;

    el.querySelector('[data-action="decrease"]').addEventListener('click', () => {
      Cart.updateQuantity(item.id, item.quantity - 1);
      renderCartItems();
    });

    el.querySelector('[data-action="increase"]').addEventListener('click', () => {
      Cart.updateQuantity(item.id, item.quantity + 1);
      renderCartItems();
    });

    el.querySelector('.cart-item__remove').addEventListener('click', () => {
      Cart.removeItem(item.id);
      renderCartItems();
      showToast(`${item.name} removed from cart.`);
    });

    list.appendChild(el);
  });

  updateSummary();
}

function updateSummary() {
  const subtotal = Cart.getSubtotal();
  const deliveryFee = Cart.getDeliveryFee(orderType);
  const total = Cart.getTotal(orderType);

  document.getElementById('summary-subtotal').textContent = Cart.formatPrice(subtotal);
  document.getElementById('summary-delivery').textContent =
    orderType === 'delivery' ? Cart.formatPrice(deliveryFee) : 'Free';
  document.getElementById('summary-total').textContent = Cart.formatPrice(total);
}

function initOrderTypeToggle() {
  const buttons = document.querySelectorAll('.order-type-toggle__btn');
  const addressGroup = document.getElementById('address-group');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      orderType = btn.dataset.type;
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      if (orderType === 'delivery') {
        addressGroup.classList.remove('hidden');
      } else {
        addressGroup.classList.add('hidden');
        clearFieldError('address');
      }

      updateSummary();
    });
  });
}

const ERROR_IDS = {
  'customer-name': 'error-name',
  phone: 'error-phone',
  address: 'error-address',
  payment: 'error-payment',
};

function clearFieldError(fieldId) {
  const input = document.getElementById(fieldId);
  const error = document.getElementById(ERROR_IDS[fieldId]);
  if (input) input.classList.remove('error');
  if (error) error.classList.remove('visible');
}

function showFieldError(fieldId) {
  const input = document.getElementById(fieldId);
  const error = document.getElementById(ERROR_IDS[fieldId]);
  if (input) input.classList.add('error');
  if (error) error.classList.add('visible');
}

function validateForm() {
  let valid = true;

  ['customer-name', 'phone', 'payment'].forEach(clearFieldError);
  clearFieldError('address');

  const name = document.getElementById('customer-name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const payment = document.getElementById('payment').value;
  const address = document.getElementById('address').value.trim();

  if (!name) {
    showFieldError('customer-name');
    valid = false;
  }

  if (!phone || !validatePhone(phone)) {
    showFieldError('phone');
    valid = false;
  }

  if (orderType === 'delivery' && !address) {
    showFieldError('address');
    valid = false;
  }

  if (!payment) {
    showFieldError('payment');
    valid = false;
  }

  return valid;
}

function showAlert(message, type = 'error') {
  const alertContainer = document.getElementById('cart-alert');
  alertContainer.innerHTML = `<div class="alert alert--${type}">${message}</div>`;
  alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function handleCheckout(event) {
  event.preventDefault();

  const items = Cart.getItems();
  if (items.length === 0) {
    showAlert('Your cart is empty. Add items before placing an order.');
    return;
  }

  if (!validateForm()) return;

  const btn = document.getElementById('place-order-btn');
  btn.disabled = true;
  btn.textContent = 'Placing Order...';

  const orderData = {
    customerName: document.getElementById('customer-name').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    orderType,
    address: orderType === 'delivery' ? document.getElementById('address').value.trim() : null,
    paymentMethod: document.getElementById('payment').value,
    notes: document.getElementById('notes').value.trim(),
    items: items.map((item) => ({
      id: item.id,
      name: item.detail ? `${item.name} — ${item.detail}` : item.name,
      price: item.price,
      quantity: item.quantity,
      customization: item.customization || null,
    })),
    subtotal: Cart.getSubtotal(),
    deliveryFee: Cart.getDeliveryFee(orderType),
    total: Cart.getTotal(orderType),
  };

  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });

    const result = await response.json();

    if (!response.ok) {
      const msg = result.errors ? result.errors.join(' ') : 'Failed to place order.';
      showAlert(msg);
      btn.disabled = false;
      btn.textContent = 'Place Order';
      return;
    }

    Cart.clear();
    window.location.href = `/confirmation.html?id=${result.order.id}`;
  } catch {
    showAlert('Network error. Please check your connection and try again.');
    btn.disabled = false;
    btn.textContent = 'Place Order';
  }
}

function initCheckout() {
  initOrderTypeToggle();
  renderCartItems();

  document.getElementById('checkout-form').addEventListener('submit', handleCheckout);

  ['customer-name', 'phone', 'address', 'payment'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => clearFieldError(id));
      el.addEventListener('change', () => clearFieldError(id));
    }
  });
}

/* ── Confirmation page ── */

function renderConfirmation(order) {
  const container = document.getElementById('confirmation-content');
  if (!container) return;

  const orderTypeLabel = order.orderType === 'delivery' ? '🚗 Delivery' : '🥡 Takeaway';
  const paymentLabel = order.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Card';

  const itemsHtml = order.items
    .map(
      (item) => `
      <div class="confirmation__item">
        <div>
          <span>${item.quantity}× ${item.name.includes(' — ') ? item.name.split(' — ')[0] : item.name}</span>
          ${item.customization ? `<small class="confirmation__item-detail">${formatCustomizationDetail(item.customization)}</small>` : item.name.includes(' — ') ? `<small class="confirmation__item-detail">${item.name.split(' — ')[1]}</small>` : ''}
        </div>
        <span>${Cart.formatPrice(item.price * item.quantity)}</span>
      </div>
    `
    )
    .join('');

  container.innerHTML = `
    <div class="confirmation__icon">✓</div>
    <h1 class="confirmation__title">Order Confirmed!</h1>
    <p class="confirmation__subtitle">Thank you, ${order.customerName}! Your order has been received.</p>

    <div class="confirmation__card">
      <div class="confirmation__order-id">
        <span>Order ID</span>
        <strong>${order.id}</strong>
      </div>

      <div class="confirmation__eta">
        <span class="confirmation__eta-icon">⏱️</span>
        <div class="confirmation__eta-text">
          <strong>Estimated Time: ~${order.estimatedMinutes} minutes</strong>
          <span>${order.orderType === 'delivery' ? 'Your food is on its way!' : 'Your order will be ready for pickup soon.'}</span>
        </div>
      </div>

      <p style="margin-bottom: 0.75rem; font-weight: 600;">Order Details</p>
      <div class="confirmation__items">${itemsHtml}</div>

      <div class="summary-row">
        <span>Subtotal</span>
        <span>${Cart.formatPrice(order.subtotal)}</span>
      </div>
      <div class="summary-row">
        <span>Delivery Fee</span>
        <span>${order.deliveryFee > 0 ? Cart.formatPrice(order.deliveryFee) : 'Free'}</span>
      </div>
      <div class="summary-row summary-row--total">
        <span>Total</span>
        <span>${Cart.formatPrice(order.total)}</span>
      </div>

      <div style="margin-top: 1.25rem; font-size: 0.9rem; color: var(--color-text-light);">
        <p><strong>Type:</strong> ${orderTypeLabel}</p>
        <p><strong>Payment:</strong> ${paymentLabel}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        ${order.address ? `<p><strong>Address:</strong> ${order.address}</p>` : ''}
        ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
      </div>
    </div>

    <div class="confirmation__actions">
      <a href="/menu.html" class="btn btn--primary">Order Again</a>
      <a href="/index.html" class="btn btn--outline">Back to Home</a>
    </div>
  `;
}

function renderError(message) {
  const container = document.getElementById('confirmation-content');
  container.innerHTML = `
    <div class="alert alert--error">${message}</div>
    <div class="confirmation__actions" style="margin-top: 1.5rem;">
      <a href="/cart.html" class="btn btn--primary">Return to Cart</a>
      <a href="/index.html" class="btn btn--outline">Back to Home</a>
    </div>
  `;
}

async function loadOrder() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('id');

  if (!orderId) {
    renderError('No order ID provided. Please place an order first.');
    return;
  }

  try {
    const response = await fetch(`/api/orders/${orderId}`);
    const result = await response.json();

    if (!response.ok || !result.success) {
      renderError('Order not found. It may have expired or the ID is invalid.');
      return;
    }

    renderConfirmation(result.order);
  } catch {
    renderError('Could not load order details. Please try again later.');
  }
}

/* ── Page router ── */

const PAGE_META = {
  home: {
    title: 'MunchBox | Fast Food Delivered',
    description: 'MunchBox — Burgers, pizza, and more. Order online for delivery or takeaway.',
  },
  menu: {
    title: 'Menu | MunchBox',
    description: 'Browse the MunchBox menu — burgers, pizza, sides, drinks, and desserts.',
  },
  cart: {
    title: 'Cart & Checkout | MunchBox',
    description: 'Your cart and checkout — MunchBox',
  },
  confirmation: {
    title: 'Order Confirmed | MunchBox',
    description: 'Order confirmed — MunchBox',
  },
};

function getCurrentPage() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  if (path === 'menu.html') return 'menu';
  if (path === 'cart.html') return 'cart';
  if (path === 'confirmation.html') return 'confirmation';
  return 'home';
}

function initPage() {
  const page = getCurrentPage();

  document.querySelectorAll('[data-page]').forEach((section) => {
    section.hidden = section.dataset.page !== page;
  });

  const meta = PAGE_META[page];
  if (meta) {
    document.title = meta.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', meta.description);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initPage();

  const page = getCurrentPage();
  if (page === 'home') loadPopularItems();
  if (page === 'menu') loadMenu();
  if (page === 'cart') initCheckout();
  if (page === 'confirmation') loadOrder();
});
