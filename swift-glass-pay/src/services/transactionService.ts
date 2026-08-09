import { transactionBackendClient } from "./transactionBackendClient";
import { walletService } from "./walletService";
import type { PaymentRequest, Transaction, UserProfile } from "@/types/payment";

const rid = () => Math.random().toString(16).slice(2, 8);

export const transactionService = {
  async sendToPhone(payload: PaymentRequest, user: UserProfile): Promise<Transaction> {
    if (payload.pin.length !== 6) throw new Error("PIN format is invalid");
    if (payload.amount <= 0) throw new Error("Amount must be greater than zero");
    if (payload.amount > user.balance) throw new Error("Insufficient balance");

    const recipient = await walletService.lookupUserByPhone(payload.recipientPhone);

    const data = await transactionBackendClient.transfer({
      recipientPhone: payload.recipientPhone,
      amount: payload.amount,
      pin: payload.pin,
      note: payload.note
    });

    return {
      id: data?.id || `tx_${rid()}`,
      senderId: user.id,
      senderPhone: user.phone,
      receiverId: data?.receiver_id || recipient?.id || `usr_${rid()}`,
      receiverPhone: payload.recipientPhone,
      receiverName: recipient?.name || "Wallet User",
      amount: payload.amount,
      currency: user.currency,
      type: "PHONE_NUMBER",
      status: "COMPLETED",
      timestamp: new Date().toISOString(),
      note: payload.note || 'Transfer'
    };
  },

  async payMerchantQr(
    merchant: { name: string; phone: string; amount: number },
    user: UserProfile,
  ): Promise<Transaction> {
    if (merchant.amount > user.balance) throw new Error("Insufficient balance");

    const data = await transactionBackendClient.transferMerchant({
      merchantPhone: merchant.phone,
      amount: merchant.amount,
      note: "Merchant QR payment",
      pin: "000000"
    });

    return {
      id: data?.id || `tx_${rid()}`,
      senderId: user.id,
      senderPhone: user.phone,
      receiverId: data?.receiver_id || `mch_${rid()}`,
      receiverPhone: merchant.phone,
      receiverName: merchant.name,
      amount: merchant.amount,
      currency: user.currency,
      type: "MERCHANT_QR",
      status: "COMPLETED",
      timestamp: new Date().toISOString(),
      note: "Merchant QR payment",
    };
  },

  async deposit(amount: number, user: UserProfile): Promise<Transaction> {
    if (amount <= 0) throw new Error("Amount must be greater than zero");

    await transactionBackendClient.deposit({ amount, method: "BANK_TRANSFER" });

    return {
      id: `dep_${rid()}`,
      senderId: "system",
      senderPhone: "system",
      receiverId: user.id,
      receiverPhone: user.phone,
      receiverName: user.name,
      amount,
      currency: user.currency,
      type: "DEPOSIT",
      status: "COMPLETED",
      timestamp: new Date().toISOString(),
      note: "Wallet Deposit"
    };
  },

  async withdraw(amount: number, user: UserProfile): Promise<Transaction> {
    if (amount <= 0) throw new Error("Amount must be greater than zero");
    if (amount > user.balance) throw new Error("Insufficient balance");

    await transactionBackendClient.withdraw({ amount, method: "BANK_TRANSFER" });

    return {
      id: `wd_${rid()}`,
      senderId: user.id,
      senderPhone: user.phone,
      receiverId: "system",
      receiverPhone: "system",
      receiverName: "External Bank",
      amount,
      currency: user.currency,
      type: "WITHDRAW",
      status: "COMPLETED",
      timestamp: new Date().toISOString(),
      note: "Wallet Withdraw"
    };
  }
};
