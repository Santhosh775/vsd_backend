const VegetableAvailability = require('../model/VegetableAvailability');

const createVegetableAvailability = async (req, res) => {
  try {
    const availability = await VegetableAvailability.create(req.body);
    res.status(201).json({ success: true, data: availability });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getVegetableAvailabilityByFarmer = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const availabilities = await VegetableAvailability.findAll({
      where: { farmer_id: farmerId },
      order: [['created_at', 'DESC']]
    });
    res.status(200).json({ success: true, data: availabilities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateVegetableAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await VegetableAvailability.update(req.body, {
      where: { id }
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
    const availability = await VegetableAvailability.findByPk(id);
    res.status(200).json({ success: true, data: availability });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteVegetableAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await VegetableAvailability.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createVegetableAvailability,
  getVegetableAvailabilityByFarmer,
  updateVegetableAvailability,
  deleteVegetableAvailability
};
