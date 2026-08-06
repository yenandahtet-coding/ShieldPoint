export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  balance: number;
  currency: "USD" | "MMK";
  avatarUrl?: string;
}

export interface Transaction {
  id: string;
  senderId: string;
  senderPhone: string;
  senderName?: string;
  receiverId: string;
  receiverPhone: string;
  receiverName: string;
  amount: number;
  currency: string;
  type: "PHONE_NUMBER" | "MERCHANT_QR";
  status: "COMPLETED" | "PENDING" | "FAILED" | "FLAGGED";
  timestamp: string;
  note?: string;
}

export interface PaymentRequest {
  recipientPhone: string;
  amount: number;
  pin: string;
  note?: string;
}

export interface Contact {
  name: string;
  phone: string;
}