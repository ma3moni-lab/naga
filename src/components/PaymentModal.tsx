import { useState } from "react";

interface Props {
  amount: number;
  description: string;
  onSuccess: (ref: string, method: string) => void;
  onClose: () => void;
}

function fmt(n: number) {
  return `₦${n.toLocaleString()}`;
}

function genRef() {
  return "TXN-NAG-" + (Math.floor(Math.random() * 90000) + 10000);
}

const METHODS = [
  {
    id: "card" as const,
    label: "Debit / Credit Card",
    sub: "Visa · Mastercard · Verve",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="1" y="4" width="18" height="13" rx="2" stroke="#25205B" strokeWidth="1.3" />
        <path d="M1 8h18" stroke="#25205B" strokeWidth="1.3" />
        <rect x="3" y="11" width="5" height="2" rx="0.5" fill="#6B9FE5" />
      </svg>
    ),
  },
  {
    id: "transfer" as const,
    label: "Bank Transfer",
    sub: "Direct inter-bank transfer",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 10h14M13 6l4 4-4 4" stroke="#25205B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 14l-4-4 4-4" stroke="#6B9FE5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "ussd" as const,
    label: "USSD",
    sub: "*903# · *737# · *770# · *901#",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="5" y="1" width="10" height="18" rx="2" stroke="#25205B" strokeWidth="1.3" />
        <path d="M8 5h4M8 8h4M8 11h4M8 14h4" stroke="#6B9FE5" strokeWidth="1.1" strokeLinecap="round" />
        <circle cx="10" cy="16.5" r="0.8" fill="#25205B" />
      </svg>
    ),
  },
] as const;

type Method = typeof METHODS[number]["id"];

