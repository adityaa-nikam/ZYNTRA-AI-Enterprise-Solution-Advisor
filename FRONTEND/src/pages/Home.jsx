import { useState } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import AssessmentForm from "../components/AssessmentForm";
import ReportHistory from "../components/ReportHistory";
import Footer from "../components/Footer";
import { History, X } from "lucide-react";

function Home() {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />
      <Hero />

      {/* History toggle */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-6 flex justify-end">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`btn ${showHistory ? "btn-secondary" : "btn-ghost"} text-[13px]`}
        >
          {showHistory ? (
            <>
              <X size={14} /> Close History
            </>
          ) : (
            <>
              <History size={14} /> View Report History
            </>
          )}
        </button>
      </div>

      <div className="flex-1 pb-16">
        {showHistory ? (
          <ReportHistory onClose={() => setShowHistory(false)} />
        ) : (
          <AssessmentForm />
        )}
      </div>

      <Footer />
    </div>
  );
}

export default Home;