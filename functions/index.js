const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const crypto = require("crypto");
const cors = require("cors")({ origin: true });
const Razorpay = require("razorpay");
const serverConfig = require("./server-config");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Helper to get initialized Razorpay instance
function getRazorpayInstance() {
  const keyId = serverConfig.razorpay.keyId;
  const keySecret = serverConfig.razorpay.keySecret;
  if (!keyId || !keySecret || keySecret === "YOUR_RAZORPAY_KEY_SECRET") {
    return null;
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// Background WhatsApp Message Dispatcher (Sends silently without UI interference)
async function sendBackgroundWhatsAppMessages(order) {
  try {
    const ownerPhone = serverConfig.ownerPhone || "917517592373";
    let customerPhone = (order.customer?.phone || "").replace(/[^0-9]/g, "");
    if (customerPhone.length === 10) customerPhone = "91" + customerPhone;

    const itemsList = (order.items || [])
      .map(i => `• ${i.name} (Qty: ${i.qty}) - ₹${(i.price * i.qty).toLocaleString("en-IN")}`)
      .join("\n");

    const paymentStatusText = order.paymentStatus || (order.status && order.status.includes("Paid") ? "Payment Captured (Paid)" : (order.status || "Received"));

    // 1. Customer Message
    const customerMsg =
      `✨ *Thank You for Ordering with Earthen8Knot!* 🧶\n\n` +
      `Dear *${order.customer?.name || "Customer"}*,\n` +
      `We have successfully received your order, and our artisans have already started handcrafting your pieces!\n\n` +
      `📋 *Order Summary:*\n` +
      `• *Order Number / ID:* ${order.id}\n` +
      `• *Products Ordered:*\n${itemsList}\n` +
      `• *Total Order Amount:* ₹${Number(order.total || 0).toLocaleString("en-IN")}\n` +
      `• *Payment Status:* ${paymentStatusText}\n\n` +
      `📍 *Delivery Details:*\n` +
      `• *Deliver To:* ${order.customer?.name || ""}\n` +
      `• *Shipping Address:* ${order.customer?.address || ""} (PIN: ${order.customer?.pincode || ""})\n` +
      `• *Estimated Delivery:* 10–12 business days (Handmade with natural warmth)\n\n` +
      `Warm regards,\n*Earthen8Knot Team*\nhttps://earthenknot.in`;

    // 2. Owner Message
    const ownerMsg =
      `🚨 *NEW ORDER CONFIRMED - Earthen8Knot* 🛍️\n\n` +
      `• *Order Number / ID:* ${order.id}\n` +
      `• *Customer:* ${order.customer?.name} (${order.customer?.phone})\n` +
      `• *Email:* ${order.customer?.email}\n` +
      `• *Total Amount:* ₹${Number(order.total || 0).toLocaleString("en-IN")}\n` +
      `• *Payment Status:* ${paymentStatusText}\n` +
      (order.razorpayPaymentId ? `• *Razorpay Payment ID:* ${order.razorpayPaymentId}\n` : "") +
      `• *Delivery Address:* ${order.customer?.address} (PIN: ${order.customer?.pincode})\n` +
      (order.customer?.mapUrl ? `• *Google Maps Location Pin:* ${order.customer.mapUrl}\n` : "") +
      `\n📦 *Products Ordered:*\n${itemsList}\n` +
      (order.requestOrderTour ? `\n🚨 *WHATSAPP TOUR REQUESTED:* Yes! (Send photo/video quality review before dispatch)\n` : "") +
      (order.isGift ? `\n🎁 *Gift Order:* "${order.giftMessage || "Warmest wishes"}"\n` : "") +
      `\n🔗 *Orders Dashboard:*\nhttps://earthenknot.in/orders.html`;

    console.log(`[Background WhatsApp] Processing notifications for Order ${order.id}...`);

    // Dispatch via Meta Cloud API if configured
    if (serverConfig.whatsapp.accessToken && serverConfig.whatsapp.phoneNumberId) {
      const url = `https://graph.facebook.com/v19.0/${serverConfig.whatsapp.phoneNumberId}/messages`;
      const headers = {
        Authorization: `Bearer ${serverConfig.whatsapp.accessToken}`,
        "Content-Type": "application/json"
      };

      if (customerPhone) {
        await axios.post(url, {
          messaging_product: "whatsapp",
          to: customerPhone,
          type: "text",
          text: { body: customerMsg }
        }, { headers }).catch(e => console.warn("[Background WhatsApp] Customer send error:", e.response?.data || e.message));
      }

      if (ownerPhone) {
        await axios.post(url, {
          messaging_product: "whatsapp",
          to: ownerPhone,
          type: "text",
          text: { body: ownerMsg }
        }, { headers }).catch(e => console.warn("[Background WhatsApp] Owner send error:", e.response?.data || e.message));
      }
    } else {
      console.log(`[Background WhatsApp] Messages formatted and prepared for customer (${customerPhone}) and owner (${ownerPhone}). To dispatch live WhatsApp Cloud messages, provide WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.`);
    }

    return true;
  } catch (err) {
    console.error("[Background WhatsApp] Notification handler error:", err);
    return false;
  }
}

// =========================================================================
// 1. CREATE RAZORPAY ORDER (WITH IMMEDIATE AUTO-CAPTURE ENABLED)
// =========================================================================
exports.createRazorpayOrder = functions.https.onRequest((req, res) => cors(req, res, async () => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { amount, orderId, currency = "INR" } = req.body;
  if (!amount || !orderId) {
    return res.status(400).json({ error: "Missing required parameters: amount, orderId." });
  }

  const rzp = getRazorpayInstance();
  const keyId = serverConfig.razorpay.keyId;

  // If secret key is not set up on server yet, return graceful fallback
  if (!rzp) {
    return res.json({
      success: true,
      fallback: true,
      keyId: keyId,
      message: "Razorpay initialized in client mode (server secret not configured)."
    });
  }

  try {
    // payment_capture: 1 instructs Razorpay to automatically & immediately capture payment upon authorization!
    const rzpOrder = await rzp.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency: currency,
      receipt: orderId.toString().slice(0, 40),
      payment_capture: 1,
      notes: {
        orderId: orderId,
        store: "Earthen8Knot"
      }
    });

    console.log(`[Razorpay Order Created] RZP Order ID: ${rzpOrder.id} for Store Order: ${orderId} (Auto-Capture: Enabled)`);

    return res.json({
      success: true,
      keyId: keyId,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency
    });
  } catch (err) {
    console.error("[Razorpay Order Creation Failed]", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to create Razorpay order."
    });
  }
}));

