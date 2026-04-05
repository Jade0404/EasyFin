/* ============================================================
   EASYFIN — SME DEMO PAGE JAVASCRIPT
   ============================================================ */

'use strict';

var fmt = (window.EasyFin && window.EasyFin.fmt) || {
  baht:    function(n){ return '\u0E3F' + Number(n).toLocaleString('en-US'); },
  pct:     function(n,d){ return Number(n).toFixed(d !== undefined ? d : 1) + '%'; },
  compact: function(n){ return n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(0)+'K' : String(n); }
};

/* ------------------------------------------------------------
   TAX DATA
   ------------------------------------------------------------ */
var taxState = {
  income:  600000,
  rmf:     0,
  ltf:     0,
  ssf:     0
};

function computeTax(income, rmf, ltf, ssf) {
  var deductions =
    100000          +  // Expense deduction (capped)
    60000           +  // Personal allowance
    rmf             +
    ltf             +
    ssf;

  var taxable = Math.max(0, income - deductions);
  return calcProgressiveTax(taxable);
}

function calcProgressiveTax(taxable) {
  var brackets = [
    { max: 150000,  rate: 0.00 },
    { max: 300000,  rate: 0.05 },
    { max: 500000,  rate: 0.10 },
    { max: 750000,  rate: 0.15 },
    { max: 1000000, rate: 0.20 },
    { max: 2000000, rate: 0.25 },
    { max: 5000000, rate: 0.30 },
    { max: Infinity,rate: 0.35 }
  ];

  var tax = 0;
  var prev = 0;
  for (var i = 0; i < brackets.length; i++) {
    var b = brackets[i];
    if (taxable <= prev) break;
    var chunk = Math.min(taxable, b.max) - prev;
    tax += chunk * b.rate;
    prev = b.max;
  }
  return Math.round(tax);
}

/* ------------------------------------------------------------
   TAX CALCULATOR TAB
   ------------------------------------------------------------ */
function initTaxTab() {
  /* Sync range slider display values */
  ['rmf', 'ltf', 'ssf'].forEach(function(key) {
    var slider = document.getElementById(key + 'Slider');
    var display = document.getElementById(key + 'Display');
    if (!slider || !display) return;

    slider.addEventListener('input', function() {
      taxState[key] = parseInt(slider.value) || 0;
      display.textContent = fmt.baht(taxState[key]);
    });
  });

  /* Income input */
  var incomeInput = document.getElementById('incomeInput');
  if (incomeInput) {
    incomeInput.addEventListener('input', function() {
      taxState.income = parseInt(incomeInput.value.replace(/,/g,'')) || 0;
    });
  }

  /* Calculate button */
  var calcBtn = document.getElementById('calcTaxBtn');
  if (calcBtn) {
    calcBtn.addEventListener('click', function() {
      runTaxCalc();
    });
  }

  /* Run initial calc */
  runTaxCalc();
}

function runTaxCalc() {
  var currentTax   = computeTax(taxState.income, 0, 0, 0);
  var optimizedTax = computeTax(taxState.income, taxState.rmf, taxState.ltf, taxState.ssf);
  var savings      = currentTax - optimizedTax;

  /* Summary numbers */
  setTextContent('currentTaxVal',   fmt.baht(currentTax));
  setTextContent('optimizedTaxVal', fmt.baht(optimizedTax));
  setTextContent('savingsVal',      fmt.baht(savings));

  /* Bar chart widths */
  var maxVal   = Math.max(currentTax, 1);
  var curPct   = 100;
  var optPct   = Math.round((optimizedTax / maxVal) * 100);

  animateBar('currentBar',   curPct,  fmt.baht(currentTax));
  animateBar('optimizedBar', optPct,  fmt.baht(optimizedTax));

  /* Recommendations */
  renderTaxRecs(savings);

  /* Show result panel */
  var panel = document.getElementById('taxResultPanel');
  if (panel) panel.style.display = 'block';
}

