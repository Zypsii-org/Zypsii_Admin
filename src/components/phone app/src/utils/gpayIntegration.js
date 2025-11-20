import { Linking, Platform, Alert } from 'react-native';

/**
 * GPay Integration Utility
 * Handles GPay deep linking and payment flow
 */

// Payment app schemes in order of preference
const PAYMENT_SCHEMES = [
  'upi://pay',           // Universal UPI intent
  'gpay://upi/pay',      // Direct GPay
  'phonepe://pay',       // PhonePe fallback
  'paytm://pay'          // Paytm fallback
];

/**
 * Opens GPay with payment details
 * @param {Object} paymentDetails - Payment information
 * @param {number} paymentDetails.amount - Amount to pay
 * @param {string} paymentDetails.recipientName - Name of recipient
 * @param {string} paymentDetails.recipientUpi - UPI ID of recipient (optional)
 * @param {string} paymentDetails.note - Payment note (optional)
 * @returns {Promise<boolean>} - Whether GPay was opened successfully
 */
export const openGPay = async (paymentDetails) => {
  try {
    const { amount, recipientName, recipientUpi, note = 'Splitwise Payment' } = paymentDetails;
    
    // Build payment URL with minimal parameters
    const params = new URLSearchParams({
      pa: recipientUpi || recipientName, // UPI ID or name
      pn: recipientName, // Payee name
      am: amount.toString(), // Amount
      cu: 'INR', // Currency
      tn: note, // Transaction note
    });
    
    // Use Android Intent approach for better app switching
    if (Platform.OS === 'android') {
      // For Android, use a more specific intent that prevents immediate return
      const androidIntentUrl = `intent://pay?${params.toString()}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
      console.log('Opening Android intent:', androidIntentUrl);
      
      try {
        await Linking.openURL(androidIntentUrl);
        console.log('Android intent opened successfully');
        return true;
      } catch (androidError) {
        console.log('Android intent failed, trying UPI:', androidError);
      }
    }
    
    // Fallback to UPI intent
    const upiUrl = `upi://pay?${params.toString()}`;
    console.log('Opening UPI payment:', upiUrl);
    
    await Linking.openURL(upiUrl);
    console.log('UPI payment opened successfully');
    return true;
    
  } catch (error) {
    console.error('Error in openGPay:', error);
    
    // Final fallback to direct GPay
    try {
      const gpayUrl = `gpay://upi/pay?${params.toString()}`;
      console.log('Trying direct GPay:', gpayUrl);
      await Linking.openURL(gpayUrl);
      console.log('Direct GPay opened successfully');
      return true;
    } catch (gpayError) {
      console.log('All payment methods failed:', gpayError);
      await showGPayInstallPrompt();
      return false;
    }
  }
};

/**
 * Shows prompt to install GPay if not installed
 */
export const showGPayInstallPrompt = async () => {
  const gpayStoreUrl = Platform.OS === 'ios' 
    ? 'https://apps.apple.com/app/gpay/id1193357041'
    : 'https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user';
  
  Alert.alert(
    'GPay Not Installed',
    'GPay is not installed on your device. Would you like to install it?',
    [
      {
        text: 'Install GPay',
        onPress: () => Linking.openURL(gpayStoreUrl)
      },
      {
        text: 'Cancel',
        style: 'cancel'
      }
    ]
  );
};

/**
 * Payment status constants
 */
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAYMENT_SENT: 'payment_sent',
  CONFIRMATION_REQUESTED: 'confirmation_requested',
  WAITING_CONFIRMATION: 'waiting_confirmation',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed'
};

/**
 * Payment flow manager class
 */
export class PaymentFlowManager {
  constructor() {
    this.paymentStatuses = new Map();
    this.pendingConfirmations = new Map();
    this.listeners = new Set();
  }

  /**
   * Get payment status for a balance
   * @param {string} balanceId - Balance identifier
   * @returns {string} - Payment status
   */
  getPaymentStatus(balanceId) {
    return this.paymentStatuses.get(balanceId) || PAYMENT_STATUS.PENDING;
  }

