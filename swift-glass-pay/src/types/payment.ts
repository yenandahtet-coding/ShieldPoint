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
  type: "PHONE_NUMBER" | "MERCHANT_QR" | "TRANSFER" | "RECEIVED" | "DEPOSIT" | "WITHDRAW";
  status: "COMPLETED" | "PENDING" | "FAILED" | "FLAGGED";
  timestamp: string;
  note?: string | undefined;
}

export interface PaymentRequest {
  recipientPhone: string;
  amount: number;
  pin: string;
  note?: string | undefined;
}

export interface Contact {
  name: string;
  phone: string;
}