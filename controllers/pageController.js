exports.about = (req, res) => {
  res.render('pages/about', {
    title: 'About Us',
    layout: 'layouts/main'
  });
};

exports.contact = (req, res) => {
  res.render('pages/contact', {
    title: 'Contact Us',
    layout: 'layouts/main'
  });
};

exports.contactSubmit = (req, res) => {
  req.flash('success', 'Thank you for your message! We will get back to you soon.');
  res.redirect('/contact');
};