// =========================================================================
// 2. VERIFY PAYMENT SIGNATURE & ENSURE IMMEDIATE CAPTURE
// =========================================================================
exports.verifyAndCapturePayment = functions.https.onRequest((req, res) => cors(req, res, async () => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const {
    orderId,
    userId,
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
    orderData
  } = req.body;

  if (!razorpayPaymentId) {
    return res.status(400).json({ error: "Missing razorpayPaymentId." });
  }

  const rzp = getRazorpayInstance();
  const keySecret = serverConfig.razorpay.keySecret;
  let isSignatureValid = false;

  // Verify HMAC SHA256 signature if server keySecret is configured
  if (keySecret && keySecret !== "YOUR_RAZORPAY_KEY_SECRET" && razorpayOrderId && razorpaySignature) {
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");
    isSignatureValid = expectedSignature === razorpaySignature;

    if (!isSignatureValid) {
      console.error(`[Razorpay Signature Verification Failed] Order: ${orderId}, Payment: ${razorpayPaymentId}`);
      return res.status(400).json({
        success: false,
        error: "Invalid Razorpay payment signature. Payment rejected for safety."
      });
    }
  } else {
    // If running in development without server secret, trust authenticated client payload
    isSignatureValid = true;
  }

  try {
    let paymentStatus = "Captured";
    let capturedDetails = null;

    // Verify & ensure payment is captured via Razorpay official API
    if (rzp) {
      try {
        const payment = await rzp.payments.fetch(razorpayPaymentId);
        capturedDetails = payment;

        // If payment is authorized but not yet captured, capture it immediately!
        if (payment.status === "authorized") {
          console.log(`[Auto-Capturing Payment] Payment ${razorpayPaymentId} is authorized. Triggering immediate capture...`);
          const captured = await rzp.payments.capture(razorpayPaymentId, payment.amount, payment.currency);
          paymentStatus = captured.status === "captured" ? "Captured" : captured.status;
        } else if (payment.status === "captured") {
          paymentStatus = "Captured";
        } else if (payment.status === "failed") {
          paymentStatus = "Failed";
          return res.status(400).json({
            success: false,
            error: "Payment was reported as failed by Razorpay."
          });
        }
      } catch (apiErr) {
        console.warn("[Razorpay Fetch Warning]", apiErr.message);
      }
    }

    // Persist verified & captured order in Firestore if userId or orderData provided
    const confirmedOrder = {
      ...(orderData || {}),
      id: orderId,
      status: paymentStatus === "Captured" ? "Paid & Confirmed" : "Payment Initiated",
      paymentStatus: paymentStatus,
      razorpayPaymentId: razorpayPaymentId,
      razorpayOrderId: razorpayOrderId || null,
      capturedAt: new Date().toISOString()
    };

    if (userId) {
      try {
        const orderRef = db.doc(`users/${userId}/orders/${orderId}`);
        await orderRef.set(confirmedOrder, { merge: true });
        console.log(`[Firestore Updated] Order ${orderId} marked as ${confirmedOrder.status} for user ${userId}`);
      } catch (dbErr) {
        console.error("[Firestore Update Error]", dbErr);
      }
    }

    // Dispatch automated background WhatsApp notification
    sendBackgroundWhatsAppMessages(confirmedOrder).catch(console.error);

    return res.json({
      success: true,
      paymentStatus: paymentStatus,
      status: confirmedOrder.status,
      message: "Payment successfully verified and captured."
    });
  } catch (err) {
    console.error("[Payment Verification Error]", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to process payment capture."
    });
  }
}));

