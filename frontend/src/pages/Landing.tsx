import { Link } from 'react-router-dom';
import { Mic, BarChart2 } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center text-white px-4 relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute w-[500px] h-[500px] bg-brand-teal/20 rounded-full blur-[100px] -top-20 -left-20 animate-pulse"></div>
        <div className="absolute w-[400px] h-[400px] bg-brand-saffron/20 rounded-full blur-[80px] bottom-10 right-10"></div>
      </div>
      
      <div className="z-10 text-center max-w-3xl w-full">
        <div className="mb-8 flex justify-center">
          <div className="bg-white/95 p-4 md:p-6 rounded-3xl shadow-2xl border border-white/30 backdrop-blur-md inline-flex items-center justify-center hover:scale-105 transition-transform duration-300">
            <img 
              src="/assets/jansetu-logo.png" 
              alt="JanSetu AI — Raise Voice Make Impact" 
              className="h-24 md:h-28 w-auto object-contain"
            />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
          Raise Voice. <span className="text-brand-saffron">Make Impact.</span>
        </h1>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
          An AI-assisted civic decision-support platform that converts collective citizen voices into actionable, location-aware infrastructure intelligence.
        </p>

        <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto">
          <Link to="/login?role=citizen" className="group flex flex-col items-center p-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-brand-saffron">
            <div className="w-16 h-16 bg-brand-saffron/20 text-brand-saffron rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mic size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Citizen</h2>
            <p className="text-gray-300 text-center text-sm mb-6">Raise and track issues in your community.</p>
            <span className="mt-auto px-6 py-2 bg-brand-saffron text-white rounded-full font-medium w-full text-center group-hover:bg-orange-600 transition-colors">
              Continue as Citizen
            </span>
          </Link>

          <Link to="/login?role=admin" className="group flex flex-col items-center p-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-brand-teal">
            <div className="w-16 h-16 bg-brand-teal/20 text-brand-teal rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BarChart2 size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Administrator</h2>
            <p className="text-gray-400 text-center text-sm mb-6">Understand community needs, infrastructure gaps and priorities.</p>
            <span className="mt-auto px-6 py-2 bg-brand-teal/20 text-brand-teal border border-brand-teal rounded-full font-medium w-full text-center group-hover:bg-brand-teal group-hover:text-white transition-colors">
              Continue as Administrator
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
