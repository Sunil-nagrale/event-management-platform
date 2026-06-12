const notFound = (req, res, next) => {
  res.status(404).render('errors/404', {
    title: 'Page Not Found',
    layout: 'layouts/main'
  });
};

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

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
