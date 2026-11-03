import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleAuthProvider } from './lib/firebase.ts';
import {
  PropertyItem,
  ServiceItem,
  UserProfile,
  BookingItem,
  OrderItem,
  PaymentItem,
  LeadItem,
  MessageItem,
  NotificationItem,
  AuditLogItem,
} from './types.ts';
import { PropertyVisual } from './components/PropertyVisual.tsx';
import { PropertyMap } from './components/PropertyMap.tsx';
import { PropertyModal } from './components/PropertyModal.tsx';
import { AiAdvisorView } from './components/AiAdvisorView.tsx';
import { CustomerDashboard } from './components/CustomerDashboard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AiChatbotWidget } from './components/AiChatbotWidget.tsx';
import {
  Search,
  ShieldCheck,
  MapPin,
  ArrowUpRight,
  Phone,
  Mail,
  MessageCircle,
  CheckCircle2,
  LogOut,
  SlidersHorizontal,
  Heart,
  Sparkles,
  Building2,
  Compass,
  Loader2,
} from 'lucide-react';

type ActivePage =
  | 'home'
  | 'properties'
  | 'ai-advisor'
  | 'about'
  | 'contact'
  | 'portal';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  // Auth State (token kept strictly in memory — supports both Customer Email/Password & Google Sign-In)
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [authFormMode, setAuthFormMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Customer Sign In / Sign Up Form Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regLocation, setRegLocation] = useState('Ibeju-Lekki, Lagos');
  const [regBudget, setRegBudget] = useState('15000000');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');

  // Platform Data from PostgreSQL
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favourites, setFavourites] = useState<number[]>([]);
  const [loadingBootstrap, setLoadingBootstrap] = useState(true);

  // Authenticated Dashboard Data
  const [portalMode, setPortalMode] = useState<'customer' | 'admin'>('customer');
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStateFilter, setSelectedStateFilter] = useState('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [selectedDocFilter, setSelectedDocFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'size-desc'>(
    'featured'
  );

  // Selected Property Modal State
  const [selectedProperty, setSelectedProperty] = useState<PropertyItem | null>(
    null
  );
  const [modalInitialTab, setModalInitialTab] = useState<
    'overview' | 'book' | 'order' | 'enquire'
  >('overview');

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactSubject, setContactSubject] = useState(
    'Land Acquisition & Cadastral Verification Enquiry'
  );
  const [contactBudget, setContactBudget] = useState('15000000');
  const [contactBody, setContactBody] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  // Listen for Google Maps Platform Demo Key Quota Event
  useEffect(() => {
    const handleQuota = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Monitor Firebase Authentication
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFbUser(user);
      if (user) {
        try {
          const token = await user.getIdToken();
          setAuthToken(token);
          if (user.email?.toLowerCase() === 'williamjoy621@gmail.com') {
            setPortalMode('admin');
          } else {
            setPortalMode('customer');
          }
        } catch {
          setAuthToken(null);
        }
      } else {
        setAuthToken((prev) => (prev && prev.startsWith('jc_sess.') ? prev : null));
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const fetchBootstrapData = useCallback(async (token: string | null) => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/bootstrap', { headers });
      const data = await res.json();
      if (res.ok) {
        setProperties(data.properties || []);
        setServices(data.services || []);
        if (data.profile) setProfile(data.profile);
        if (data.favourites) setFavourites(data.favourites);
      }
    } catch (err) {
      console.error('Bootstrap fetch failed:', err);
    } finally {
      setLoadingBootstrap(false);
    }
  }, []);

  const fetchDashboardData = useCallback(
    async (token: string | null, mode: 'customer' | 'admin') => {
      if (!token) return;
      try {
        const res = await fetch(`/api/dashboard?viewMode=${mode}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setProfile(data.profile);
          if (data.profile?.role !== 'admin') {
            setPortalMode('customer');
          }
          setBookings(data.bookings || []);
          setOrders(data.orders || []);
          setPayments(data.payments || []);
          setMessages(data.messages || []);
          setNotifications(data.notifications || []);
          setFavourites(data.favourites || []);
          setLeads(data.leads || []);
          setCustomers(data.customers || []);
          setAuditLogs(data.auditLogs || []);
        }
      } catch (err) {
        console.error('Dashboard fetch failed:', err);
      }
    },
    []
  );

  useEffect(() => {
    fetchBootstrapData(authToken);
    if (authToken) {
      fetchDashboardData(authToken, portalMode);
    }
  }, [authToken, portalMode, fetchBootstrapData, fetchDashboardData]);

  const handleRefreshAll = useCallback(() => {
    fetchBootstrapData(authToken);
    if (authToken) {
      fetchDashboardData(authToken, portalMode);
    }
  }, [authToken, portalMode, fetchBootstrapData, fetchDashboardData]);

  const handleCustomerSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');
    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });
      const rawText = await res.text();
      const data = JSON.parse(rawText);
      if (!res.ok) {
        throw new Error(data.error || 'Invalid email or password.');
      }
      setAuthToken(data.token);
      setProfile(data.profile);
      setPortalMode(data.profile?.role === 'admin' ? 'admin' : 'customer');
      setLoginPassword('');
      setActivePage('portal');
    } catch (err: any) {
      setAuthError(err.message || 'Sign in failed. Please check your credentials.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleCustomerSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');
    if (regPassword !== regConfirmPassword) {
      setAuthError('Passwords do not match. Please confirm your password.');
      return;
    }
    if (regPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }
    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regFullName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          password: regPassword,
          preferredLocation: regLocation,
          investmentBudget: Number(regBudget || 15000000),
        }),
      });
      const rawText = await res.text();
      const data = JSON.parse(rawText);
      if (!res.ok) {
        throw new Error(data.error || 'Could not create account.');
      }
      setAuthToken(data.token);
      setProfile(data.profile);
      setPortalMode(data.profile?.role === 'admin' ? 'admin' : 'customer');
      setRegPassword('');
      setRegConfirmPassword('');
      setActivePage('portal');
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed. Please try again.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleCustomerPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');
    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail.trim(),
          phone: resetPhone.trim(),
          newPassword: resetNewPassword,
        }),
      });
      const rawText = await res.text();
      const data = JSON.parse(rawText);
      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed.');
      }
      setAuthToken(data.token);
      setProfile(data.profile);
      setPortalMode(data.profile?.role === 'admin' ? 'admin' : 'customer');
      setResetNewPassword('');
      setActivePage('portal');
    } catch (err: any) {
      setAuthError(err.message || 'Unable to reset password.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthSuccessMsg('');
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      const token = await cred.user.getIdToken();
      setAuthToken(token);
      if (cred.user.email?.toLowerCase() === 'williamjoy621@gmail.com') {
        setPortalMode('admin');
      } else {
        setPortalMode('customer');
      }
      setActivePage('portal');
    } catch (error: any) {
      setAuthError(
        error.message || 'Sign-in popup was closed or blocked by browser.'
      );
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {
      // Ignore if signed in via customer session token
    }
    setAuthToken(null);
    setProfile(null);
    setBookings([]);
    setOrders([]);
    setPayments([]);
    setMessages([]);
    setNotifications([]);
    setPortalMode('customer');
    setActivePage('home');
  };

  const handleToggleSaveProperty = async (propertyId: number) => {
    if (!authToken) {
      setActivePage('portal');
      return;
    }
    const res = await fetch('/api/favourites/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ propertyId }),
    });
    if (res.ok) {
      const data = await res.json();
      setFavourites((prev) =>
        data.saved
          ? [...prev, propertyId]
          : prev.filter((id) => id !== propertyId)
      );
    }
  };

  const openPropertyModal = (
    property: PropertyItem,
    tab: 'overview' | 'book' | 'order' | 'enquire' = 'overview'
  ) => {
    setSelectedProperty(property);
    setModalInitialTab(tab);
  };

  const filteredProperties = useMemo(() => {
    return properties
      .filter((p) => {
        const q = searchQuery.trim().toLowerCase();
        const matchesQuery =
          !q ||
          p.title.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.referenceCode.toLowerCase().includes(q) ||
          p.documentationStatus.toLowerCase().includes(q);
        const matchesState =
          selectedStateFilter === 'All' || p.state === selectedStateFilter;
        const matchesCategory =
          selectedCategoryFilter === 'All' ||
          p.category === selectedCategoryFilter;
        const matchesDoc =
          selectedDocFilter === 'All' ||
          p.documentationStatus
            .toLowerCase()
            .includes(selectedDocFilter.toLowerCase());
        return matchesQuery && matchesState && matchesCategory && matchesDoc;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return Number(a.priceNgn) - Number(b.priceNgn);
        if (sortBy === 'price-desc') return Number(b.priceNgn) - Number(a.priceNgn);
        if (sortBy === 'size-desc') return b.sizeSqm - a.sizeSqm;
        return Number(b.isFeatured) - Number(a.isFeatured);
      });
  }, [
    properties,
    searchQuery,
    selectedStateFilter,
    selectedCategoryFilter,
    selectedDocFilter,
    sortBy,
  ]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    setContactSuccess(false);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          senderName: contactName,
          senderEmail: contactEmail,
          senderPhone: contactPhone,
          subject: contactSubject,
          messageBody: contactBody,
          captureAsLead: true,
          budgetNgn: Number(contactBudget) || 15000000,
        }),
      });
      if (res.ok) {
        setContactSuccess(true);
        setContactBody('');
        handleRefreshAll();
      }
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0B192C]">
      {/* Required Google Maps Platform Demo Key Quota Banner */}
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Top Navigation Bar — Strict 3-Zone Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 bg-[#0B192C] text-white border-b border-white/10 sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            setActivePage('home');
          }}
          className="text-xl font-serif-display font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          JOY CONSULTANT
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-300">
          {[
            { id: 'home', label: 'Home' },
            { id: 'properties', label: 'Properties' },
            { id: 'ai-advisor', label: 'AI Advisor' },
            { id: 'about', label: 'About Us' },
            { id: 'contact', label: 'Contact' },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                setActivePage(item.id as ActivePage);
              }}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activePage === item.id
                  ? 'text-[#E5C158] border-[#C59B27]'
                  : 'border-transparent hover:text-white'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActivePage('portal')}
            className="px-4 py-2 text-xs font-semibold text-[#0B192C] bg-[#C59B27] rounded-lg hover:bg-[#d4aa32] transition-colors whitespace-nowrap shrink-0"
          >
            {authToken
              ? profile?.role === 'admin'
                ? 'Admin Console'
                : 'My Account'
              : 'Sign In / Sign Up'}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center justify-around bg-[#11233D] text-slate-300 px-3 py-2 text-xs border-b border-white/10 overflow-x-auto">
        {[
          { id: 'home', label: 'Home' },
          { id: 'properties', label: 'Properties' },
          { id: 'ai-advisor', label: 'AI Advisor' },
          { id: 'about', label: 'About Us' },
          { id: 'contact', label: 'Contact' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActivePage(item.id as ActivePage)}
            className={`px-2.5 py-1 rounded whitespace-nowrap shrink-0 ${
              activePage === item.id ? 'text-[#E5C158] font-semibold' : ''
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1">
        {activePage === 'home' && (
          <div>
            {/* Hero Section */}
            <section className="bg-[#0B192C] text-white border-b border-white/10">
              <div className="max-w-7xl mx-auto px-6 py-14 lg:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                  <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="text-xs font-mono-tabular text-[#E5C158] tracking-wider">
                        NIGERIA LAND ACQUISITION · CADASTRAL VERIFICATION · PROPERTY CONSULTANCY
                      </div>
                      <h1
                        className="font-serif-display font-bold text-white leading-[1.12] text-balance"
                        style={{ fontSize: 'clamp(2.25rem, 4vw, 3.75rem)' }}
                      >
                        Acquire Registry-Verified Land Across Nigeria’s Fastest-Growing Corridors.
                      </h1>
                      <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                        Welcome to JOY CONSULTANT. Explore surveyed residential, commercial, waterfront, and agro-industrial land parcels with verified Certificates of Occupancy (C of O), Governor’s Consent, live inspection booking, and AI-guided portfolio advisory.
                      </p>
                    </div>

                    {/* Instant Search Bar */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/15 backdrop-blur-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                        <div className="sm:col-span-5 relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search Lekki, Epe, Guzape Abuja, Ibadan..."
                            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white text-[#0B192C] text-xs focus:outline-none"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <select
                            value={selectedCategoryFilter}
                            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-white text-[#0B192C] text-xs focus:outline-none"
                          >
                            <option value="All">All Land Categories</option>
                            <option value="Residential Land">Residential Land</option>
                            <option value="Commercial Land">Commercial Land</option>
                            <option value="Waterfront Plot">Waterfront Plot</option>
                            <option value="Agricultural / Farmland">Agricultural / Farmland</option>
                            <option value="Mixed-Use Estate">Mixed-Use Estate</option>
                          </select>
                        </div>
                        <div className="sm:col-span-3">
                          <button
                            type="button"
                            onClick={() => setActivePage('properties')}
                            className="w-full py-2.5 px-4 rounded-lg bg-[#C59B27] text-[#0B192C] text-xs font-semibold hover:bg-[#d4aa32] transition-colors whitespace-nowrap shrink-0"
                          >
                            Explore Lands
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300 pt-2">
                      <span>SURCON Charted Surveys</span>
                      <span aria-hidden="true">·</span>
                      <span>Alausa &amp; AGIS Registry Verified</span>
                      <span aria-hidden="true">·</span>
                      <span>Physical &amp; Live Virtual Inspections</span>
                    </div>
                  </div>

                  {/* Featured Cadastral Highlight Card */}
                  <div className="lg:col-span-5 flex flex-col justify-between rounded-xl overflow-hidden border border-white/15 bg-[#122642]">
                    {properties[0] ? (
                      <>
                        <PropertyVisual
                          imageType={properties[0].imageType}
                          imageUrl={properties[0].imageUrl}
                          referenceCode={properties[0].referenceCode}
                          sizeSqm={properties[0].sizeSqm}
                          coordinatesLat={properties[0].coordinatesLat}
                          coordinatesLng={properties[0].coordinatesLng}
                          className="h-64"
                        />
                        <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="text-xs text-[#E5C158] font-mono-tabular">
                              FEATURED ESTATE · {properties[0].referenceCode} ·{' '}
                              {properties[0].documentationStatus}
                            </div>
                            <h2 className="text-xl font-serif-display font-semibold text-white mt-1">
                              {properties[0].title}
                            </h2>
                            <p className="text-xs text-slate-300 mt-1">
                              {properties[0].location}
                            </p>
                          </div>
                          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                            <div>
                              <div className="text-[11px] text-slate-400">
                                Outright Price ({properties[0].sizeSqm} sqm)
                              </div>
                              <div className="text-lg font-mono-tabular font-bold text-[#E5C158]">
                                ₦{Number(properties[0].priceNgn).toLocaleString()}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => openPropertyModal(properties[0], 'overview')}
                              className="px-3.5 py-2 rounded-lg bg-white text-[#0B192C] text-xs font-semibold hover:bg-slate-100 transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                            >
                              Verify Title &amp; Book
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-8 text-center my-auto text-xs text-slate-300">
                        Loading verified estate catalog...
                      </div>
                    )}
                  </div>
                </div>

                {/* Full-Width 4-Column Quantitative Proof Row Below Hero Split */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12 pt-8 border-t border-white/10">
                  <div>
                    <div className="text-2xl font-mono-tabular font-bold text-[#E5C158]">
                      {properties.length} Estates
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5">
                      Charted Across Lagos, Abuja, Oyo &amp; Enugu
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-mono-tabular font-bold text-white">
                      100% Charted
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5">
                      Zero Government Committed Acquisition Overlap
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-mono-tabular font-bold text-white">
                      ₦3.8M – ₦145M
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5">
                      Entry-Level Agro Plots to Prime Waterfront Parcels
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-mono-tabular font-bold text-[#E5C158]">
                      48-Hour Allocation
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5">
                      Provisional Allocation Issued Upon Verified Deposit
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Featured & Latest Land Listings */}
            <section className="max-w-7xl mx-auto px-6 py-16 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-mono-tabular text-[#9A7411]">
                    VERIFIED LAND CATALOGUE
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-serif-display font-bold text-[#0B192C] mt-1">
                    Featured Land Acquisitions &amp; Investment Listings
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePage('properties')}
                  className="text-xs font-semibold text-[#0B192C] hover:text-[#9A7411] inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  View Full Catalogue &amp; Filters ({properties.length})
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              {loadingBootstrap ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="h-96 rounded-xl bg-slate-200 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.slice(0, 6).map((prop) => {
                    const isSaved = favourites.includes(prop.id);
                    return (
                      <div
                        key={prop.id}
                        className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors"
                      >
                        <div>
                          <PropertyVisual
                            imageType={prop.imageType}
                            imageUrl={prop.imageUrl}
                            referenceCode={prop.referenceCode}
                            sizeSqm={prop.sizeSqm}
                            coordinatesLat={prop.coordinatesLat}
                            coordinatesLng={prop.coordinatesLng}
                          />
                          <div className="p-5 space-y-2.5">
                            {/* Clean unboxed metadata with typographic separators */}
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>{prop.category}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono-tabular">
                                {prop.plotCount} plots left
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="text-emerald-700 font-medium">
                                {prop.availabilityStatus}
                              </span>
                            </div>

                            <h3 className="text-lg font-serif-display font-bold text-[#0B192C] leading-snug">
                              {prop.title}
                            </h3>

                            <p className="text-xs text-slate-600 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[#9A7411] shrink-0" />
                              <span>{prop.location}</span>
                            </p>

                            <div className="text-xs text-slate-600 pt-1">
                              <span className="font-medium text-[#0B192C]">
                                Verified Title:
                              </span>{' '}
                              {prop.documentationStatus}
                            </div>

                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {prop.description}
                            </p>
                          </div>
                        </div>

                        <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-3">
                          <div className="flex items-baseline justify-between">
                            <div>
                              <span className="text-[11px] text-slate-500 block">
                                Outright per {prop.sizeSqm} sqm
                              </span>
                              <span className="text-lg font-mono-tabular font-bold text-[#0B192C]">
                                ₦{Number(prop.priceNgn).toLocaleString()}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleSaveProperty(prop.id)}
                              className={`text-xs inline-flex items-center gap-1 ${
                                isSaved
                                  ? 'text-[#9A7411] font-semibold'
                                  : 'text-slate-500 hover:text-[#0B192C]'
                              }`}
                            >
                              <Heart
                                className={`w-3.5 h-3.5 ${
                                  isSaved ? 'fill-current' : ''
                                }`}
                              />
                              {isSaved ? 'Saved' : 'Save'}
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => openPropertyModal(prop, 'overview')}
                              className="py-2 px-3 rounded-lg border border-slate-300 text-xs font-medium text-[#0B192C] hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                            >
                              Verify Title &amp; Details
                            </button>
                            <button
                              type="button"
                              onClick={() => openPropertyModal(prop, 'book')}
                              className="py-2 px-3 rounded-lg bg-[#0B192C] text-white text-xs font-semibold hover:bg-[#162B49] transition-colors whitespace-nowrap shrink-0"
                            >
                              Book Inspection
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Interactive Google Maps Corridor Explorer */}
            <section className="bg-white border-y border-slate-200 py-16">
              <div className="max-w-7xl mx-auto px-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono-tabular text-[#9A7411]">
                      GEOSPATIAL CADASTRAL DIRECTORY
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-serif-display font-bold text-[#0B192C] mt-1">
                      Available Locations &amp; Interactive Survey Coordinates
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      Click any pin across Lagos (Ibeju-Lekki, Epe, Victoria Island), Abuja (Guzape), Oyo (Moniya), or Enugu to inspect plot details.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivePage('ai-advisor')}
                    className="px-4 py-2 rounded-lg bg-[#0B192C] text-white text-xs font-semibold hover:bg-[#162B49] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
                    Ask AI Advisor Which Location Suits Your Budget
                  </button>
                </div>

                <PropertyMap
                  properties={properties}
                  onInspectProperty={(p) => openPropertyModal(p, 'overview')}
                  heightClass="h-[460px]"
                />
              </div>
            </section>

            {/* Core Capabilities & Consultancy Services (Editorial Numbering) */}
            <section className="max-w-7xl mx-auto px-6 py-16 space-y-8">
              <div className="max-w-2xl">
                <div className="text-xs font-mono-tabular text-[#9A7411]">
                  END-TO-END PROPERTY CONSULTANCY
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif-display font-bold text-[#0B192C] mt-1">
                  Professional Land Advisory &amp; Documentation Services
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {services.map((srv, index) => (
                  <div
                    key={srv.id}
                    className={`${
                      index === 0 || index === 3 ? 'md:col-span-7' : 'md:col-span-5'
                    } bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4`}
                  >
                    <div className="space-y-2">
                      <div className="text-xs text-slate-500">
                        <span>{srv.category}</span>
                        <span aria-hidden="true"> · </span>
                        <span className="font-mono-tabular text-[#9A7411] font-semibold">
                          {srv.priceLabel}
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span>{srv.durationEstimate}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-[#0B192C]">
                        0{index + 1}. {srv.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {srv.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4 text-xs">
                      <span className="text-slate-500 truncate">
                        Deliverables: {srv.deliverables}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setContactSubject(`Service Request: ${srv.title}`);
                          setActivePage('contact');
                        }}
                        className="text-[#0B192C] font-semibold hover:text-[#9A7411] whitespace-nowrap shrink-0"
                      >
                        Request Service →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Attributable Testimonials (Claim-to-Proof Adjacency) */}
            <section className="bg-[#0B192C] text-white py-16 border-t border-white/10">
              <div className="max-w-7xl mx-auto px-6 space-y-8">
                <div className="max-w-2xl">
                  <div className="text-xs font-mono-tabular text-[#E5C158]">
                    VERIFIED INVESTOR OUTCOMES
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-serif-display font-bold mt-1">
                    Trusted by Nigerian Executives &amp; Diaspora Land Investors
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      quote:
                        'Before working with JOY CONSULTANT, our family lost 4 months trying to verify an unchartable excision parcel in Lekki. Their surveyor charted Plot A14 & A15 at The Imperial Haven Estate in 72 hours, and our Lagos State C of O extract and registered survey were delivered within 14 days of payment.',
                      name: 'Dr. Adewale Ogunleye',
                      role: 'Chief Medical Director',
                      org: 'Lagos Mainland Specialist Hospital',
                      metric: '2 Plots Acquired · Survey LS/D/IBJ/4491/2025 Verified',
                    },
                    {
                      quote:
                        'Investing from the UK used to feel risky until I used JOY CONSULTANT’s Virtual Live Video Inspection. Their legal head walked my Lagos solicitor through the Governor’s Consent file (EPE/GC/2025/192) on Goldcrest Commercial Hub before I paid my 50% deposit via Paystack.',
                      name: 'Chidinma Nwosu',
                      role: 'Director of Operations',
                      org: 'Nwosu Freight & Logistics Ltd (London / Lagos)',
                      metric: '1,000 SQM Commercial Parcel · 6-Month Structured Plan',
                    },
                    {
                      quote:
                        'With a ₦12M budget for agro-industrial warehousing near the Lagos-Ibadan rail terminal, the AI Advisor matched us to 3 contiguous plots at Emerald Agro-Industrial Park in Moniya. Beacon casting and Deed execution were completed ahead of schedule.',
                      name: 'Oluwaseun Adebayo',
                      role: 'Managing Partner',
                      org: 'GreenBelt AgriTech Processing Ltd, Ibadan',
                      metric: '1,800 SQM Acquired · 100% Title Perfection',
                    },
                  ].map((t, i) => (
                    <div
                      key={i}
                      className="p-6 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-4"
                    >
                      <p className="text-xs text-slate-200 leading-relaxed">
                        &ldquo;{t.quote}&rdquo;
                      </p>
                      <div className="pt-4 border-t border-white/10 space-y-1">
                        <div className="font-semibold text-sm text-white">
                          {t.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {t.role}, {t.org}
                        </div>
                        <div className="text-[11px] font-mono-tabular text-[#E5C158] pt-1">
                          {t.metric}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {activePage === 'properties' && (
          <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="text-xs font-mono-tabular text-[#9A7411]">
                  SERVICES &amp; LAND LISTINGS CATALOGUE
                </div>
                <h1 className="text-3xl font-serif-display font-bold text-[#0B192C] mt-1">
                  Verified Land Listings &amp; Property Consultancy Services
                </h1>
              </div>
              <button
                type="button"
                onClick={() => setActivePage('ai-advisor')}
                className="px-4 py-2 rounded-lg bg-[#0B192C] text-white text-xs font-semibold hover:bg-[#162B49] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
                Use AI Budget Recommender
              </button>
            </div>

            {/* Filter & Sort Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                <div className="relative lg:col-span-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by estate name, city, ref code, or C of O..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <select
                  value={selectedStateFilter}
                  onChange={(e) => setSelectedStateFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="All">All States / Regions</option>
                  <option value="Lagos State">Lagos State</option>
                  <option value="FCT Abuja">FCT Abuja</option>
                  <option value="Oyo State">Oyo State</option>
                  <option value="Enugu State">Enugu State</option>
                </select>

                <select
                  value={selectedDocFilter}
                  onChange={(e) => setSelectedDocFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="All">All Title Documents</option>
                  <option value="Certificate of Occupancy">Certificate of Occupancy (C of O)</option>
                  <option value="Governor's Consent">Governor&rsquo;s Consent</option>
                  <option value="Registered Survey">Registered Survey &amp; Deed</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="featured">Sort: Featured First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="size-desc">Plot Size: Largest First</option>
                </select>
              </div>

              {/* Interactive Category Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
                {[
                  'All',
                  'Residential Land',
                  'Commercial Land',
                  'Waterfront Plot',
                  'Agricultural / Farmland',
                  'Mixed-Use Estate',
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      selectedCategoryFilter === cat
                        ? 'bg-[#0B192C] text-white'
                        : 'bg-slate-100 text-slate-600 hover:text-[#0B192C]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtered Listings Grid */}
            {filteredProperties.length === 0 ? (
              <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
                <p className="text-sm text-slate-600">
                  No land listings match your current filter selection.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStateFilter('All');
                    setSelectedCategoryFilter('All');
                    setSelectedDocFilter('All');
                  }}
                  className="px-4 py-2 rounded-lg bg-[#0B192C] text-white text-xs font-semibold"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((prop) => {
                  const isSaved = favourites.includes(prop.id);
                  return (
                    <div
                      key={prop.id}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        <PropertyVisual
                          imageType={prop.imageType}
                          imageUrl={prop.imageUrl}
                          referenceCode={prop.referenceCode}
                          sizeSqm={prop.sizeSqm}
                          coordinatesLat={prop.coordinatesLat}
                          coordinatesLng={prop.coordinatesLng}
                        />
                        <div className="p-5 space-y-2.5">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{prop.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-tabular">
                              {prop.plotCount} plots
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="text-emerald-700 font-medium">
                              {prop.availabilityStatus}
                            </span>
                          </div>
                          <h3 className="text-lg font-serif-display font-bold text-[#0B192C]">
                            {prop.title}
                          </h3>
                          <p className="text-xs text-slate-600">{prop.location}</p>
                          <div className="text-xs text-slate-700">
                            <strong>Title:</strong> {prop.documentationStatus} ·{' '}
                            <span className="font-mono-tabular">
                              {prop.surveyPlanNumber}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {prop.description}
                          </p>
                        </div>
                      </div>

                      <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-mono-tabular font-bold text-[#0B192C]">
                            ₦{Number(prop.priceNgn).toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleSaveProperty(prop.id)}
                            className="text-xs text-slate-600 hover:text-[#9A7411] inline-flex items-center gap-1"
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${
                                isSaved ? 'fill-[#9A7411] text-[#9A7411]' : ''
                              }`}
                            />
                            {isSaved ? 'Saved' : 'Save'}
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => openPropertyModal(prop, 'overview')}
                            className="py-2 px-2 rounded border border-slate-300 text-[11px] font-medium text-[#0B192C] hover:bg-slate-50 whitespace-nowrap shrink-0"
                          >
                            Verify Docs
                          </button>
                          <button
                            type="button"
                            onClick={() => openPropertyModal(prop, 'book')}
                            className="py-2 px-2 rounded bg-slate-100 text-[11px] font-semibold text-[#0B192C] hover:bg-slate-200 whitespace-nowrap shrink-0"
                          >
                            Book Tour
                          </button>
                          <button
                            type="button"
                            onClick={() => openPropertyModal(prop, 'order')}
                            className="py-2 px-2 rounded bg-[#0B192C] text-[11px] font-semibold text-white hover:bg-[#162B49] whitespace-nowrap shrink-0"
                          >
                            Buy Land
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activePage === 'ai-advisor' && (
          <AiAdvisorView
            properties={properties}
            authToken={authToken}
            onSelectProperty={(prop, tab) => openPropertyModal(prop, tab || 'overview')}
          />
        )}

        {activePage === 'about' && (
          <div className="max-w-7xl mx-auto px-6 py-14 space-y-12">
            <div className="max-w-3xl space-y-4">
              <div className="text-xs font-mono-tabular text-[#9A7411]">
                ABOUT JOY CONSULTANT · CORPORATE PROFILE
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif-display font-bold text-[#0B192C] text-balance">
                Institutional-Grade Land Acquisition, Title Due Diligence &amp; Property Advisory in Nigeria.
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                JOY CONSULTANT was established to eliminate title uncertainty, unverified coordinates, and opaque documentation in the Nigerian land market. Every estate and parcel listed on our digital platform undergoes rigorous cadastral charting at the Office of the Surveyor-General and legal encumbrance searches before being presented to investors.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-mono-tabular text-[#9A7411]">01. OUR MISSION</div>
                <h3 className="text-lg font-serif-display font-bold text-[#0B192C]">
                  Transparent, Fraud-Free Land Ownership
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  To provide homebuyers, commercial developers, and diaspora Nigerians with a transparent digital real estate system where every survey coordinate, C of O, and payment tranche is verifiable in real time.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-mono-tabular text-[#9A7411]">02. OUR VISION</div>
                <h3 className="text-lg font-serif-display font-bold text-[#0B192C]">
                  West Africa’s Most Trusted Land Advisory
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  To set the gold standard for AI-assisted real estate consultancy and digital land administration across Nigeria’s high-growth infrastructure corridors.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-mono-tabular text-[#9A7411]">03. CORE VALUES</div>
                <h3 className="text-lg font-serif-display font-bold text-[#0B192C]">
                  Cadastral Integrity &amp; Fiduciary Care
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We never list government-committed land, never invent documentation statuses, and never guarantee speculative returns—relying strictly on verified registry facts.
                </p>
              </div>
            </div>

            {/* 4-Step Verification Process */}
            <div className="bg-[#0B192C] text-white p-8 rounded-xl space-y-6">
              <div>
                <div className="text-xs font-mono-tabular text-[#E5C158]">
                  OUR PROFESSIONAL APPROACH
                </div>
                <h2 className="text-2xl font-serif-display font-bold mt-1">
                  Why Customers Trust JOY CONSULTANT
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
                <div className="space-y-2">
                  <div className="font-mono-tabular text-[#E5C158] font-semibold">
                    STAGE 01 · SURVEY CHARTING
                  </div>
                  <div className="font-semibold text-sm">
                    Coordinate Verification
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    SURCON-licensed surveyors pick GPS boundary coordinates and chart them against State Master Plans to confirm zero government acquisition.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="font-mono-tabular text-[#E5C158] font-semibold">
                    STAGE 02 · REGISTRY SEARCH
                  </div>
                  <div className="font-semibold text-sm">
                    Legal Title Audit
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Our real estate solicitors verify the root of title (C of O, Governor’s Consent, or Gazette) at Alausa, AGIS Abuja, or state registries.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="font-mono-tabular text-[#E5C158] font-semibold">
                    STAGE 03 · SITE &amp; VIRTUAL TOUR
                  </div>
                  <div className="font-semibold text-sm">
                    Physical or Live Drone Inspection
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Clients inspect physical perimeter beacons on-site or join a live high-definition virtual tour from anywhere in the world.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="font-mono-tabular text-[#E5C158] font-semibold">
                    STAGE 04 · ESCROW &amp; PERFECTION
                  </div>
                  <div className="font-semibold text-sm">
                    Deed Execution &amp; Allocation
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Upon Paystack-verified deposit or outright settlement, clients receive their Allocation Letter, Registered Survey, and Executed Deed of Assignment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activePage === 'contact' && (
          <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
            <div className="max-w-2xl">
              <div className="text-xs font-mono-tabular text-[#9A7411]">
                DIRECT ADVISORY &amp; OFFICE LOCATIONS
              </div>
              <h1 className="text-3xl font-serif-display font-bold text-[#0B192C] mt-1">
                Contact JOY CONSULTANT
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Reach our Land Acquisition &amp; Legal Verification Desk via form, direct phone, WhatsApp, or visit our Victoria Island Lagos and Abuja offices.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Contact & Lead Capture Form */}
              <form
                onSubmit={handleContactSubmit}
                className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 space-y-4 text-xs"
              >
                <h2 className="text-lg font-serif-display font-semibold text-[#0B192C]">
                  Submit an Official Enquiry
                </h2>

                {contactSuccess && (
                  <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                    Thank you! Your message and buyer profile have been saved to our PostgreSQL database. Our advisory desk will respond shortly.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Your Full Name"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Phone / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+2348144833743"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Estimated Budget (₦ NGN)
                    </label>
                    <input
                      type="number"
                      value={contactBudget}
                      onChange={(e) => setContactBudget(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono-tabular"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Message / Property Requirements
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={contactBody}
                    onChange={(e) => setContactBody(e.target.value)}
                    placeholder="Tell us the location, number of plots, or title verification service you need..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-[#0B192C] text-white font-semibold hover:bg-[#162B49] transition-colors"
                >
                  {contactSubmitting ? 'Sending...' : 'Send Enquiry to Advisory Desk'}
                </button>
              </form>

              {/* Direct Channels & Google Maps Office Location */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 text-xs">
                  <h2 className="text-lg font-serif-display font-semibold text-[#0B192C]">
                    Direct Communication Channels
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                      <div className="text-slate-500">Victoria Island Head Office</div>
                      <div className="font-semibold text-[#0B192C]">
                        Plot 1420 Adeola Odeku Street, Victoria Island, Lagos
                      </div>
                      <div className="font-mono-tabular text-slate-600">
                        Mon – Sat · 8:30 AM – 6:00 PM WAT
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                      <div className="text-slate-500">Abuja Regional Directorate</div>
                      <div className="font-semibold text-[#0B192C]">
                        Suite 402, Statement Complex, Wuse II / Guzape Axis, Abuja
                      </div>
                      <div className="font-mono-tabular text-slate-600">
                        +2348144833743 · williamjoy621@gmail.com
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <a
                      href="https://wa.me/2348144833743?text=Hello%20JOY%20CONSULTANT%2C%20I%20would%20like%20to%20enquire%20about%20available%20verified%20land%20listings."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800 inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat on WhatsApp
                    </a>
                    <a
                      href="tel:+2348144833743"
                      className="px-4 py-2.5 rounded-lg border border-slate-300 text-[#0B192C] font-medium hover:bg-slate-50 inline-flex items-center gap-2 whitespace-nowrap shrink-0 font-mono-tabular"
                    >
                      <Phone className="w-4 h-4 text-[#9A7411]" />
                      +2348144833743
                    </a>
                    <a
                      href="mailto:williamjoy621@gmail.com"
                      className="px-4 py-2.5 rounded-lg border border-slate-300 text-[#0B192C] font-medium hover:bg-slate-50 inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                    >
                      <Mail className="w-4 h-4 text-[#9A7411]" />
                      williamjoy621@gmail.com
                    </a>
                  </div>
                </div>

                {/* Interactive Google Maps Office & Estates Locator */}
                <PropertyMap
                  properties={properties}
                  onInspectProperty={(p) => openPropertyModal(p, 'overview')}
                  showOfficePin={true}
                  heightClass="h-[340px]"
                />
              </div>
            </div>
          </div>
        )}

        {activePage === 'portal' && (
          <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
            {authLoading ? (
              <div className="py-20 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#9A7411]" />
                Verifying session...
              </div>
            ) : !authToken ? (
              <div className="max-w-lg mx-auto bg-white p-8 rounded-xl border border-slate-200 space-y-6">
                <div>
                  <div className="text-xs font-mono-tabular text-[#9A7411]">
                    CLIENT AUTHENTICATION &amp; INVESTOR ACCOUNT PORTAL
                  </div>
                  <h1 className="text-2xl font-serif-display font-bold text-[#0B192C] mt-1">
                    {authFormMode === 'signup'
                      ? 'Create Your JOY CONSULTANT Account'
                      : authFormMode === 'reset'
                      ? 'Reset Your Account Password'
                      : 'Sign In to Your Customer Account'}
                  </h1>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Access your personal Customer Dashboard to manage land inspection bookings, purchase orders, Paystack receipts, title verification documents, and saved properties.
                  </p>
                </div>

                {/* Sign In / Sign Up Mode Tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthFormMode('signin');
                      setAuthError('');
                      setAuthSuccessMsg('');
                    }}
                    className={`py-2 rounded-md font-semibold transition-colors ${
                      authFormMode === 'signin'
                        ? 'bg-[#0B192C] text-white'
                        : 'text-slate-600 hover:text-[#0B192C]'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthFormMode('signup');
                      setAuthError('');
                      setAuthSuccessMsg('');
                    }}
                    className={`py-2 rounded-md font-semibold transition-colors ${
                      authFormMode === 'signup'
                        ? 'bg-[#0B192C] text-white'
                        : 'text-slate-600 hover:text-[#0B192C]'
                    }`}
                  >
                    Sign Up (New Customer)
                  </button>
                </div>

                {authError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                    {authError}
                  </div>
                )}

                {authSuccessMsg && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                    {authSuccessMsg}
                  </div>
                )}

                {authFormMode === 'signin' && (
                  <form onSubmit={handleCustomerSignIn} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-medium text-slate-700">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthFormMode('reset');
                            setAuthError('');
                          }}
                          className="text-[#9A7411] hover:underline font-medium"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-300"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={authSubmitting}
                      className="w-full py-3 px-4 rounded-lg bg-[#0B192C] text-white font-semibold hover:bg-[#162B49] transition-colors flex items-center justify-center gap-2"
                    >
                      {authSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Sign In to Customer Dashboard
                    </button>
                  </form>
                )}

                {authFormMode === 'signup' && (
                  <form onSubmit={handleCustomerSignUp} className="space-y-3.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={regFullName}
                          onChange={(e) => setRegFullName(e.target.value)}
                          placeholder="e.g. Chinedu Okafor"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Phone / WhatsApp Number
                        </label>
                        <input
                          type="tel"
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="+2348144833743"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Preferred Location
                        </label>
                        <select
                          value={regLocation}
                          onChange={(e) => setRegLocation(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="Ibeju-Lekki, Lagos">Ibeju-Lekki, Lagos</option>
                          <option value="Epe Corridor, Lagos">Epe Corridor, Lagos</option>
                          <option value="Victoria Island, Lagos">Victoria Island, Lagos</option>
                          <option value="Guzape District, Abuja">Guzape District, Abuja</option>
                          <option value="Moniya Axis, Ibadan">Moniya Axis, Ibadan</option>
                          <option value="Centenary Corridor, Enugu">Centenary Corridor, Enugu</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Target Budget (₦ NGN)
                        </label>
                        <input
                          type="number"
                          min={1000000}
                          step={500000}
                          value={regBudget}
                          onChange={(e) => setRegBudget(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono-tabular"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Password (Min. 6 chars)
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Create password"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Confirm password"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authSubmitting}
                      className="w-full py-3 px-4 rounded-lg bg-[#0B192C] text-white font-semibold hover:bg-[#162B49] transition-colors flex items-center justify-center gap-2"
                    >
                      {authSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Create Account &amp; Open Customer Dashboard
                    </button>
                  </form>
                )}

                {authFormMode === 'reset' && (
                  <form onSubmit={handleCustomerPasswordReset} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Registered Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Phone Number (Optional Verification)
                      </label>
                      <input
                        type="tel"
                        value={resetPhone}
                        onChange={(e) => setResetPhone(e.target.value)}
                        placeholder="+2348144833743"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        New Password (Min. 6 chars)
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={authSubmitting}
                        className="flex-1 py-2.5 px-4 rounded-lg bg-[#0B192C] text-white font-semibold hover:bg-[#162B49]"
                      >
                        {authSubmitting ? 'Updating...' : 'Update Password & Sign In'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthFormMode('signin')}
                        className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </form>
                )}

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase">
                    <span className="bg-white px-2 text-slate-400">Or Continue With</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 px-4 rounded-lg border border-slate-300 text-[#0B192C] text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-[#C59B27]" />
                  Continue with Google Account
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Authenticated Header — Admin Dashboard is strictly visible ONLY to Admin (profile.role === 'admin') */}
                <div className="bg-[#0B192C] text-white p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono-tabular text-[#E5C158]">
                      {profile?.role === 'admin'
                        ? `ADMINISTRATOR PORTAL · ${profile?.email || fbUser?.email}`
                        : `CUSTOMER INVESTOR PORTAL · ${profile?.email || fbUser?.email}`}
                    </div>
                    <h1 className="text-2xl font-serif-display font-bold mt-1">
                      {profile?.role === 'admin' && portalMode === 'admin'
                        ? 'Administrator Business Management Console'
                        : `Welcome back, ${profile?.fullName || fbUser?.displayName || 'Valued Client'}`}
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Strictly show Admin Dashboard toggle ONLY if authenticated user is an Administrator */}
                    {profile?.role === 'admin' && (
                      <div className="flex items-center bg-white/10 p-1 rounded-lg border border-white/15">
                        <button
                          type="button"
                          onClick={() => setPortalMode('customer')}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                            portalMode === 'customer'
                              ? 'bg-[#C59B27] text-[#0B192C] font-semibold'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          Customer View
                        </button>
                        <button
                          type="button"
                          onClick={() => setPortalMode('admin')}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                            portalMode === 'admin'
                              ? 'bg-[#C59B27] text-[#0B192C] font-semibold'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          Admin Dashboard
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="px-3.5 py-2 rounded-lg border border-white/20 text-xs font-medium text-white hover:bg-white/10 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>

                {profile?.role === 'admin' && portalMode === 'admin' ? (
                  <AdminDashboard
                    properties={properties}
                    bookings={bookings}
                    orders={orders}
                    payments={payments}
                    leads={leads}
                    messages={messages}
                    customers={customers}
                    auditLogs={auditLogs}
                    authToken={authToken}
                    onRefresh={handleRefreshAll}
                  />
                ) : (
                  profile && (
                    <CustomerDashboard
                      profile={profile}
                      properties={properties}
                      bookings={bookings}
                      orders={orders}
                      payments={payments}
                      messages={messages}
                      notifications={notifications}
                      favourites={favourites}
                      authToken={authToken}
                      onRefresh={handleRefreshAll}
                      onSelectProperty={(prop, tab) =>
                        openPropertyModal(prop, tab || 'overview')
                      }
                      onToggleSave={handleToggleSaveProperty}
                    />
                  )
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="bg-[#0B192C] text-slate-400 border-t border-white/10 py-10 px-6 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="text-base font-serif-display font-bold text-white">
              JOY CONSULTANT
            </div>
            <p className="text-slate-400">
              Land Sales · Land Acquisition · Cadastral Verification · Real Estate Investment Advisory (Nigeria)
            </p>
            <p className="text-slate-300 font-mono-tabular pt-0.5">
              Tel / WhatsApp: +2348144833743 · Email: williamjoy621@gmail.com
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => setActivePage('properties')}
              className="hover:text-white transition-colors"
            >
              Properties &amp; Services
            </button>
            <button
              type="button"
              onClick={() => setActivePage('ai-advisor')}
              className="hover:text-white transition-colors"
            >
              AI Investment Advisor
            </button>
            <button
              type="button"
              onClick={() => setActivePage('about')}
              className="hover:text-white transition-colors"
            >
              About Us
            </button>
            <button
              type="button"
              onClick={() => setActivePage('contact')}
              className="hover:text-white transition-colors"
            >
              Contact &amp; Offices
            </button>
            <button
              type="button"
              onClick={() => setActivePage('portal')}
              className="hover:text-white transition-colors"
            >
              Customer Sign In / Sign Up
            </button>
          </div>
        </div>
      </footer>

      {/* Property Details / Inspection / Order Modal */}
      {selectedProperty && (
        <PropertyModal
          property={selectedProperty}
          initialTab={modalInitialTab}
          onClose={() => setSelectedProperty(null)}
          authToken={authToken}
          profile={profile}
          isSaved={favourites.includes(selectedProperty.id)}
          onToggleSave={handleToggleSaveProperty}
          onRequestSignIn={() => {
            setSelectedProperty(null);
            setActivePage('portal');
          }}
          onActionSuccess={handleRefreshAll}
        />
      )}

      {/* Active AI Real Estate Chatbot Widget */}
      <AiChatbotWidget
        properties={properties}
        authToken={authToken}
        userEmail={profile?.email || fbUser?.email || ''}
        userName={profile?.fullName || fbUser?.displayName || ''}
        onLeadCaptured={handleRefreshAll}
      />
    </div>
  );
}
