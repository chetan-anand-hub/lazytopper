// src/pages/Home.tsx  (Variant 2 – Planner-first landing)

import React from "react";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const navigate = useNavigate();

  const goToClass10Maths = () => {
    navigate("/trends/10/Maths");
  };

  const goToMentor = () => {
    navigate("/mentor");
  };

  const goToTrends = () => {
    navigate("/trends/10/Maths");
  };

  const goToPredictivePapers = () => {
    navigate("/predictive-papers");
  };

  const goToMockBuilder = () => {
    navigate("/mock-builder");
  };

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const chips = [
    { label: "PYQ brain, not guesswork", emoji: "📊" },
    { label: "AI plan, HPQs & mocks", emoji: "🤖" },
    { label: "Chill mentor, no extra gyaan", emoji: "😎" },
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Tell us your board story",
      body: "Class, subjects, target %, days left. No long form.",
    },
    {
      step: 2,
      title: "We sort your chapters",
      body: "Ranked by PYQ weightage, trends and your comfort level.",
    },
    {
      step: 3,
      title: "You get a marks-first plan",
      body: "Daily checklist of concepts, HPQs, mocks and revision blocks.",
    },
    {
      step: 4,
      title: "Mentor keeps you steady",
      body: "Nudges, fixes mistakes, and tweaks the plan as you move.",
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e0f2ff_0,#dde7ff_30%,#e5edff_60%,#f1f5f9_100%)] pb-20">
      <div className="mx-auto max-w-[1120px] px-4 pt-3 pb-10">
        {/* TOP NAV */}
        <header className="mb-6 flex items-center justify-between gap-3 border-b border-slate-200/70 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[conic-gradient(at_top,_#22c55e,_#3b82f6,#6366f1,#fbbf24,#22c55e)] text-[0.9rem] font-extrabold text-slate-900">
              LT
            </div>
            <span className="text-[1rem] font-bold text-slate-950">
              LazyTopper
            </span>
          </div>
          <nav className="hidden items-center gap-4 text-[0.8rem] text-slate-600 sm:flex">
            <button
              onClick={() => scrollToId("how-it-works")}
              className="cursor-pointer border-none bg-transparent p-0 text-slate-600 hover:text-slate-900"
            >
              How it works
            </button>
            <button
              onClick={() => scrollToId("features")}
              className="cursor-pointer border-none bg-transparent p-0 text-slate-600 hover:text-slate-900"
            >
              Features
            </button>
            <button
              onClick={goToMentor}
              className="cursor-pointer rounded-full border border-blue-600/40 bg-blue-50 px-3 py-1.5 text-[0.8rem] font-semibold text-blue-700 shadow-sm hover:bg-blue-100"
            >
              Try AI mentor
            </button>
          </nav>
        </header>

        {/* HERO SECTION */}
        <section className="mb-10 grid items-center gap-7 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          {/* Left: copy + mini onboarding form */}
          <div>
            <p className="mb-2 text-[0.8rem] uppercase tracking-[0.24em] text-slate-500">
              CBSE 10 &amp; 12 • Maths + Science
            </p>

            <h1 className="mb-2 text-[2.4rem] font-extrabold leading-[1.1] text-slate-950 md:text-[2.6rem]">
              Study less.{" "}
              <span className="text-blue-600">Score more.</span>
            </h1>

            <p className="mb-4 max-w-xl text-[0.96rem] leading-7 text-slate-600">
              LazyTopper is an AI exam coach for CBSE that{" "}
              <strong>plans your days from now till boards</strong> so you know
              exactly <strong>what to study today</strong> for the marks you
              want.
            </p>

            {/* Feature chips */}
            <div className="mb-4 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-300/70 bg-slate-900/5 px-3 py-1 text-[0.8rem] text-slate-900 backdrop-blur-sm"
                >
                  <span>{chip.emoji}</span>
                  <span>{chip.label}</span>
                </span>
              ))}
            </div>

            {/* Mini sign-up / plan card (PRIMARY CONVERSION) */}
            <div className="mb-3 mt-1 max-w-md rounded-2xl bg-white p-3.5 shadow-[0_14px_32px_rgba(15,23,42,0.12)]">
              <p className="mb-2 text-[0.8rem] text-slate-600">
                Get your personalised board plan in under{" "}
                <strong>30 seconds.</strong>
              </p>
              <div className="mb-2 flex flex-wrap gap-2">
                <select className="min-w-[110px] flex-1 rounded-full border border-[#CBD5F5] px-3 py-2 text-[0.8rem] text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <option>Class 10</option>
                  <option>Class 12</option>
                </select>
                <input
                  type="text"
                  placeholder="Phone or email"
                  className="min-w-[160px] flex-1 rounded-full border border-[#CBD5F5] px-3 py-2 text-[0.8rem] text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button className="w-full cursor-pointer rounded-full bg-gradient-to-tr from-green-500 via-blue-500 to-indigo-500 px-4 py-2.5 text-[0.9rem] font-semibold text-slate-50 shadow-[0_14px_30px_rgba(59,130,246,0.5)] hover:brightness-105">
                Get my study plan
              </button>
              <p className="mt-1.5 text-[0.7rem] text-slate-400">
                No spam. Only your plan link and gentle exam nudges.
              </p>
            </div>

            <div className="mt-2 text-[0.8rem] text-slate-600">
              Approx <strong>93 days</strong> left for CBSE Class 10 boards.{" "}
              <span className="opacity-90">
                Use them like a topper, not a zombie. 👀
              </span>
            </div>

            {/* Secondary CTA – small, clearly secondary */}
            <div className="mt-3 text-[0.8rem] text-slate-500">
              or{" "}
              <button
                onClick={goToClass10Maths}
                className="cursor-pointer border-none bg-none p-0 text-blue-600 underline underline-offset-2"
              >
                browse Class 10 Maths trends →
              </button>
            </div>
          </div>

          {/* Right: planning-focused marketing card */}
          <div className="min-h-[260px] rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 via-20% to-blue-500 p-5 text-slate-50 shadow-[0_26px_70px_rgba(15,23,42,0.7)]">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-2.5 py-1 text-[0.7rem] uppercase tracking-[0.16em]">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>One roadmap till boards</span>
            </div>
            <p className="mb-2 text-[0.9rem] font-semibold">
              Turn “I&apos;ll start tomorrow” into a daily checklist.
            </p>
            <ul className="list-none space-y-1.5 text-[0.8rem] leading-6 text-slate-100/95">
              <li>📊 Splits your hours by must-crack vs high-ROI topics</li>
              <li>📝 Packs HPQs, mocks and revision into each day</li>
              <li>🤖 Adjusts when you miss a day (it happens)</li>
              <li>😎 Keeps the vibe chill, not panic-mode</li>
            </ul>
            <p className="mt-3 text-[0.78rem] text-slate-100/85">
              Planner, question bank and mentor – all fused into one calm exam
              brain.
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how-it-works"
          className="mb-9 rounded-[32px] border border-slate-300/40 bg-slate-50 p-5 shadow-[0_20px_48px_rgba(148,163,184,0.45)]"
        >
          <h2 className="mb-1 text-[1.3rem] font-semibold text-slate-950">
            How LazyTopper works
          </h2>
          <p className="mb-4 text-[0.86rem] text-slate-500">
            4 quick steps from “lost” to “board-ready”.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((card) => (
              <div
                key={card.step}
                className="rounded-3xl border border-slate-200 bg-white p-3.5 shadow-[0_10px_24px_rgba(148,163,184,0.32)]"
              >
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-600 text-[0.9rem] font-semibold text-indigo-600">
                  {card.step}
                </div>
                <h3 className="mb-1 text-[0.95rem] font-semibold text-slate-900">
                  {card.title}
                </h3>
                <p className="text-[0.8rem] text-slate-600">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PRODUCT PILLARS */}
        <section id="features" className="mb-9">
          <h2 className="mb-1 text-[1.25rem] font-semibold text-slate-950">
            Four pieces. One calm exam brain.
          </h2>
          <p className="mb-3 text-[0.86rem] text-slate-500">
            Topic trends, predictive papers, smart practice and an AI mentor –
            all talking to each other.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Trends */}
            <div className="rounded-3xl border border-slate-300/70 bg-slate-50 p-3.5 shadow-[0_14px_30px_rgba(148,163,184,0.28)]">
              <div className="mb-1 text-[0.78rem] uppercase tracking-[0.16em] text-slate-500">
                01 • Trends
              </div>
              <h3 className="mb-1 text-[0.98rem] font-semibold text-slate-900">
                TopicHub PYQ radar
              </h3>
              <p className="mb-2 text-[0.8rem] text-slate-600">
                10-year CBSE analysis that shows which chapters actually move
                your marks.
              </p>
              <button
                onClick={goToTrends}
                className="cursor-pointer rounded-full border border-blue-500/60 bg-blue-50/90 px-2.5 py-1 text-[0.78rem] text-blue-700 hover:bg-blue-100"
              >
                View trends →
              </button>
            </div>

            {/* Predictive papers */}
            <div className="rounded-3xl border border-slate-300/70 bg-slate-50 p-3.5 shadow-[0_14px_30px_rgba(148,163,184,0.28)]">
              <div className="mb-1 text-[0.78rem] uppercase tracking-[0.16em] text-slate-500">
                02 • Predict
              </div>
              <h3 className="mb-1 text-[0.98rem] font-semibold text-slate-900">
                AI predictive papers
              </h3>
              <p className="mb-2 text-[0.8rem] text-slate-600">
                80-mark, section-wise CBSE-style papers mapped to latest trends
                and blueprints.
              </p>
              <button
                onClick={goToPredictivePapers}
                className="cursor-pointer rounded-full border border-violet-500/60 bg-violet-50/90 px-2.5 py-1 text-[0.78rem] text-violet-700 hover:bg-violet-100"
              >
                See predicted papers →
              </button>
            </div>

            {/* Practice sets */}
            <div className="rounded-3xl border border-slate-300/70 bg-slate-50 p-3.5 shadow-[0_14px_30px_rgba(148,163,184,0.28)]">
              <div className="mb-1 text-[0.78rem] uppercase tracking-[0.16em] text-slate-500">
                03 • Practise
              </div>
              <h3 className="mb-1 text-[0.98rem] font-semibold text-slate-900">
                Smart practice sets
              </h3>
              <p className="mb-2 text-[0.8rem] text-slate-600">
                Build mini-mocks by topic, tier and difficulty in a few clicks.
              </p>
              <button
                onClick={goToMockBuilder}
                className="cursor-pointer rounded-full border border-emerald-500/60 bg-emerald-50/95 px-2.5 py-1 text-[0.78rem] text-emerald-700 hover:bg-emerald-100"
              >
                Build a mock →
              </button>
            </div>

            {/* Mentor */}
            <div className="rounded-3xl border border-slate-300/70 bg-slate-50 p-3.5 shadow-[0_14px_30px_rgba(148,163,184,0.28)]">
              <div className="mb-1 text-[0.78rem] uppercase tracking-[0.16em] text-slate-500">
                04 • Plan
              </div>
              <h3 className="mb-1 text-[0.98rem] font-semibold text-slate-900">
                AI mentor & planner
              </h3>
              <p className="mb-2 text-[0.8rem] text-slate-600">
                Converts your target, days left and hours/day into a realistic{" "}
                <strong>marks-first</strong> roadmap.
              </p>
              <button
                onClick={goToMentor}
                className="cursor-pointer rounded-full border border-blue-500/60 bg-blue-50/90 px-2.5 py-1 text-[0.78rem] text-blue-700 hover:bg-blue-100"
              >
                Open AI mentor →
              </button>
            </div>
          </div>
        </section>

        {/* SNEAK PEEK AI MENTOR */}
        <section className="rounded-[28px] border border-slate-300/60 bg-gradient-to-tr from-slate-50 to-sky-50 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.45)]">
          <div className="grid items-stretch gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div>
              <h2 className="mb-1 text-[1.2rem] font-semibold text-slate-950">
                Sneak peek: your AI mentor
              </h2>
              <p className="mb-2 text-[0.85rem] text-slate-600">
                You tell it{" "}
                <strong>targets, days left and hours/day</strong>; it sends you
                chapter-wise hours and next-step nudges.
              </p>
              <ul className="mb-2 list-disc pl-5 text-[0.8rem] leading-7 text-slate-700">
                <li>
                  Distributes hours using{" "}
                  <strong>board weightage + must-crack / high-ROI tags</strong>.
                </li>
                <li>
                  Connects to <strong>TopicHub</strong>,{" "}
                  <strong>HPQ bank</strong> and{" "}
                  <strong>Mock Builder</strong> so “plan → study → practise”
                  feels like one flow.
                </li>
                <li>
                  Later: logs your mocks + scores to keep tweaking the roadmap.
                </li>
              </ul>
              <button
                onClick={goToMentor}
                className="mt-1 cursor-pointer rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-emerald-500 px-4 py-2 text-[0.85rem] font-semibold text-slate-50 shadow-[0_14px_30px_rgba(59,130,246,0.55)] hover:brightness-105"
              >
                Open planner →
              </button>
            </div>

            {/* Fake screenshot card */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-700 p-3.5 text-[0.78rem] text-slate-100 shadow-[0_16px_40px_rgba(15,23,42,0.7)]">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[0.75rem] text-slate-200/90">
                  Maths • Class 10
                </span>
                <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-slate-950 text-[0.9rem]">
                  😶
                </span>
              </div>
              <div className="mb-2 rounded-xl bg-slate-950/80 p-2.5">
                <p className="mb-1 text-slate-100">
                  <strong>Planner snapshot</strong> for 80% target:
                </p>
                <ul className="ml-4 list-disc space-y-0.5 text-[0.78rem] text-slate-100/90">
                  <li>93 days left • 1 hr/day</li>
                  <li>~60% hours → 🔥 must-crack chapters</li>
                  <li>~30% → 💎 high-ROI + revision</li>
                  <li>~10% → 🌈 good-to-do / buffer</li>
                </ul>
              </div>
              <p className="text-slate-100/90">
                “Today’s focus: <strong>Pair of Linear Equations</strong> +
                <strong> Statistics</strong> HPQs. 40-minute mock, then 20
                minutes revision.”
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
