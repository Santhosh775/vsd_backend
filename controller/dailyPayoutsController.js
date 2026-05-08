const DailyPayout = require('../model/dailyPayoutsModel');
const Payout = require('../model/payoutModel');
const { Op } = require('sequelize');

const VALID_TYPES = ['driver', 'labour', 'farmer', 'supplier', 'third_party'];

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
            status: { [Op.in]: ['paid', 'partial'] }
        };
        if (entityId) {
            where.entity_id = String(entityId);
        }

        const records = await DailyPayout.findAll({
            where,
            order: [['paid_at', 'DESC']],
            attributes: ['dpid', 'reference_key', 'entity_id', 'reference_date', 'amount', 'status', 'paid_at', 'row_data', 'createdAt']
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
 * Revert a paid daily payout row back to pending state.
 * POST /api/v1/daily-payouts/:type/unmark-paid
 * Body: { id|key|reference_key }
 */
const unmarkAsPaid = async (req, res) => {
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
                message: 'Missing id or key in body (unique row identifier)'
            });
        }

        const where = {
            payout_type: type,
            reference_key: String(referenceKey)
        };

        const record = await DailyPayout.findOne({ where });
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Paid daily payout record not found for this row'
            });
        }

        await record.update({
            status: 'pending',
            paid_at: null
        });

        // Keep daily payout + payout in sync.
        try {
            const payoutRecord = await Payout.findOne({ where });
            if (payoutRecord) {
                await payoutRecord.update({
                    status: 'pending',
                    paid_at: null
                });
            }
        } catch (syncErr) {
            console.error('Error syncing daily payout unmark to payouts:', syncErr);
        }

        return res.status(200).json({
            success: true,
            message: 'Daily payout reverted to pending'
        });
    } catch (error) {
        console.error('Error reverting daily payout:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to revert daily payout',
            error: error.message
        });
    }
};

/**
 * Mark daily payout row as partial paid.
 * POST /api/v1/daily-payouts/:type/partial-pay
 * Body: { id|key|reference_key, partial_amount, amount?, note? }
 */
const markPartialPaid = async (req, res) => {
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
        const note = (body.note ?? body.partial_note ?? '').toString().trim();
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
            reference_date: dateStr,
            amount: cumulativePartialAmount,
            status: 'paid',
            paid_at: new Date(),
            row_data: rowData
        };
        const created = !record;
        if (record) {
            await record.update(payload);
        } else {
            record = await DailyPayout.create(payload);
        }

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
                amount: cumulativePartialAmount,
                status: 'paid',
                paid_at: new Date(),
                row_data: rowData
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
            console.error('Error syncing partial daily payout to payouts:', syncErr);
        }

        const row = record.toJSON();
        row.paid_at = row.paid_at ? new Date(row.paid_at).toISOString() : null;
        return res.status(created ? 201 : 200).json({
            success: true,
            message: created ? 'Daily partial payout stored' : 'Daily partial payout updated',
            data: row
        });
    } catch (error) {
        console.error('Error marking partial daily payout:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to mark partial daily payout',
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
    markPartialPaid,
    unmarkAsPaid,
    getPayoutList
};
