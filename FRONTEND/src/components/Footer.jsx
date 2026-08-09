import ZyntraLogo from "./ZyntraLogo";

function Footer() {
  return (
    <footer className="bg-[#0F172A] border-t border-[#1E293B] text-white">
      <div className="max-w-screen-xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ZyntraLogo size={22} variant="light" />
        </div>
        <p className="text-[12px] text-slate-500 font-medium">
          Enterprise Intelligence. Engineered. · From Business Problems to AI Solutions.
        </p>
        <p className="text-[12px] text-slate-500 font-medium">
          © {new Date().getFullYear()} ZYNTRA AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;