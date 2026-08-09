import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { ZyntraIcon } from "./ZyntraLogo";

function Hero() {
  return (
    <section className="relative bg-[#0F172A] text-white overflow-hidden">
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)`,
          backgroundSize: "40px 40px"
        }}
      />
      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(37,99,235,0.15),transparent)] pointer-events-none" />

      <div className="relative max-w-screen-xl mx-auto px-6 pt-16 pb-20">
        <div className="max-w-3xl">

          {/* Brand Tagline Pill */}
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-full px-3.5 py-1.5 mb-8">
            <Sparkles size={13} className="text-blue-400" />
            <span className="text-blue-400 text-xs font-bold tracking-wider uppercase">
              Enterprise Intelligence. Engineered.
            </span>
          </div>

          {/* Hero Heading */}
          <div className="flex items-center gap-4 mb-4">
            <ZyntraIcon size={44} className="text-white shrink-0" />
            <h1 className="text-4xl md:text-5xl lg:text-[58px] font-extrabold tracking-tight text-white leading-none font-heading uppercase">
              ZYNTRA <span className="text-blue-500">AI</span>
            </h1>
          </div>

          {/* Supporting Headline */}
          <h2 className="text-xl md:text-2xl font-bold text-slate-200 mb-4 font-heading">
            From Business Problems to AI Solutions.
          </h2>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed mb-10">
            Instantly evaluate operational friction, calculate expected ROI benchmarks, and generate
            executive-grade digital transformation roadmaps — powered by enterprise knowledge
            retrieval and multi-stage AI reasoning.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#assessment"
              className="btn btn-primary btn-lg shadow-lg shadow-blue-600/20"
            >
              Start Enterprise Profiler
              <ArrowRight size={15} />
            </a>
            <Link
              to="/rag-test"
              className="btn btn-secondary btn-lg bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
            >
              <BookOpen size={15} />
              Knowledge Repository
            </Link>
          </div>

          {/* Stats Ribbon */}
          <div className="flex flex-wrap items-center gap-6 mt-12 pt-8 border-t border-white/10">
            {[
              { value: "320+", label: "Knowledge Playbooks" },
              { value: "16", label: "Industry Verticals" },
              { value: "Multi-Stage", label: "RAG Pipeline" },
              { value: "Fortune 500", label: "Enterprise Ready" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-xl font-extrabold text-white font-heading">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;