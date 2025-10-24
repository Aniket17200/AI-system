const validateUser = (req, res, next) => {
  const { email, shopifyStore, shopifyAccessToken } = req.body;

  if (!email || !shopifyStore || !shopifyAccessToken) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: email, shopifyStore, shopifyAccessToken'
    });
  }

  if (!email.includes('@')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email format'
    });
  }

  next();
};

const validateProductCost = (req, res, next) => {
  const { userId, shopifyProductId, cost } = req.body;

  if (!userId || !shopifyProductId || cost === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: userId, shopifyProductId, cost'
    });
  }

  if (isNaN(cost) || cost < 0) {
    return res.status(400).json({
      success: false,
      error: 'Cost must be a positive number'
    });
  }

  next();
};

const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.body || req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: startDate, endDate'
    });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      success: false,
      error: 'Invalid date format. Use YYYY-MM-DD'
    });
  }

  if (start > end) {
    return res.status(400).json({
      success: false,
      error: 'startDate must be before endDate'
    });
  }

  next();
};

module.exports = { validateUser, validateProductCost, validateDateRange };
