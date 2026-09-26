/**
 * Server-Side Configuration for EarthenKnot
 * 
 * Keep this file on the server / Firebase Functions only!
 * Never expose these secrets to client-side frontend code.
 */

module.exports = {
  // Razorpay API Credentials
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_live_TdO9wjpeo1fyUX',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_RAZORPAY_KEY_SECRET',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'YOUR_RAZORPAY_WEBHOOK_SECRET',
    autoCapture: true // Automatically capture payments immediately
  },

  // Owner Notifications
  ownerPhone: '917517592373',
  ownerEmail: 'earthen8knot@gmail.com',

  // Order Cancellation Policy
  cancellation: {
    maxHoursAllowed: 12 // Maximum 12 hours from order placement
  },

  // WhatsApp Gateway Configuration (Optional - Meta Cloud API or Twilio)
  whatsapp: {
    provider: process.env.WHATSAPP_PROVIDER || 'cloud_api', // 'cloud_api' | 'twilio' | 'webhook'
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || ''
  }
};
