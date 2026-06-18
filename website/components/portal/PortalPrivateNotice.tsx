export default function PortalPrivateNotice() {
  return (
    <div className="border border-[#c5a46e]/30 bg-[#0f172a]/80 rounded-2xl p-5 text-sm leading-relaxed">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#c5a46e]/40 bg-[#c5a46e]/10 text-[#c5a46e]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
            <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h14.25a3 3 0 003-3V12.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-[#f1f5f9]">Private client portal</p>
          <p className="mt-2 text-[#94a3b8]">
            Access granted for engaged clients only.
          </p>
        </div>
      </div>
    </div>
  );
}