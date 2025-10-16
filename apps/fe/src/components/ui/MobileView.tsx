import React from "react";

const MobileView = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="min-h-screen bg-gray-100 flex items-center h-screen justify-center p-6">
      <div className="w-96 h-full bg-white backdrop-blur-xl rounded-[1.2rem] shadow-2xl overflow-hidden flex flex-col items-center justify-start">
        {children}
      </div>
    </main>
  );
};

export default MobileView;
