'use strict';

const STORAGE_KEY = 'sbms_data_v1';
const AUTH_KEY = 'sbms_auth_v1';
const THEME_KEY = 'sbms_theme_v1';
const ADMIN_PASSWORD = 'Admin@123'; // Demo only. In production, never hardcode secrets in frontend code.

const state = {
  customers: [],
  products: [],
  orders: [],
  chart: null,
};

const dom = {};

document.addEventListener('DOMContentLoaded', () => {
  cacheDom();
  attachEvents();
  loadTheme();
  loadData();
  checkAuth();
  refreshAll();
});

function cacheDom() {
  const ids = [
    'toastContainer', 'loginView', 'appView', 'loginForm', 'password', 'logoutBtn', 'themeToggle',
    'kpiCustomers', 'kpiOrders', 'kpiRevenue', 'kpiPopular', 'revenueChart',
    'customerForm', 'customerId', 'customerName', 'customerEmail', 'customerTier', 'customerSearch', 'customerTableBody', 'saveCustomerBtn',
    'productForm', 'productId', 'productName', 'productPrice', 'productCategory', 'productSearch', 'productSort', 'productTableBody', 'saveProductBtn',
    'orderForm', 'orderCustomer', 'orderProduct', 'orderQuantity', 'orderTotal', 'orderTableBody', 'orderCustomerFilter', 'orderSort',
    'backupBtn', 'restoreInput', 'restoreBtn', 'resetBtn', 'exportCsvBtn', 'sectionTitle'
  ];
  ids.forEach((id) => (dom[id] = document.getElementById(id)));
  dom.navLinks = Array.from(document.querySelectorAll('.nav-link'));
  dom.sections = Array.from(document.querySelectorAll('.section'));
}

function attachEvents() {
  dom.loginForm.addEventListener('submit', onLogin);
  dom.logoutBtn.addEventListener('click', logout);
  dom.themeToggle.addEventListener('click', toggleTheme);

  dom.navLinks.forEach((btn) => btn.addEventListener('click', () => showSection(btn.dataset.section)));

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

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state.customers = Array.isArray(parsed.customers) ? parsed.customers : [];
    state.products = Array.isArray(parsed.products) ? parsed.products : [];
    state.orders = Array.isArray(parsed.orders) ? parsed.orders : [];
  } catch {
    showToast('Saved data was corrupted and could not be loaded.', 'error');
  }
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
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(value || 0);
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function onLogin(e) {
  e.preventDefault();
  const entered = sanitizeText(dom.password.value);

  // Authentication is important because it protects business operations and sensitive data from unauthorized users.
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
  const authed = localStorage.getItem(AUTH_KEY) === 'true';
  dom.loginView.classList.toggle('hidden', authed);
  dom.appView.classList.toggle('hidden', !authed);
}

function showSection(sectionId) {
  dom.sections.forEach((s) => s.classList.toggle('active', s.id === sectionId));
  dom.navLinks.forEach((n) => n.classList.toggle('active', n.dataset.section === sectionId));
  dom.sectionTitle.textContent = sectionId.replace('Section', '').replace(/^./, (m) => m.toUpperCase());
}

