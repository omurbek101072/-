/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { OnlinePaymentHub } from './components/OnlinePaymentHub';
import { PastureSection } from './components/PastureSection';
import { MachineryFleetSection } from './components/MachineryFleetSection';
import { WaterAndWasteSection } from './components/WaterAndWasteSection';
import { ReportsSection } from './components/ReportsSection';
import { Footer } from './components/Footer';
import { CitizenRequestModal } from './components/CitizenRequestModal';
import { AdminPanel } from './components/AdminPanel';
import { AboutSection } from './components/AboutSection';
import { FloatingContact } from './components/FloatingContact';
import { AdminLoginModal, PasswordRecoveryModal } from './components/AdminLoginModal';
import { AdminTopBar } from './components/AdminTopBar';

// Сервер менен байланыш жок болсо же админдин өзгөртүүсү сакталбаса — экранга чыгаруу
function StatusBanner() {
  const { connectionError, errorNotice, clearErrorNotice, refreshData } = useApp();
  if (!connectionError && !errorNotice) return null;
  return (
    <div className="bg-rose-700 text-white text-xs px-4 py-2" role="alert">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">{errorNotice || `Сервер менен байланыш жок: ${connectionError}`}</span>
        {errorNotice ? (
          <button type="button" onClick={clearErrorNotice} className="underline cursor-pointer">Жабуу</button>
        ) : (
          <button type="button" onClick={() => refreshData()} className="underline cursor-pointer">Кайра аракет кылуу</button>
        )}
      </div>
    </div>
  );
}

function MainAppContent() {
  const { isAdminLoggedIn } = useApp();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isCitizenModalOpen, setIsCitizenModalOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Keyboard shortcut listener: Ctrl+Shift+A or Alt+A to open admin login / panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') ||
        (e.altKey && e.key.toLowerCase() === 'a')
      ) {
        e.preventDefault();
        if (isAdminLoggedIn) {
          setIsAdminOpen(prev => !prev);
        } else {
          setIsLoginModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminLoggedIn]);

  // Pre-filled state when redirected to payment hub
  const [paymentPreFill, setPaymentPreFill] = useState<{
    serviceType: 'water' | 'waste' | 'pasture' | 'machinery';
    amount: number;
    details: string;
    orderId?: string;
    accountId?: string;
    version: number;
  }>({
    version: 0,
    serviceType: 'water',
    amount: 240,
    details: 'Таза суу карызын төлөө'
  });

  const handleOpenQuickPayment = () => {
    setActiveTab('payments');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDirectPaymentFromSection = (
    serviceType: 'water' | 'waste' | 'pasture' | 'machinery',
    amount: number,
    details: string,
    orderId?: string,
    accountId?: string
  ) => {
    // version өзгөргөндө төлөм формасы жаңы маалымат менен кайра түзүлөт
    setPaymentPreFill(prev => ({
      serviceType,
      amount,
      details,
      orderId,
      accountId,
      version: prev.version + 1
    }));
    setActiveTab('payments');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAdmin = () => {
    if (isAdminLoggedIn) {
      setIsAdminOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      {/* Admin Status Ribbon (ONLY visible to authenticated administrator) */}
      <AdminTopBar onOpenAdminPanel={() => setIsAdminOpen(true)} />

      <StatusBanner />

      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickPayment={handleOpenQuickPayment}
        onOpenCitizenRequest={() => setIsCitizenModalOpen(true)}
        onOpenAdminPanel={handleOpenAdmin}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'overview' && (
          <>
            <Hero
              onSelectService={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenQuickPayment={handleOpenQuickPayment}
              onOpenCitizenRequest={() => setIsCitizenModalOpen(true)}
            />
            {/* Quick Teaser of Online Payments */}
            <OnlinePaymentHub
              initialServiceType={paymentPreFill.serviceType}
              initialAmount={paymentPreFill.amount}
              initialDetails={paymentPreFill.details}
              initialOrderId={paymentPreFill.orderId}
              initialAccountId={paymentPreFill.accountId}
              key={`pay-${paymentPreFill.version}`}
            />
            {/* Clean Water & Waste Management */}
            <WaterAndWasteSection
              onDirectPayment={handleDirectPaymentFromSection}
              onOpenCitizenRequest={() => setIsCitizenModalOpen(true)}
            />
            {/* Pasture Section */}
            <PastureSection
              onDirectPayment={handleDirectPaymentFromSection}
            />
            {/* Machinery Fleet */}
            <MachineryFleetSection
              onDirectPayment={handleDirectPaymentFromSection}
            />
            {/* Reports & Transparency */}
            <ReportsSection />
          </>
        )}

        {activeTab === 'water-waste' && (
          <WaterAndWasteSection
            onDirectPayment={handleDirectPaymentFromSection}
            onOpenCitizenRequest={() => setIsCitizenModalOpen(true)}
          />
        )}

        {activeTab === 'pasture' && (
          <PastureSection
            onDirectPayment={handleDirectPaymentFromSection}
          />
        )}

        {activeTab === 'machinery' && (
          <MachineryFleetSection
            onDirectPayment={handleDirectPaymentFromSection}
          />
        )}

        {activeTab === 'payments' && (
          <OnlinePaymentHub
            initialServiceType={paymentPreFill.serviceType}
            initialAmount={paymentPreFill.amount}
            initialDetails={paymentPreFill.details}
            initialOrderId={paymentPreFill.orderId}
            initialAccountId={paymentPreFill.accountId}
            key={`pay-${paymentPreFill.version}`}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsSection />
        )}

        {activeTab === 'about' && <AboutSection />}
      </main>

      <FloatingContact />

      {/* Footer */}
      <Footer
        onNavClick={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCitizenRequest={() => setIsCitizenModalOpen(true)}
        onOpenAdminLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Emergency & Citizen Request Modal */}
      <CitizenRequestModal
        isOpen={isCitizenModalOpen}
        onClose={() => setIsCitizenModalOpen(false)}
      />

      {/* Admin Authentication Modal (Hidden from public, opened via discrete footer lock or shortcut) */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setIsLoginModalOpen(false);
          setIsAdminOpen(true);
        }}
      />

      {/* Почтадагы шилтемеден келгенде: жаңы сырсөз коюу же билдирүү */}
      <PasswordRecoveryModal
        onDone={() => {
          if (isAdminLoggedIn) setIsAdminOpen(true);
        }}
      />

      {/* Admin Panel Modal / Workspace (STRICTLY rendered only if admin is logged in) */}
      {isAdminOpen && isAdminLoggedIn && (
        <AdminPanel
          onClose={() => setIsAdminOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
