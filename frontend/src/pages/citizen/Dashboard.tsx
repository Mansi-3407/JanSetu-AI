import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Home, Mic, FileText, Users, Map as MapIcon, Bell, User, LogOut,
  Send, MapPin, AlertCircle, CheckCircle2, Clock, ChevronRight, Menu, X,
  Search, Phone, Mail, ArrowRight, RefreshCw, Check, Sparkles, AlertTriangle
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

// Complete Bilingual Dictionary (English & Hindi)
const t = {
  en: {
    brand: "JANSETU AI",
    subBrand: "Civic Action Platform",
    sidebar: {
      home: "Home",
      raise_voice: "Raise Voice",
      my_reports: "My Reports",
      my_community: "My Community",
      local_map: "Local Map", 
      notifications: "Notifications",
      profile: "Profile",
      logout: "Sign Out"
    },
    home: {
      greeting: "Welcome back",
      subtitle: "Your voice shapes civic priorities and powers infrastructure repair in your community.",
      cta_banner_title: "Notice a civic or infrastructure issue?",
      cta_banner_sub: "Raise your voice in English or Hindi. Our AI automatically categorizes and routes it to administration.",
      btn_speak: "Speak Issue",
      btn_write: "Write Complaint",
      stats_submitted: "Total Reports Submitted",
      stats_in_progress: "Active / In Progress",
      stats_resolved: "Resolved Issues",
      stats_community: "Community Active Issues",
      recent_title: "Your Recent Submissions",
      view_all: "View All Reports →",
      empty_title: "No issues reported yet",
      empty_sub: "Empower your neighborhood by reporting roads, water, electricity, or sanitation problems.",
      empty_btn: "Raise Your First Voice",
      community_spotlight: "Community Trends",
      explore_community: "Explore Community →",
      map_preview_title: "Active Complaints Near You",
      open_map: "Open Full Map →"
    },
    raise: {
      title: "Lodge a Citizen Complaint",
      subtitle: "Mandatory contact snapshot and description required for verified administrative action.",
      contact_section: "Citizen Contact Information (Saved with Report)",
      name_label: "Full Name *",
      name_placeholder: "e.g. Ramesh Kumar",
      email_label: "Email Address",
      email_placeholder: "e.g. citizen@example.com",
      phone_label: "Phone Number",
      phone_placeholder: "e.g. +91 98765 43210",
      contact_hint: "* At least ONE contact method (Email or Phone) is mandatory.",
      address_label: "Full Residential Address *",
      address_placeholder: "House/Plot, Village/Colony, Block, District, State",
      complaint_section: "Issue Description",
      complaint_label: "Describe the infrastructure or civic issue *",
      complaint_placeholder: "Describe the problem in your words (Hindi or English). Example: The road near the primary school is damaged with deep potholes and gets flooded during rain...",
      lang_label: "Complaint Language",
      submit_btn: "Submit & Analyze with AI",
      submitting_btn: "Analyzing with AI...",
      cancel: "Cancel",
      validation_error: "Please complete all mandatory fields (Name, Address, Complaint, and either Email or Phone).",
      ai_success_title: "AI Successfully Understood",
      ai_success_desc: "Your complaint has been verified, structured with Gemini AI, and logged into the administrative database.",
      ai_error_title: "We Couldn't Analyze Your Complaint",
      ai_error_desc: "The AI service encountered an error or was temporarily busy. We have not saved a broken report.",
      retry_btn: "Retry Analysis",
      category: "Category",
      issue_type: "Identified Issue",
      location: "Extracted Location",
      severity: "Severity Level",
      urgency: "Urgency",
      status: "Current Status",
      view_in_reports: "View in My Reports"
    },
    reports: {
      title: "My Submitted Reports",
      subtitle: "Track the real-time review, planning, and resolution of your complaints.",
      search_placeholder: "Search by issue, category, or address...",
      filter_all: "All Statuses",
      details_title: "Report Investigation & Timeline",
      contact_snapshot: "Submitted Contact Snapshot",
      ai_analysis: "AI Extraction & Intelligence",
      status_timeline: "Resolution Timeline",
      close: "Close"
    },
    community: {
      title: "Community Intelligence",
      subtitle: "Collective citizen voice and infrastructure status in your district.",
      active_issues: "Active Community Issues",
      top_categories: "Most Reported Issue Categories",
      hotspots: "Identified Civic Hotspots",
      reports_count: "reports"
    },
    map: {
      title: "Local Civic Map",
      subtitle: "Geolocated citizen complaints and active infrastructure hotspots.",
      filter_cat: "Filter Category",
      all: "All",
      legend_high: "High / Critical (Sev 4-5)",
      legend_med: "Moderate (Sev 3)",
      legend_low: "Low (Sev 1-2)"
    },
    notifs: {
      title: "Notifications & Status Updates",
      mark_all_read: "Mark All as Read",
      empty: "You have no notifications at this time."
    },
    profile: {
      title: "Citizen Profile Settings",
      subtitle: "Manage your personal information. These details pre-fill your future complaints.",
      name: "Full Name",
      email: "Email Address (Account ID)",
      phone: "Phone Number",
      address: "Residential Address",
      pref_lang: "Preferred Language",
      save_btn: "Save Changes",
      saved_success: "Profile updated and persisted successfully!"
    }
  },
  hi: {
    brand: "जनसेतु AI",
    subBrand: "नागरिक समाधान मंच",
    sidebar: {
      home: "होम",
      raise_voice: "आवाज़ उठाएं",
      my_reports: "मेरी शिकायतें",
      my_community: "मेरा समुदाय",
      local_map: "स्थानीय नक्शा", 
      notifications: "सूचनाएं",
      profile: "प्रोफ़ाइल",
      logout: "साइन आउट"
    },
    home: {
      greeting: "नमस्ते",
      subtitle: "आपकी आवाज़ नागरिक प्राथमिकताओं को दिशा देती है और बुनियादी ढांचे में सुधार लाती है।",
      cta_banner_title: "क्या कोई बुनियादी ढांचा या नागरिक समस्या है?",
      cta_banner_sub: "हिंदी या अंग्रेजी में अपनी आवाज़ उठाएं। हमारा AI इसे समझकर सीधे प्रशासन तक पहुंचाता है।",
      btn_speak: "समस्या बोलें",
      btn_write: "शिकायत लिखें",
      stats_submitted: "कुल दर्ज शिकायतें",
      stats_in_progress: "सक्रिय / प्रक्रियाधीन",
      stats_resolved: "समाधान हुई समस्याएं",
      stats_community: "समुदाय में सक्रिय मुद्दे",
      recent_title: "आपकी हालिया शिकायतें",
      view_all: "सभी शिकायतें देखें →",
      empty_title: "अभी तक कोई शिकायत दर्ज नहीं है",
      empty_sub: "सड़क, पानी, बिजली या स्वच्छता की समस्या दर्ज करके अपने क्षेत्र को बेहतर बनाएं।",
      empty_btn: "अपनी पहली आवाज़ उठाएं",
      community_spotlight: "सामुदायिक रुझान",
      explore_community: "समुदाय देखें →",
      map_preview_title: "आपके आसपास की सक्रिय समस्याएं",
      open_map: "पूरा नक्शा खोलें →"
    },
    raise: {
      title: "नागरिक शिकायत दर्ज करें",
      subtitle: "सत्यापित प्रशासनिक कार्रवाई के लिए संपर्क विवरण और समस्या का विवरण अनिवार्य है।",
      contact_section: "नागरिक संपर्क जानकारी (रिपोर्ट के साथ सुरक्षित)",
      name_label: "पूरा नाम *",
      name_placeholder: "उदा. रमेश कुमार",
      email_label: "ईमेल पता",
      email_placeholder: "उदा. citizen@example.com",
      phone_label: "फ़ोन नंबर",
      phone_placeholder: "उदा. +91 98765 43210",
      contact_hint: "* कम से कम एक संपर्क माध्यम (ईमेल या फ़ोन नंबर) अनिवार्य है।",
      address_label: "पूरा आवासीय पता *",
      address_placeholder: "मकान/प्लॉट, गांव/कॉलोनी, ब्लॉक, जिला, राज्य",
      complaint_section: "समस्या का विवरण",
      complaint_label: "समस्या का विस्तार से वर्णन करें *",
      complaint_placeholder: "समस्या को अपने शब्दों में लिखें (हिंदी या अंग्रेजी)। उदाहरण: प्राथमिक स्कूल के पास की मुख्य सड़क पूरी तरह टूट चुकी है और गड्ढों के कारण बारिश में चलना कठिन हो गया है...",
      lang_label: "शिकायत की भाषा",
      submit_btn: "जमा करें और AI विश्लेषण करें",
      submitting_btn: "AI विश्लेषण जारी है...",
      cancel: "रद्द करें",
      validation_error: "कृपया सभी अनिवार्य फ़ील्ड भरें (नाम, पता, शिकायत विवरण, और ईमेल या फ़ोन)।",
      ai_success_title: "AI ने सफलतापूर्वक समझा",
      ai_success_desc: "आपकी शिकायत Gemini AI द्वारा सत्यापित और वर्गीकृत करके प्रशासनिक डेटाबेस में दर्ज कर दी गई है।",
      ai_error_title: "हम आपकी शिकायत का विश्लेषण नहीं कर सके",
      ai_error_desc: "AI सेवा में कोई समस्या आई या वह अस्थायी रूप से व्यस्त थी। कोई गलत रिपोर्ट दर्ज नहीं की गई है।",
      retry_btn: "पुनः प्रयास करें",
      category: "श्रेणी",
      issue_type: "पहचाना गया मुद्दा",
      location: "पहचाना गया स्थान",
      severity: "गंभीरता",
      urgency: "तात्कालिकता",
      status: "वर्तमान स्थिति",
      view_in_reports: "मेरी शिकायतों में देखें"
    },
    reports: {
      title: "मेरी दर्ज शिकायतें",
      subtitle: "अपनी शिकायतों की प्रशासनिक समीक्षा, योजना और समाधान को ट्रैक करें।",
      search_placeholder: "मुद्दे, श्रेणी या पते से खोजें...",
      filter_all: "सभी स्थितियां",
      details_title: "शिकायत विवरण एवं समयरेखा",
      contact_snapshot: "दर्ज संपर्क विवरण",
      ai_analysis: "AI निष्कर्षण एवं विश्लेषण",
      status_timeline: "समाधान समयरेखा",
      close: "बंद करें"
    },
    community: {
      title: "सामुदायिक विश्लेषण",
      subtitle: "आपके जिले में नागरिकों की सामूहिक आवाज़ और बुनियादी ढांचे की स्थिति।",
      active_issues: "सक्रिय सामुदायिक समस्याएं",
      top_categories: "सर्वाधिक दर्ज श्रेणियां",
      hotspots: "पहचाने गए नागरिक हॉटस्पॉट",
      reports_count: "शिकायतें"
    },
    map: {
      title: "स्थानीय नागरिक नक्शा",
      subtitle: "स्थान-आधारित नागरिक शिकायतें और सक्रिय बुनियादी ढांचा हॉटस्पॉट।",
      filter_cat: "श्रेणी फ़िल्टर करें",
      all: "सभी",
      legend_high: "उच्च / गंभीर (स्तर 4-5)",
      legend_med: "मध्यम (स्तर 3)",
      legend_low: "निम्न (स्तर 1-2)"
    },
    notifs: {
      title: "सूचनाएं एवं स्थिति अपडेट",
      mark_all_read: "सभी को पढ़ा हुआ चिह्नित करें",
      empty: "वर्तमान में कोई नई सूचना नहीं है।"
    },
    profile: {
      title: "नागरिक प्रोफ़ाइल सेटिंग्स",
      subtitle: "अपनी व्यक्तिगत जानकारी प्रबंधित करें। यह विवरण आपकी शिकायतों में स्वतः भर जाएगा।",
      name: "पूरा नाम",
      email: "ईमेल पता (खाता आईडी)",
      phone: "फ़ोन नंबर",
      address: "आवासीय पता",
      pref_lang: "पसंदीदा भाषा",
      save_btn: "परिवर्तन सहेजें",
      saved_success: "प्रोफ़ाइल सफलतापूर्वक डेटाबेस में सहेजी गई!"
    }
  }
};

