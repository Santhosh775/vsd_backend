const Payout = require('../model/payoutModel');
const DailyPayout = require('../model/dailyPayoutsModel');
const { Op } = require('sequelize');

const VALID_TYPES = ['farmer', 'supplier', 'third_party', 'labour', 'driver'];

const validateType = (type) => {
    if (!type || !VALID_TYPES.includes(type)) {
        return false;
    }
    return true;
};

const parseRowData = (rowData) => {
    if (!rowData) return {};
    if (typeof rowData === 'string') {
        try {
            return JSON.parse(rowData);
        } catch (e) {
            return {};
        }
    }
    return rowData;
};

const getExistingPartialAmount = (record) => {
    if (!record) return 0;
    const rowData = parseRowData(record.row_data);
    const paymentStatus = String(
        rowData?.paymentStatus ??
        rowData?.status ??
        record?.status ??
        ''
    ).toLowerCase();
    if (paymentStatus !== 'partial') return 0;
    return parseFloat(
        rowData?.partialPaidAmount ??
        rowData?.partial_amount ??
        rowData?.paid_amount ??
        rowData?.amount ??
        record?.amount ??
        0
    ) || 0;
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
                status: { [Op.in]: ['paid', 'partial'] }
            },
            order: [['paid_at', 'DESC']],
            attributes: ['pid', 'reference_key', 'entity_id', 'entity_name', 'entity_code', 'order_id', 'reference_date', 'quantity_kg', 'amount', 'status', 'paid_at', 'row_data', 'createdAt']
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
 * Revert a paid payout row back to pending state.
 * POST /api/v1/payout/:type/unmark-paid
 * Body: { id|key|reference_key }
 */
const unmarkAsPaid = async (req, res) => {
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
                message: 'Missing id or key in body (unique row identifier)'
            });
        }

        const where = {
            payout_type: type,
            reference_key: String(referenceKey)
        };

        const record = await Payout.findOne({ where });
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Paid record not found for this payout row'
            });
        }

        await record.update({
            status: 'pending',
            paid_at: null
        });

        // Keep payout + daily payout in sync.
        try {
            const dailyRecord = await DailyPayout.findOne({ where });
            if (dailyRecord) {
                await dailyRecord.update({
                    status: 'pending',
                    paid_at: null
                });
            }
        } catch (syncErr) {
            console.error('Error syncing payout unmark to daily_payouts:', syncErr);
        }

        return res.status(200).json({
            success: true,
            message: 'Payout reverted to pending'
        });
    } catch (error) {
        console.error('Error reverting payout:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to revert payout',
            error: error.message
        });
    }
};

/**
 * Mark payout row as partial paid.
 * POST /api/v1/payout/:type/partial-pay
 * Body: { id|key|reference_key, partial_amount, amount?, note? }
 */
const markPartialPaid = async (req, res) => {
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
                message: 'Missing id or key in body (unique row identifier)'
            });
        }

        const totalAmount = parseFloat(body.amount ?? body.totalPayout ?? 0) || 0;
        const partialAmount = parseFloat(body.partial_amount ?? body.partialAmount ?? 0) || 0;
        const requestedPartialTotal = parseFloat(body.partial_paid_total);
        if (partialAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Partial amount must be greater than 0'
            });
        }

        const quantityKg = body.quantityKg != null ? parseFloat(body.quantityKg) : (body.quantity_kg != null ? parseFloat(body.quantity_kg) : null);
        const entityId = body.entity_id ?? body.farmerId ?? body.supplierId ?? body.thirdPartyId ?? body.labourId ?? body.driverId ?? null;
        const entityName = body.entity_name ?? body.farmerName ?? body.supplierName ?? body.thirdName ?? body.labourName ?? body.driverName ?? '';
        const entityCode = body.entity_code ?? body.farmerCode ?? body.supplierCode ?? body.thirdCode ?? body.driverCode ?? '';
        const orderId = body.order_id ?? body.orderId ?? null;
        const refDate = body.reference_date ?? body.lastSupplied ?? body.date ?? null;
        const dateStr = refDate ? (typeof refDate === 'string' ? refDate.substring(0, 10) : new Date(refDate).toISOString().split('T')[0]) : null;
        const note = (body.note ?? body.partial_note ?? '').toString().trim();

        let record = await Payout.findOne({
            where: {
                payout_type: type,
                reference_key: String(referenceKey)
            }
        });
        const existingPartialAmount = getExistingPartialAmount(record);
        const cumulativePartialAmount = Number.isFinite(requestedPartialTotal) && requestedPartialTotal > 0
            ? requestedPartialTotal
            : (existingPartialAmount + partialAmount);
        if (totalAmount > 0 && cumulativePartialAmount >= totalAmount) {
            return res.status(400).json({
                success: false,
                message: 'Total partial paid amount must be less than total payout amount'
            });
        }
        const rowData = {
            ...body,
            partialPaidAmount: cumulativePartialAmount,
            partial_amount: cumulativePartialAmount,
            partial_paid_increment: partialAmount,
            remainingAmount: Math.max(totalAmount - cumulativePartialAmount, 0),
            paymentNote: note,
            paymentStatus: 'Partial'
        };

        const payload = {
            payout_type: type,
            reference_key: String(referenceKey),
            entity_id: entityId != null ? String(entityId) : null,
            entity_name: entityName || null,
            entity_code: entityCode || null,
            order_id: orderId != null ? String(orderId) : null,
            reference_date: dateStr,
            quantity_kg: quantityKg,
            amount: cumulativePartialAmount,
            status: 'paid',
            paid_at: new Date(),
            row_data: rowData
        };

        const created = !record;
        if (record) {
            await record.update(payload);
        } else {
            record = await Payout.create(payload);
        }

        try {
            const dailyPayload = {
                payout_type: type,
                reference_key: String(referenceKey),
                entity_id: entityId != null ? String(entityId) : null,
                reference_date: dateStr,
                amount: cumulativePartialAmount,
                status: 'paid',
                paid_at: new Date(),
                row_data: rowData
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
            console.error('Error syncing partial payout to daily_payouts:', syncErr);
        }

        const row = record.toJSON();
        row.paid_at = row.paid_at ? new Date(row.paid_at).toISOString() : null;
        return res.status(created ? 201 : 200).json({
            success: true,
            message: created ? 'Payout partial payment stored' : 'Payout partial payment updated',
            data: row
        });
    } catch (error) {
        console.error('Error marking payout partial payment:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to mark partial payment',
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
    markPartialPaid,
    unmarkAsPaid,
    getPayoutList
};
