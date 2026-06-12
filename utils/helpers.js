const crypto = require('crypto');

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

const generateToken = () => crypto.randomBytes(32).toString('hex');

const paginate = (page, totalPages) => {
  const current = Math.max(1, parseInt(page, 10) || 1);
  const pages = Math.max(1, totalPages);
  const range = [];
  const delta = 2;

  for (let i = Math.max(1, current - delta); i <= Math.min(pages, current + delta); i++) {
    range.push(i);
  }

  return { current, pages, range, hasPrev: current > 1, hasNext: current < pages };
};

const getCategoryLabel = (category) => {
  const labels = {
    technology: 'Technology',
    cultural: 'Cultural',
    workshop: 'Workshop',
    concert: 'Concert',
    hackathon: 'Hackathon',
    sports: 'Sports',
    networking: 'Networking',
    other: 'Other'
  };
  return labels[category] || category;
};

const getStatusBadge = (status) => {
  const badges = {
    draft: 'secondary',
    published: 'success',
    cancelled: 'danger',
    completed: 'info',
    pending: 'warning',
    confirmed: 'success'
  };
  return badges[status] || 'secondary';
};

module.exports = {
  formatCurrency,
  formatDate,
  formatDateTime,
  generateToken,
  paginate,
  getCategoryLabel,
  getStatusBadge
};
