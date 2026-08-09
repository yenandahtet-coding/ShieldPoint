import { motion } from "motion/react";
import { ArrowDownLeft, ArrowUpRight, QrCode, Smartphone } from "lucide-react";
import { StatusBadge } from "@/components/wallet-ui";
import { useWallet } from "@/context/WalletContext";
import type { Transaction } from "@/types/payment";

export function TransactionItem({
  tx,
  onClick,
}: {
  tx: Transaction;
  onClick?: () => void;
}) {
  const { user, format } = useWallet();
  const isCredit = tx.type === "RECEIVED" || tx.receiverPhone === user.phone;
  const counterparty = isCredit ? tx.senderName : tx.receiverName;

  return (
    <motion.button
      layout
      whileHover={{ scale: 1.006 }}
      whileTap={{ scale: 0.995 }}
      onClick={onClick}
      className="glass grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-3.5 text-left"
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${
          isCredit
            ? "border-success/30 bg-success/10 text-success"
            : "border-border/70 bg-secondary/50 text-muted-foreground"
        }`}
      >
        {isCredit ? (
          <ArrowDownLeft className="h-4 w-4" />
        ) : (
          <ArrowUpRight className="h-4 w-4" />
        )}
      </span>

      <span className="min-w-0">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">
            {isCredit ? `From ${tx.senderName || tx.senderPhone}` : counterparty}
          </span>
          <StatusBadge status={tx.status} />
        </span>
        <span className="mt-1 flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
          {tx.type === "MERCHANT_QR" ? (
            <QrCode className="h-3 w-3 shrink-0" />
          ) : (
            <Smartphone className="h-3 w-3 shrink-0" />
          )}
          <span className="truncate">
            {tx.type} · {isCredit ? tx.senderPhone : tx.receiverPhone} ·{" "}
            {new Date(tx.timestamp).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </span>
      </span>

      <span
        className={`num shrink-0 text-sm font-semibold ${
          isCredit ? "text-success" : "text-foreground"
        }`}
      >
        {isCredit ? "+" : "−"}
        {format(tx.amount)}
      </span>
    </motion.button>
  );
}