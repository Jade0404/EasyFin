/* ============================================================
   EASYFIN — AGENT DEMO PAGE JAVASCRIPT
   ============================================================ */

'use strict';

/* ------------------------------------------------------------
   MOCK CUSTOMER DATA
   ------------------------------------------------------------ */
var CUSTOMERS = [
  {
    id: 'c1',
    name: 'Somchai Prakob',
    age: 35,
    income: 45000,
    expenses: 28000,
    dependents: 2,
    currentInsurance: 'AIA Health – IPD only (฿300K/year)\nNo life insurance\nNo CI coverage',
    initials: 'SP',
    score: 65,
    riskProfile: 'Medium',
    surplus: 17000
  },
  {
    id: 'c2',
    name: 'Araya Suthin',
    age: 28,
    income: 32000,
    expenses: 22000,
    dependents: 0,
    currentInsurance: 'Company health insurance (basic)\nNo personal life coverage',
    initials: 'AS',
    score: 72,
    riskProfile: 'Low',
    surplus: 10000
  },
  {
    id: 'c3',
    name: 'Pong Wichit',
    age: 42,
    income: 68000,
    expenses: 38000,
    dependents: 3,
    currentInsurance: 'Bangkok Life – Endowment 15 pay\nAIA Health Plus – IPD/OPD\nNo CI, no accident coverage',
    initials: 'PW',
    score: 78,
    riskProfile: 'Medium',
    surplus: 30000
  },
  {
    id: 'c4',
    name: 'Nina Saelim',
    age: 31,
    income: 52000,
    expenses: 31000,
    dependents: 1,
    currentInsurance: 'Muang Thai Life – Term 20\nNo health insurance\nNo CI coverage',
    initials: 'NS',
    score: 58,
    riskProfile: 'High',
    surplus: 21000
  }
];

/* Product recommendations are the same for all mock customers (demo) */
var PRODUCT_RECS = [
  {
    type: 'Life Insurance',
    name: 'AIA Premier Life',
    company: 'AIA Thailand',
    price: 1450,
    coverage: '5,000,000',
    unit: 'coverage',
    priority: 'high',
    note: 'High priority: Insufficient family protection'
  },
  {
    type: 'Critical Illness',
    name: 'Prudential CriticalCare',
    company: 'Prudential Thailand',
    price: 750,
    coverage: '1,000,000',
    unit: 'lump sum',
    priority: 'medium',
    note: 'Medium priority: No CI coverage detected'
  },
  {
    type: 'Health Insurance',
    name: 'Bangkok Life Health Plus',
    company: 'Bangkok Life Assurance',
    price: 900,
    coverage: '1,000,000/year',
    unit: 'annual',
    priority: 'low',
    note: 'Supplement existing coverage with comprehensive plan'
  }
];

/* Coverage gap data (mocked) */
var COVERAGE_GAPS = [
  { label: 'Life Insurance',      current: 30, recommended: 100, status: 'partial' },
  { label: 'Health Insurance',    current: 55, recommended: 100, status: 'partial' },
  { label: 'Critical Illness',    current: 0,  recommended: 100, status: 'none'    },
  { label: 'Accident / PAB',      current: 20, recommended: 100, status: 'partial' }
];

/* ---- state ---- */
var activeCustomerId = null;
var fmt = (window.EasyFin && window.EasyFin.fmt) || {
  baht: function(n){ return '\u0E3F' + Number(n).toLocaleString('en-US'); }
};

/* ------------------------------------------------------------
   SIDEBAR — BUILD CUSTOMER LIST
   ------------------------------------------------------------ */
