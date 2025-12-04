/**
 * Messages Layout - Full screen, no header/footer
 */
export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="messages-layout fixed inset-0 overflow-hidden bg-white dark:bg-gray-900 z-[9999]">
      {children}
    </div>
  );
}

