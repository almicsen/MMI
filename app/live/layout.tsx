export default function LiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        .site-chrome { display: none !important; }
      `}</style>
      {children}
    </>
  );
}