function buildSidebar() {
  var list = document.getElementById('customerList');
  if (!list) return;

  list.innerHTML = CUSTOMERS.map(function (c) {
    return [
      '<li class="customer-item" data-id="', c.id, '" role="button" tabindex="0"',
      ' aria-label="View ', c.name, '">',
        '<div class="customer-avatar">', c.initials, '</div>',
        '<div class="customer-info">',
          '<div class="customer-name">', c.name, '</div>',
          '<div class="customer-meta">Age ', c.age, ' &nbsp;|&nbsp; ', fmt.baht(c.income), '/mo</div>',
        '</div>',
      '</li>'
    ].join('');
  }).join('');

  // Bind click + keyboard
  list.querySelectorAll('.customer-item').forEach(function (item) {
    item.addEventListener('click',   function () { loadCustomer(item.dataset.id); });
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') loadCustomer(item.dataset.id);
    });
  });
}

/* ------------------------------------------------------------
   LOAD CUSTOMER INTO MAIN AREA
   ------------------------------------------------------------ */
function loadCustomer(id) {
  var customer = CUSTOMERS.find(function (c) { return c.id === id; });
  if (!customer) return;
  activeCustomerId = id;

  // Highlight sidebar item
  document.querySelectorAll('.customer-item').forEach(function (el) {
    el.classList.toggle('active', el.dataset.id === id);
  });

  // Show results panel, hide empty state
  document.getElementById('emptyState')  && (document.getElementById('emptyState').style.display  = 'none');
  document.getElementById('newCustomerForm') && (document.getElementById('newCustomerForm').style.display = 'none');
  var results = document.getElementById('resultsPanel');
  if (results) {
    results.style.display = 'block';
    renderResults(customer);
  }
}

/* ------------------------------------------------------------
   RENDER FULL RESULTS PANEL
   ------------------------------------------------------------ */
function renderResults(customer) {
  renderProfileHeader(customer);
  renderScoreCard(customer);
  renderCoverageGaps();
  renderRecommendations(customer);
  renderActionBar();
}

/* -- Profile header -- */
function renderProfileHeader(c) {
  var el = document.getElementById('profileHeader');
  if (!el) return;
  el.innerHTML = [
    '<div class="customer-profile-header">',
      '<div class="profile-avatar">', c.initials, '</div>',
      '<div class="profile-info">',
        '<div class="profile-name">', c.name, '</div>',
        '<div class="profile-meta">',
          '<span>Age ', c.age, '</span>',
          '<span>Income: ', fmt.baht(c.income), '/mo</span>',
          '<span>Dependents: ', c.dependents, '</span>',
          '<span>Surplus: ', fmt.baht(c.surplus), '/mo</span>',
        '</div>',
      '</div>',
      '<div class="profile-actions">',
        '<button class="btn btn-ghost btn-sm" onclick="showNewCustomerForm()">Edit</button>',
        '<button class="btn btn-primary btn-sm" onclick="openModal(\'proposalModal\')">Generate Proposal</button>',
      '</div>',
    '</div>'
  ].join('');
}

/* -- Score card with animated ring -- */
function renderScoreCard(c) {
  var el = document.getElementById('scoreCard');
  if (!el) return;

  var score    = c.score;
  var maxScore = 100;
  var circumference = 345; // 2π × 55 ≈ 345
  var offset   = circumference - (score / maxScore) * circumference;

  var ringClass = score >= 70 ? 'green' : score >= 50 ? 'yellow' : 'red';
  var riskClass = c.riskProfile === 'Low' ? 'badge-success' : c.riskProfile === 'Medium' ? 'badge-warning' : 'badge-error';

  el.innerHTML = [
    '<div class="score-card">',
      '<div class="score-card-title">Financial Health Score</div>',
      '<div class="score-ring-container">',
        '<svg class="score-ring" viewBox="0 0 120 120">',
          '<circle class="score-ring-bg"   cx="60" cy="60" r="55"/>',
          '<circle class="score-ring-fill ', ringClass, '" cx="60" cy="60" r="55"',
            ' id="scoreRingFill"',
            ' style="stroke-dasharray:', circumference, '; stroke-dashoffset:', circumference, '"/>',
        '</svg>',
        '<div class="score-number">',
          '<span class="score-val">', score, '</span>',
          '<span class="score-max">/ 100</span>',
        '</div>',
      '</div>',
      '<div class="score-metrics">',
        '<div class="metric-row">',
          '<span class="metric-label">Risk Profile</span>',
          '<span class="badge ', riskClass, '">', c.riskProfile, '</span>',
        '</div>',
        '<div class="metric-row">',
          '<span class="metric-label">Monthly Surplus</span>',
          '<span class="metric-value">', fmt.baht(c.surplus), '</span>',
        '</div>',
        '<div class="metric-row">',
          '<span class="metric-label">Budget for Insurance</span>',
          '<span class="metric-value">', fmt.baht(Math.round(c.surplus * 0.18)), '</span>',
        '</div>',
        '<div class="metric-row">',
          '<span class="metric-label">Coverage Gaps</span>',
          '<span class="metric-value text-warning">2 identified</span>',
        '</div>',
      '</div>',
    '</div>'
  ].join('');

  // Animate ring after render
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      var ring = document.getElementById('scoreRingFill');
      if (ring) ring.style.strokeDashoffset = String(offset);
    });
  });
}

