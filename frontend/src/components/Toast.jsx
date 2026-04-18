const Toast = ({ toast }) => {
  if (!toast) return null

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl
        backdrop-blur-md border border-white/20 text-white text-sm font-medium
        transition-all duration-300
        ${toast.type === 'error' ? 'bg-red-500/90' : 'bg-[#2d5a8e]/90'}`}
    >
      <span className="text-base">{icons[toast.type] || icons.success}</span>
      <span>{toast.message}</span>
    </div>
  )
}

export default Toast