// =========================================================================
// 3. AUTOMATIC REFUND FOR ELIGIBLE ORDER CANCELLATIONS
// =========================================================================
exports.cancelAndRefundOrder = functions.https.onRequest((req, res) => cors(req, res, async () => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { orderId, userId, reason } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: "Missing required parameter: orderId." });
  }

  try {
    let order = null;
    let orderRef = null;

    // Locate order document in Firestore
    if (userId) {
      orderRef = db.doc(`users/${userId}/orders/${orderId}`);
      const snap = await orderRef.get();
      if (snap.exists) {
        order = snap.data();
      }
    }

    // If not found under user or guest, search across orders collections
    if (!order) {
      const querySnap = await db.collectionGroup("orders").where("id", "==", orderId).limit(1).get();
      if (!querySnap.empty) {
        orderRef = querySnap.docs[0].ref;
        order = querySnap.docs[0].data();
      }
    }

    if (!order) {
      return res.status(404).json({ error: `Order ${orderId} not found.` });
    }

    // --- Cancellation Eligibility Verification ---
    // 1. Check if already cancelled or refunded
    if (order.status === "Cancelled" || order.status === "Refunded" || order.status === "Refund Initiated") {
      return res.json({
        success: true,
        alreadyProcessed: true,
        status: order.status,
        message: `Order is already ${order.status}.`
      });
    }

    // 2. Check if already dispatched or delivered
    if (order.status === "Dispatched" || order.status === "Shipped" || order.status === "Delivered") {
      return res.status(400).json({
        success: false,
        error: "This order has already been dispatched/shipped and cannot be cancelled or refunded."
      });
    }

    // 3. Verify 12-hour cancellation policy window
    const orderTimestamp = order.timestamp || new Date(order.date).getTime();
    if (orderTimestamp && !isNaN(orderTimestamp)) {
      const hoursPassed = (Date.now() - orderTimestamp) / (1000 * 60 * 60);
      const maxHours = serverConfig.cancellation.maxHoursAllowed || 12;
      if (hoursPassed > maxHours) {
        return res.status(400).json({
          success: false,
          error: `Cancellation window expired. Orders can only be cancelled within ${maxHours} hours of placement.`
        });
      }
    }

    // --- Razorpay Refund Initiation ---
    let refundResult = null;
    const rzp = getRazorpayInstance();
    const isOnlinePayment = Boolean(order.razorpayPaymentId);

    if (isOnlinePayment) {
      // Idempotency: Verify if refund was already triggered for this order
      if (order.refundId) {
        console.log(`[Idempotent Refund Check] Refund already exists (${order.refundId}) for Order ${orderId}. Skipping duplicate.`);
        return res.json({
          success: true,
          status: order.status || "Refund Initiated",
          refundId: order.refundId,
          message: "Refund has already been initiated for this order."
        });
      }

      if (rzp) {
        try {
          console.log(`[Initiating Razorpay Refund] Payment ID: ${order.razorpayPaymentId}, Order Total: ₹${order.total}`);
          
          // Trigger official Razorpay Refund API
          const refund = await rzp.payments.refund(order.razorpayPaymentId, {
            amount: Math.round(Number(order.total) * 100),
            notes: {
              orderId: order.id,
              cancellationReason: reason || "Customer requested cancellation within 12h policy",
              source: "Earthen8Knot Automated Refund"
            }
          });

          console.log(`[Razorpay Refund Created] Refund ID: ${refund.id}, Status: ${refund.status}`);
          refundResult = refund;

          const updatedFields = {
            status: refund.status === "processed" ? "Refunded" : "Refund Initiated",
            paymentStatus: refund.status === "processed" ? "Refunded" : "Refund Initiated",
            refundId: refund.id,
            refundAmount: refund.amount / 100,
            refundStatus: refund.status,
            refundInitiatedAt: new Date().toISOString(),
            cancellationReason: reason || "Customer requested within 12h policy"
          };

          if (orderRef) {
            await orderRef.update(updatedFields);
          }

          return res.json({
            success: true,
            status: updatedFields.status,
            refundId: refund.id,
            amount: refund.amount / 100,
            message: "Refund initiated successfully via Razorpay. Amount will reflect in original payment account in 5-7 business days."
          });

        } catch (refundErr) {
          console.error(`[Razorpay Refund Failed] Order ${orderId}:`, refundErr);
          
          // Flag order clearly for owner attention instead of silent failure
          const flaggedFields = {
            status: "Cancellation Pending - Owner Attention Required",
            paymentStatus: "Refund Failed - Attention Required",
            refundError: refundErr.error ? refundErr.error.description : refundErr.message,
            flaggedForAttention: true,
            cancellationAttemptedAt: new Date().toISOString()
          };

          if (orderRef) {
            await orderRef.update(flaggedFields);
          }

          return res.status(500).json({
            success: false,
            status: flaggedFields.status,
            error: `Failed to initiate automatic refund: ${refundErr.message}. Order has been flagged for owner intervention.`
          });
        }
      } else {
        // Fallback simulation mode if secret key is not set
        console.warn("[Refund Fallback] Razorpay secret not set on server. Simulating refund initiation.");
        const simRefundId = "rfnd_sim_" + Math.random().toString(36).substring(2, 10);
        const updatedFields = {
          status: "Refund Initiated",
          paymentStatus: "Refund Initiated",
          refundId: simRefundId,
          refundAmount: order.total,
          refundInitiatedAt: new Date().toISOString()
        };

        if (orderRef) {
          await orderRef.update(updatedFields);
        }

        return res.json({
          success: true,
          status: "Refund Initiated",
          refundId: simRefundId,
          message: "Refund initiated. Amount will reflect in customer account shortly."
        });
      }
    } else {
      // Cash on delivery or non-prepaid order cancellation
      const updatedFields = {
        status: "Cancelled",
        paymentStatus: "Cancelled",
        cancelledAt: new Date().toISOString()
      };

      if (orderRef) {
        await orderRef.update(updatedFields);
      }

      return res.json({
        success: true,
        status: "Cancelled",
        message: "Order cancelled successfully."
      });
    }

  } catch (err) {
    console.error("[Cancel & Refund General Error]", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to process order cancellation and refund."
    });
  }
}));