/* -- Coverage gap bars -- */
function renderCoverageGaps() {
  var el = document.getElementById('gapCard');
  if (!el) return;

  var barsHTML = COVERAGE_GAPS.map(function (g) {
    var currentLabel = g.current > 0 ? g.current + '% covered' : 'No coverage';
    return [
      '<div class="gap-bar-row">',
        '<div class="gap-bar-label">',
          '<span>', g.label, '</span>',
          '<span class="gap-bar-sub">', currentLabel, '</span>',
        '</div>',
        '<div class="gap-bar-track">',
          '<div class="gap-bar-fill ', g.status, '"',
            ' style="width: 0%"',
            ' data-width="', g.current, '%">',
          '</div>',
        '</div>',
      '</div>'
    ].join('');
  }).join('');

  el.innerHTML = [
    '<div class="gap-card">',
      '<div class="gap-card-title">',
        'Coverage Gap Analysis',
        '<span class="badge badge-warning">2 gaps found</span>',
      '</div>',
      '<div class="gap-bar-group">', barsHTML, '</div>',
      '<div class="gap-legend">',
        '<div class="gap-legend-item"><div class="gap-legend-dot" style="background:var(--color-success)"></div> Covered</div>',
        '<div class="gap-legend-item"><div class="gap-legend-dot" style="background:var(--color-warning)"></div> Partial</div>',
        '<div class="gap-legend-item"><div class="gap-legend-dot" style="background:var(--color-error)"></div> No coverage</div>',
      '</div>',
    '</div>'
  ].join('');

  // Animate bars
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      el.querySelectorAll('.gap-bar-fill').forEach(function (bar) {
        bar.style.width = bar.dataset.width;
      });
    });
  });
}

/* -- Product recommendation cards -- */
function renderRecommendations(c) {
  var el = document.getElementById('recommendationsSection');
  if (!el) return;

  var totalMonthly = PRODUCT_RECS.reduce(function (sum, r) { return sum + r.price; }, 0);
  var budget       = Math.round(c.surplus * 0.18);

  var cardsHTML = PRODUCT_RECS.map(function (r) {
    return [
      '<div class="rec-card">',
        '<div class="rec-type">', r.type, '</div>',
        '<div class="rec-product-name">', r.name, '</div>',
        '<div class="rec-company">', r.company, '</div>',
        '<div class="rec-pricing">',
          '<span class="rec-price">', fmt.baht(r.price), '</span>',
          '<span class="rec-period">/month</span>',
        '</div>',
        '<div class="rec-coverage">Coverage: ', fmt.baht(r.coverage), ' ', r.unit, '</div>',
        '<div class="rec-note ', r.priority, '">', r.note, '</div>',
      '</div>'
    ].join('');
  }).join('');

  el.innerHTML = [
    '<div class="recommendations-section">',
      '<div class="recommendations-title">',
        'Product Recommendations',
        ' <span style="font-size:14px; color:var(--color-text-muted); font-weight:400;">',
          '— Total: ', fmt.baht(totalMonthly), '/mo',
          ' (Budget: ', fmt.baht(budget), '/mo)',
        '</span>',
      '</div>',
      '<div class="recommendations-grid">', cardsHTML, '</div>',
    '</div>'
  ].join('');
}

