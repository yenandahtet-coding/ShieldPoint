import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, Loader2, Lock, Phone, Wallet, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { useWallet } from "@/context/WalletContext";

export const Route = createFileRoute("/register")({
    head: () => ({
        meta: [
            { title: "Sign up — Nova Pay Wallet" },
            { name: "description", content: "Create your Nova Pay wallet with your phone number and 6-digit PIN." }
        ],
    }),
    component: RegisterPage,
});

function RegisterPage() {
    const { login, isAuthenticated } = useWallet();
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) navigate({ to: "/", replace: true });
    }, [isAuthenticated, navigate]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim().length < 2) {
            toast.error("Please enter a valid name");
            return;
        }
        if (phone.length < 10) {
            toast.error("Please enter a valid phone number");
            return;
        }
        if (pin.length !== 6) {
            toast.error("Enter a 6-digit transaction PIN to use as your password");
            return;
        }
        setLoading(true);
        try {
            const res = await authService.register(phone, pin, name);
            login(res.token, res.user);
            toast.success(`Account created successfully!`);
            navigate({ to: "/", replace: true });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Sign up failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ambient-bg grid min-h-screen place-items-center px-4 py-10">
            <motion.div
                initial={{ opacity: 0, y: 22, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="glass glow-brand w-full max-w-md rounded-3xl p-7 sm:p-9"
            >
                <div className="flex items-center gap-3">
                    <span className="gradient-brand grid h-11 w-11 shrink-0 place-items-center rounded-2xl">
                        <Wallet className="h-5 w-5 text-background" />
                    </span>
                    <div className="min-w-0">
                        <h1 className="truncate text-xl font-semibold tracking-tight">Nova Pay</h1>
                        <p className="truncate text-xs text-muted-foreground">
                            Create a new account
                        </p>
                    </div>
                </div>

                <p className="mt-7 text-2xl font-semibold leading-snug">
                    Create your <span className="text-gradient-brand">digital wallet</span>
                </p>

                <form onSubmit={submit} className="mt-7 space-y-5">
                    <label className="block">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">
                            Full Name
                        </span>
                        <div className="mt-2 flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/40 px-3.5 py-3 focus-within:border-primary/60">
                            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Name"
                                className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                            />
                        </div>
                    </label>

                    <label className="block">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">
                            Phone number
                        </span>
                        <div className="mt-2 flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/40 px-3.5 py-3 focus-within:border-primary/60">
                            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="09XXXXXXXXX"
                                className="num min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                            />
                        </div>
                    </label>

                    <label className="block">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">
                            Create a 6-digit PIN
                        </span>
                        <div className="mt-2 flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/40 px-3.5 py-3 focus-within:border-primary/60">
                            <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <input
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                inputMode="numeric"
                                type="password"
                                placeholder="••••••"
                                className="num min-w-0 flex-1 bg-transparent text-base tracking-[0.5em] outline-none placeholder:tracking-[0.4em] placeholder:text-muted-foreground"
                            />
                        </div>
                    </label>

                    <motion.button
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        type="submit"
                        className="gradient-brand flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-background disabled:opacity-70"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                Create account <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </motion.button>
                </form>

                <p className="mt-6 text-center text-[13px] text-muted-foreground">
                    Already have an account?{" "}
                    <Link to="/login" className="text-brand font-semibold hover:underline">
                        Log in here
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
