const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

exports.onOrderCreated = onDocumentCreated("users/{userId}/orders/{orderId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const order = snapshot.data();
    
    // Check if tracking ID already exists to avoid duplicate requests
    if (order.trackingId || order.delhiveryWaybill) {
        console.log("Order already has a tracking ID. Skipping.");
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
                        city: order.customer.city || "Nagpur", // Add city if missing
                        state: order.customer.state || "Maharashtra", // Add state if missing
                        country: "India",
                        phone: order.customer.phone,
                        order: order.id,
                        payment_mode: "Pre-paid",
                        products_desc: "Handmade Crochet Item",
                        cod_amount: "0",
                        order_date: new Date(order.timestamp).toISOString().split('T')[0],
                        total_amount: order.total,
                        weight: "500", // 500g as provided
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

        // Parse response to get the waybill
        const waybill = response.data?.packages?.[0]?.waybill;
        
        if (waybill) {
            // Update Firestore with the waybill
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
