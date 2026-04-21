'use strict';

const STORAGE_KEY = 'sbms_data_v1';
const AUTH_KEY = 'sbms_auth_v1';
const THEME_KEY = 'sbms_theme_v1';
const ADMIN_PASSWORD = 'Admin@123'; // Demo only: production systems should never keep passwords in frontend code.

const state = {
  customers: [],
  products: [],
  orders: [],
  chart: null,
};

const dom = {};

const DEMO_TEMPLATE = {
  customers: [
    { id: 'CUST-1001', name: 'John Doe', email: 'john.doe@sbms.demo', tier: 'Regular' },
    { id: 'CUST-1002', name: 'Sarah Smith', email: 'sarah.smith@sbms.demo', tier: 'Premium' },
    { id: 'CUST-1003', name: 'Michael Brown', email: 'michael.brown@sbms.demo', tier: 'VIP' },
  ],
  products: [
    { id: 'PRD-2001', name: 'Laptop', category: 'Electronics', price: 15000 },
    { id: 'PRD-2002', name: 'Phone', category: 'Electronics', price: 8000 },
    { id: 'PRD-2003', name: 'Headphones', category: 'Accessories', price: 1200 },
  ],
};

document.addEventListener('DOMContentLoaded', () => {
  cacheDom();
  attachEvents();
  loadTheme();
  loadDataOrSeedDemo();
  checkAuth();
  refreshAll();
});

function cacheDom() {
  const ids = [
    'toastContainer', 'loginView', 'appView', 'loginForm', 'password', 'logoutBtn', 'themeToggle',
    'sectionTitle', 'kpiCustomers', 'kpiOrders', 'kpiRevenue', 'kpiPopular', 'revenueChart',
    'customerForm', 'customerId', 'customerName', 'customerEmail', 'customerTier', 'customerSearch', 'customerTableBody', 'saveCustomerBtn',
    'productForm', 'productId', 'productName', 'productPrice', 'productCategory', 'productSearch', 'productSort', 'productTableBody', 'saveProductBtn',
    'orderForm', 'orderCustomer', 'orderProduct', 'orderQuantity', 'orderTotal', 'orderTableBody', 'orderCustomerFilter', 'orderSort',
    'backupBtn', 'restoreInput', 'restoreBtn', 'resetBtn', 'exportCsvBtn'
  ];

  ids.forEach((id) => {
    dom[id] = document.getElementById(id);
  });

  dom.navLinks = Array.from(document.querySelectorAll('.nav-link'));
  dom.sections = Array.from(document.querySelectorAll('.section'));
}

function attachEvents() {
  dom.loginForm.addEventListener('submit', onLogin);
  dom.logoutBtn.addEventListener('click', logout);
  dom.themeToggle.addEventListener('click', toggleTheme);

  dom.navLinks.forEach((btn) => {
    btn.addEventListener('click', () => showSection(btn.dataset.section));
  });

  dom.customerForm.addEventListener('submit', onSaveCustomer);
  dom.customerSearch.addEventListener('input', renderCustomers);

  dom.productForm.addEventListener('submit', onSaveProduct);
  dom.productSearch.addEventListener('input', renderProducts);
  dom.productSort.addEventListener('change', renderProducts);

  dom.orderForm.addEventListener('submit', onCreateOrder);
  dom.orderCustomer.addEventListener('change', updateOrderTotal);
  dom.orderProduct.addEventListener('change', updateOrderTotal);
  dom.orderQuantity.addEventListener('input', updateOrderTotal);
  dom.orderCustomerFilter.addEventListener('change', renderOrders);
  dom.orderSort.addEventListener('change', renderOrders);

  dom.backupBtn.addEventListener('click', backupToCloud);
  dom.restoreBtn.addEventListener('click', restoreFromBackup);
  dom.resetBtn.addEventListener('click', resetSystem);
  dom.exportCsvBtn.addEventListener('click', exportOrdersCsv);
}