export default function CitizenDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login?role=citizen');
        return;
      }
      const res = await axios.get(`${API_BASE}/citizen/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      if (res.data.citizen?.preferred_language === 'Hindi') {
        setLang('hi');
      }
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        handleLogout();
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const toggleLang = () => {
    const nextLang = lang === 'en' ? 'hi' : 'en';
    setLang(nextLang);
  };

  const navItems = [
    { name: t[lang].sidebar.home, icon: Home, path: '/citizen' },
    { name: t[lang].sidebar.raise_voice, icon: Mic, path: '/citizen/raise-voice' },
    { name: t[lang].sidebar.my_reports, icon: FileText, path: '/citizen/reports' },
    { name: t[lang].sidebar.my_community, icon: Users, path: '/citizen/community' },
    { name: t[lang].sidebar.local_map, icon: MapIcon, path: '/citizen/map' },
    { name: t[lang].sidebar.notifications, icon: Bell, path: '/citizen/notifications' },
    { name: t[lang].sidebar.profile, icon: User, path: '/citizen/profile' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Loading JanSetu Citizen Portal...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col p-6">
        <AlertCircle size={48} className="text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to connect to JanSetu Services</h2>
        <p className="text-slate-500 mb-6 text-center max-w-md">There was an issue reaching the civic intelligence backend. Please verify your connection.</p>
        <button onClick={fetchDashboard} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow">Retry Connection</button>
      </div>
    );
  }

  const currentStrings = t[lang];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col border-r border-slate-800 shadow-xl z-20">
        <div className="p-5 border-b border-slate-800">
          <Link to="/citizen" className="flex flex-col items-center gap-2.5 group">
            <div className="bg-white p-2.5 rounded-2xl shadow-md border border-slate-700/50 w-full flex items-center justify-center group-hover:shadow-teal-900/20 transition-all">
              <img 
                src="/assets/jansetu-logo.png" 
                alt="JanSetu AI" 
                className="h-11 w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-between w-full px-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{currentStrings.subBrand}</span>
              <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-1.5 py-0.5 rounded font-black">
                CITIZEN
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.name} 
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all text-sm ${
                  isActive 
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-900/40' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card at Bottom of Sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow">
              {data.citizen.full_name?.charAt(0) || 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{data.citizen.full_name}</div>
              <div className="text-xs text-slate-400 truncate">{data.community_summary.district}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 px-3 py-2 w-full text-left text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg font-medium transition-colors"
          >
            <LogOut size={14} />
            {currentStrings.sidebar.logout}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-slate-600 p-1" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={22} />
            </button>
            <div className="md:hidden flex items-center gap-2">
              <div className="bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-sm flex items-center">
                <img src="/assets/jansetu-logo.png" alt="JanSetu AI" className="h-7 w-auto object-contain" />
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              <MapPin size={12} className="text-amber-500" />
              <span>{data.community_summary.district}, Maharashtra</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button 
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700 shadow-sm"
              title="Toggle English / Hindi"
            >
              <span className={lang === 'en' ? 'text-teal-600 font-extrabold' : 'text-slate-400'}>EN</span>
              <span className="text-slate-300">|</span>
              <span className={lang === 'hi' ? 'text-teal-600 font-extrabold' : 'text-slate-400'}>हिंदी</span>
            </button>
            
            {/* Notifications Shortcut */}
            <Link 
              to="/citizen/notifications"
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Bell size={18} />
              {data.notifications.unread_count > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </Link>

            <Link to="/citizen/profile" className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm hover:ring-2 hover:ring-teal-500 transition-all">
                {data.citizen.full_name?.charAt(0) || 'C'}
              </div>
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
            <div className="relative w-72 bg-slate-900 text-white h-full flex flex-col shadow-2xl">
              <div className="p-5 flex justify-between items-center border-b border-slate-800">
                <div className="bg-white p-2 rounded-xl">
                  <img src="/assets/jansetu-logo.png" alt="JanSetu AI" className="h-9 w-auto object-contain" />
                </div>
                <button onClick={() => setMobileMenuOpen(false)}><X size={20} className="text-slate-400" /></button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map(item => (
                  <Link 
                    key={item.name} 
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <item.icon size={18} className="text-teal-400" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Routes>
            <Route path="/" element={<HomeView data={data} t={currentStrings} />} />
            <Route path="/raise-voice" element={<RaiseVoiceView userProfile={data.citizen} lang={lang} t={currentStrings} onRefresh={fetchDashboard} />} />
            <Route path="/reports" element={<MyReportsView t={currentStrings} />} />
            <Route path="/reports/:id" element={<MyReportsView t={currentStrings} />} />
            <Route path="/community" element={<CommunityView t={currentStrings} initialData={data} />} />
            <Route path="/map" element={<LocalMapView t={currentStrings} />} />
            <Route path="/notifications" element={<NotificationsView t={currentStrings} onRefresh={fetchDashboard} />} />
            <Route path="/profile" element={<ProfileView userProfile={data.citizen} t={currentStrings} onRefresh={fetchDashboard} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 1. HOME VIEW
// -------------------------------------------------------------
function HomeView({ data, t }: { data: any, t: any }) {
  const dict = t.home;
  const firstName = data.citizen.full_name?.split(' ')[0] || 'Citizen';

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            {dict.greeting}, {firstName} 👋
          </h1>
          <p className="text-slate-500 text-sm md:text-base mt-1">{dict.subtitle}</p>
        </div>
        <Link 
          to="/citizen/raise-voice"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow active:scale-95 text-sm"
        >
          <Mic size={18} />
          {dict.btn_write}
        </Link>
      </div>

      {/* Action CTA Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <Sparkles size={14} />
            <span>AI-Driven Civic Routing</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-2">{dict.cta_banner_title}</h2>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">{dict.cta_banner_sub}</p>
          <div className="flex flex-wrap gap-3">
            <Link 
              to="/citizen/raise-voice" 
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm text-sm"
            >
              <Mic size={16} />
              {dict.btn_speak}
            </Link>
            <Link 
              to="/citizen/raise-voice" 
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-medium px-5 py-2.5 rounded-xl transition-colors backdrop-blur-sm border border-white/15 text-sm"
            >
              <FileText size={16} />
              {dict.btn_write}
            </Link>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-2xl md:text-3xl font-black text-slate-900">{data.report_summary.total}</div>
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">{dict.stats_submitted}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-2xl md:text-3xl font-black text-amber-600">{data.report_summary.requiring_attention}</div>
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">{dict.stats_in_progress}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-2xl md:text-3xl font-black text-teal-600">{data.report_summary.resolved || 0}</div>
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">{dict.stats_resolved}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-2xl md:text-3xl font-black text-indigo-600">{data.community_summary.active_issues}</div>
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">{dict.stats_community}</div>
        </div>
      </div>

      {/* Grid: Recent Reports & Community */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Submissions */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">{dict.recent_title}</h2>
            <Link to="/citizen/reports" className="text-xs font-semibold text-teal-600 hover:text-teal-700">{dict.view_all}</Link>
          </div>

          <div className="space-y-3">
            {data.recent_reports.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                <AlertCircle className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                <h3 className="text-base font-bold text-slate-800">{dict.empty_title}</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">{dict.empty_sub}</p>
                <Link to="/citizen/raise-voice" className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow">
                  {dict.empty_btn}
                </Link>
              </div>
            ) : (
              data.recent_reports.map((report: any) => (
                <div key={report.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="bg-teal-50 text-teal-800 border border-teal-200/60 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                        {report.category || 'Civic'}
                      </span>
                      <span className="text-xs text-slate-400">{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm truncate">{report.issue_type || report.description}</h3>
                    <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                      <MapPin size={12} className="text-amber-500 flex-shrink-0" />
                      <span className="truncate">{report.location}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      report.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      report.status === 'Under Review' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      report.status === 'Action Planned' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {report.status}
                    </span>
                    <Link to={`/citizen/reports/${report.id}`} className="p-1.5 text-slate-400 hover:text-teal-600 bg-slate-50 hover:bg-teal-50 rounded-lg">
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right Sidebar: Community Insight & Map Preview */}
        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-3">{dict.community_spotlight}</h2>
            <div className="space-y-3 mb-4">
              {data.community_categories?.map((cat: any, idx: number) => {
                const max = data.community_categories[0]?.count || 1;
                const pct = Math.max(10, Math.round((cat.count / max) * 100));
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700">{cat.category}</span>
                      <span className="font-bold text-slate-500">{cat.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-teal-600 h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="bg-teal-50/70 border border-teal-100 rounded-xl p-3 text-xs text-teal-900 font-medium">
              💡 {data.community_summary.insight}
            </div>

            <Link to="/citizen/community" className="text-xs font-bold text-teal-600 hover:underline block text-center mt-3">
              {dict.explore_community}
            </Link>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-2">{dict.map_preview_title}</h2>
            <div className="bg-slate-100 rounded-xl h-28 border border-slate-200 flex items-center justify-center relative overflow-hidden mb-3">
              <div className="text-xs text-slate-500 font-medium z-10 bg-white/90 px-3 py-1.5 rounded-full shadow-sm">
                📍 {data.nearby_issues?.length || 0} Civic Hotspots in {data.community_summary.district}
              </div>
            </div>
            <Link to="/citizen/map" className="text-xs font-bold text-teal-600 hover:underline block text-center">
              {dict.open_map}
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. RAISE VOICE VIEW (Full Functional Repair + Validation)
// -------------------------------------------------------------
function RaiseVoiceView({ userProfile, lang, t, onRefresh }: { userProfile: any, lang: 'en'|'hi', t: any, onRefresh: () => void }) {
  const dict = t.raise;
  const navigate = useNavigate();

  // Pre-fill from user profile
  const [name, setName] = useState(userProfile?.full_name || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [address, setAddress] = useState(userProfile?.address || '');
  const [complaintText, setComplaintText] = useState('');
  const [complaintLang, setComplaintLang] = useState(lang === 'hi' ? 'Hindi' : 'English');

  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError('');
    setAiError(null);
    setAiResult(null);

    // Strict Frontend Validation
    if (!name.trim()) {
      setValidationError('Full Name is mandatory.');
      return;
    }
    if (!address.trim()) {
      setValidationError('Residential Address is mandatory.');
      return;
    }
    if (!complaintText.trim()) {
      setValidationError('Complaint description is mandatory.');
      return;
    }
    const hasContact = (email && email.trim()) || (phone && phone.trim());
    if (!hasContact) {
      setValidationError('At least ONE contact method (Email or Phone) is mandatory.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        citizen_name: name.trim(),
        citizen_email: email.trim() || null,
        citizen_phone: phone.trim() || null,
        citizen_address: address.trim(),
        original_text: complaintText.trim(),
        language: complaintLang
      };

      const res = await axios.post(`${API_BASE}/reports`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAiResult(res.data);
      setComplaintText('');
      onRefresh(); // Refresh global counts
    } catch (err: any) {
      console.error('Report submission error:', err);
      const detail = err.response?.data?.detail || "AI processing failed. We couldn't analyze your complaint.";
      setAiError(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">{dict.title}</h2>
          <p className="text-slate-500 text-xs md:text-sm mt-1">{dict.subtitle}</p>
        </div>

        {validationError && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs md:text-sm flex items-center gap-2">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Contact Snapshot */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <User size={14} className="text-teal-600" />
              {dict.contact_section}
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{dict.name_label}</label>
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={dict.name_placeholder}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{dict.email_label}</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={dict.email_placeholder}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{dict.phone_label}</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input 
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={dict.phone_placeholder}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 font-medium">
              {dict.contact_hint}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{dict.address_label}</label>
              <input 
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={dict.address_placeholder}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Section 2: Complaint Text */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} className="text-teal-600" />
                {dict.complaint_section}
              </h3>
              
              <div className="flex items-center gap-1 text-xs font-medium">
                <span className="text-slate-400">{dict.lang_label}:</span>
                <select 
                  value={complaintLang} 
                  onChange={(e) => setComplaintLang(e.target.value)}
                  className="bg-slate-100 border border-slate-200 text-xs font-bold rounded-lg px-2 py-1 focus:outline-none text-slate-700"
                >
                  <option value="English">English</option>
                  <option value="Hindi">हिंदी (Hindi)</option>
                </select>
              </div>
            </div>

            <div>
              <textarea 
                required
                rows={5}
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder={dict.complaint_placeholder}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white resize-none transition-all leading-relaxed"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button 
              type="button" 
              onClick={() => navigate('/citizen')}
              className="text-slate-500 hover:text-slate-900 font-medium text-xs md:text-sm"
            >
              {dict.cancel}
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white px-6 py-3 rounded-xl font-bold text-sm shadow transition-all active:scale-95"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  {dict.submitting_btn}
                </>
              ) : (
                <>
                  <Send size={16} />
                  {dict.submit_btn}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Honest AI Success Card */}
      {aiResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-900/10">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-950">{dict.ai_success_title}</h3>
              <p className="text-xs md:text-sm text-emerald-800 mt-1">{dict.ai_success_desc}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-xl border border-emerald-100 shadow-sm">
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-1">{dict.category}</div>
              <div className="font-extrabold text-slate-900 text-sm">{aiResult.category}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-1">{dict.location}</div>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-1">
                <MapPin size={14} className="text-amber-500" />
                <span>{aiResult.district || aiResult.state || 'Local Region'}</span>
              </div>
            </div>
            <div className="col-span-1 md:col-span-2">
              <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-1">{dict.issue_type}</div>
              <div className="font-bold text-slate-900 text-sm">{aiResult.issue_type}</div>
              <div className="text-xs text-slate-600 mt-1">{aiResult.description}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-1">{dict.severity}</div>
              <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full text-xs font-bold border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Level {aiResult.severity} / 5
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-1">{dict.status}</div>
              <div className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-800 px-2.5 py-1 rounded-full text-xs font-bold border border-teal-200">
                <Clock size={12} />
                {aiResult.status}
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <Link 
              to="/citizen/reports" 
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              {dict.view_in_reports}
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Honest AI Failure Card with Retry */}
      {aiError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-rose-950">{dict.ai_error_title}</h3>
              <p className="text-xs md:text-sm text-rose-800 mt-1 leading-relaxed">{dict.ai_error_desc}</p>
              <div className="mt-3 p-3 bg-white rounded-lg border border-rose-200 text-xs font-mono text-rose-900">
                {aiError}
              </div>
              <div className="mt-4 flex gap-3">
                <button 
                  onClick={() => handleSubmit()} 
                  className="inline-flex items-center gap-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow"
                >
                  <RefreshCw size={14} />
                  {dict.retry_btn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// -------------------------------------------------------------
// 3. MY REPORTS VIEW (List + Status Timeline Drawer)
// -------------------------------------------------------------
function MyReportsView({ t }: { t: any }) {
  const dict = t.reports;
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<any>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/citizen/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = reports.filter(r => {
    const q = searchTerm.toLowerCase();
    return (
      (r.issue_type || '').toLowerCase().includes(q) ||
      (r.category || '').toLowerCase().includes(q) ||
      (r.citizen_address || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{dict.title}</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">{dict.subtitle}</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={dict.search_placeholder}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading complaints...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-700">No matching reports found</h3>
          <p className="text-xs text-slate-400 mt-1">Try changing your search terms or raise a new voice.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(r => (
            <div 
              key={r.id} 
              onClick={() => setSelectedReport(r)}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase">
                    {r.category || 'Civic'}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    r.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    r.status === 'Under Review' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    r.status === 'Action Planned' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {r.status}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{r.issue_type || r.description}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">{r.description || r.original_text}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 truncate max-w-[200px]">
                  <MapPin size={12} className="text-amber-500 flex-shrink-0" />
                  {r.district || r.citizen_address}
                </span>
                <span className="text-teal-600 font-bold hover:underline flex items-center gap-1">
                  View Timeline <ChevronRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded text-xs font-bold uppercase">
                  {selectedReport.category}
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-2">{selectedReport.issue_type}</h2>
                <div className="text-xs text-slate-400 mt-0.5">Report #{selectedReport.id} • Submitted on {new Date(selectedReport.created_at).toLocaleString()}</div>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            {/* Contact Snapshot */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">{dict.contact_snapshot}</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Citizen Name:</span>
                  <span className="font-bold text-slate-800">{selectedReport.citizen_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Contact:</span>
                  <span className="font-bold text-slate-800">{selectedReport.citizen_phone || selectedReport.citizen_email || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block font-medium">Submitted Address:</span>
                  <span className="font-bold text-slate-800">{selectedReport.citizen_address}</span>
                </div>
              </div>
            </div>

            {/* Complaint Text */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Original Complaint Text</h4>
              <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed font-sans">
                "{selectedReport.original_text}"
              </p>
            </div>

            {/* AI Analysis */}
            <div className="grid grid-cols-3 gap-3 bg-teal-50/50 p-4 rounded-xl border border-teal-100 text-xs">
              <div>
                <span className="text-teal-700 block font-semibold">Severity</span>
                <span className="font-extrabold text-slate-900 text-sm">{selectedReport.severity || 3} / 5</span>
              </div>
              <div>
                <span className="text-teal-700 block font-semibold">Urgency</span>
                <span className="font-extrabold text-slate-900 text-sm">{selectedReport.urgency || 3} / 5</span>
              </div>
              <div>
                <span className="text-teal-700 block font-semibold">Confidence</span>
                <span className="font-extrabold text-slate-900 text-sm">{Math.round((selectedReport.ai_confidence || 0.95) * 100)}%</span>
              </div>
            </div>

            {/* Status Timeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{dict.status_timeline}</h4>
              <div className="space-y-4 border-l-2 border-teal-500 ml-3 pl-4">
                {selectedReport.status_history && selectedReport.status_history.length > 0 ? (
                  selectedReport.status_history.map((h: any, i: number) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-teal-600 ring-4 ring-white"></div>
                      <div className="text-xs font-extrabold text-slate-900">{h.new_status}</div>
                      <div className="text-[11px] text-slate-400">{new Date(h.created_at).toLocaleString()} • {h.changed_by}</div>
                      {h.note && <div className="text-xs text-slate-600 mt-0.5 bg-slate-50 p-2 rounded border border-slate-200">{h.note}</div>}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400">Current Status: {selectedReport.status}</div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setSelectedReport(null)}
                className="bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800"
              >
                {dict.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 4. COMMUNITY VIEW
// -------------------------------------------------------------
function CommunityView({ t, initialData }: { t: any, initialData: any }) {
  const dict = t.community;
  const [commData, setCommData] = useState<any>(null);

  useEffect(() => {
    fetchCommunity();
  }, []);

  const fetchCommunity = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/citizen/community`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCommData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const data = commData || {
    district: initialData?.community_summary?.district || 'Pune',
    active_clusters: initialData?.nearby_issues || [],
    categories: initialData?.community_categories || []
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{dict.title} - {data.district}</h1>
        <p className="text-slate-500 text-xs md:text-sm mt-0.5">{dict.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">{dict.hotspots}</h2>
          <div className="space-y-4">
            {data.active_clusters?.map((c: any, i: number) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded uppercase">
                    {c.category}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{c.name || `${c.category} Issue Cluster`}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Impact: ~{c.population_affected ? `${(c.population_affected/1000).toFixed(0)}k citizens` : 'Local community'} • Severity: {c.severity_score || '8.5'}/10
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-slate-900">{c.report_count || 12}</div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase">{dict.reports_count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">{dict.top_categories}</h2>
          <div className="space-y-4">
            {data.categories?.map((cat: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">{cat.category}</span>
                  <span className="text-slate-900 font-bold">{cat.count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-teal-600 h-2 rounded-full" style={{ width: `${Math.min(100, cat.count * 15)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 5. LOCAL MAP VIEW
// -------------------------------------------------------------
function LocalMapView({ t }: { t: any }) {
  const dict = t.map;
  const [reports, setReports] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState('All');
  const [selectedPin, setSelectedPin] = useState<any>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/citizen/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = reports.filter(r => selectedCat === 'All' || r.category === selectedCat);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{dict.title}</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">{dict.subtitle}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">{dict.filter_cat}:</span>
          <select 
            value={selectedCat} 
            onChange={(e) => setSelectedCat(e.target.value)}
            className="bg-white border border-slate-200 text-xs font-bold rounded-xl px-3 py-2 text-slate-800 shadow-sm"
          >
            <option value="All">{dict.all}</option>
            <option value="Roads & Infrastructure">Roads & Infrastructure</option>
            <option value="Water Supply">Water Supply</option>
            <option value="Electricity & Streetlights">Electricity & Streetlights</option>
            <option value="Waste Management">Waste Management</option>
            <option value="Drainage & Sewage">Drainage & Sewage</option>
          </select>
        </div>
      </div>

      {/* Map Graphic Canvas */}
      <div className="bg-slate-900 rounded-2xl h-[480px] p-6 relative overflow-hidden shadow-xl border border-slate-800 flex flex-col justify-between">
        {/* Subtle Map Grid Lines */}
        <div className="absolute inset-0 opacity-15" style={{backgroundImage: 'radial-gradient(#0d9488 1.5px, transparent 1.5px)', backgroundSize: '24px 24px'}}></div>
        
        {/* Map Legend */}
        <div className="relative z-10 bg-slate-950/80 backdrop-blur-md border border-slate-800 text-white text-xs px-3.5 py-2 rounded-xl inline-flex items-center gap-4 self-start shadow-lg">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> {dict.legend_high}</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> {dict.legend_med}</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span> {dict.legend_low}</div>
        </div>

        {/* Dynamic Pins */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <div className="relative w-full max-w-2xl h-80">
            {filtered.map((r, i) => {
              // Deterministic pseudo coordinates inside box
              const top = 20 + ((i * 37) % 65);
              const left = 15 + ((i * 53) % 75);
              const isHigh = (r.severity || 3) >= 4;
              return (
                <div 
                  key={r.id} 
                  onClick={() => setSelectedPin(r)}
                  style={{ top: `${top}%`, left: `${left}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-125 z-20 group`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg ${
                    isHigh ? 'bg-rose-500 ring-4 ring-rose-500/20' : 'bg-teal-500 ring-4 ring-teal-500/20'
                  }`}>
                    <MapPin size={16} />
                  </div>
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[11px] font-bold px-2 py-1 rounded shadow whitespace-nowrap z-30">
                    {r.issue_type}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Pin Drawer */}
        {selectedPin && (
          <div className="relative z-20 bg-white text-slate-900 rounded-xl p-4 shadow-xl border border-slate-200 max-w-md self-center w-full animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded uppercase">
                  {selectedPin.category}
                </span>
                <h4 className="font-bold text-sm mt-1">{selectedPin.issue_type}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{selectedPin.citizen_address}</p>
              </div>
              <button onClick={() => setSelectedPin(null)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 6. NOTIFICATIONS VIEW
// -------------------------------------------------------------
function NotificationsView({ t, onRefresh }: { t: any, onRefresh: () => void }) {
  const dict = t.notifs;
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifs();
  }, []);

  const fetchNotifs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/citizen/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/citizen/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifs();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{dict.title}</h1>
        </div>
        {notifs.length > 0 && (
          <button 
            onClick={markAllRead}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline"
          >
            {dict.mark_all_read}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center p-8 text-slate-400">Loading notifications...</div>
      ) : notifs.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Bell className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p className="text-xs text-slate-500">{dict.empty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifs.map(n => (
            <div 
              key={n.id} 
              className={`p-4 rounded-xl border transition-all ${
                n.is_read ? 'bg-white border-slate-200 text-slate-700' : 'bg-teal-50/60 border-teal-200 text-teal-950 font-medium'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold">{n.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  <span className="text-[11px] text-slate-400 mt-2 block">{new Date(n.created_at).toLocaleString()}</span>
                </div>
                {!n.is_read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600 flex-shrink-0 mt-1"></span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 7. CITIZEN PROFILE VIEW (Real Persistence in PostgreSQL/SQLite)
// -------------------------------------------------------------
function ProfileView({ userProfile, t, onRefresh }: { userProfile: any, t: any, onRefresh: () => void }) {
  const dict = t.profile;
  const [name, setName] = useState(userProfile?.full_name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [address, setAddress] = useState(userProfile?.address || '');
  const [prefLang, setPrefLang] = useState(userProfile?.preferred_language || 'English');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_BASE}/citizen/profile`, {
        full_name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        preferred_language: prefLang
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local storage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...user, ...res.data }));
      
      setSuccess(true);
      onRefresh();
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">{dict.title}</h1>
        <p className="text-slate-500 text-xs md:text-sm mt-0.5">{dict.subtitle}</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs md:text-sm flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          <span>{dict.saved_success}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{dict.name}</label>
          <input 
            type="text" 
            required 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{dict.email}</label>
          <input 
            type="email" 
            disabled 
            value={userProfile?.email || ''} 
            className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{dict.phone}</label>
          <input 
            type="tel" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            placeholder="+91 98765 43210"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{dict.address}</label>
          <input 
            type="text" 
            value={address} 
            onChange={(e) => setAddress(e.target.value)} 
            placeholder="Plot 42, Green Avenue, Pune, Maharashtra"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{dict.pref_lang}</label>
          <select 
            value={prefLang} 
            onChange={(e) => setPrefLang(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white font-medium"
          >
            <option value="English">English</option>
            <option value="Hindi">हिंदी (Hindi)</option>
          </select>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
            {dict.save_btn}
          </button>
        </div>
      </form>
    </div>
  );
}