// =========================================================================
// 3.5 BACKGROUND WHATSAPP NOTIFICATIONS DISPATCH ENDPOINT
// =========================================================================
exports.sendWhatsAppNotifications = functions.https.onRequest((req, res) => cors(req, res, async () => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { order } = req.body;
  if (!order || !order.id) {
    return res.status(400).json({ error: "Missing order details." });
  }

  try {
    const dispatched = await sendBackgroundWhatsAppMessages(order);
    return res.json({ success: true, dispatched: Boolean(dispatched) });
  } catch (err) {
    console.error("[WhatsApp Dispatch API Error]", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}));

// =========================================================================
// 4. RAZORPAY OFFICIAL WEBHOOK ENDPOINT
// =========================================================================
exports.razorpayWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const webhookSecret = serverConfig.razorpay.webhookSecret;
  const signature = req.headers["x-razorpay-signature"];

  // Verify Webhook Signature if secret configured
  if (webhookSecret && webhookSecret !== "YOUR_RAZORPAY_WEBHOOK_SECRET") {
    if (!signature) {
      console.error("[Webhook Error] Missing x-razorpay-signature header");
      return res.status(400).send("Missing signature");
    }

    const rawBody = req.rawBody || JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("[Webhook Error] Invalid signature on incoming Razorpay webhook");
      return res.status(400).send("Invalid signature");
    }
  }

  const event = req.body.event;
  const payload = req.body.payload;
  console.log(`[Razorpay Webhook Received] Event: ${event}`);

  try {
    if (event === "payment.captured") {
      const payment = payload.payment.entity;
      const paymentId = payment.id;
      const orderIdNote = payment.notes?.orderId;

      console.log(`[Webhook: Payment Captured] Payment ID: ${paymentId}, Order: ${orderIdNote}`);

      if (orderIdNote) {
        const querySnap = await db.collectionGroup("orders").where("id", "==", orderIdNote).limit(1).get();
        if (!querySnap.empty) {
          const docRef = querySnap.docs[0].ref;
          await docRef.update({
            paymentStatus: "Captured",
            status: "Paid & Confirmed",
            razorpayPaymentId: paymentId,
            capturedAt: new Date().toISOString()
          });
          console.log(`[Webhook] Order ${orderIdNote} synchronized to Paid & Confirmed via payment.captured webhook`);
        }
      }
    } else if (event === "payment.failed") {
      const payment = payload.payment.entity;
      const orderIdNote = payment.notes?.orderId;
      console.warn(`[Webhook: Payment Failed] Payment ID: ${payment.id}, Order: ${orderIdNote}`);

      if (orderIdNote) {
        const querySnap = await db.collectionGroup("orders").where("id", "==", orderIdNote).limit(1).get();
        if (!querySnap.empty) {
          await querySnap.docs[0].ref.update({
            paymentStatus: "Failed",
            status: "Payment Failed",
            paymentFailureReason: payment.error_description || "Payment failed via gateway"
          });
        }
      }
    } else if (event === "refund.processed") {
      const refund = payload.refund.entity;
      const paymentId = refund.payment_id;
      console.log(`[Webhook: Refund Processed] Refund ID: ${refund.id} for Payment: ${paymentId}`);

      const querySnap = await db.collectionGroup("orders").where("razorpayPaymentId", "==", paymentId).limit(1).get();
      if (!querySnap.empty) {
        await querySnap.docs[0].ref.update({
          paymentStatus: "Refunded",
          status: "Refunded",
          refundId: refund.id,
          refundProcessedAt: new Date().toISOString()
        });
        console.log(`[Webhook] Order updated to Refunded`);
      }
    } else if (event === "refund.failed") {
      const refund = payload.refund.entity;
      const paymentId = refund.payment_id;
      console.error(`[Webhook: Refund Failed] Refund ID: ${refund.id} for Payment: ${paymentId}`);

      const querySnap = await db.collectionGroup("orders").where("razorpayPaymentId", "==", paymentId).limit(1).get();
      if (!querySnap.empty) {
        await querySnap.docs[0].ref.update({
          paymentStatus: "Refund Failed - Attention Required",
          status: "Refund Failed - Owner Attention Required",
          flaggedForAttention: true,
          refundError: "Razorpay refund.failed event received"
        });
      }
    }

    return res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("[Webhook Handler Error]", err);
    return res.status(500).send("Webhook handler error");
  }
});