function loadDataOrSeedDemo() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      seedDemoData();
      persistData();
      showToast('Demo data loaded for first-time use.', 'success');
      return;
    }

    const parsed = JSON.parse(raw);
    state.customers = Array.isArray(parsed.customers) ? parsed.customers : [];
    state.products = Array.isArray(parsed.products) ? parsed.products : [];
    state.orders = Array.isArray(parsed.orders) ? parsed.orders : [];

    if (!state.customers.length && !state.products.length && !state.orders.length) {
      seedDemoData();
      persistData();
    }
  } catch {
    seedDemoData();
    persistData();
    showToast('Stored data was invalid. Demo data has been restored.', 'error');
  }
}

function seedDemoData() {
  state.customers = structuredClone(DEMO_TEMPLATE.customers);
  state.products = structuredClone(DEMO_TEMPLATE.products);

  const john = state.customers.find((c) => c.name === 'John Doe');
  const sarah = state.customers.find((c) => c.name === 'Sarah Smith');
  const michael = state.customers.find((c) => c.name === 'Michael Brown');
  const laptop = state.products.find((p) => p.name === 'Laptop');
  const phone = state.products.find((p) => p.name === 'Phone');
  const headphones = state.products.find((p) => p.name === 'Headphones');

  const now = Date.now();
  state.orders = [
    createOrderRecord(john.id, laptop.id, 1, new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString()),
    createOrderRecord(sarah.id, phone.id, 2, new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString()),
    createOrderRecord(michael.id, headphones.id, 3, new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString()),
  ];
}

function createOrderRecord(customerId, productId, quantity, timestamp) {
  const product = state.products.find((p) => p.id === productId);
  return {
    id: uid('ORD'),
    customerId,
    productId,
    quantity,
    total: +(product.price * quantity).toFixed(2),
    timestamp,
  };
}

function persistData() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ customers: state.customers, products: state.products, orders: state.orders })
  );
}

function sanitizeText(value) {
  return String(value || '').trim().replace(/[<>]/g, '');
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(Number(value) || 0);
}

function uid(prefix) {
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${prefix}-${Date.now()}-${random}`;
}

function onLogin(event) {
  event.preventDefault();
  const entered = sanitizeText(dom.password.value);

  // Authentication protects sensitive operational data from unauthorized users.
  if (entered !== ADMIN_PASSWORD) {
    showToast('Invalid password. Access denied.', 'error');
    return;
  }

  localStorage.setItem(AUTH_KEY, 'true');
  dom.password.value = '';
  checkAuth();
  showToast('Login successful. Welcome, Admin.', 'success');
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  checkAuth();
  showToast('Logged out securely.', 'success');
}

function checkAuth() {
  const isAuthenticated = localStorage.getItem(AUTH_KEY) === 'true';
  dom.loginView.classList.toggle('hidden', isAuthenticated);
  dom.appView.classList.toggle('hidden', !isAuthenticated);
}

function showSection(sectionId) {
  dom.sections.forEach((section) => {
    section.classList.toggle('active', section.id === sectionId);
  });

  dom.navLinks.forEach((link) => {
    link.classList.toggle('active', link.dataset.section === sectionId);
  });

  dom.sectionTitle.textContent = sectionId.replace('Section', '').replace(/^./, (char) => char.toUpperCase());
}

function onSaveCustomer(event) {
  event.preventDefault();

  const id = dom.customerId.value;
  const name = sanitizeText(dom.customerName.value);
  const email = sanitizeText(dom.customerEmail.value);
  const tier = sanitizeText(dom.customerTier.value);

  // Validation keeps records reliable and reduces risks from malformed or malicious input.
  if (!name || !email || !tier) {
    showToast('All customer fields are required.', 'error');
    return;
  }

  const duplicate = state.customers.find(
    (customer) => customer.name.toLowerCase() === name.toLowerCase() && customer.id !== id
  );

  if (duplicate) {
    showToast('Duplicate customer name is not allowed.', 'error');
    return;
  }

  if (id) {
    const customer = state.customers.find((entry) => entry.id === id);
    if (!customer) return;

    customer.name = name;
    customer.email = email;
    customer.tier = tier;
    showToast('Customer updated successfully.', 'success');
  } else {
    state.customers.push({ id: uid('CUST'), name, email, tier });
    showToast('Customer added successfully.', 'success');
  }

  dom.customerForm.reset();
  dom.customerId.value = '';
  dom.saveCustomerBtn.textContent = 'Add Customer';

  persistData();
  refreshAll();
}

function renderCustomers() {
  const searchTerm = sanitizeText(dom.customerSearch.value).toLowerCase();
  const spendMap = calculateCustomerSpend();

  const rows = state.customers
    .filter((customer) => `${customer.name} ${customer.email} ${customer.tier}`.toLowerCase().includes(searchTerm))
    .map((customer) => {
      const spend = spendMap[customer.id] || 0;
      const isHighValue = spend >= 10000;

      return `
        <tr>
          <td>${customer.id}</td>
          <td>${customer.name}</td>
          <td>${customer.email}</td>
          <td><span class="badge ${isHighValue ? 'high-value' : ''}">${customer.tier}${isHighValue ? ' • High Value' : ''}</span></td>
          <td>
            <div class="action-group">
              <button class="btn btn-ghost" onclick="editCustomer('${customer.id}')">Edit</button>
              <button class="btn btn-danger" onclick="deleteCustomer('${customer.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  dom.customerTableBody.innerHTML = rows || '<tr><td colspan="5">No customers found.</td></tr>';
}

