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
const MENU_FILE = path.join(__dirname, 'public', 'data', 'menu.json');

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

const MENU_DATA = readJsonFile(MENU_FILE, []);

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
