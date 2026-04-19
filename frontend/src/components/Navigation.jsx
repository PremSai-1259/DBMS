export default function Navigation() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-12"
      style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #e6ecf5' }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="text-[#2d5a8e] text-[18px] sm:text-[22px] md:text-[24px] lg:text-[26px] font-semibold tracking-tight leading-tight"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Medi-Bridge
        </span>
      </div>
    </nav>
  )
}
