"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ConfirmationModal from "@/components/ConfirmationModal";
import SettingsModal from "@/components/SettingsModal";
import { OperationItem, Wallet, api } from "@/lib/api";

interface FinanceContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
  openConfirmation: (logId: string, rawText: string, operations: OperationItem[]) => void;
  wallets: Wallet[];
}

export const FinanceContext = createContext<FinanceContextType>({
  refreshTrigger: 0,
  triggerRefresh: () => {},
  openConfirmation: () => {},
  wallets: [],
});

export const useFinance = () => useContext(FinanceContext);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    logId: string;
    rawText: string;
    operations: OperationItem[];
  }>({
    logId: "",
    rawText: "",
    operations: [],
  });

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [netWorth, setNetWorth] = useState<number | undefined>(undefined);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const openConfirmation = (logId: string, rawText: string, operations: OperationItem[]) => {
    setConfirmationData({ logId, rawText, operations });
    setIsConfirmationOpen(true);
  };

  // Load summary & wallets
  useEffect(() => {
    const loadData = async () => {
      try {
        const [wList, summary] = await Promise.all([
          api.getWallets(),
          api.getSummary()
        ]);
        setWallets(wList);
        setNetWorth(summary.total_net_worth);
      } catch (err) {
        console.warn("Failed to fetch initial layout data, using default state", err);
      }
    };
    loadData();
  }, [refreshTrigger]);

  return (
    <FinanceContext.Provider
      value={{
        refreshTrigger,
        triggerRefresh,
        openConfirmation,
        wallets,
      }}
    >
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <Header onOpenSettings={() => setIsSettingsOpen(true)} netWorth={netWorth} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
            {children}
          </main>
        </div>

        {/* Global Confirmation Modal */}
        <ConfirmationModal
          isOpen={isConfirmationOpen}
          logId={confirmationData.logId}
          rawText={confirmationData.rawText}
          initialOperations={confirmationData.operations}
          wallets={wallets}
          onClose={() => setIsConfirmationOpen(false)}
          onSuccess={() => {
            triggerRefresh();
          }}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSaved={() => triggerRefresh()}
        />
      </div>
    </FinanceContext.Provider>
  );
}
