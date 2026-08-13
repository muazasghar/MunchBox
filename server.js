const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const INDEX_HTML = path.join(__dirname, 'public', 'index.html');

const MENU_DATA = [
  {
    id: 'burger-chicken',
    name: 'Chicken Burger',
    description: 'Crispy golden chicken patty with fresh lettuce, tomato, and our signature house sauce on a toasted brioche bun.',
    price: 6.99,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
  },
  {
    id: 'burger-beef',
    name: 'Beef Burger',
    description: 'Juicy grilled beef patty topped with cheddar, pickles, and caramelized onions.',
    price: 7.49,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop',
  },
  {
    id: 'burger-spicy-chicken',
    name: 'Spicy Chicken Burger',
    description: 'Crispy chicken with fiery jalapeños, pepper jack cheese, and chipotle mayo.',
    price: 7.99,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=300&fit=crop',
  },
  {
    id: 'burger-double-cheese',
    name: 'Double Cheeseburger',
    description: 'Two grilled beef patties stacked with double cheddar, bacon, and special sauce.',
    price: 8.99,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop',
  },
  {
    id: 'burger-veggie',
    name: 'Veggie Munch Burger',
    description: 'Plant-based patty with avocado, roasted peppers, and herb aioli on a whole-grain bun.',
    price: 7.29,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&h=300&fit=crop',
  },
  {
    id: 'pizza-margherita',
    name: 'Margherita Pizza',
    description: 'Classic thin crust with San Marzano tomato sauce, fresh mozzarella, and basil.',
    price: 9.99,
    category: 'Pizza',
    customizable: true,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop',
  },
  {
    id: 'pizza-pepperoni',
    name: 'Pepperoni Pizza',
    description: 'Loaded with premium pepperoni slices and melted mozzarella on our hand-stretched dough.',
    price: 11.49,
    category: 'Pizza',
    customizable: true,
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop',
  },
  {
    id: 'pizza-bbq-chicken',
    name: 'BBQ Chicken Pizza',
    description: 'Smoky BBQ base, grilled chicken, red onion, and cilantro on a crispy crust.',
    price: 12.99,
    category: 'Pizza',
    customizable: true,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
  },
  {
    id: 'pizza-meat-lovers',
    name: 'Meat Lovers Pizza',
    description: 'Pepperoni, sausage, bacon, and ham piled high on a cheesy tomato base.',
    price: 13.49,
    category: 'Pizza',
    customizable: true,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop',
  },
  {
    id: 'side-fries',
    name: 'Fries',
    description: 'Golden crispy fries, lightly salted and served hot. Choose Regular or Large.',
    price: 2.99,
    category: 'Sides',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',
    variations: [
      { id: 'regular', name: 'Regular', price: 2.99 },
      { id: 'large', name: 'Large', price: 4.49 },
    ],
  },
  {
    id: 'side-loaded-fries',
    name: 'Loaded Fries',
    description: 'Crispy fries topped with melted cheese, bacon bits, and spring onions.',
    price: 4.49,
    category: 'Sides',
    image: 'https://images.unsplash.com/photo-1743193711514-4f7bc5d78d4d?w=400&h=300&fit=crop',
  },
  {
    id: 'side-onion-rings',
    name: 'Onion Rings',
    description: 'Golden beer-battered onion rings served with smoky BBQ dip.',
    price: 3.99,
    category: 'Sides',
    image: 'https://images.unsplash.com/photo-1766589152292-3c052f0d87aa?w=400&h=300&fit=crop',
  },
  {
    id: 'side-chicken-wings',
    name: 'Chicken Wings (6pc)',
    description: 'Six crispy wings tossed in your choice of Buffalo, BBQ, or Honey Garlic sauce.',
    price: 6.99,
    category: 'Sides',
    image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=300&fit=crop',
  },
  {
    id: 'side-mozzarella-sticks',
    name: 'Mozzarella Sticks',
    description: 'Five golden-fried mozzarella sticks with marinara dipping sauce.',
    price: 4.99,
    category: 'Sides',
    image: 'https://images.unsplash.com/photo-1778449665117-2c607bbc7415?w=400&h=300&fit=crop',
  },
  {
    id: 'drink-soft',
    name: 'Soft Drink (Can)',
    description: 'Chilled 330ml can — Coke, Sprite, Fanta, or Diet Coke.',
    price: 1.99,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=300&fit=crop',
  },
  {
    id: 'drink-milkshake',
    name: 'Milkshake',
    description: 'Thick and creamy shake — choose from chocolate, vanilla, or strawberry.',
    price: 3.49,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
  },
  {
    id: 'drink-iced-tea',
    name: 'Iced Tea',
    description: 'Freshly brewed peach or lemon iced tea, served over ice.',
    price: 2.49,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&h=300&fit=crop',
  },
  {
    id: 'dessert-brownie',
    name: 'Chocolate Brownie',
    description: 'Warm fudgy chocolate brownie with a dusting of powdered sugar.',
    price: 2.99,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop',
  },
  {
    id: 'dessert-sundae',
    name: 'Ice Cream Sundae',
    description: 'Vanilla soft-serve topped with hot fudge, whipped cream, and a cherry.',
    price: 3.99,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop',
  },
];

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readJsonFile(filePath, fallback = []) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function generateOrderId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `MBX-${timestamp}-${random}`;
}

