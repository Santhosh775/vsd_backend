const DailyPayout = require('../model/dailyPayoutsModel');
const Payout = require('../model/payoutModel');

const VALID_TYPES = ['driver', 'labour', 'farmer', 'supplier', 'third_party'];

const validateType = (type) => {
    if (!type || !VALID_TYPES.includes(type)) {
        return false;
    }
    return true;
};

/**
 * Get paid records for a payout type (optional filter by entity_id).
 * Frontend uses this to merge paid status into computed payout list.
 * GET /api/v1/daily-payouts/:type/paid?entity_id=123
 */
const getPaidRecords = async (req, res) => {
    try {
        const { type } = req.params;
        const { entity_id: entityId } = req.query;

        if (!validateType(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payout type. Use: driver, labour, farmer, supplier, third_party'
            });
        }

        const where = {
            payout_type: type,
            status: 'paid'
        };
        if (entityId) {
            where.entity_id = String(entityId);
        }

        const records = await DailyPayout.findAll({
            where,
            order: [['paid_at', 'DESC']],
            attributes: ['dpid', 'reference_key', 'entity_id', 'reference_date', 'amount', 'paid_at', 'row_data', 'createdAt']
        });

        const data = records.map((r) => {
            const j = r.toJSON();
            j.paid_at = j.paid_at ? new Date(j.paid_at).toISOString() : null;
            return j;
        });

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error fetching daily payout paid records:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch paid records',
            error: error.message
        });
    }
};

/**
 * Mark a daily payout row as paid and store full table row data.
 * POST /api/v1/daily-payouts/:type/mark-paid
 * Body: full row from frontend (id/key, date, entity_id, amount, totalPayout, basePay, fuelExpenses, etc.)
 */
const markAsPaid = async (req, res) => {
    try {
        const { type } = req.params;
        if (!validateType(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payout type. Use: driver, labour, farmer, supplier, third_party'
            });
        }

        const body = req.body || {};
        const referenceKey = body.id ?? body.key ?? body.reference_key;
        if (!referenceKey) {
            return res.status(400).json({
                success: false,
                message: 'Missing id or key in body (unique row identifier: date for driver, date_entityId for labour, orderId_entityId for farmer/supplier/third_party)'
            });
        }

        const amount = parseFloat(body.amount) ?? parseFloat(body.totalPayout) ?? 0;
        const entityId = body.entity_id ?? body.driverId ?? body.labourId ?? body.farmerId ?? body.supplierId ?? body.thirdPartyId ?? null;
        const refDate = body.reference_date ?? body.date ?? body.orderDate ?? null;
        const dateStr = refDate
            ? (typeof refDate === 'string' ? refDate.substring(0, 10) : new Date(refDate).toISOString().split('T')[0])
            : null;

        let record = await DailyPayout.findOne({
            where: {
                payout_type: type,
                reference_key: String(referenceKey)
            }
        });

        const payload = {
            payout_type: type,
            reference_key: String(referenceKey),
            entity_id: entityId != null ? String(entityId) : null,
            reference_date: dateStr,
            amount: Number.isFinite(amount) ? amount : 0,
            status: 'paid',
            paid_at: new Date(),
            row_data: body
        };

        const created = !record;
        if (record) {
            await record.update(payload);
        } else {
            record = await DailyPayout.create(payload);
        }

        // Sync to Payout so Payout list page shows same paid state (all types)
        try {
            const entityName = body.entity_name ?? body.farmerName ?? body.supplierName ?? body.thirdName ?? body.thirdPartyName ?? body.driverName ?? body.labourName ?? '';
            const entityCode = body.entity_code ?? body.farmerCode ?? body.supplierCode ?? body.thirdCode ?? body.thirdPartyCode ?? body.driverCode ?? body.driver_id ?? body.labourId ?? '';
            const orderId = body.order_id ?? body.orderId ?? null;
            const quantityKg = body.quantity_kg != null ? body.quantity_kg : (body.quantityKg != null ? body.quantityKg : null);
            const payoutPayload = {
                payout_type: type,
                reference_key: String(referenceKey),
                entity_id: entityId != null ? String(entityId) : null,
                entity_name: entityName || null,
                entity_code: entityCode || null,
                order_id: orderId != null ? String(orderId) : null,
                reference_date: dateStr,
                quantity_kg: quantityKg,
                amount: Number.isFinite(amount) ? amount : 0,
                status: 'paid',
                paid_at: new Date(),
                row_data: body
            };
            let payoutRecord = await Payout.findOne({
                where: { payout_type: type, reference_key: String(referenceKey) }
            });
            if (payoutRecord) {
                await payoutRecord.update(payoutPayload);
            } else {
                await Payout.create(payoutPayload);
            }
        } catch (syncErr) {
            console.error('Error syncing daily payout to payouts:', syncErr);
        }

        const row = record.toJSON();
        row.paid_at = row.paid_at ? new Date(row.paid_at).toISOString() : null;

        return res.status(created ? 201 : 200).json({
            success: true,
            message: created ? 'Daily payout marked as paid and stored' : 'Daily payout record updated',
            data: row
        });
    } catch (error) {
        console.error('Error marking daily payout as paid:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to mark daily payout as paid',
            error: error.message
        });
    }
};

/**
 * Get list of daily payouts (optional filter by type and entity_id).
 * GET /api/v1/daily-payouts/list?type=driver&entity_id=5
 */
const getPayoutList = async (req, res) => {
    try {
        const { type, entity_id: entityId } = req.query;
        const where = { status: 'paid' };
        if (type && VALID_TYPES.includes(type)) {
            where.payout_type = type;
        }
        if (entityId) {
            where.entity_id = String(entityId);
        }

        const records = await DailyPayout.findAll({
            where,
            order: [['paid_at', 'DESC']],
            attributes: ['dpid', 'payout_type', 'reference_key', 'entity_id', 'reference_date', 'amount', 'status', 'paid_at', 'row_data', 'createdAt']
        });

        const data = records.map((r) => {
            const j = r.toJSON();
            j.paid_at = j.paid_at ? new Date(j.paid_at).toISOString() : null;
            return j;
        });

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error fetching daily payout list:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch daily payout list',
            error: error.message
        });
    }
};

module.exports = {
    getPaidRecords,
    markAsPaid,
    getPayoutList
};