function animateBar(id, pct, label) {
  var bar = document.getElementById(id);
  if (!bar) return;
  bar.style.width = '0%';
  bar.textContent = label;
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      bar.style.width = pct + '%';
    });
  });
}

function renderTaxRecs(savings) {
  var el = document.getElementById('taxRecsContainer');
  if (!el) return;

  var recs = [];
  if (taxState.rmf < 50000)
    recs.push('Invest ' + fmt.baht(50000 - taxState.rmf) + ' more in RMF to save up to ' + fmt.baht(Math.round((50000 - taxState.rmf) * 0.15)) + ' in taxes');
  if (taxState.ltf < 30000)
    recs.push('Invest ' + fmt.baht(30000 - taxState.ltf) + ' more in LTF/Thai ESG to save up to ' + fmt.baht(Math.round((30000 - taxState.ltf) * 0.15)) + ' in taxes');
  if (taxState.ssf < 100000)
    recs.push('Top up SSF contribution by ' + fmt.baht(Math.min(100000, 100000 - taxState.ssf)) + ' to maximise deduction');

  if (savings <= 0) {
    recs = ['Your tax is already fully optimised with current contributions.'];
  }

  el.innerHTML = recs.map(function(rec, i) {
    return [
      '<div class="tax-rec-item">',
        '<div class="tax-rec-icon">', i + 1, '</div>',
        rec,
      '</div>'
    ].join('');
  }).join('');
}

/* ------------------------------------------------------------
   PORTFOLIO TAB — PIE CHART + TABLE
   ------------------------------------------------------------ */
var PORTFOLIO_ASSETS = [
  { label: 'Stocks',       pct: 40, color: '#1A7F64' },
  { label: 'Mutual Funds', pct: 30, color: '#E8B931' },
  { label: 'Cash',         pct: 25, color: '#4299E1' },
  { label: 'Crypto',       pct:  5, color: '#9F7AEA' }
];

var HOLDINGS = [
  { ticker: 'KBANK',   name: 'Kasikornbank',      qty: '1,000 shares',  value: 165000, gain:  5.2 },
  { ticker: 'CPALL',   name: 'CP All',             qty: '500 shares',    value:  32500, gain: -2.1 },
  { ticker: 'SCB-RMF', name: 'SCB Equity RMF',    qty: '10,000 units',  value: 120000, gain: 12.3 },
  { ticker: 'BTSGIF',  name: 'BTS Growth Infra',  qty: '5,000 units',   value:  42500, gain:  3.8 }
];

function renderPieChart() {
  var canvas = document.getElementById('pieChart');
  if (!canvas) return;

  /* Build CSS conic-gradient */
  var stops = [];
  var cumulative = 0;
  PORTFOLIO_ASSETS.forEach(function(asset) {
    stops.push(asset.color + ' ' + cumulative + '% ' + (cumulative + asset.pct) + '%');
    cumulative += asset.pct;
  });
  canvas.style.background = 'conic-gradient(' + stops.join(', ') + ')';

  /* Legend */
  var legend = document.getElementById('pieLegend');
  if (!legend) return;
  legend.innerHTML = PORTFOLIO_ASSETS.map(function(a) {
    return [
      '<div class="pie-legend-item">',
        '<div class="pie-legend-left">',
          '<div class="pie-legend-dot" style="background:', a.color, '"></div>',
          a.label,
        '</div>',
        '<span class="pie-legend-pct">', a.pct, '%</span>',
      '</div>'
    ].join('');
  }).join('');
}

function renderHoldingsTable() {
  var tbody = document.getElementById('holdingsBody');
  if (!tbody) return;

  tbody.innerHTML = HOLDINGS.map(function(h) {
    var gainClass = h.gain >= 0 ? 'gain-positive' : 'gain-negative';
    var gainSign  = h.gain >= 0 ? '+' : '';
    return [
      '<tr>',
        '<td><span class="ticker">', h.ticker, '</span></td>',
        '<td>', h.name, '</td>',
        '<td style="color:var(--color-text-muted)">', h.qty, '</td>',
        '<td>', fmt.baht(h.value), '</td>',
        '<td class="', gainClass, '">', gainSign, fmt.pct(h.gain), '</td>',
      '</tr>'
    ].join('');
  }).join('');

  /* Totals */
  var totalValue = HOLDINGS.reduce(function(s, h) { return s + h.value; }, 0);
  setTextContent('holdingsTotalValue', fmt.baht(totalValue));
}