function onSaveCustomer(e) {
  e.preventDefault();
  const id = dom.customerId.value;
  const name = sanitizeText(dom.customerName.value);
  const email = sanitizeText(dom.customerEmail.value);
  const tier = sanitizeText(dom.customerTier.value);

  // Validation is important to maintain data integrity and reduce security risks (invalid/malicious input).
  if (!name || !email || !tier) return showToast('All customer fields are required.', 'error');

  const duplicate = state.customers.find(
    (c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== id
  );
  if (duplicate) return showToast('Duplicate customer name is not allowed.', 'error');

  if (id) {
    const customer = state.customers.find((c) => c.id === id);
    if (!customer) return;
    customer.name = name;
    customer.email = email;
    customer.tier = tier;
    showToast('Customer updated.', 'success');
  } else {
    state.customers.push({ id: uid('CUST'), name, email, tier });
    showToast('Customer added.', 'success');
  }

  dom.customerForm.reset();
  dom.customerId.value = '';
  dom.saveCustomerBtn.textContent = 'Add Customer';
  persistData();
  refreshAll();
}

function renderCustomers() {
  const term = sanitizeText(dom.customerSearch.value).toLowerCase();
  const customerSpend = calculateCustomerSpend();

  const rows = state.customers
    .filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(term))
    .map((c) => {
      const spend = customerSpend[c.id] || 0;
      const highClass = spend >= 5000 ? 'high-value' : '';
      return `
      <tr>
        <td>${c.id}</td>
        <td>${c.name}</td>
        <td>${c.email}</td>
        <td><span class="badge ${highClass}">${c.tier}${spend >= 5000 ? ' • High Value' : ''}</span></td>
        <td>
          <div class="action-group">
            <button class="btn btn-ghost" onclick="editCustomer('${c.id}')">Edit</button>
            <button class="btn btn-danger" onclick="deleteCustomer('${c.id}')">Delete</button>
          </div>
        </td>
      </tr>`;
    })
    .join('');

  dom.customerTableBody.innerHTML = rows || '<tr><td colspan="5">No customers found.</td></tr>';
}

window.editCustomer = function editCustomer(id) {
  const c = state.customers.find((x) => x.id === id);
  if (!c) return;
  dom.customerId.value = c.id;
  dom.customerName.value = c.name;
  dom.customerEmail.value = c.email;
  dom.customerTier.value = c.tier;
  dom.saveCustomerBtn.textContent = 'Update Customer';
  showSection('customersSection');
};

window.deleteCustomer = function deleteCustomer(id) {
  if (state.orders.some((o) => o.customerId === id)) {
    return showToast('Cannot delete customer with existing orders.', 'error');
  }
  state.customers = state.customers.filter((c) => c.id !== id);
  persistData();
  refreshAll();
  showToast('Customer deleted.', 'success');
};

function onSaveProduct(e) {
  e.preventDefault();
  const id = dom.productId.value;
  const name = sanitizeText(dom.productName.value);
  const category = sanitizeText(dom.productCategory.value);
  const price = Number(dom.productPrice.value);

  if (!name || !category || Number.isNaN(price) || price < 0) {
    return showToast('Please provide valid product fields.', 'error');
  }

  if (id) {
    const p = state.products.find((x) => x.id === id);
    if (!p) return;
    p.name = name;
    p.category = category;
    p.price = +price.toFixed(2);
    showToast('Product updated.', 'success');
  } else {
    state.products.push({ id: uid('PRD'), name, category, price: +price.toFixed(2) });
    showToast('Product added.', 'success');
  }

  dom.productForm.reset();
  dom.productId.value = '';
  dom.saveProductBtn.textContent = 'Add Product';
  persistData();
  refreshAll();
}

function renderProducts() {
  const term = sanitizeText(dom.productSearch.value).toLowerCase();
  const sort = dom.productSort.value;

  const filtered = state.products.filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(term));

  filtered.sort((a, b) => {
    if (sort === 'priceAsc') return a.price - b.price;
    if (sort === 'priceDesc') return b.price - a.price;
    return a.name.localeCompare(b.name);
  });

  const rows = filtered
    .map(
      (p) => `
      <tr>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>${formatCurrency(p.price)}</td>
        <td>
          <div class="action-group">
            <button class="btn btn-ghost" onclick="editProduct('${p.id}')">Edit</button>
            <button class="btn btn-danger" onclick="deleteProduct('${p.id}')">Delete</button>
          </div>
        </td>
      </tr>`
    )
    .join('');

  dom.productTableBody.innerHTML = rows || '<tr><td colspan="4">No products found.</td></tr>';
}

