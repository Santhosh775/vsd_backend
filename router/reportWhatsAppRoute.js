// router/reportWhatsAppRoute.js
const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Import models via associations so we can fetch everything in one place
const { OrderAssignment, Order, OrderItem, Farmer, Supplier, ThirdParty } = require('../model/associations');

// ---------- helpers ----------
const cleanText = (str) => {
  if (str === null || str === undefined) return '';
  let s = String(str);
  s = s.replace(/₹/g, 'Rs. ');
  return s.replace(/[^\x00-\x7F]/g, '').trim();
};

const normalizePhoneToWhatsApp = (raw) => {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('91')) return `+${digits}`;
  return `+91${digits}`; // default India; adjust if needed
};

const cleanForMatching = (name) => {
  if (!name) return '';
  return name.replace(/^\d+\s*-\s*/, '').trim();
};

// Fetch order + assignments once (used for all entities)
async function getOrderAndAssignment(orderId) {
  const assignment = await OrderAssignment.findOne({
    where: { order_id: orderId },
    include: [
      {
        model: Order,
        as: 'order',
        include: [
          {
            model: OrderItem,
            as: 'items'
          }
        ]
      }
    ]
  });

  if (!assignment) return null;

  // product_assignments & stage4_data may be stored as JSON/string
  let productAssignments = assignment.product_assignments || [];
  if (typeof productAssignments === 'string') {
    try {
      productAssignments = JSON.parse(productAssignments);
    } catch {
      productAssignments = [];
    }
  }

  let stage4Data = assignment.stage4_data || null;
  if (typeof stage4Data === 'string') {
    try {
      stage4Data = JSON.parse(stage4Data);
    } catch {
      stage4Data = null;
    }
  }

  const stage4ProductRows = stage4Data?.reviewData?.productRows || [];

  return {
    order: assignment.order,
    productAssignments,
    stage4ProductRows
  };
}

// Build assignments + total for a given entity type
function buildAssignmentsForEntity(entityType, entityId, order, productAssignments, stage4ProductRows) {
  const forEntity = productAssignments.filter(
    a => a.entityType === entityType && String(a.entityId) === String(entityId)
  );

  const enriched = forEntity.map(a => {
    const cleanAssignmentProduct = cleanForMatching(a.product);

    // quantity
    let qty = a.assignedQty || 0;
    if (!qty || qty === 0) {
      const matchingItem = order.items?.find(item => {
        const itemProduct = item.product_name || item.product || '';
        const cleanItemProduct = cleanForMatching(itemProduct);
        return cleanItemProduct === cleanAssignmentProduct;
      });
      if (matchingItem) {
        qty = parseFloat(matchingItem.net_weight) || parseFloat(matchingItem.quantity) || 0;
      }
    }

    // price (from assignment or stage4)
    let price = a.price || 0;
    if (!price || price === 0) {
      const stage4Entry = stage4ProductRows.find(s4 => {
        const s4Product = cleanForMatching(s4.product || s4.product_name || '');
        const s4AssignedTo = s4.assignedTo || s4.assigned_to || '';
        const assignedTo = a.assignedTo || '';
        return s4Product === cleanAssignmentProduct && s4AssignedTo === assignedTo;
      });
      if (stage4Entry) {
        price = parseFloat(stage4Entry.price) || 0;
      }
    }

    return { ...a, assignedQty: qty, price };
  });

  const totalAmount = enriched.reduce((sum, a) => {
    const qty = parseFloat(a.assignedQty || 0) || 0;
    const price = parseFloat(a.price || 0) || 0;
    return sum + qty * price;
  }, 0);

  return { assignments: enriched, totalAmount };
}

function buildPdfBuffer({ title, entityLabel, name, order, assignments, totalAmount }) {
  const doc = new jsPDF();

  const orderDate = new Date(order.order_received_date || order.createdAt);
  const fullDate = orderDate.toLocaleDateString('en-GB');

  // Header
  doc.setFillColor(13, 92, 77);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text(title, 105, 12, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`${cleanText(order.oid)} - ${cleanText(name)}`, 105, 22, { align: 'center' });

  // Order Info
  doc.setTextColor(0, 0, 0);
  doc.autoTable({
    startY: 35,
    head: [['Order ID', entityLabel, 'Order Date', 'Total Amount']],
    body: [[
      cleanText(order.oid),
      cleanText(name),
      fullDate,
      cleanText(`Rs. ${totalAmount.toFixed(2)}`)
    ]],
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 10 },
    bodyStyles: { halign: 'center', fontSize: 10, cellPadding: 3 }
  });

  let finalY = doc.lastAutoTable.finalY + 12;

  // Products table
  const productsBody = assignments.map(a => [
    cleanText(a.product || a.productName),
    `${a.assignedQty || 0} kg`,
    `${a.assignedBoxes || 0}`,
    cleanText(`Rs. ${a.price || 0}`),
    cleanText(`Rs. ${((parseFloat(a.assignedQty) || 0) * (parseFloat(a.price) || 0)).toFixed(2)}`)
  ]);

  doc.autoTable({
    startY: finalY + 7,
    head: [['Product', 'Quantity', 'Boxes', 'Price/kg', 'Total']],
    body: productsBody,
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 2 },
    alternateRowStyles: { fillColor: [240, 253, 244] }
  });

  finalY = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(`Grand Total: Rs. ${totalAmount.toFixed(2)}`, 14, finalY);

  return Buffer.from(doc.output('arraybuffer'));
}

// ---------- PDF endpoints (public URL Twilio will hit) ----------

