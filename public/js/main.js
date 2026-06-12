(function () {
  'use strict';

  // Dark mode toggle
  const themeToggle = () => {
    const html = document.documentElement;
    const current = html.getAttribute('data-bs-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    html.setAttribute('data-bs-theme', next);
    localStorage.setItem('theme', next);

    document.querySelectorAll('.theme-toggle i').forEach((icon) => {
      icon.className = next === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars';
    });
  };

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
  }

  document.querySelectorAll('.theme-toggle').forEach((btn) => {
    btn.addEventListener('click', themeToggle);
    const theme = document.documentElement.getAttribute('data-bs-theme') || 'light';
    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars';
    }
  });

  // Auto-dismiss flash alerts
  document.querySelectorAll('.toast-alert').forEach((alert) => {
    setTimeout(() => {
      const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
      bsAlert.close();
    }, 5000);
  });

  // Loading indicator on form submit
  document.querySelectorAll('form').forEach((form) => {
    form.addEventListener('submit', function () {
      const overlay = document.getElementById('loading-overlay');
      const btn = form.querySelector('.btn-loading');
      if (overlay) overlay.classList.remove('d-none');
      if (btn) {
        btn.disabled = true;
        const text = btn.querySelector('.btn-text');
        if (text) text.textContent = 'Loading...';
      }
    });
  });

  // Confirm password match on register/reset forms
  const confirmField = document.getElementById('confirmPassword');
  const passwordField = document.getElementById('password');
  if (confirmField && passwordField) {
    confirmField.addEventListener('input', () => {
      confirmField.setCustomValidity(
        confirmField.value !== passwordField.value ? 'Passwords do not match' : ''
      );
    });
  }
})();
