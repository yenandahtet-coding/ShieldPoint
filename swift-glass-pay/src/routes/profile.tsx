import { createFileRoute } from "@tanstack/react-router";
import { useWallet } from "@/context/WalletContext";
import { WalletPage } from "@/components/wallet-ui";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/profile")({
    head: () => ({
        meta: [{ title: "Profile — Nova Pay" }],
    }),
    component: Profile,
});

function Profile() {
    const { user, logout, format } = useWallet();

    return (
        <WalletPage>
            <header className="mb-6 flex items-center gap-4">
                <div className="gradient-brand grid h-14 w-14 shrink-0 place-items-center rounded-full text-xl font-semibold text-background">
                    {user.name.charAt(0)}
                </div>
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
                    <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                </div>
            </header>

            <section className="glass mt-8 space-y-6 rounded-3xl p-6">
                <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Phone Number</p>
                    <p className="mt-1 font-mono text-lg font-medium tracking-wider">{user.phone}</p>
                </div>

                <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Balance</p>
                    <p className="mt-1 font-mono text-lg font-medium">{format(user.balance)}</p>
                </div>
            </section>

            <button
                onClick={logout}
                className="mt-12 flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3.5 font-medium text-destructive transition-colors hover:bg-destructive/20 active:scale-[0.98]"
            >
                <LogOut className="h-4 w-4" /> Sign out
            </button>
        </WalletPage>
    );
}
