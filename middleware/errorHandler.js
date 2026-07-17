const notFound = (req, res, next) => {
  res.status(404).render('errors/404', {
    title: 'Page Not Found',
    layout: 'layouts/main'
  });
};

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'CastError') {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    req.flash('error', 'Invalid resource ID.');
    return res.redirect('/events');
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(statusCode).json({
      success: false,
      message
    });
  }

  res.status(statusCode).render('errors/500', {
    title: 'Server Error',
    layout: 'layouts/main',
    message: process.env.NODE_ENV === 'development' ? message : 'Something went wrong. Please try again later.'
  });
};

module.exports = { notFound, errorHandler };
