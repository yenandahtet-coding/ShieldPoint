import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Image as ImageIcon, Loader2, ScanLine, Zap } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { WalletPage, PinPad } from "@/components/wallet-ui";
import { useWallet } from "@/context/WalletContext";
import { transactionService } from "@/services/transactionService";

export const Route = createFileRoute("/pay/qr")({
  head: () => ({
    meta: [
      { title: "Scan & Receive QR — Nova Pay" },
      {
        name: "description",
        content: "Scan a merchant QR code or share your own branded wallet QR to get paid.",
      },
      { property: "og:title", content: "Scan & Receive QR — Nova Pay" },
      {
        property: "og:description",
        content: "Camera scanner and a dynamic personal QR code with a requested amount.",
      },
    ],
  }),
  component: QrPage,
});

function QrPage() {
  const [tab, setTab] = useState<"scan" | "mine">("scan");
  const [step, setStep] = useState<"scan" | "amount">("scan");
  const navigate = useNavigate();

  return (
    <WalletPage>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <button
          onClick={() => (tab === "scan" && step === "amount" ? setStep("scan") : navigate({ to: "/" }))}
          className="glass grid h-9 w-9 shrink-0 place-items-center rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="truncate text-xl font-semibold tracking-tight">Scan & receive</h1>
      </div>

      <div className="glass mt-5 grid grid-cols-2 gap-1 rounded-2xl p-1.5">
        {(
          [
            ["scan", "Scan QR code"],
            ["mine", "My QR code"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${tab === key ? "text-background" : "text-muted-foreground"
              }`}
          >
            {tab === key && (
              <motion.span
                layoutId="qr-tab"
                className="gradient-brand absolute inset-0 rounded-xl"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "scan" ? (
          <motion.div
            key="scan"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <ScannerTab step={step} setStep={setStep} />
          </motion.div>
        ) : (
          <motion.div
            key="mine"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <MyQrTab />
          </motion.div>
        )}
      </AnimatePresence>
    </WalletPage>
  );
}

function ScannerTab({ step, setStep }: { step: "scan" | "amount"; setStep: (s: "scan" | "amount") => void }) {
  const { user, format, applyTransaction } = useWallet();
  const [recipient, setRecipient] = useState<{ name: string; phone: string; walletId: string } | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const numeric = parseFloat(amount || "0");
  const validAmount = numeric > 0 && numeric <= user.balance;

  useEffect(() => {
    if (step !== "scan") return;

    let mounted = true;
    // Fix StrictMode duplication: ensure container is empty before initializing
    const el = document.getElementById("qr-reader");
    if (el) el.innerHTML = "";

    const startScan = async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10 }, // Removed qrbox completely to let it scan the full un-squashed feed
          (decodedText) => {
            if (!mounted) return;
            try {
              const data = JSON.parse(decodedText);
              if (data.walletId && data.phone && data.name) {
                if (data.walletId === user.id) {
                  toast.error("You cannot scan your own QR code");
                  return;
                }
                scanner.stop().catch(console.error);
                setRecipient(data);
                if (data.amount) setAmount(String(data.amount));
                setStep("amount");
                toast.success(`Scanned wallet: ${data.name}`);
              } else {
                toast.error("Invalid QR format");
              }
            } catch {
              toast.error("Invalid QR code");
            }
          },
          () => { }
        );
      } catch (err) {
        if (mounted) toast.error("Failed to start camera");
      }
    };

    startScan();

    return () => {
      mounted = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
        }).catch(console.error);
      }
    };
  }, [step, user.id]);

  const toggleFlash = async () => {
    if (!scannerRef.current || !scannerRef.current.isScanning) return;
    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: !flash }]
      } as any);
      setFlash(!flash);
    } catch {
      toast.error("Flash not supported on this device");
    }
  };

  const execute = async (pin: string) => {
    if (!recipient) return;
    setBusy(true);
    setError(null);
    try {
      // If it's a merchant, one could call payMerchantQr, but here we assume general P2P based on phone
      const tx = await transactionService.sendToPhone(
        { recipientPhone: recipient.phone, amount: numeric, pin, ...(note ? { note } : {}) },
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
    <div className="glass mt-4 rounded-3xl p-5">
      <style>{`
        #qr-reader { border: none !important; }
        #qr-reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; border-radius: 1rem !important; }
        #qr-reader img { display: none !important; }
      `}</style>
      <AnimatePresence mode="popLayout" initial={false}>
        {step === "scan" ? (
          <motion.div
            key="scan"
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col gap-4"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border/70 bg-background/80" id="qr-reader">
              <div className="absolute inset-0 z-10 pointer-events-none">
                {[
                  "left-6 top-6 border-l-2 border-t-2 rounded-tl-xl",
                  "right-6 top-6 border-r-2 border-t-2 rounded-tr-xl",
                  "left-6 bottom-6 border-b-2 border-l-2 rounded-bl-xl",
                  "right-6 bottom-6 border-b-2 border-r-2 rounded-br-xl",
                ].map((cls) => (
                  <span
                    key={cls}
                    className={`absolute h-14 w-14 border-cyan-accent ${cls}`}
                  />
                ))}
                <motion.span
                  animate={{ top: ["16%", "82%", "16%"] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                  className="gradient-brand absolute inset-x-8 h-0.5 rounded-full blur-[1px]"
                />
              </div>
            </div>

            <button
              onClick={toggleFlash}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${flash
                ? "border-warning/60 bg-warning/10 text-warning"
                : "border-border/70 bg-secondary/40 text-muted-foreground focus:border-primary/50"
                }`}
            >
              <Zap className="h-4 w-4" /> Flash turning {flash ? "off" : "on"}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="amount"
            initial={{ x: 200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col relative"
          >
            <div className="mb-6 rounded-2xl bg-secondary/40 p-4 border border-border/40 text-center mt-2">
              <span className="gradient-brand grid mx-auto h-12 w-12 shrink-0 place-items-center rounded-full text-lg font-semibold text-background">
                {recipient?.name.charAt(0) || "?"}
              </span>
              <p className="mt-3 font-semibold text-foreground text-lg">{recipient?.name}</p>
              <p className="text-sm font-mono text-muted-foreground">{recipient?.phone}</p>
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

      <PinPad
        open={pinOpen}
        busy={busy}
        error={error}
        title="Confirm payment"
        subtitle={`${format(numeric)} to ${recipient?.name || ""}`}
        onClose={() => {
          if (!busy) {
            setPinOpen(false);
            setError(null);
          }
        }}
        onSubmit={execute}
      />
    </div>
  );
}

function MyQrTab() {
  const { user, format } = useWallet();
  const [requested, setRequested] = useState("");

  const payload = JSON.stringify({
    walletId: user.id,
    phone: user.phone,
    name: user.name,
    amount: Number(requested) || null,
    currency: user.currency,
  });

  return (
    <div className="glass mt-4 rounded-3xl p-6 text-center">
      <div className="gradient-brand mx-auto w-fit rounded-3xl p-[2px]">
        <div className="rounded-3xl bg-card p-5">
          <QRCodeCanvas
            value={payload}
            size={208}
            bgColor="transparent"
            fgColor="#e6edf7"
            level="M"
            marginSize={0}
          />
        </div>
      </div>

      <p className="mt-5 text-lg font-semibold">{user.name}</p>
      <p className="num text-xs text-muted-foreground">
        {user.phone} · {user.id}
      </p>

      <label className="mt-6 block text-left">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Request a specific amount (optional)
        </span>
        <input
          value={requested}
          onChange={(e) => setRequested(e.target.value.replace(/[^\d.]/g, ""))}
          placeholder="0.00"
          inputMode="decimal"
          className="num mt-2 w-full rounded-xl border border-border/70 bg-secondary/40 px-3.5 py-3 text-lg outline-none focus:border-primary/60 placeholder:text-muted-foreground/50"
        />
      </label>

      {Number(requested) > 0 && (
        <p className="mt-3 text-sm text-cyan-accent">
          Requesting {format(Number(requested))}
        </p>
      )}
    </div>
  );
}