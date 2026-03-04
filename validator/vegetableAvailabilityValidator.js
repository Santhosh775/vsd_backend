const validateVegetableAvailability = (req, res, next) => {
  const { farmer_id, farmer_name, vegetable_name, from_date, to_date, status, vegetable_history } = req.body;

  if (!farmer_id || !farmer_name || !vegetable_name || !from_date || !to_date) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }

  if (new Date(from_date) > new Date(to_date)) {
    return res.status(400).json({
      success: false,
      message: 'From date must be before to date'
    });
  }

  if (status && !['Available', 'Unavailable'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status value'
    });
  }

  if (vegetable_history !== undefined && vegetable_history !== null) {
    let history = vegetable_history;
    if (!Array.isArray(history)) {
      if (typeof history === 'string') {
        try {
          const parsed = JSON.parse(history);
          history = Array.isArray(parsed) ? parsed : null;
        } catch {
          history = null;
        }
      } else {
        history = null;
      }
      if (!Array.isArray(history)) {
        return res.status(400).json({
          success: false,
          message: 'vegetable_history must be an array'
        });
      }
    }
    // Attach normalized array so controller receives an array
    req.body.vegetable_history = history;
  }

  next();
};

module.exports = { validateVegetableAvailability };
