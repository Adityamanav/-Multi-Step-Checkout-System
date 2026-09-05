(() => {
  'use strict';

  // ===== State =====
  let currentStep = 1;
  const totalSteps = 4;
  const formData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    shipping: 'standard',
    payMethod: 'card',
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  };

  const shippingPrices = {
    standard: 0,
    express: 12,
    overnight: 25
  };

  // ===== DOM =====
  const themeToggle = document.getElementById('themeToggle');
  const progressFill = document.getElementById('progressFill');
  const steps = document.querySelectorAll('.step');
  const formSteps = document.querySelectorAll('.form-step:not(.success-step)');
  const successStep = document.getElementById('stepSuccess');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const formNav = document.getElementById('formNav');
  const shippingCostEl = document.getElementById('shippingCost');
  const grandTotalEl = document.getElementById('grandTotal');

  // ===== Theme =====
  function initTheme() {
    const saved = localStorage.getItem('checkout-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  }

  function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('checkout-theme', next);
  }

  themeToggle.addEventListener('click', toggleTheme);

  // ===== Progress & Steps UI =====
  function updateProgress() {
    const percent = (currentStep / totalSteps) * 100;
    progressFill.style.width = `${percent}%`;

    steps.forEach((step) => {
      const num = parseInt(step.dataset.step, 10);
      step.classList.remove('active', 'completed');
      if (num === currentStep) {
        step.classList.add('active');
      } else if (num < currentStep) {
        step.classList.add('completed');
        step.querySelector('.step-circle').textContent = '✓';
      } else {
        step.querySelector('.step-circle').textContent = num;
      }
    });

    prevBtn.classList.toggle('visible', currentStep > 1);
    nextBtn.textContent = currentStep === totalSteps ? 'Place Order' : 'Continue';
  }

  function showStep(stepNum, direction = 'forward') {
    const currentEl = document.querySelector('.form-step.active');
    const nextEl = document.getElementById(`step${stepNum}`);

    if (currentEl && currentEl !== nextEl) {
      currentEl.classList.add('leaving');
      currentEl.classList.remove('active');

      setTimeout(() => {
        currentEl.classList.remove('leaving');
        currentEl.style.display = 'none';
      }, 280);
    }

    if (nextEl) {
      nextEl.style.display = 'block';
      // Force reflow for animation
      void nextEl.offsetWidth;
      nextEl.classList.add('active');
    }

    // Hide success if going back
    successStep.classList.remove('active');
    successStep.style.display = 'none';
    formNav.style.display = 'flex';

    currentStep = stepNum;
    updateProgress();
  }

  // ===== Validation =====
  function showError(input, message) {
    input.classList.add('error');
    const msg = input.closest('.form-group')?.querySelector('.error-msg');
    if (msg) {
      msg.textContent = message;
      msg.classList.add('show');
    }
  }

  function clearError(input) {
    input.classList.remove('error');
    const msg = input.closest('.form-group')?.querySelector('.error-msg');
    if (msg) {
      msg.textContent = '';
      msg.classList.remove('show');
    }
  }

  function validateStep(step) {
    let valid = true;

    if (step === 1) {
      const fields = ['firstName', 'lastName', 'email', 'phone'];
      fields.forEach((id) => {
        const el = document.getElementById(id);
        clearError(el);
        const val = el.value.trim();
        if (!val) {
          showError(el, 'This field is required');
          valid = false;
        } else if (id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          showError(el, 'Enter a valid email');
          valid = false;
        } else if (id === 'phone' && val.replace(/\D/g, '').length < 8) {
          showError(el, 'Enter a valid phone number');
          valid = false;
        } else {
          formData[id] = val;
        }
      });
    }

    if (step === 2) {
      const fields = ['address', 'city', 'state', 'zip', 'country'];
      fields.forEach((id) => {
        const el = document.getElementById(id);
        clearError(el);
        const val = el.value.trim();
        if (!val) {
          showError(el, 'This field is required');
          valid = false;
        } else {
          formData[id] = val;
        }
      });
      formData.apartment = document.getElementById('apartment').value.trim();
      const shipping = document.querySelector('input[name="shipping"]:checked');
      formData.shipping = shipping ? shipping.value : 'standard';
      updateShippingCost();
    }

    if (step === 3) {
      const method = document.querySelector('input[name="payMethod"]:checked')?.value || 'card';
      formData.payMethod = method;

      if (method === 'card') {
        const fields = [
          { id: 'cardName', test: (v) => v.length >= 2, msg: 'Enter name on card' },
          { id: 'cardNumber', test: (v) => v.replace(/\s/g, '').length >= 15, msg: 'Enter a valid card number' },
          { id: 'expiry', test: (v) => /^\d{2}\/\d{2}$/.test(v), msg: 'Use MM/YY format' },
          { id: 'cvv', test: (v) => /^\d{3,4}$/.test(v), msg: 'Enter a valid CVV' }
        ];
        fields.forEach(({ id, test, msg }) => {
          const el = document.getElementById(id);
          clearError(el);
          const val = el.value.trim();
          if (!val || !test(val)) {
            showError(el, msg);
            valid = false;
          } else {
            formData[id] = val;
          }
        });
      }
    }

    if (step === 4) {
      const terms = document.getElementById('terms');
      if (!terms.checked) {
        terms.focus();
        valid = false;
        // subtle shake
        terms.closest('.checkbox-row').style.animation = 'none';
        void terms.closest('.checkbox-row').offsetWidth;
        terms.closest('.checkbox-row').style.animation = 'shake 0.4s ease';
      }
    }

    return valid;
  }

  // Add shake keyframes dynamically
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }
  `;
  document.head.appendChild(style);

  // ===== Collect & Display Review =====
  function populateReview() {
    document.getElementById('reviewContact').innerHTML = `
      <p><strong>${formData.firstName} ${formData.lastName}</strong></p>
      <p>${formData.email}</p>
      <p>${formData.phone}</p>
    `;

    const shippingLabel = {
      standard: 'Standard (5–7 days) — Free',
      express: 'Express (2–3 days) — $12.00',
      overnight: 'Overnight — $25.00'
    };

    document.getElementById('reviewShipping').innerHTML = `
      <p>${formData.address}${formData.apartment ? ', ' + formData.apartment : ''}</p>
      <p>${formData.city}, ${formData.state} ${formData.zip}</p>
      <p>${document.getElementById('country').selectedOptions[0]?.text || formData.country}</p>
      <p style="margin-top:0.5rem">${shippingLabel[formData.shipping]}</p>
    `;

    let paymentHtml = '';
    if (formData.payMethod === 'card') {
      const last4 = formData.cardNumber.replace(/\s/g, '').slice(-4);
      paymentHtml = `
        <p>Credit Card ending in •••• ${last4}</p>
        <p>${formData.cardName}</p>
        <p>Expires ${formData.expiry}</p>
      `;
    } else {
      paymentHtml = `<p>${formData.payMethod === 'paypal' ? 'PayPal' : 'Apple Pay'}</p>`;
    }
    document.getElementById('reviewPayment').innerHTML = paymentHtml;
  }

  // ===== Shipping Cost =====
  function updateShippingCost() {
    const method = document.querySelector('input[name="shipping"]:checked')?.value || 'standard';
    const cost = shippingPrices[method];
    shippingCostEl.textContent = cost === 0 ? 'Free' : `$${cost.toFixed(2)}`;
    const total = 448 + cost + 35.84;
    grandTotalEl.textContent = `$${total.toFixed(2)}`;
  }

  document.querySelectorAll('input[name="shipping"]').forEach((radio) => {
    radio.addEventListener('change', updateShippingCost);
  });

  // ===== Payment Method Toggle =====
  document.querySelectorAll('input[name="payMethod"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      document.querySelectorAll('.method-card').forEach((c) => c.classList.remove('active'));
      e.target.closest('.method-card').classList.add('active');

      const cardFields = document.getElementById('cardFields');
      const alt = document.getElementById('altPayment');
      if (e.target.value === 'card') {
        cardFields.classList.remove('hidden');
        alt.classList.add('hidden');
      } else {
        cardFields.classList.add('hidden');
        alt.classList.remove('hidden');
      }
    });
  });

  // ===== Input Formatting =====
  const cardNumber = document.getElementById('cardNumber');
  cardNumber.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 16);
    val = val.replace(/(.{4})/g, '$1 ').trim();
    e.target.value = val;
  });

  const expiry = document.getElementById('expiry');
  expiry.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    }
    e.target.value = val;
  });

  const cvv = document.getElementById('cvv');
  cvv.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
  });

  // Clear errors on input
  document.querySelectorAll('input, select').forEach((el) => {
    el.addEventListener('input', () => clearError(el));
    el.addEventListener('change', () => clearError(el));
  });

  // ===== Navigation =====
  nextBtn.addEventListener('click', () => {
    if (!validateStep(currentStep)) return;

    if (currentStep < totalSteps) {
      if (currentStep === 3) populateReview();
      showStep(currentStep + 1);
    } else {
      // Place order
      placeOrder();
    }
  });

  prevBtn.addEventListener('click', () => {
    if (currentStep > 1) {
      showStep(currentStep - 1, 'back');
    }
  });

  // Edit buttons on review
  document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const goto = parseInt(btn.dataset.goto, 10);
      showStep(goto);
    });
  });

  // ===== Place Order =====
  function placeOrder() {
    // Simulate processing
    nextBtn.disabled = true;
    nextBtn.textContent = 'Processing…';

    setTimeout(() => {
      // Hide form steps and nav
      formSteps.forEach((s) => {
        s.classList.remove('active');
        s.style.display = 'none';
      });
      formNav.style.display = 'none';

      // Show success
      document.getElementById('successEmail').textContent = formData.email;
      document.getElementById('orderId').textContent =
        'ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase();

      successStep.style.display = 'block';
      void successStep.offsetWidth;
      successStep.classList.add('active');

      // Mark all steps completed
      steps.forEach((step) => {
        step.classList.remove('active');
        step.classList.add('completed');
        step.querySelector('.step-circle').textContent = '✓';
      });
      progressFill.style.width = '100%';

      nextBtn.disabled = false;
    }, 1200);
  }

  document.getElementById('continueShopping').addEventListener('click', () => {
    // Reset to step 1
    currentStep = 1;
    successStep.classList.remove('active');
    successStep.style.display = 'none';
    formNav.style.display = 'flex';
    showStep(1);
    // Optionally clear forms – for demo we keep data
  });

  // ===== Promo Code (fun) =====
  document.getElementById('applyPromo').addEventListener('click', () => {
    const code = document.getElementById('promoCode').value.trim().toUpperCase();
    if (code === 'SAVE10') {
      alert('Promo applied! 10% off (demo only)');
    } else if (code) {
      alert('Invalid promo code');
    }
  });

  // ===== Init =====
  initTheme();
  updateProgress();
  updateShippingCost();
  showStep(1);
})();