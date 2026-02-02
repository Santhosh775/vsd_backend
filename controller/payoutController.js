const Payout = require('../model/payoutModel');
const DailyPayout = require('../model/dailyPayoutsModel');

const VALID_TYPES = ['farmer', 'supplier', 'third_party', 'labour', 'driver'];

const validateType = (type) => {
    if (!type || !VALID_TYPES.includes(type)) {
        return false;
    }
    return true;
};

/**
 * Get paid records for a payout type.
 * Frontend uses this to merge paid status into computed payout list.
 * GET /api/v1/payout/:type/paid
 */
const getPaidRecords = async (req, res) => {
    try {
        const { type } = req.params;
        if (!validateType(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payout type. Use: farmer, supplier, third_party, labour, driver'
            });
        }

        const records = await Payout.findAll({
            where: {
                payout_type: type,
                status: 'paid'
            },
            order: [['paid_at', 'DESC']],
            attributes: ['pid', 'reference_key', 'entity_id', 'entity_name', 'entity_code', 'order_id', 'reference_date', 'quantity_kg', 'amount', 'paid_at', 'row_data', 'createdAt']
        });

        const data = records.map((r) => {
            const j = r.toJSON();
            j.paid_at = j.paid_at ? new Date(j.paid_at).toISOString() : null;
            return j;
        });

        return res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error fetching paid records:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch paid records',
            error: error.message
        });
    }
};

/**
 * Mark a payout row as paid and store full row data.
 * POST /api/v1/payout/:type/mark-paid
 * Body: full row from frontend table (id/key, entity name/code, amount, quantityKg, lastSupplied/date, etc.)
 */
const markAsPaid = async (req, res) => {
    try {
        const { type } = req.params;
        if (!validateType(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payout type. Use: farmer, supplier, third_party, labour, driver'
            });
        }

        const body = req.body || {};
        const referenceKey = body.id ?? body.key ?? body.reference_key;
        if (!referenceKey) {
            return res.status(400).json({
                success: false,
                message: 'Missing id or key in body (unique row identifier, e.g. orderId_entityId or date_entityId)'
            });
        }

        const amount = parseFloat(body.amount) || 0;
        const quantityKg = body.quantityKg != null ? parseFloat(body.quantityKg) : (body.quantity_kg != null ? parseFloat(body.quantity_kg) : null);
        const entityId = body.entity_id ?? body.farmerId ?? body.supplierId ?? body.thirdPartyId ?? body.labourId ?? body.driverId ?? null;
        const entityName = body.entity_name ?? body.farmerName ?? body.supplierName ?? body.thirdName ?? body.labourName ?? body.driverName ?? '';
        const entityCode = body.entity_code ?? body.farmerCode ?? body.supplierCode ?? body.thirdCode ?? body.driverCode ?? '';
        const orderId = body.order_id ?? body.orderId ?? null;
        const refDate = body.reference_date ?? body.lastSupplied ?? body.date ?? null;
        const dateStr = refDate ? (typeof refDate === 'string' ? refDate.substring(0, 10) : new Date(refDate).toISOString().split('T')[0]) : null;

        let record = await Payout.findOne({
            where: {
                payout_type: type,
                reference_key: String(referenceKey)
            }
        });

        const payload = {
            payout_type: type,
            reference_key: String(referenceKey),
            entity_id: entityId != null ? String(entityId) : null,
            entity_name: entityName || null,
            entity_code: entityCode || null,
            order_id: orderId != null ? String(orderId) : null,
            reference_date: dateStr,
            quantity_kg: quantityKg,
            amount: amount,
            status: 'paid',
            paid_at: new Date(),
            row_data: body
        };

        const created = !record;
        if (record) {
            await record.update(payload);
        } else {
            record = await Payout.create(payload);
        }

        // Sync to DailyPayout so Daily Payout page shows same paid state (all types)
        try {
            const dailyPayload = {
                payout_type: type,
                reference_key: String(referenceKey),
                entity_id: entityId != null ? String(entityId) : null,
                reference_date: dateStr,
                amount: amount,
                status: 'paid',
                paid_at: new Date(),
                row_data: body
            };
            let dailyRecord = await DailyPayout.findOne({
                where: { payout_type: type, reference_key: String(referenceKey) }
            });
            if (dailyRecord) {
                await dailyRecord.update(dailyPayload);
            } else {
                await DailyPayout.create(dailyPayload);
            }
        } catch (syncErr) {
            console.error('Error syncing payout to daily_payouts:', syncErr);
        }

        const row = record.toJSON();
        row.paid_at = row.paid_at ? new Date(row.paid_at).toISOString() : null;

        return res.status(created ? 201 : 200).json({
            success: true,
            message: created ? 'Payout marked as paid and stored' : 'Payout record updated',
            data: row
        });
    } catch (error) {
        console.error('Error marking payout as paid:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to mark payout as paid',
            error: error.message
        });
    }
};

/**
 * Get all payouts (optional: filter by type) for admin/list view.
 * GET /api/v1/payout/list?type=farmer
 */
const getPayoutList = async (req, res) => {
    try {
        const { type } = req.query;
        const where = { status: 'paid' };
        if (type && VALID_TYPES.includes(type)) {
            where.payout_type = type;
        }

        const records = await Payout.findAll({
            where,
            order: [['paid_at', 'DESC']],
            attributes: ['pid', 'payout_type', 'reference_key', 'entity_id', 'entity_name', 'entity_code', 'order_id', 'reference_date', 'quantity_kg', 'amount', 'status', 'paid_at', 'row_data', 'createdAt']
        });

        const data = records.map((r) => {
            const j = r.toJSON();
            j.paid_at = j.paid_at ? new Date(j.paid_at).toISOString() : null;
            return j;
        });

        return res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error fetching payout list:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch payout list',
            error: error.message
        });
    }
};

module.exports = {
    getPaidRecords,
    markAsPaid,
    getPayoutList
};
