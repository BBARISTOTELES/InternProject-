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
const avgInvoiceEl = document.getElementById('avgInvoice');

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

// Format currency (Philippine Peso)
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
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
    const avgInvoice = invoices.length > 0 ? totalRevenue / invoices.length : 0;

    totalRevenueEl.textContent = formatCurrency(totalRevenue);
    totalInvoicesEl.textContent = invoices.length;
    todaySalesEl.textContent = formatCurrency(todaySales);
    avgInvoiceEl.textContent = formatCurrency(avgInvoice);
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
    totalAmountInput.value = '₱0.00';
    customerNameInput.focus();
}

// Event Listeners
quantityInput.addEventListener('input', updateTotal);
priceInput.addEventListener('input', updateTotal);
invoiceForm.addEventListener('submit', handleSubmit);

// Scroll-based gray ombre effect
function updateOmbre() {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0;

    // Interpolate gray shades: darker at top, lighter as you scroll down
    const grays = [
        { r: 10, g: 10, b: 10 },
        { r: 20, g: 20, b: 20 },
        { r: 35, g: 35, b: 35 },
        { r: 50, g: 50, b: 50 },
        { r: 30, g: 30, b: 30 },
    ];
    const graysEnd = [
        { r: 25, g: 25, b: 25 },
        { r: 45, g: 45, b: 45 },
        { r: 65, g: 65, b: 65 },
        { r: 85, g: 85, b: 85 },
        { r: 55, g: 55, b: 55 },
    ];

    const lerp = (a, b, t) => Math.round(a + (b - a) * t);
    const toHex = (r, g, b) => `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;

    document.body.style.setProperty('--ombr-1', toHex(
        lerp(grays[0].r, graysEnd[0].r, progress),
        lerp(grays[0].g, graysEnd[0].g, progress),
        lerp(grays[0].b, graysEnd[0].b, progress)
    ));
    document.body.style.setProperty('--ombr-2', toHex(
        lerp(grays[1].r, graysEnd[1].r, progress),
        lerp(grays[1].g, graysEnd[1].g, progress),
        lerp(grays[1].b, graysEnd[1].b, progress)
    ));
    document.body.style.setProperty('--ombr-3', toHex(
        lerp(grays[2].r, graysEnd[2].r, progress),
        lerp(grays[2].g, graysEnd[2].g, progress),
        lerp(grays[2].b, graysEnd[2].b, progress)
    ));
    document.body.style.setProperty('--ombr-4', toHex(
        lerp(grays[3].r, graysEnd[3].r, progress),
        lerp(grays[3].g, graysEnd[3].g, progress),
        lerp(grays[3].b, graysEnd[3].b, progress)
    ));
    document.body.style.setProperty('--ombr-5', toHex(
        lerp(grays[4].r, graysEnd[4].r, progress),
        lerp(grays[4].g, graysEnd[4].g, progress),
        lerp(grays[4].b, graysEnd[4].b, progress)
    ));
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    renderInvoices();
    updateDashboard();
    updateOmbre();
});

window.addEventListener('scroll', updateOmbre);
window.addEventListener('resize', updateOmbre);