/* ------------------------------------------------------------
   INSURANCE TAB
   ------------------------------------------------------------ */
function renderInsuranceTab() {
  /* Static content is in HTML; nothing to dynamically render here
     beyond any interactive actions */
}

/* ------------------------------------------------------------
   TAB SWITCHING
   ------------------------------------------------------------ */
function initSmeTabs() {
  var tabBtns = document.querySelectorAll('.sme-tab-btn');

  tabBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var target = btn.dataset.tab;

      /* Update button states */
      tabBtns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');

      /* Show/hide panels — set both class and inline display so inline
         styles on initially-hidden panels are correctly overridden */
      document.querySelectorAll('.sme-panel').forEach(function(panel) {
        var isActive = panel.id === target + 'Panel';
        panel.classList.toggle('active', isActive);
        panel.style.display = isActive ? 'block' : 'none';
      });

      /* Lazy-init charts on first show */
      if (target === 'portfolio') renderPieChart();
    });
  });
}

/* ------------------------------------------------------------
   "ADD INVESTMENT" MODAL (simple)
   ------------------------------------------------------------ */
function initAddInvestment() {
  var btn = document.getElementById('addInvestmentBtn');
  if (btn) {
    btn.addEventListener('click', function() {
      window.showToast && showToast('Investment entry form coming in the next release.');
    });
  }
}

/* ------------------------------------------------------------
   DASHBOARD CARD — MINI PIE (CSS only)
   Uses a radial-gradient progress ring for the summary card
   ------------------------------------------------------------ */
function renderDashPie() {
  var el = document.getElementById('dashPie');
  if (!el) return;

  var stops = [];
  var cumulative = 0;
  PORTFOLIO_ASSETS.forEach(function(a) {
    stops.push(a.color + ' ' + cumulative + '% ' + (cumulative + a.pct) + '%');
    cumulative += a.pct;
  });
  el.style.background = 'conic-gradient(' + stops.join(', ') + ')';
}

/* ------------------------------------------------------------
   OPTIMIZE NOW / REVIEW COVERAGE BUTTONS
   ------------------------------------------------------------ */
function initDashButtons() {
  var optimizeBtn = document.getElementById('optimizeNowBtn');
  if (optimizeBtn) {
    optimizeBtn.addEventListener('click', function() {
      /* Switch to Tax tab */
      var taxTabBtn = document.querySelector('[data-tab="tax"]');
      if (taxTabBtn) taxTabBtn.click();
      window.scrollTo({ top: 300, behavior: 'smooth' });
    });
  }

  var reviewBtn = document.getElementById('reviewCoverageBtn');
  if (reviewBtn) {
    reviewBtn.addEventListener('click', function() {
      var insTabBtn = document.querySelector('[data-tab="insurance"]');
      if (insTabBtn) insTabBtn.click();
      window.scrollTo({ top: 300, behavior: 'smooth' });
    });
  }
}

/* ------------------------------------------------------------
   UTILITY
   ------------------------------------------------------------ */
function setTextContent(id, text) {
  var el = document.getElementById(id);
  if (el) el.textContent = text;
}

/* ------------------------------------------------------------
   INIT
   ------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', function() {
  initSmeTabs();
  initTaxTab();
  renderHoldingsTable();
  renderInsuranceTab();
  renderDashPie();
  initAddInvestment();
  initDashButtons();

  /* Run initial tax calc to populate dashboard card */
  runTaxCalc();
});

/* Expose for inline events */
window.runTaxCalc = runTaxCalc;
