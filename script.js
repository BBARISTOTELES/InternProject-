/**
 * BizInvoice - Invoicing & Sales Tracking System
 * Handles invoice creation, dashboard stats, and localStorage persistence
 */

// Storage key for invoices
const STORAGE_KEY = 'bizinvoice_invoices';

// DOM Elements
const invoiceForm = document.getElementById('invoiceForm');
const customerNameInput = document.getElementById('customerName');
const productServiceInput = document.getElementById('productService');
const quantityInput = document.getElementById('quantity');
const priceInput = document.getElementById('price');
const totalAmountInput = document.getElementById('totalAmount');
const invoicesTableBody = document.getElementById('invoicesTableBody');
const emptyState = document.getElementById('emptyState');
const totalRevenueEl = document.getElementById('totalRevenue');
const totalInvoicesEl = document.getElementById('totalInvoices');
const todaySalesEl = document.getElementById('todaySales');

// Get invoices from localStorage
function getInvoices() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Error loading invoices:', e);
        return [];
    }
}

// Save invoices to localStorage
function saveInvoices(invoices) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(amount);
}

// Format date for display
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

// Check if date is today
function isToday(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
}

// Calculate total when quantity or price changes
function updateTotal() {
    const quantity = parseFloat(quantityInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    const total = quantity * price;
    totalAmountInput.value = formatCurrency(total);
}

// Update dashboard summary
function updateDashboard() {
    const invoices = getInvoices();
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const todaySales = invoices
        .filter(inv => isToday(inv.date))
        .reduce((sum, inv) => sum + inv.total, 0);

    totalRevenueEl.textContent = formatCurrency(totalRevenue);
    totalInvoicesEl.textContent = invoices.length;
    todaySalesEl.textContent = formatCurrency(todaySales);
}

// Render invoices table
function renderInvoices() {
    const invoices = getInvoices();

    if (invoices.length === 0) {
        invoicesTableBody.innerHTML = '';
        emptyState.classList.add('visible');
        return;
    }

    emptyState.classList.remove('visible');
    invoicesTableBody.innerHTML = invoices
        .slice()
        .reverse()
        .map((inv, index) => {
            const displayIndex = invoices.length - index;
            return `
                <tr>
                    <td>${displayIndex}</td>
                    <td>${formatDate(inv.date)}</td>
                    <td>${escapeHtml(inv.customerName)}</td>
                    <td>${escapeHtml(inv.productService)}</td>
                    <td>${inv.quantity}</td>
                    <td>${formatCurrency(inv.price)}</td>
                    <td class="total-cell">${formatCurrency(inv.total)}</td>
                    <td>
                        <button type="button" class="btn btn-danger" data-id="${inv.id}">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        })
        .join('');

    // Attach delete handlers
    invoicesTableBody.querySelectorAll('.btn-danger').forEach(btn => {
        btn.addEventListener('click', () => deleteInvoice(btn.dataset.id));
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add new invoice
function addInvoice(customerName, productService, quantity, price) {
    const total = quantity * price;
    const invoice = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        customerName,
        productService,
        quantity,
        price,
        total,
    };

    const invoices = getInvoices();
    invoices.push(invoice);
    saveInvoices(invoices);
}

// Delete invoice
function deleteInvoice(id) {
    let invoices = getInvoices();
    invoices = invoices.filter(inv => inv.id !== id);
    saveInvoices(invoices);
    renderInvoices();
    updateDashboard();
}

// Handle form submit
function handleSubmit(e) {
    e.preventDefault();

    const customerName = customerNameInput.value.trim();
    const productService = productServiceInput.value.trim();
    const quantity = parseFloat(quantityInput.value);
    const price = parseFloat(priceInput.value);

    if (!customerName || !productService || !quantity || !price || quantity < 1 || price < 0) {
        alert('Please fill in all fields with valid values.');
        return;
    }

    addInvoice(customerName, productService, quantity, price);
    renderInvoices();
    updateDashboard();

    // Reset form
    invoiceForm.reset();
    totalAmountInput.value = '$0.00';
    customerNameInput.focus();
}

// Event Listeners
quantityInput.addEventListener('input', updateTotal);
priceInput.addEventListener('input', updateTotal);
invoiceForm.addEventListener('submit', handleSubmit);

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    renderInvoices();
    updateDashboard();
});
