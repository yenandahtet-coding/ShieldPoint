import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ChevronRight, Users } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { WalletPage, PinPad } from "@/components/wallet-ui";
import { useWallet } from "@/context/WalletContext";
import { transactionService } from "@/services/transactionService";
import { walletService } from "@/services/walletService";


export const Route = createFileRoute("/pay/phone")({
  head: () => ({
    meta: [
      { title: "Send by Phone Number — Nova Pay" },
      {
        name: "description",
        content: "Transfer money instantly to any Nova Pay wallet using a phone number.",
      },
    ],
  }),
  component: PhoneTransfer,
});

function PhoneTransfer() {
  const { user, transactions, format, applyTransaction } = useWallet();
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "amount">("phone");
  const [phone, setPhone] = useState("");
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numeric = parseFloat(amount || "0");
  const validAmount = numeric > 0 && numeric <= user.balance;
  const validPhone = phone.length >= 6;

  const recentContacts = useMemo(() => {
    const sent = transactions.filter((t) => t.senderId === user.id && t.receiverPhone);
    const unique = new Set<string>();
    const res: { name: string; phone: string }[] = [];
    for (const t of sent) {
      if (!unique.has(t.receiverPhone!)) {
        unique.add(t.receiverPhone!);
        res.push({ name: t.receiverName || "User", phone: t.receiverPhone! });
      }
    }
    return res.slice(0, 5);
  }, [transactions, user.id]);

  const verifyPhone = async () => {
    setBusy(true);
    try {
      const foundUser = await walletService.lookupUserByPhone(phone);
      if (foundUser) {
        setRecipientName(foundUser.name);
        setStep("amount");
      } else {
        toast.error("Phone number is not registered");
      }
    } catch (err) {
      toast.error("Failed to verify phone number");
    } finally {
      setBusy(false);
    }
  };

  const execute = async (pin: string) => {
    setBusy(true);
    setError(null);
    try {
      const tx = await transactionService.sendToPhone(
        { recipientPhone: phone, amount: numeric, pin, ...(note ? { note } : {}) },
        user,
      );
      applyTransaction(tx);
      setPinOpen(false);
      toast.success(`${format(tx.amount)} sent to ${tx.receiverName}`, {
        description: `${tx.id} · ${tx.status}`,
      });
      navigate({ to: "/history" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <WalletPage>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <button
          onClick={() => (step === "amount" ? setStep("phone") : navigate({ to: "/" }))}
          className="glass grid h-9 w-9 shrink-0 place-items-center rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="truncate text-xl font-semibold tracking-tight">Send to phone number</h1>
      </div>

      <div className="glass mt-5 rounded-3xl p-6 relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          {step === "phone" ? (
            <motion.div
              key="phone"
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -200, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Recipient phone number
                </span>
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-border/70 bg-secondary/40 px-3.5 py-3 focus-within:border-primary/60">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
                    placeholder="09XXXXXXXXX"
                    inputMode="tel"
                    className="num min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && validPhone && !busy) verifyPhone();
                    }}
                  />
                </div>
              </label>

              <motion.button
                whileHover={{ scale: validPhone && !busy ? 1.015 : 1 }}
                whileTap={{ scale: validPhone && !busy ? 0.98 : 1 }}
                disabled={!validPhone || busy}
                onClick={verifyPhone}
                className="gradient-brand mt-7 w-full rounded-xl py-3.5 text-sm font-semibold text-background disabled:opacity-40"
              >
                {busy ? "Checking..." : "Continue"}
              </motion.button>

              {recentContacts.length > 0 && (
                <div className="mt-8">
                  <h3 className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                    Recent Contacts
                  </h3>
                  <div className="space-y-2">
                    {recentContacts.map((c) => (
                      <button
                        key={c.phone}
                        onClick={() => setPhone(c.phone)}
                        className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 px-3 py-2.5 text-left transition-colors hover:border-primary/50"
                      >
                        <span className="gradient-brand grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold text-background">
                          {c.name.charAt(0)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{c.name}</span>
                          <span className="num block truncate text-xs text-muted-foreground">
                            {c.phone}
                          </span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="amount"
              initial={{ x: 200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="mb-6 rounded-2xl bg-secondary/40 p-4 border border-border/40 text-center">
                <span className="gradient-brand grid mx-auto h-12 w-12 shrink-0 place-items-center rounded-full text-lg font-semibold text-background">
                  {recipientName?.charAt(0) || "?"}
                </span>
                <p className="mt-3 font-semibold text-foreground text-lg">{recipientName}</p>
                <p className="text-sm font-mono text-muted-foreground">{phone}</p>
              </div>

              <div className="text-center mt-3">
                <span className="inline-block rounded-full bg-secondary/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Amount to Send
                </span>
                <div className="relative mx-auto flex w-full max-w-[280px] items-baseline justify-center border-b-2 border-border/50 pb-2 focus-within:border-cyan-accent transition-colors">
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                    placeholder="0"
                    inputMode="decimal"
                    className={`num w-full px-12 bg-transparent text-center font-light tracking-tight outline-none placeholder:text-muted-foreground/20 text-foreground transition-all duration-200 ${amount.length > 8 ? 'text-3xl' : amount.length > 5 ? 'text-4xl' : 'text-5xl'}`}
                  />
                  <span className="absolute right-2 bottom-3 text-xl font-medium text-muted-foreground">
                    Ks
                  </span>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Current balance: <span className="font-medium text-foreground">{format(user.balance)}</span>
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {[1000, 5000, 10000].map((v) => (
                    <motion.button
                      key={v}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setAmount(String(+(Number(amount || 0) + v).toFixed(2)))}
                      className="rounded-full border border-border/70 bg-secondary/40 px-3 py-1.5 text-xs font-medium hover:border-cyan-accent/60"
                    >
                      +{user.currency === "USD" ? "$" : "Ks "}{v.toLocaleString()}
                    </motion.button>
                  ))}
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setAmount("")}
                    className="rounded-full border border-border/70 px-4 py-1.5 text-xs text-muted-foreground"
                  >
                    Clear
                  </motion.button>
                </div>
              </div>

              <label className="mt-7 block">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Note (optional)
                </span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What's this for?"
                  className="mt-2 w-full rounded-xl border border-border/70 bg-secondary/40 px-3.5 py-3 text-sm outline-none focus:border-primary/60 placeholder:text-muted-foreground"
                />
              </label>

              <motion.button
                whileHover={{ scale: validAmount ? 1.015 : 1 }}
                whileTap={{ scale: validAmount ? 0.98 : 1 }}
                disabled={!validAmount}
                onClick={() => setPinOpen(true)}
                className="gradient-brand mt-7 w-full rounded-xl py-3.5 text-sm font-semibold text-background disabled:opacity-40"
              >
                Continue to PIN
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PinPad
        open={pinOpen}
        busy={busy}
        error={error}
        title="Confirm transfer"
        subtitle={`${format(numeric)} to ${recipientName || phone}`}
        onClose={() => {
          if (!busy) {
            setPinOpen(false);
            setError(null);
          }
        }}
        onSubmit={execute}
      />
    </WalletPage>
  );
}