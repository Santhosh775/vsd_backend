const VegetableAvailability = require('../model/VegetableAvailability');

// Helper to safely parse existing vegetable_history (stored as JSON array or string)
const parseHistory = (raw) => {
  if (!raw) return [];
  try {
    if (Array.isArray(raw)) return raw;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

const createVegetableAvailability = async (req, res) => {
  try {
    const { farmer_id, farmer_name, vegetable_name, from_date, to_date, status } = req.body;

    // Always store a new array with only this entry (no append to old data for any vegetable)
    const currentEntry = {
      vegetable_name,
      from_date,
      to_date
    };
    const vegetable_history = [currentEntry];

    const availability = await VegetableAvailability.create({
      farmer_id,
      farmer_name,
      vegetable_name,
      from_date,
      to_date,
      status,
      vegetable_history
    });

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

const getVegetableHistoryByFarmer = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const availabilities = await VegetableAvailability.findAll({
      where: { farmer_id: farmerId },
      order: [['created_at', 'DESC']],
      attributes: ['id', 'vegetable_name', 'vegetable_history', 'created_at']
    });
    const vegetable_history = availabilities.flatMap((row) => {
      const history = parseHistory(row.vegetable_history);
      return history.map((entry) => ({
        ...entry,
        availability_id: row.id,
        record_created_at: row.created_at
      }));
    });
    res.status(200).json({
      success: true,
      data: { farmer_id: farmerId, vegetable_history }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateVegetableAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const availability = await VegetableAvailability.findByPk(id);
    if (!availability) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    const {
      farmer_id,
      farmer_name,
      vegetable_name,
      from_date,
      to_date,
      status
    } = req.body;

    const nextVegetableName = vegetable_name || availability.vegetable_name;
    const nextFromDate = from_date || availability.from_date;
    const nextToDate = to_date || availability.to_date;

    // Always store a new array with only this entry (no append to old data)
    const currentEntry = {
      vegetable_name: nextVegetableName,
      from_date: nextFromDate,
      to_date: nextToDate
    };
    const vegetable_history = [currentEntry];

    const updatedData = {
      farmer_id: farmer_id !== undefined ? farmer_id : availability.farmer_id,
      farmer_name: farmer_name !== undefined ? farmer_name : availability.farmer_name,
      vegetable_name: nextVegetableName,
      from_date: nextFromDate,
      to_date: nextToDate,
      status: status !== undefined ? status : availability.status,
      vegetable_history
    };

    await availability.update(updatedData);

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
  getVegetableHistoryByFarmer,
  updateVegetableAvailability,
  deleteVegetableAvailability
};