window.editProduct = function editProduct(id) {
  const p = state.products.find((x) => x.id === id);
  if (!p) return;
  dom.productId.value = p.id;
  dom.productName.value = p.name;
  dom.productPrice.value = p.price;
  dom.productCategory.value = p.category;
  dom.saveProductBtn.textContent = 'Update Product';
  showSection('productsSection');
};

window.deleteProduct = function deleteProduct(id) {
  if (state.orders.some((o) => o.productId === id)) {
    return showToast('Cannot delete product with existing orders.', 'error');
  }
  state.products = state.products.filter((p) => p.id !== id);
  persistData();
  refreshAll();
  showToast('Product deleted.', 'success');
};

function renderOrderSelectors() {
  dom.orderCustomer.innerHTML = '<option value="">Select customer</option>' +
    state.customers.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');

  dom.orderProduct.innerHTML = '<option value="">Select product</option>' +
    state.products.map((p) => `<option value="${p.id}">${p.name} (${formatCurrency(p.price)})</option>`).join('');

  dom.orderCustomerFilter.innerHTML = '<option value="all">Filter by customer: All</option>' +
    state.customers.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
}

function updateOrderTotal() {
  const productId = dom.orderProduct.value;
  const qty = Math.max(1, Number(dom.orderQuantity.value) || 1);
  dom.orderQuantity.value = qty;
  const product = state.products.find((p) => p.id === productId);
  const total = product ? product.price * qty : 0;
  dom.orderTotal.textContent = formatCurrency(total);
}

function onCreateOrder(e) {
  e.preventDefault();
  const customerId = dom.orderCustomer.value;
  const productId = dom.orderProduct.value;
  const quantity = Number(dom.orderQuantity.value);

  const product = state.products.find((p) => p.id === productId);
  if (!customerId || !product || !Number.isFinite(quantity) || quantity < 1) {
    return showToast('Provide valid customer, product and quantity.', 'error');
  }

  const total = +(product.price * quantity).toFixed(2);
  state.orders.push({
    id: uid('ORD'),
    customerId,
    productId,
    quantity,
    total,
    timestamp: new Date().toISOString(),
  });

  dom.orderForm.reset();
  dom.orderQuantity.value = 1;
  updateOrderTotal();
  persistData();
  refreshAll();
  showToast('Order created successfully.', 'success');
}

window.deleteOrder = function deleteOrder(id) {
  state.orders = state.orders.filter((o) => o.id !== id);
  persistData();
  refreshAll();
  showToast('Order deleted.', 'success');
};