/* -- Action bar -- */
function renderActionBar() {
  var el = document.getElementById('actionBar');
  if (!el) return;
  el.innerHTML = [
    '<div class="action-bar">',
      '<button class="btn btn-primary" onclick="openModal(\'proposalModal\')">Generate Proposal</button>',
      '<button class="btn btn-outline-dark">Schedule Follow-up</button>',
      '<button class="btn btn-ghost">Add to Pipeline</button>',
    '</div>'
  ].join('');
}

/* ------------------------------------------------------------
   NEW CUSTOMER FORM
   ------------------------------------------------------------ */
function showNewCustomerForm() {
  document.getElementById('emptyState')      && (document.getElementById('emptyState').style.display = 'none');
  document.getElementById('resultsPanel')    && (document.getElementById('resultsPanel').style.display = 'none');
  var form = document.getElementById('newCustomerForm');
  if (form) form.style.display = 'block';
}

function initCustomerForm() {
  var form = document.getElementById('customerForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var data = {
      id:              'new_' + Date.now(),
      name:            form.querySelector('[name=customerName]').value.trim() || 'New Customer',
      age:             parseInt(form.querySelector('[name=customerAge]').value) || 30,
      income:          parseInt(form.querySelector('[name=customerIncome]').value) || 40000,
      expenses:        parseInt(form.querySelector('[name=customerExpenses]').value) || 25000,
      dependents:      parseInt(form.querySelector('[name=customerDependents]').value) || 0,
      currentInsurance:form.querySelector('[name=currentInsurance]').value || 'None',
      initials: '',
      score: 0,
      riskProfile: '',
      surplus: 0
    };

    // Derive computed fields
    data.initials    = data.name.split(' ').map(function(w){ return w[0]; }).join('').slice(0,2).toUpperCase();
    data.surplus     = data.income - data.expenses;
    data.score       = computeScore(data);
    data.riskProfile = data.score >= 70 ? 'Low' : data.score >= 50 ? 'Medium' : 'High';

    // Add to list and show
    CUSTOMERS.push(data);
    buildSidebar();
    document.getElementById('newCustomerForm').style.display = 'none';
    loadCustomer(data.id);
  });

  form.querySelector('.cancel-form') && form.querySelector('.cancel-form').addEventListener('click', function () {
    document.getElementById('newCustomerForm').style.display = 'none';
    if (!activeCustomerId) {
      document.getElementById('emptyState').style.display = 'flex';
    } else {
      document.getElementById('resultsPanel').style.display = 'block';
    }
  });
}

function computeScore(data) {
  // Simple scoring heuristic for demo
  var score = 50;
  var surplusRatio = data.surplus / data.income;
  if (surplusRatio > 0.4) score += 20;
  else if (surplusRatio > 0.25) score += 12;
  else if (surplusRatio < 0.1) score -= 15;

  if (data.dependents >= 2) score -= 8;
  if (data.age > 40) score -= 5;
  if (data.income > 60000) score += 10;
  if (data.currentInsurance.toLowerCase().indexOf('none') >= 0) score -= 10;

  return Math.max(10, Math.min(95, score));
}

/* ------------------------------------------------------------
   PROPOSAL MODAL CONTENT
   ------------------------------------------------------------ */
