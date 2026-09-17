/**
 * Payment Gateway Configuration for Earthen8Knot
 * 
 * Instructions:
 * 1. Log in to your Razorpay Dashboard: https://dashboard.razorpay.com/app/keys
 * 2. Generate a Key ID in Test Mode (starts with 'rzp_test_...') or Live Mode (starts with 'rzp_live_...')
 * 3. Replace the keyId below with your actual Key ID.
 */

window.RAZORPAY_CONFIG = {
  // Replace this with your Razorpay Key ID (e.g., 'rzp_test_...' or 'rzp_live_...')
  keyId: 'rzp_test_placeholder',
  
  // Store details displayed on the checkout modal
  merchantName: 'Earthen8Knot',
  description: 'Handcrafted Modern Crochet',
  logo: 'assets/logo.png',
  
  // Branding color (Matching Earthen8Knot theme)
  themeColor: '#6c785c',
  
  // Currency
  currency: 'INR'
};
