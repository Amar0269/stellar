import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import logo from "../../assets/homeImage.jpg";

// ── Data ─────────────────────────────────────────────────────────────────────
const acronym = [
  { letter: "S", word: "Student",    detail: "Empowering students with tools for learning, attendance, and results." },
  { letter: "T", word: "Teacher",    detail: "Connecting faculty with smart dashboards and complaint workflows." },
  { letter: "E", word: "Engagement", detail: "Fostering meaningful interaction between all campus stakeholders." },
  { letter: "L", word: "Learning",   detail: "Academic tools to streamline result viewing and performance tracking." },
  { letter: "L", word: "Living",     detail: "Smart IoT systems monitoring the campus environment in real time." },
  { letter: "A", word: "Assistance", detail: "Automated complaint management with role-based resolution." },
  { letter: "R", word: "Repository", detail: "A unified hub for all campus data, sensors, and services." },
];

const features = [
  {
    title: "IoT Monitoring",
    description: "Track temperature, humidity, gas levels, and dustbin status in real time from all campus rooms.",
  },
  {
    title: "Complaint Management",
    description: "Submit, track, and resolve campus complaints through a streamlined role-based workflow.",
  },
  {
    title: "Smart Campus Tools",
    description: "Attendance, academic results, and more — integrated into a single unified platform.",
  },
];

// ── STELLAR Acronym Card ──────────────────────────────────────────────────────
// FIX: removed useState + max-h-0 trick that caused cards to collapse/disappear.
// Detail text is always rendered; opacity + translateY animate purely via CSS group-hover.
function AcronymCard({ letter, word, detail, delay }) {
  return (
    <div
      data-aos="fade-up"
      data-aos-delay={delay}
      className="
        group relative flex flex-col bg-white border border-gray-100
        rounded-2xl px-5 pt-5 pb-6 shadow-sm cursor-default select-none
        hover:border-orange-300 hover:shadow-md hover:-translate-y-1
        transition-all duration-200 ease-in-out
      "
    >
      {/* Letter */}
      <span className="text-4xl font-black leading-none mb-1 text-orange-300 group-hover:text-orange-500 transition-colors duration-200">
        {letter}
      </span>

      {/* Word */}
      <span className="text-sm font-bold text-gray-800 mb-2">{word}</span>

      {/* Detail — always rendered, fades + slides up on hover via CSS only */}
      <p className="text-xs text-gray-400 leading-relaxed opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-in-out">
        {detail}
      </p>

      {/* Bottom accent bar */}
      <div className="absolute bottom-0 left-0 h-0.5 w-6 bg-orange-400 rounded-full group-hover:w-full transition-all duration-300 ease-in-out" />
    </div>
  );
}

// ── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ title, description, delay }) {
  return (
    <div
      data-aos="fade-up"
      data-aos-delay={delay}
      className="
        group bg-white p-6 rounded-2xl shadow-sm border border-gray-100
        hover:shadow-lg hover:border-orange-200 hover:-translate-y-1
        transition-all duration-200 ease-in-out
      "
    >
      <div className="h-1 w-8 bg-orange-500 rounded-full mb-4 group-hover:w-14 transition-all duration-300" />
      <h3 className="text-base font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

// ── Home Page ─────────────────────────────────────────────────────────────────
function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <div className="bg-white">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="flex flex-col md:flex-row items-center justify-between px-10 py-20 bg-gradient-to-br from-orange-50 via-white to-blue-50">

        {/* Left */}
        <div className="max-w-xl" data-aos="fade-right">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-3">
            Campus Interaction Platform
          </p>

          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
            STELLAR —{" "}
            <span className="text-orange-600">Smart Campus Platform</span>
          </h1>

          <p className="mt-5 text-gray-600 text-lg leading-relaxed">
            Stellar is a centralized platform designed to enhance interaction
            between students and faculty. It integrates IoT monitoring,
            complaint management, academic tools, and smart campus features.
          </p>

          <div className="mt-8 flex gap-4 flex-wrap">
            <button
              onClick={() => navigate("/login")}
              className="bg-orange-600 text-white px-7 py-3 rounded-xl text-base font-semibold hover:bg-orange-700 hover:scale-105 hover:shadow-lg active:scale-95 transition-all duration-150"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate("/about")}
              className="border border-gray-300 px-7 py-3 rounded-xl text-base font-semibold hover:bg-gray-100 hover:scale-105 hover:shadow-md active:scale-95 transition-all duration-150"
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Right image */}
        <div className="mt-12 md:mt-0 md:w-1/2 flex justify-center" data-aos="fade-left">
          <div className="bg-white p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <img src={logo} alt="Stellar Campus Platform" className="w-full rounded-xl" />
          </div>
        </div>
      </section>

      {/* ── STELLAR ACRONYM ──────────────────────────────── */}
      <section className="py-20 px-10 bg-white">
        <div className="max-w-4xl mx-auto text-center mb-12" data-aos="fade-up">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-2">
            What does STELLAR mean?
          </p>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Every Letter Has a Purpose
          </h2>
          <p className="text-gray-500 text-base max-w-xl mx-auto">
            STELLAR is more than a name — hover each card to discover what it represents.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {acronym.map(({ letter, word, detail }, index) => (
            <AcronymCard
              key={`${letter}-${word}`}
              letter={letter}
              word={word}
              detail={detail}
              delay={index * 70}
            />
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section className="bg-gray-50 py-20 px-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12" data-aos="fade-up">
            Key Features
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ title, description }, index) => (
              <FeatureCard key={title} title={title} description={description} delay={index * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-20 px-10 text-center bg-white">
        <h2 className="text-3xl font-bold text-gray-800" data-aos="zoom-in">
          Ready to Experience the Smart Campus?
        </h2>
        <p className="mt-4 text-gray-500 max-w-lg mx-auto" data-aos="zoom-in" data-aos-delay="120">
          Join Stellar and access everything your campus has to offer — all from one place.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="mt-8 bg-orange-600 text-white px-10 py-3 rounded-xl text-base font-semibold hover:bg-orange-700 hover:scale-105 hover:shadow-lg active:scale-95 transition-all duration-150"
          data-aos="zoom-in"
          data-aos-delay="240"
        >
          Get Started
        </button>
      </section>

    </div>
  );
}

export default Home;