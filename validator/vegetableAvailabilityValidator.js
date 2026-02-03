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
    if (!Array.isArray(vegetable_history)) {
      return res.status(400).json({
        success: false,
        message: 'vegetable_history must be an array'
      });
    }
  }

  next();
};

module.exports = { validateVegetableAvailability };