function renderOrders() {
  const filterCustomer = dom.orderCustomerFilter.value;
  const sort = dom.orderSort.value;

  const customerMap = new Map(state.customers.map((c) => [c.id, c]));
  const productMap = new Map(state.products.map((p) => [p.id, p]));

  const rowsData = state.orders.filter((o) => filterCustomer === 'all' || o.customerId === filterCustomer);

  rowsData.sort((a, b) => {
    if (sort === 'dateAsc') return new Date(a.timestamp) - new Date(b.timestamp);
    if (sort === 'amountAsc') return a.total - b.total;
    if (sort === 'amountDesc') return b.total - a.total;
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  const rows = rowsData
    .map((o) => {
      const customer = customerMap.get(o.customerId)?.name || 'Unknown';
      const product = productMap.get(o.productId)?.name || 'Unknown';
      return `
      <tr>
        <td>${o.id}</td>
        <td>${customer}</td>
        <td>${product}</td>
        <td>${o.quantity}</td>
        <td>${formatCurrency(o.total)}</td>
        <td>${new Date(o.timestamp).toLocaleString()}</td>
        <td><button class="btn btn-danger" onclick="deleteOrder('${o.id}')">Delete</button></td>
      </tr>`;
    })
    .join('');

  dom.orderTableBody.innerHTML = rows || '<tr><td colspan="7">No orders found.</td></tr>';
}

function updateDashboard() {
  const totalRevenue = state.orders.reduce((sum, o) => sum + o.total, 0);
  dom.kpiCustomers.textContent = state.customers.length;
  dom.kpiOrders.textContent = state.orders.length;
  dom.kpiRevenue.textContent = formatCurrency(totalRevenue);
  dom.kpiPopular.textContent = getPopularProductName();
  renderRevenueChart();
}

function getPopularProductName() {
  if (!state.orders.length) return '—';
  const count = {};
  state.orders.forEach((o) => (count[o.productId] = (count[o.productId] || 0) + o.quantity));
  const topId = Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
  return state.products.find((p) => p.id === topId)?.name || 'Unknown';
}

function calculateCustomerSpend() {
  return state.orders.reduce((acc, o) => {
    acc[o.customerId] = (acc[o.customerId] || 0) + o.total;
    return acc;
  }, {});
}

function renderRevenueChart() {
  const daily = {};
  state.orders.forEach((o) => {
    const key = new Date(o.timestamp).toISOString().split('T')[0];
    daily[key] = (daily[key] || 0) + o.total;
  });

  const labels = Object.keys(daily).sort();
  const values = labels.map((l) => daily[l]);

  if (state.chart) state.chart.destroy();

  state.chart = new Chart(dom.revenueChart, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Revenue (ZAR)',
        data: values,
        borderColor: '#2a67f6',
        backgroundColor: 'rgba(42,103,246,0.15)',
        fill: true,
        tension: 0.25,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

function backupToCloud() {
  // This simulates "backup to cloud" by generating a JSON artifact that can be stored externally.
  const payload = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    data: { customers: state.customers, products: state.products, orders: state.orders },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `sbms-backup-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('Backup file exported.', 'success');
}

function restoreFromBackup() {
  const file = dom.restoreInput.files[0];
  if (!file) return showToast('Please choose a backup JSON file.', 'error');

  const reader = new FileReader();
  reader.onload = () => {
    try {
      // This simulates "restore from cloud" by importing a previously exported backup package.
      const payload = JSON.parse(String(reader.result));
      const data = payload.data || payload;
      if (!Array.isArray(data.customers) || !Array.isArray(data.products) || !Array.isArray(data.orders)) {
        throw new Error('Invalid backup structure');
      }
      state.customers = data.customers;
      state.products = data.products;
      state.orders = data.orders;
      persistData();
      refreshAll();
      dom.restoreInput.value = '';
      showToast('Backup restored successfully.', 'success');
    } catch {
      showToast('Backup file is invalid.', 'error');
    }
  };
  reader.readAsText(file);
}

function exportOrdersCsv() {
  if (!state.orders.length) return showToast('No orders available to export.', 'error');
  const customerMap = new Map(state.customers.map((c) => [c.id, c.name]));
  const productMap = new Map(state.products.map((p) => [p.id, p.name]));
  const header = ['Order ID', 'Customer', 'Product', 'Quantity', 'Total', 'Timestamp'];
  const lines = state.orders.map((o) => [
    o.id,
    customerMap.get(o.customerId) || 'Unknown',
    productMap.get(o.productId) || 'Unknown',
    o.quantity,
    o.total,
    o.timestamp,
  ]);

  const csv = [header, ...lines]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `sbms-orders-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('Orders exported as CSV.', 'success');
}

function resetSystem() {
  if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) return;
  state.customers = [];
  state.products = [];
  state.orders = [];
  persistData();
  refreshAll();
  showToast('System reset completed.', 'success');
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'error' : ''}`;
  toast.textContent = message;
  dom.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

function toggleTheme() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', dark ? 'light' : 'dark');
  dom.themeToggle.textContent = dark ? '🌙 Dark Mode' : '☀️ Light Mode';
  localStorage.setItem(THEME_KEY, dark ? 'light' : 'dark');
}

function loadTheme() {
  const theme = localStorage.getItem(THEME_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  dom.themeToggle.textContent = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
}

function refreshAll() {
  renderCustomers();
  renderProducts();
  renderOrderSelectors();
  updateOrderTotal();
  renderOrders();
  updateDashboard();
}
