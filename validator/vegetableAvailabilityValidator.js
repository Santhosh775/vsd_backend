const validateVegetableAvailability = (req, res, next) => {
  const { farmer_id, farmer_name, vegetable_name, from_date, to_date, status } = req.body;

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

  next();
};

module.exports = { validateVegetableAvailability };