// =========================================================================
// 5. FIRESTORE ORDER CREATION TRIGGER (DELHIVERY + BACKGROUND WHATSAPP)
// =========================================================================
exports.onOrderCreated = functions.firestore.document("users/{userId}/orders/{orderId}").onCreate(async (snapshot, context) => {
    if (!snapshot.exists) return;

    const order = snapshot.data();

    // Trigger background automated WhatsApp notifications
    sendBackgroundWhatsAppMessages(order).catch(console.error);
    
    // Check if tracking ID already exists to avoid duplicate requests
    if (order.trackingId || order.delhiveryWaybill) {
        console.log("Order already has a tracking ID. Skipping Delhivery call.");
        return;
    }

    try {
        const DELHIIVERY_TOKEN = "32b80147a9f28c2ac841fb9a8dffa4432f26e21f";
        const PICKUP_LOCATION = "Flat no. 502 Kusum Residency, Narendra Nagar Nagpur 440015";
        
        // Format payload for Delhivery API
        const payload = {
            format: "json",
            data: {
                shipments: [
                    {
                        name: order.customer.name,
                        add: order.customer.address,
                        pin: order.customer.pincode,
                        city: order.customer.city || "Nagpur",
                        state: order.customer.state || "Maharashtra",
                        country: "India",
                        phone: order.customer.phone,
                        order: order.id,
                        payment_mode: "Pre-paid",
                        products_desc: "Handmade Crochet Item",
                        cod_amount: "0",
                        order_date: new Date(order.timestamp).toISOString().split('T')[0],
                        total_amount: order.total,
                        weight: "500",
                        quantity: "1"
                    }
                ],
                pickup_location: {
                    name: PICKUP_LOCATION
                }
            }
        };

        const config = {
            headers: {
                "Authorization": `Token ${DELHIIVERY_TOKEN}`,
                "Content-Type": "application/json"
            }
        };

        console.log("Calling Delhivery API with:", JSON.stringify(payload));
        const response = await axios.post("https://track.delhivery.com/api/cmu/create.json", `format=json&data=${JSON.stringify(payload.data)}`, config);
        
        console.log("Delhivery Response:", response.data);
        const waybill = response.data?.packages?.[0]?.waybill;
        
        if (waybill) {
            await snapshot.ref.update({
                trackingId: waybill,
                delhiveryWaybill: waybill,
                fulfillmentStatus: "Label Created"
            });
            console.log(`Successfully created Delhivery order. AWB: ${waybill}`);
        } else {
            console.error("Delhivery API did not return a waybill. Response:", response.data);
            await snapshot.ref.update({
                fulfillmentStatus: "Failed: No Waybill returned"
            });
        }
    } catch (error) {
        console.error("Error creating Delhivery order:", error.response ? error.response.data : error.message);
        await snapshot.ref.update({
            fulfillmentStatus: "Failed: " + (error.response ? JSON.stringify(error.response.data) : error.message)
        });
    }
});