window.editCustomer = function editCustomer(id) {
  const customer = state.customers.find((entry) => entry.id === id);
  if (!customer) return;

  dom.customerId.value = customer.id;
  dom.customerName.value = customer.name;
  dom.customerEmail.value = customer.email;
  dom.customerTier.value = customer.tier;
  dom.saveCustomerBtn.textContent = 'Update Customer';

  showSection('customersSection');
};

window.deleteCustomer = function deleteCustomer(id) {
  if (state.orders.some((order) => order.customerId === id)) {
    showToast('Cannot delete customer with existing orders.', 'error');
    return;
  }

  state.customers = state.customers.filter((entry) => entry.id !== id);
  persistData();
  refreshAll();
  showToast('Customer deleted successfully.', 'success');
};

function onSaveProduct(event) {
  event.preventDefault();

  const id = dom.productId.value;
  const name = sanitizeText(dom.productName.value);
  const category = sanitizeText(dom.productCategory.value);
  const price = Number(dom.productPrice.value);

  if (!name || !category || !Number.isFinite(price) || price < 0) {
    showToast('Please provide valid product fields.', 'error');
    return;
  }

  if (id) {
    const product = state.products.find((entry) => entry.id === id);
    if (!product) return;

    product.name = name;
    product.category = category;
    product.price = +price.toFixed(2);
    showToast('Product updated successfully.', 'success');
  } else {
    state.products.push({ id: uid('PRD'), name, category, price: +price.toFixed(2) });
    showToast('Product added successfully.', 'success');
  }

  dom.productForm.reset();
  dom.productId.value = '';
  dom.saveProductBtn.textContent = 'Add Product';

  persistData();
  refreshAll();
}