  /**
   * Set payment status for a balance
   * @param {string} balanceId - Balance identifier
   * @param {string} status - Payment status
   */
  setPaymentStatus(balanceId, status) {
    this.paymentStatuses.set(balanceId, status);
    this.notifyListeners();
  }

  /**
   * Add pending confirmation
   * @param {string} balanceId - Balance identifier
   * @param {Object} confirmation - Confirmation details
   */
  addPendingConfirmation(balanceId, confirmation) {
    this.pendingConfirmations.set(balanceId, {
      ...confirmation,
      requestedAt: new Date()
    });
    this.notifyListeners();
  }

  /**
   * Remove pending confirmation
   * @param {string} balanceId - Balance identifier
   */
  removePendingConfirmation(balanceId) {
    this.pendingConfirmations.delete(balanceId);
    this.notifyListeners();
  }

  /**
   * Get all pending confirmations
   * @returns {Map} - Pending confirmations
   */
  getPendingConfirmations() {
    return this.pendingConfirmations;
  }

  /**
   * Add listener for payment status changes
   * @param {Function} listener - Listener function
   */
  addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * Remove listener
   * @param {Function} listener - Listener function
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of changes
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener({
          paymentStatuses: new Map(this.paymentStatuses),
          pendingConfirmations: new Map(this.pendingConfirmations)
        });
      } catch (error) {
        console.error('Error in payment flow listener:', error);
      }
    });
  }

  /**
   * Reset all payment states
   */
  reset() {
    this.paymentStatuses.clear();
    this.pendingConfirmations.clear();
    this.notifyListeners();
  }
}

// Export singleton instance
export const paymentFlowManager = new PaymentFlowManager();

/**
 * Utility functions for payment flow
 */

/**
 * Get button text based on payment status
 * @param {string} status - Payment status
 * @returns {string} - Button text
 */
export const getPaymentButtonText = (status) => {
  switch (status) {
    case PAYMENT_STATUS.PAYMENT_SENT:
      return 'Request Payment Confirmation';
    case PAYMENT_STATUS.WAITING_CONFIRMATION:
      return 'Waiting for Payment Confirmation';
    case PAYMENT_STATUS.CONFIRMED:
      return 'Payment Confirmed';
    case PAYMENT_STATUS.COMPLETED:
      return 'Completed';
    default:
      return 'Pay now';
  }
};

/**
 * Get button style based on payment status
 * @param {string} status - Payment status
 * @returns {Object} - Style object
 */
export const getPaymentButtonStyle = (status) => {
  const baseStyle = {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  };

  switch (status) {
    case PAYMENT_STATUS.PAYMENT_SENT:
      return { ...baseStyle, backgroundColor: '#FFA726' };
    case PAYMENT_STATUS.WAITING_CONFIRMATION:
      return { ...baseStyle, backgroundColor: '#757575' };
    case PAYMENT_STATUS.CONFIRMED:
      return { ...baseStyle, backgroundColor: '#00C853' };
    case PAYMENT_STATUS.COMPLETED:
      return { ...baseStyle, backgroundColor: '#4CAF50' };
    default:
      return { ...baseStyle, backgroundColor: '#8B5CF6' };
  }
};

/**
 * Get button text style based on payment status
 * @param {string} status - Payment status
 * @returns {Object} - Style object
 */
export const getPaymentButtonTextStyle = (status) => {
  const baseStyle = {
    fontSize: 14,
    fontWeight: '600',
  };

  switch (status) {
    case PAYMENT_STATUS.WAITING_CONFIRMATION:
      return { ...baseStyle, color: '#CCCCCC' };
    case PAYMENT_STATUS.CONFIRMED:
    case PAYMENT_STATUS.COMPLETED:
      return { ...baseStyle, color: '#FFFFFF' };
    default:
      return { ...baseStyle, color: '#FFFFFF' };
  }
}; 