function validateOrderPayload(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return ['Invalid order payload.'];
  }

  if (!body.customerName || !String(body.customerName).trim()) {
    errors.push('Customer name is required.');
  }

  if (!body.phone || !/^[\d\s\-+()]{7,20}$/.test(String(body.phone).trim())) {
    errors.push('A valid phone number is required.');
  }

  if (!body.orderType || !['delivery', 'takeaway'].includes(body.orderType)) {
    errors.push('Order type must be delivery or takeaway.');
  }

  if (body.orderType === 'delivery') {
    if (!body.address || !String(body.address).trim()) {
      errors.push('Delivery address is required for delivery orders.');
    }
  }

  if (!body.paymentMethod || !['cash', 'card'].includes(body.paymentMethod)) {
    errors.push('Payment method must be cash or card.');
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push('Order must contain at least one item.');
  } else {
    body.items.forEach((item, index) => {
      if (!item.id || !item.name || typeof item.price !== 'number' || !item.quantity) {
        errors.push(`Item at index ${index} is missing required fields.`);
      }
    });
  }

  return errors;
}

app.get('/api/menu', (_req, res) => {
  res.json(MENU_DATA);
});

app.post('/api/orders', (req, res) => {
  const errors = validateOrderPayload(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  const {
    customerName,
    phone,
    orderType,
    address,
    paymentMethod,
    items,
    subtotal,
    deliveryFee,
    total,
    notes,
  } = req.body;

  const order = {
    id: generateOrderId(),
    customerName: String(customerName).trim(),
    phone: String(phone).trim(),
    orderType,
    address: orderType === 'delivery' ? String(address).trim() : null,
    paymentMethod,
    items,
    subtotal,
    deliveryFee,
    total,
    notes: notes ? String(notes).trim() : '',
    status: 'confirmed',
    estimatedMinutes: orderType === 'delivery' ? 35 : 20,
    createdAt: new Date().toISOString(),
  };

  const orders = readJsonFile(ORDERS_FILE, []);
  orders.push(order);
  writeJsonFile(ORDERS_FILE, orders);

  res.status(201).json({
    success: true,
    order: {
      id: order.id,
      status: order.status,
      estimatedMinutes: order.estimatedMinutes,
      total: order.total,
      orderType: order.orderType,
      createdAt: order.createdAt,
    },
  });
});

app.get('/api/orders/:id', (req, res) => {
  const orders = readJsonFile(ORDERS_FILE, []);
  const order = orders.find((entry) => entry.id === req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  res.json({ success: true, order });
});

['/', '/index.html', '/menu.html', '/cart.html', '/confirmation.html'].forEach((route) => {
  app.get(route, (_req, res) => {
    res.sendFile(INDEX_HTML);
  });
});

app.listen(PORT, () => {
  console.log(`MunchBox server running at http://localhost:${PORT}`);
});