function renderProducts() {
  const searchTerm = sanitizeText(dom.productSearch.value).toLowerCase();
  const sortMode = dom.productSort.value;

  const filtered = state.products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(searchTerm));

  filtered.sort((a, b) => {
    if (sortMode === 'priceAsc') return a.price - b.price;
    if (sortMode === 'priceDesc') return b.price - a.price;
    return a.name.localeCompare(b.name);
  });

  const rows = filtered
    .map((product) => {
      return `
        <tr>
          <td>${product.name}</td>
          <td>${product.category}</td>
          <td>${formatCurrency(product.price)}</td>
          <td>
            <div class="action-group">
              <button class="btn btn-ghost" onclick="editProduct('${product.id}')">Edit</button>
              <button class="btn btn-danger" onclick="deleteProduct('${product.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  dom.productTableBody.innerHTML = rows || '<tr><td colspan="4">No products found.</td></tr>';
}

window.editProduct = function editProduct(id) {
  const product = state.products.find((entry) => entry.id === id);
  if (!product) return;

  dom.productId.value = product.id;
  dom.productName.value = product.name;
  dom.productPrice.value = product.price;
  dom.productCategory.value = product.category;
  dom.saveProductBtn.textContent = 'Update Product';

  showSection('productsSection');
};

window.deleteProduct = function deleteProduct(id) {
  if (state.orders.some((order) => order.productId === id)) {
    showToast('Cannot delete product with existing orders.', 'error');
    return;
  }

  state.products = state.products.filter((entry) => entry.id !== id);
  persistData();
  refreshAll();
  showToast('Product deleted successfully.', 'success');
};

function renderOrderSelectors() {
  dom.orderCustomer.innerHTML = '<option value="">Select customer</option>' +
    state.customers.map((customer) => `<option value="${customer.id}">${customer.name}</option>`).join('');

  dom.orderProduct.innerHTML = '<option value="">Select product</option>' +
    state.products.map((product) => `<option value="${product.id}">${product.name} (${formatCurrency(product.price)})</option>`).join('');

  dom.orderCustomerFilter.innerHTML = '<option value="all">Filter by customer: All</option>' +
    state.customers.map((customer) => `<option value="${customer.id}">${customer.name}</option>`).join('');
}

function updateOrderTotal() {
  const productId = dom.orderProduct.value;
  const quantity = Math.max(1, Number(dom.orderQuantity.value) || 1);
  const product = state.products.find((entry) => entry.id === productId);

  dom.orderQuantity.value = quantity;
  dom.orderTotal.textContent = formatCurrency(product ? product.price * quantity : 0);
}

function onCreateOrder(event) {
  event.preventDefault();

  const customerId = dom.orderCustomer.value;
  const productId = dom.orderProduct.value;
  const quantity = Number(dom.orderQuantity.value);

  const product = state.products.find((entry) => entry.id === productId);

  if (!customerId || !product || !Number.isFinite(quantity) || quantity < 1) {
    showToast('Please provide valid order details.', 'error');
    return;
  }

  state.orders.push(createOrderRecord(customerId, productId, quantity, new Date().toISOString()));

  dom.orderForm.reset();
  dom.orderQuantity.value = 1;

  persistData();
  refreshAll();
  showToast('Order created successfully.', 'success');
}

window.deleteOrder = function deleteOrder(id) {
  state.orders = state.orders.filter((order) => order.id !== id);
  persistData();
  refreshAll();
  showToast('Order deleted successfully.', 'success');
};

function renderOrders() {
  const filterCustomerId = dom.orderCustomerFilter.value;
  const sortMode = dom.orderSort.value;

  const customerMap = new Map(state.customers.map((customer) => [customer.id, customer.name]));
  const productMap = new Map(state.products.map((product) => [product.id, product.name]));

  const filtered = state.orders.filter((order) => filterCustomerId === 'all' || order.customerId === filterCustomerId);

  filtered.sort((a, b) => {
    if (sortMode === 'dateAsc') return new Date(a.timestamp) - new Date(b.timestamp);
    if (sortMode === 'amountAsc') return a.total - b.total;
    if (sortMode === 'amountDesc') return b.total - a.total;
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  const rows = filtered
    .map((order) => {
      const customerName = customerMap.get(order.customerId) || 'Unknown';
      const productName = productMap.get(order.productId) || 'Unknown';

      return `
        <tr>
          <td>${order.id}</td>
          <td>${customerName}</td>
          <td>${productName}</td>
          <td>${order.quantity}</td>
          <td>${formatCurrency(order.total)}</td>
          <td>${new Date(order.timestamp).toLocaleString()}</td>
          <td><button class="btn btn-danger" onclick="deleteOrder('${order.id}')">Delete</button></td>
        </tr>
      `;
    })
    .join('');

  dom.orderTableBody.innerHTML = rows || '<tr><td colspan="7">No orders found.</td></tr>';
}

function updateDashboard() {
  const totalRevenue = state.orders.reduce((sum, order) => sum + order.total, 0);

  dom.kpiCustomers.textContent = state.customers.length;
  dom.kpiOrders.textContent = state.orders.length;
  dom.kpiRevenue.textContent = formatCurrency(totalRevenue);
  dom.kpiPopular.textContent = getMostPopularProduct();

  renderRevenueChart();
}

function getMostPopularProduct() {
  if (!state.orders.length) return '—';

  const quantitiesByProduct = {};

  state.orders.forEach((order) => {
    quantitiesByProduct[order.productId] = (quantitiesByProduct[order.productId] || 0) + order.quantity;
  });

  const topProductId = Object.entries(quantitiesByProduct).sort((a, b) => b[1] - a[1])[0][0];
  return state.products.find((product) => product.id === topProductId)?.name || 'Unknown';
}

function calculateCustomerSpend() {
  return state.orders.reduce((acc, order) => {
    acc[order.customerId] = (acc[order.customerId] || 0) + order.total;
    return acc;
  }, {});
}

function renderRevenueChart() {
  const grouped = {};

  state.orders.forEach((order) => {
    const day = new Date(order.timestamp).toISOString().split('T')[0];
    grouped[day] = (grouped[day] || 0) + order.total;
  });

  const labels = Object.keys(grouped).sort();
  const values = labels.map((label) => grouped[label]);

  if (state.chart) state.chart.destroy();

  state.chart = new Chart(dom.revenueChart, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Revenue (ZAR)',
        data: values,
        borderColor: '#5c6cff',
        backgroundColor: 'rgba(92, 108, 255, 0.18)',
        fill: true,
        tension: 0.25,
        pointRadius: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

function backupToCloud() {
  // Cloud simulation: exporting JSON mirrors downloading a cloud backup package for off-device storage.
  const payload = {
    exportedAt: new Date().toISOString(),
    data: {
      customers: state.customers,
      products: state.products,
      orders: state.orders,
    },
  };

  downloadFile(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    `sbms-backup-${Date.now()}.json`
  );

  showToast('Backup exported successfully.', 'success');
}

function restoreFromBackup() {
  const file = dom.restoreInput.files[0];
  if (!file) {
    showToast('Please select a JSON backup file.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      // Cloud simulation: importing JSON mirrors recovering app state from cloud backup.
      const parsed = JSON.parse(String(reader.result));
      const data = parsed.data || parsed;

      if (!Array.isArray(data.customers) || !Array.isArray(data.products) || !Array.isArray(data.orders)) {
        throw new Error('Invalid data format');
      }

      state.customers = data.customers;
      state.products = data.products;
      state.orders = data.orders;

      dom.restoreInput.value = '';
      persistData();
      refreshAll();

      showToast('Backup restored successfully.', 'success');
    } catch {
      showToast('Invalid backup file.', 'error');
    }
  };

  reader.readAsText(file);
}

function resetSystem() {
  if (!confirm('Reset system to initial demo state? This will remove current records.')) return;

  seedDemoData();
  persistData();
  refreshAll();
  showToast('System reset complete. Demo data reloaded.', 'success');
}

function exportOrdersCsv() {
  if (!state.orders.length) {
    showToast('No order data available for CSV export.', 'error');
    return;
  }

  const customerMap = new Map(state.customers.map((customer) => [customer.id, customer.name]));
  const productMap = new Map(state.products.map((product) => [product.id, product.name]));

  const header = ['Order ID', 'Customer', 'Product', 'Quantity', 'Total', 'Timestamp'];
  const rows = state.orders.map((order) => [
    order.id,
    customerMap.get(order.customerId) || 'Unknown',
    productMap.get(order.productId) || 'Unknown',
    order.quantity,
    order.total,
    order.timestamp,
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  downloadFile(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `sbms-orders-${Date.now()}.csv`);
  showToast('Orders exported to CSV.', 'success');
}

function downloadFile(blob, filename) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'error' : ''}`;
  toast.textContent = message;
  dom.toastContainer.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  dom.themeToggle.textContent = saved === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
  dom.themeToggle.textContent = next === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
}

function refreshAll() {
  renderCustomers();
  renderProducts();
  renderOrderSelectors();
  updateOrderTotal();
  renderOrders();
  updateDashboard();
}