// Farmer
router.get('/farmer/:farmerId/:orderId/pdf', async (req, res) => {
  const { farmerId, orderId } = req.params;
  try {
    const farmer = await Farmer.findByPk(farmerId);
    if (!farmer) return res.status(404).send('Farmer not found');

    const result = await getOrderAndAssignment(orderId);
    if (!result) return res.status(404).send('Order assignment not found');

    const { order, productAssignments, stage4ProductRows } = result;
    const { assignments, totalAmount } = buildAssignmentsForEntity('farmer', farmerId, order, productAssignments, stage4ProductRows);
    if (!assignments.length) return res.status(404).send('No assignments for this farmer');

    const pdfBuffer = buildPdfBuffer({
      title: 'FARMER ORDER DETAILS',
      entityLabel: 'Farmer Name',
      name: farmer.farmer_name,
      order,
      assignments,
      totalAmount
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Farmer_Order_${farmer.farmer_name}_${order.oid}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating PDF');
  }
});

// Supplier
router.get('/supplier/:supplierId/:orderId/pdf', async (req, res) => {
  const { supplierId, orderId } = req.params;
  try {
    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) return res.status(404).send('Supplier not found');

    const result = await getOrderAndAssignment(orderId);
    if (!result) return res.status(404).send('Order assignment not found');

    const { order, productAssignments, stage4ProductRows } = result;
    const { assignments, totalAmount } = buildAssignmentsForEntity('supplier', supplierId, order, productAssignments, stage4ProductRows);
    if (!assignments.length) return res.status(404).send('No assignments for this supplier');

    const pdfBuffer = buildPdfBuffer({
      title: 'SUPPLIER ORDER DETAILS',
      entityLabel: 'Supplier Name',
      name: supplier.supplier_name,
      order,
      assignments,
      totalAmount
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Supplier_Order_${supplier.supplier_name}_${order.oid}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating PDF');
  }
});

// Third party
router.get('/third-party/:thirdPartyId/:orderId/pdf', async (req, res) => {
  const { thirdPartyId, orderId } = req.params;
  try {
    const thirdParty = await ThirdParty.findByPk(thirdPartyId);
    if (!thirdParty) return res.status(404).send('Third party not found');

    const result = await getOrderAndAssignment(orderId);
    if (!result) return res.status(404).send('Order assignment not found');

    const { order, productAssignments, stage4ProductRows } = result;
    const { assignments, totalAmount } = buildAssignmentsForEntity('thirdParty', thirdPartyId, order, productAssignments, stage4ProductRows);
    if (!assignments.length) return res.status(404).send('No assignments for this third party');

    const pdfBuffer = buildPdfBuffer({
      title: 'THIRD PARTY ORDER DETAILS',
      entityLabel: 'Third Party Name',
      name: thirdParty.third_party_name,
      order,
      assignments,
      totalAmount
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="ThirdParty_Order_${thirdParty.third_party_name}_${order.oid}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating PDF');
  }
});

// ---------- WhatsApp send endpoints (called from React) ----------

router.post('/farmer/send-whatsapp', async (req, res) => {
  const { farmerId, orderId } = req.body;
  try {
    const farmer = await Farmer.findByPk(farmerId);
    if (!farmer || !farmer.phone) {
      return res.status(400).json({ success: false, message: 'Farmer phone not found' });
    }

    const phone = normalizePhoneToWhatsApp(farmer.phone);
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Invalid farmer phone' });
    }

    const pdfUrl = `${process.env.BASE_URL}/api/v1/report-whatsapp/farmer/${farmerId}/${orderId}/pdf`;

    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${phone.replace(/^whatsapp:/, '')}`,
      body: `Order ${orderId} details for ${farmer.farmer_name}`,
      mediaUrl: [pdfUrl]
    });

    res.json({ success: true, message: 'WhatsApp sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to send WhatsApp' });
  }
});

router.post('/supplier/send-whatsapp', async (req, res) => {
  const { supplierId, orderId } = req.body;
  try {
    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier || !supplier.phone) {
      return res.status(400).json({ success: false, message: 'Supplier phone not found' });
    }

    const phone = normalizePhoneToWhatsApp(supplier.phone);
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Invalid supplier phone' });
    }

    const pdfUrl = `${process.env.BASE_URL}/api/v1/report-whatsapp/supplier/${supplierId}/${orderId}/pdf`;

    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${phone.replace(/^whatsapp:/, '')}`,
      body: `Order ${orderId} details for ${supplier.supplier_name}`,
      mediaUrl: [pdfUrl]
    });

    res.json({ success: true, message: 'WhatsApp sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to send WhatsApp' });
  }
});

router.post('/third-party/send-whatsapp', async (req, res) => {
  const { thirdPartyId, orderId } = req.body;
  try {
    const thirdParty = await ThirdParty.findByPk(thirdPartyId);
    if (!thirdParty || !thirdParty.phone) {
      return res.status(400).json({ success: false, message: 'Third party phone not found' });
    }

    const phone = normalizePhoneToWhatsApp(thirdParty.phone);
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Invalid third party phone' });
    }

    const pdfUrl = `${process.env.BASE_URL}/api/v1/report-whatsapp/third-party/${thirdPartyId}/${orderId}/pdf`;

    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${phone.replace(/^whatsapp:/, '')}`,
      body: `Order ${orderId} details for ${thirdParty.third_party_name}`,
      mediaUrl: [pdfUrl]
    });

    res.json({ success: true, message: 'WhatsApp sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to send WhatsApp' });
  }
});

module.exports = router;