export default function PaymentModal({ amount, description, onSuccess, onClose }: Props) {
  const [step, setStep] = useState<"method" | "details" | "processing" | "result">("method");
  const [method, setMethod] = useState<Method>("card");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [outcome, setOutcome] = useState<"success" | "failure" | null>(null);
  const [txnRef] = useState(genRef());

  const [cardNum, setCardNum] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardPin, setCardPin] = useState("");

  const fmtCard = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const fmtExp = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
  };

  const handlePay = () => {
    setStep("processing");
    setTimeout(() => {
      const res = simulateFailure ? "failure" : "success";
      setOutcome(res);
      setStep("result");
    }, 2200);
  };

  const handleSuccessContinue = () => {
    onSuccess(txnRef, method);
  };

  const isCardValid = method !== "card" || (cardNum.replace(/\s/g, "").length === 16 && cardExp.length === 5 && cardCvv.length === 3 && cardPin.length === 4);

  return (
    <div
      className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(15,13,46,0.78)", backdropFilter: "blur(10px)" }}
      onClick={(e) => e.target === e.currentTarget && step !== "processing" && onClose()}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[420px] overflow-hidden shadow-2xl"
        style={{ animation: "modalIn 0.25s ease-out" }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between" style={{ borderBottom: "1px solid #E8EAF0" }}>
          <div>
            <div className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: "#6B9FE5" }}>
              {step === "result" && outcome === "success" ? "Payment Successful" : step === "result" && outcome === "failure" ? "Payment Failed" : "Secure Payment"}
            </div>
            <div className="font-bold text-[24px] leading-none" style={{ color: "#25205B", fontFamily: "var(--font-display)" }}>
              {fmt(amount)}
            </div>
            <div className="text-[11px] mt-1" style={{ color: "#69707D" }}>{description}</div>
          </div>
          {step !== "processing" && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F7F8FA] shrink-0"
              style={{ color: "#69707D" }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Step: Method */}
        {step === "method" && (
          <div className="p-6 space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#69707D" }}>
              Choose payment method
            </div>
            {METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all text-left"
                style={{
                  border: method === m.id ? "2px solid #25205B" : "1.5px solid #E8EAF0",
                  background: method === m.id ? "#F7F8FA" : "white",
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#EAF2FC" }}>
                  {m.icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[13px]" style={{ color: "#252731" }}>{m.label}</div>
                  <div className="text-[11px]" style={{ color: "#69707D" }}>{m.sub}</div>
                </div>
                {method === m.id && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "#25205B" }}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
            <button
              onClick={() => setStep("details")}
              className="w-full py-3.5 rounded-xl font-semibold text-[14px] text-white mt-2 transition-colors hover:opacity-90"
              style={{ background: "#25205B" }}
            >
              Continue →
            </button>
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM5.5 7V5m0-2v.01" stroke="#B0B8C4" strokeWidth="1.2" strokeLinecap="round" /></svg>
              <span className="text-[10px]" style={{ color: "#B0B8C4" }}>256-bit SSL encrypted · Powered by NAGA Pay</span>
            </div>
          </div>
        )}

        {/* Step: Details */}
        {step === "details" && (
          <div className="p-6 space-y-4">
            {method === "card" && (
              <>
                <div>
                  <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Card Number</label>
                  <input
                    value={cardNum}
                    onChange={(e) => setCardNum(fmtCard(e.target.value))}
                    placeholder="0000  0000  0000  0000"
                    className="w-full px-4 py-3 rounded-xl text-[14px] font-mono outline-none"
                    style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731", letterSpacing: "0.05em" }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Expiry</label>
                    <input
                      value={cardExp}
                      onChange={(e) => setCardExp(fmtExp(e.target.value))}
                      placeholder="MM/YY"
                      className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
                      style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>CVV</label>
                    <input
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      placeholder="• • •"
                      type="password"
                      className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
                      style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: "#69707D" }}>Card PIN</label>
                  <input
                    value={cardPin}
                    onChange={(e) => setCardPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="• • • •"
                    type="password"
                    className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
                    style={{ border: "1px solid #E8EAF0", background: "#F7F8FA", color: "#252731" }}
                  />
                </div>
              </>
            )}

            {method === "transfer" && (
              <div className="space-y-3">
                <div className="rounded-xl p-4" style={{ background: "#EAF2FC", border: "1px solid #D3E3F9" }}>
                  <div className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#25205B" }}>Transfer to this account</div>
                  {[
                    { label: "Bank", value: "Guaranty Trust Bank (GTB)" },
                    { label: "Account Name", value: "NAGA Properties Ltd" },
                    { label: "Account Number", value: "0123 456 789" },
                    { label: "Amount", value: fmt(amount) },
                    { label: "Reference", value: txnRef },
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between items-center py-1.5 text-[12px]">
                      <span style={{ color: "#69707D" }}>{r.label}</span>
                      <span className="font-semibold" style={{ color: "#252731" }}>{r.value}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] text-center" style={{ color: "#69707D" }}>
                  After completing your transfer, click the button below to confirm.
                </div>
              </div>
            )}

            {method === "ussd" && (
              <div className="space-y-3">
                <div className="rounded-xl p-4" style={{ background: "#EAF2FC", border: "1px solid #D3E3F9" }}>
                  <div className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "#25205B" }}>Dial the code for your bank</div>
                  {[
                    { bank: "GTBank", code: "*737*1*" + amount + "#" },
                    { bank: "Access Bank", code: "*901*1*" + amount + "#" },
                    { bank: "Zenith Bank", code: "*966*" + amount + "#" },
                    { bank: "First Bank", code: "*894*" + amount + "#" },
                  ].map((b) => (
                    <div key={b.bank} className="flex justify-between items-center py-1.5 text-[12px]">
                      <span style={{ color: "#69707D" }}>{b.bank}</span>
                      <span className="font-mono font-bold" style={{ color: "#25205B" }}>{b.code}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] text-center" style={{ color: "#69707D" }}>
                  Dial the code, follow the prompts, and click confirm when done.
                </div>
              </div>
            )}

            {/* Demo toggle */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "#FEF9EC", border: "1px solid #fcd34d" }}>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#92400e" }}>Demo mode</div>
                <div className="text-[11px]" style={{ color: "#b45309" }}>Simulate transaction outcome</div>
              </div>
              <div className="flex gap-1.5">
                {[{ label: "Success", val: false }, { label: "Fail", val: true }].map((opt) => (
                  <button
                    key={String(opt.val)}
                    onClick={() => setSimulateFailure(opt.val)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                    style={{
                      background: simulateFailure === opt.val ? (opt.val ? "#dc2626" : "#166534") : "#fff",
                      color: simulateFailure === opt.val ? "white" : "#69707D",
                      border: "1px solid " + (simulateFailure === opt.val ? (opt.val ? "#dc2626" : "#16a34a") : "#E8EAF0"),
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setStep("method")}
                className="px-5 py-3 rounded-xl font-semibold text-[13px] transition-colors hover:bg-[#F7F8FA]"
                style={{ border: "1.5px solid #E8EAF0", color: "#69707D" }}
              >
                Back
              </button>
              <button
                onClick={handlePay}
                disabled={!isCardValid}
                className="flex-1 py-3 rounded-xl font-semibold text-[13px] text-white transition-opacity disabled:opacity-40"
                style={{ background: "#25205B" }}
              >
                {method === "card" ? "Pay Now" : method === "transfer" ? "I've Sent the Transfer" : "Confirm USSD Payment"} →
              </button>
            </div>
          </div>
        )}

        {/* Step: Processing */}
        {step === "processing" && (
          <div className="p-10 flex flex-col items-center gap-5">
            <div className="relative w-16 h-16">
              <div
                className="absolute inset-0 rounded-full"
                style={{ border: "3px solid #EAF2FC" }}
              />
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  border: "3px solid #25205B",
                  borderRightColor: "transparent",
                  animation: "spin 0.9s linear infinite",
                }}
              />
            </div>
            <div className="text-center">
              <div className="font-semibold text-[15px]" style={{ color: "#252731" }}>Processing payment…</div>
              <div className="text-[12px] mt-1" style={{ color: "#69707D" }}>Please do not close this window</div>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Step: Result */}
        {step === "result" && outcome === "success" && (
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#dcfce7" }}>
              <svg width="28" height="24" viewBox="0 0 28 24" fill="none">
                <path d="M3 12l8 8 14-18" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-[18px]" style={{ color: "#166534", fontFamily: "var(--font-display)" }}>Payment Confirmed</div>
              <div className="text-[13px] mt-1.5" style={{ color: "#69707D" }}>Your payment of <span className="font-semibold" style={{ color: "#252731" }}>{fmt(amount)}</span> was successful.</div>
            </div>
            <div className="w-full rounded-xl p-4 text-left space-y-2" style={{ background: "#F7F8FA", border: "1px solid #E8EAF0" }}>
              {[
                { label: "Transaction Ref", value: txnRef },
                { label: "Method", value: METHODS.find((m) => m.id === method)?.label ?? method },
                { label: "Status", value: "Successful" },
              ].map((r) => (
                <div key={r.label} className="flex justify-between text-[12px]">
                  <span style={{ color: "#69707D" }}>{r.label}</span>
                  <span className="font-semibold" style={{ color: r.label === "Status" ? "#166534" : "#252731" }}>{r.value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleSuccessContinue}
              className="w-full py-3.5 rounded-xl font-semibold text-[14px] text-white transition-opacity hover:opacity-90"
              style={{ background: "#25205B" }}
            >
              Done
            </button>
          </div>
        )}

        {step === "result" && outcome === "failure" && (
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#fee2e2" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 4l16 16M20 4L4 20" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-[18px]" style={{ color: "#991b1b", fontFamily: "var(--font-display)" }}>Payment Failed</div>
              <div className="text-[13px] mt-1.5" style={{ color: "#69707D" }}>We could not process your payment. Please check your card details or try a different method.</div>
            </div>
            <div className="w-full rounded-xl p-3.5" style={{ background: "#FEF2F2", border: "1px solid #fca5a5" }}>
              <div className="text-[12px]" style={{ color: "#991b1b" }}>
                Error: Insufficient funds or card declined. Contact your bank if this persists.
              </div>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-semibold text-[13px] transition-colors hover:bg-[#F7F8FA]"
                style={{ border: "1.5px solid #E8EAF0", color: "#69707D" }}
              >
                Close
              </button>
              <button
                onClick={() => { setStep("method"); setOutcome(null); setSimulateFailure(false); setCardNum(""); setCardExp(""); setCardCvv(""); setCardPin(""); }}
                className="flex-1 py-3 rounded-xl font-semibold text-[13px] text-white"
                style={{ background: "#25205B" }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes modalIn{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}`}</style>
    </div>
  );
}