function renderProposalModal() {
  var content = document.getElementById('proposalContent');
  if (!content) return;

  var customer = CUSTOMERS.find(function (c) { return c.id === activeCustomerId; }) || CUSTOMERS[0];

  var rows = PRODUCT_RECS.map(function (r) {
    return [
      '<tr>',
        '<td>', r.type, '</td>',
        '<td>', r.name, '</td>',
        '<td>', fmt.baht(r.coverage), '</td>',
        '<td class="text-mono">', fmt.baht(r.price), '/mo</td>',
      '</tr>'
    ].join('');
  }).join('');

  var totalPrice = PRODUCT_RECS.reduce(function (s, r) { return s + r.price; }, 0);

  content.innerHTML = [
    '<div class="proposal-preview">',
      '<div class="proposal-header">',
        '<div>',
          '<h4>Insurance Proposal</h4>',
          '<p>Prepared for: ', customer.name, ' &nbsp;|&nbsp; ', new Date().toLocaleDateString('en-GB'), '</p>',
        '</div>',
        '<div style="text-align:right;">',
          '<div style="font-size:12px; color:rgba(255,255,255,0.6);">Prepared by</div>',
          '<div style="font-weight:700; font-size:14px;">EasyFin Agent Tool</div>',
        '</div>',
      '</div>',
      '<div class="proposal-body">',

        '<div class="proposal-section">',
          '<h5>Customer Summary</h5>',
          '<p style="font-size:14px; color:var(--color-text-muted);">',
            'Age ', customer.age, ' &nbsp;|&nbsp; Monthly Income: ', fmt.baht(customer.income),
            ' &nbsp;|&nbsp; Financial Health Score: <strong>', customer.score, '/100</strong>',
            ' &nbsp;|&nbsp; Risk Profile: <strong>', customer.riskProfile, '</strong>',
          '</p>',
        '</div>',

        '<div class="proposal-section">',
          '<h5>Recommended Coverage Plan</h5>',
          '<table class="proposal-table">',
            '<thead><tr>',
              '<th>Type</th><th>Product</th><th>Coverage</th><th>Premium</th>',
            '</tr></thead>',
            '<tbody>', rows,
            '<tr style="background:var(--color-light-bg); font-weight:700;">',
              '<td colspan="3" style="text-align:right; font-size:13px;">Total Monthly Premium</td>',
              '<td class="text-mono" style="color:var(--color-secondary);">', fmt.baht(totalPrice), '/mo</td>',
            '</tr>',
            '</tbody>',
          '</table>',
        '</div>',

        '<div class="proposal-section">',
          '<h5>Next Steps</h5>',
          '<ol style="font-size:14px; color:var(--color-text-muted); padding-left:20px; line-height:2;">',
            '<li>Review and confirm product selection</li>',
            '<li>Complete health declaration forms</li>',
            '<li>Schedule policy underwriting</li>',
            '<li>Confirm first premium payment</li>',
          '</ol>',
        '</div>',

      '</div>',
    '</div>'
  ].join('');
}

/* ------------------------------------------------------------
   APP TABS (Dashboard / Customers / Analytics / Reports)
   Only Dashboard is active — others show a "coming soon" notice
   ------------------------------------------------------------ */
function initAppTabs() {
  document.querySelectorAll('.app-tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tab = btn.dataset.tab;
      if (tab !== 'dashboard') {
        showToast('The "' + btn.textContent.trim() + '" module is coming soon.');
        return;
      }
      document.querySelectorAll('.app-tab-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });
}

/* showToast is provided by shared.js — no duplicate needed here */

/* ------------------------------------------------------------
   INIT
   ------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', function () {
  buildSidebar();
  initCustomerForm();
  initAppTabs();

  // Proposal modal: render content before opening
  var proposalBtn = document.querySelectorAll('[onclick*="proposalModal"]');
  // We handle via the openModal calls; render when modal opens
  document.getElementById('proposalModal') && document.getElementById('proposalModal').addEventListener('transitionend', function (e) {
    if (e.target === this && this.classList.contains('is-open')) {
      renderProposalModal();
    }
  });

  // "Add Customer" button in sidebar footer
  var addBtn = document.getElementById('addCustomerBtn');
  if (addBtn) addBtn.addEventListener('click', showNewCustomerForm);

  // Load first customer by default
  loadCustomer('c1');
});

/* Expose for inline onclick attributes */
window.openModal       = window.openModal       || function(){};
window.loadCustomer    = loadCustomer;
window.showNewCustomerForm = showNewCustomerForm;
