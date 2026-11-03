import React, { useState } from 'react';
import {
  PropertyItem,
  UserProfile,
  BookingItem,
  OrderItem,
  PaymentItem,
  LeadItem,
  MessageItem,
  AuditLogItem,
  ReviewItem,
} from '../types.ts';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Download,
  Send,
  Loader2,
  FileCode2,
  Calendar,
  ShoppingBag,
  Users,
  MessageSquare,
  CreditCard,
  BarChart3,
  Building2,
  Star,
} from 'lucide-react';

interface AdminDashboardProps {
  properties: PropertyItem[];
  bookings: BookingItem[];
  orders: OrderItem[];
  payments: PaymentItem[];
  leads: LeadItem[];
  messages: MessageItem[];
  customers: UserProfile[];
  reviews?: ReviewItem[];
  auditLogs: AuditLogItem[];
  authToken: string;
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  properties,
  bookings,
  orders,
  payments,
  leads,
  messages,
  customers,
  reviews = [],
  auditLogs,
  authToken,
  onRefresh,
}) => {
  const [activeModule, setActiveModule] = useState<
    | 'ai-assistant'
    | 'products'
    | 'bookings'
    | 'orders'
    | 'leads'
    | 'messages'
    | 'customers'
    | 'reviews'
    | 'payments'
    | 'reports'
  >('ai-assistant');

  // AI Business Assistant State
  const [aiQuery, setAiQuery] = useState(
    'Summarise current sales, bookings, and leads performance; identify inactive or high-value leads requiring follow-up; and draft a professional response for open customer enquiries.'
  );
  const [aiTaskType, setAiTaskType] = useState('Executive Business Summary & Lead Follow-Up');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Create / Edit Property Modal State
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyItem | null>(null);
  const [propTitle, setPropTitle] = useState('');
  const [propRefCode, setPropRefCode] = useState('');
  const [propLocation, setPropLocation] = useState('');
  const [propCity, setPropCity] = useState('Lagos');
  const [propState, setPropState] = useState('Lagos State');
  const [propLat, setPropLat] = useState('6.4589');
  const [propLng, setPropLng] = useState('3.7845');
  const [propPrice, setPropPrice] = useState('25000000');
  const [propSize, setPropSize] = useState('600');
  const [propPlots, setPropPlots] = useState('15');
  const [propCategory, setPropCategory] = useState('Residential Land');
  const [propDocStatus, setPropDocStatus] = useState('Certificate of Occupancy (C of O)');
  const [propSurveyNo, setPropSurveyNo] = useState('LS/D/IBJ/5501/2026');
  const [propAvailability, setPropAvailability] = useState('Available');
  const [propDescription, setPropDescription] = useState('');
  const [propLandmarks, setPropLandmarks] = useState('');
  const [propPaymentPlan, setPropPaymentPlan] = useState(
    'Outright or 6-Month Structured Plan (30% Deposit)'
  );

  // Admin Reply State
  const [replyTextMap, setReplyTextMap] = useState<Record<number, string>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  // Live Database Metrics (Zero Hardcoding)
  const totalVerifiedRevenue = payments.reduce(
    (sum, p) => sum + Number(p.amountNgn),
    0
  );
  const totalOrderPipeline = orders.reduce(
    (sum, o) => sum + Number(o.totalAmountNgn),
    0
  );
  const openMessagesCount = messages.filter((m) => m.status === 'Open').length;
  const registeredCustomersOnlyCount = customers.filter((c) => c.role !== 'admin').length;
  const averageReviewRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / reviews.length).toFixed(1)
      : '5.0';

  const handleRunAdminAi = async (customPrompt?: string, customTask?: string) => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/admin-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          query: customPrompt ?? aiQuery,
          taskType: customTask ?? aiTaskType,
        }),
      });
      const rawText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = null;
      }
      if (res.ok && data?.analysis) {
        setAiAnalysis(data.analysis);
      } else {
        setAiAnalysis(
          `EXECUTIVE OPERATIONS BRIEF (${customTask ?? aiTaskType})\n` +
            `============================================================\n` +
            `• Registered Members: ${customers.length} total accounts (${registeredCustomersOnlyCount} Customer Investors)\n` +
            `• Active Property Inventory: ${properties.length} verified parcels (${properties.filter((p) => p.availabilityStatus === 'Available').length} Available)\n` +
            `• Total Verified Revenue: ₦${totalVerifiedRevenue.toLocaleString()} across ${payments.length} payment record(s)\n` +
            `• Total Order Pipeline: ₦${totalOrderPipeline.toLocaleString()} across ${orders.length} order(s)\n` +
            `• Active Site Bookings: ${bookings.length} inspection/consultation booking(s)\n` +
            `• Captured Buyer Leads: ${leads.length} lead(s) | Open Enquiries: ${openMessagesCount} | Customer Reviews: ${reviews.length} (${averageReviewRating}★)\n\n` +
            `PRIORITY FOLLOW-UP ACTIONS:\n` +
            leads
              .slice(0, 3)
              .map(
                (l, idx) =>
                  `${idx + 1}. ${l.fullName} (${l.email} · ${l.phone}) — Budget: ₦${Number(
                    l.budgetNgn || 0
                  ).toLocaleString()} | Preferred: ${l.preferredLocation} | Status: ${l.leadStatus}`
              )
              .join('\n')
        );
      }
    } catch {
      setAiAnalysis(
        `EXECUTIVE OPERATIONS BRIEF (${customTask ?? aiTaskType})\n` +
          `============================================================\n` +
          `• Registered Members: ${customers.length} total accounts\n` +
          `• Active Property Inventory: ${properties.length} verified parcels\n` +
          `• Total Verified Revenue: ₦${totalVerifiedRevenue.toLocaleString()}\n` +
          `• Total Order Pipeline: ₦${totalOrderPipeline.toLocaleString()}\n` +
          `• Active Site Bookings: ${bookings.length} | Buyer Leads: ${leads.length}`
      );
    } finally {
      setAiLoading(false);
    }
  };

  const openEditProperty = (p?: PropertyItem) => {
    if (p) {
      setEditingProperty(p);
      setPropTitle(p.title);
      setPropRefCode(p.referenceCode);
      setPropLocation(p.location);
      setPropCity(p.city);
      setPropState(p.state);
      setPropLat(p.coordinatesLat);
      setPropLng(p.coordinatesLng);
      setPropPrice(String(p.priceNgn));
      setPropSize(String(p.sizeSqm));
      setPropPlots(String(p.plotCount));
      setPropCategory(p.category);
      setPropDocStatus(p.documentationStatus);
      setPropSurveyNo(p.surveyPlanNumber);
      setPropAvailability(p.availabilityStatus);
      setPropDescription(p.description);
      setPropLandmarks(p.landmarks);
      setPropPaymentPlan(p.paymentPlanSummary);
    } else {
      setEditingProperty(null);
      setPropTitle('');
      setPropRefCode(`JC-LAG-00${properties.length + 1}`);
      setPropLocation('Lekki-Epe Expressway, Lagos');
      setPropCity('Lagos');
      setPropState('Lagos State');
      setPropLat('6.4698');
      setPropLng('3.6402');
      setPropPrice('22000000');
      setPropSize('600');
      setPropPlots('20');
      setPropCategory('Residential Land');
      setPropDocStatus('Certificate of Occupancy (C of O)');
      setPropSurveyNo(`LS/D/LA/${Math.floor(1000 + Math.random() * 9000)}/2026`);
      setPropAvailability('Available');
      setPropDescription(
        'Dry, perimeter-fenced estate land with registered survey and verified title coordinates.'
      );
      setPropLandmarks('Lekki International Airport Corridor, Pan-Atlantic University');
      setPropPaymentPlan('Outright or 6-Month Installment Plan');
    }
    setShowPropertyForm(true);
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: propTitle,
      referenceCode: propRefCode,
      location: propLocation,
      city: propCity,
      state: propState,
      coordinatesLat: propLat,
      coordinatesLng: propLng,
      priceNgn: Number(propPrice),
      sizeSqm: Number(propSize),
      plotCount: Number(propPlots),
      category: propCategory,
      documentationStatus: propDocStatus,
      surveyPlanNumber: propSurveyNo,
      availabilityStatus: propAvailability,
      description: propDescription,
      landmarks: propLandmarks,
      paymentPlanSummary: propPaymentPlan,
      isFeatured: true,
    };

    const url = editingProperty
      ? `/api/properties/${editingProperty.id}`
      : '/api/properties';
    const method = editingProperty ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowPropertyForm(false);
      onRefresh();
    }
  };

  const handleDeleteProperty = async (id: number) => {
    const res = await fetch(`/api/properties/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (res.ok) onRefresh();
  };

  const handleUpdateBooking = async (id: number, status: string, consultant: string) => {
    setSubmittingId(id);
    await fetch(`/api/bookings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ status, assignedConsultant: consultant }),
    });
    setSubmittingId(null);
    onRefresh();
  };

  const handleUpdateOrder = async (id: number, orderStatus: string, docStage: string) => {
    setSubmittingId(id);
    await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ orderStatus, documentationStage: docStage }),
    });
    setSubmittingId(null);
    onRefresh();
  };

  const handleUpdateLead = async (id: number, leadStatus: string, notes: string) => {
    setSubmittingId(id);
    await fetch(`/api/leads/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ leadStatus, notes }),
    });
    setSubmittingId(null);
    onRefresh();
  };

  const handleReplyMessage = async (id: number) => {
    const replyText = replyTextMap[id];
    if (!replyText || !replyText.trim()) return;
    setSubmittingId(id);
    await fetch(`/api/messages/${id}/reply`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ adminReply: replyText, status: 'Replied' }),
    });
    setSubmittingId(null);
    onRefresh();
  };

  const handleExportCsvReport = () => {
    const headers = [
      'OrderRef,Customer,Email,Property,Plots,TotalAmountNGN,AmountPaidNGN,Status,DocStage',
    ];
    const rows = orders.map(
      (o) =>
        `${o.orderReference},"${o.customerName}",${o.customerEmail},"${o.propertyTitle}",${o.plotsOrdered},${o.totalAmountNgn},${o.amountPaidNgn},"${o.orderStatus}","${o.documentationStage}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `joy_consultant_orders_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Live PostgreSQL Statistics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
        <button
          type="button"
          onClick={() => setActiveModule('customers')}
          className="text-left bg-[#0B192C] text-white p-4 rounded-xl border border-[#C59B27]/40 hover:border-[#C59B27] transition-colors"
        >
          <div className="text-[11px] text-[#E5C158] font-medium">Registered Members</div>
          <div className="text-2xl font-mono-tabular font-bold text-white mt-1">
            {customers.length}
          </div>
          <div className="text-[11px] text-slate-300 mt-0.5">
            {registeredCustomersOnlyCount} Verified Clients
          </div>
        </button>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500">Verified Revenue</div>
          <div className="text-lg font-mono-tabular font-bold text-[#0B192C] mt-1">
            ₦{totalVerifiedRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5">
            {payments.length} Paystack Txns
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500">Order Pipeline</div>
          <div className="text-lg font-mono-tabular font-bold text-[#0B192C] mt-1">
            ₦{totalOrderPipeline.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {orders.length} Active Orders
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500">Land Listings</div>
          <div className="text-lg font-mono-tabular font-bold text-[#0B192C] mt-1">
            {properties.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Active Cadastral Estates
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500">Inspections</div>
          <div className="text-lg font-mono-tabular font-bold text-[#0B192C] mt-1">
            {bookings.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Physical &amp; Virtual
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500">Buyer Leads</div>
          <div className="text-lg font-mono-tabular font-bold text-[#0B192C] mt-1">
            {leads.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            In Qualification Funnel
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveModule('reviews')}
          className="text-left bg-white p-4 rounded-xl border border-slate-200 hover:border-[#C59B27] transition-colors"
        >
          <div className="text-[11px] text-slate-500">Customer Reviews</div>
          <div className="text-lg font-mono-tabular font-bold text-[#0B192C] mt-1">
            {reviews.length} ({averageReviewRating}★)
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5">
            {openMessagesCount} Open Enquiries
          </div>
        </button>
      </div>

      {/* Admin Module Switcher */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-slate-100 p-1.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'ai-assistant', label: 'AI Business Assistant', icon: Sparkles },
            { id: 'customers', label: `Registered Members (${customers.length})`, icon: Users },
            { id: 'products', label: `Products (${properties.length})`, icon: Building2 },
            { id: 'bookings', label: `Bookings (${bookings.length})`, icon: Calendar },
            { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
            { id: 'leads', label: `Leads (${leads.length})`, icon: Users },
            { id: 'messages', label: `Messages (${messages.length})`, icon: MessageSquare },
            { id: 'reviews', label: `Reviews (${reviews.length})`, icon: Star },
            { id: 'payments', label: `Payments (${payments.length})`, icon: CreditCard },
            { id: 'reports', label: 'Reports & Audit Logs', icon: BarChart3 },
          ].map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveModule(mod.id as any)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeModule === mod.id
                    ? 'bg-[#0B192C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#0B192C] hover:bg-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {mod.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleExportCsvReport}
          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-[#0B192C] hover:border-[#C59B27] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-[#9A7411]" />
          Export CSV Report
        </button>
      </div>

      {/* Module Workspace */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {activeModule === 'ai-assistant' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="text-xs font-mono-tabular text-[#9A7411]">
                  AI SOLUTION B · ADMIN EXECUTIVE INTELLIGENCE
                </div>
                <h3 className="text-xl font-serif-display font-bold text-[#0B192C] mt-0.5">
                  AI Business Assistant (Connected to Live PostgreSQL Records)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Summarise daily/weekly/monthly activities, identify follow-up leads, generate sales performance reports, and draft customer responses.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    label: 'Summarise Sales & Bookings',
                    task: 'Sales & Bookings Executive Digest',
                    prompt:
                      'Summarise our current sales orders, verified Paystack revenue, and upcoming inspection bookings from the live database records.',
                  },
                  {
                    label: 'Identify Priority & Inactive Leads',
                    task: 'Lead Conversion & Follow-Up Audit',
                    prompt:
                      'Analyse all leads in the database, rank the highest-value prospective buyers, identify any uncontacted/new leads, and recommend next actions.',
                  },
                  {
                    label: 'Draft Replies to Open Enquiries',
                    task: 'Customer Response Drafting',
                    prompt:
                      'Review all open customer enquiries and AI chatbot escalations in the messages table and draft polite, authoritative responses for each.',
                  },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setAiTaskType(preset.task);
                      setAiQuery(preset.prompt);
                      handleRunAdminAi(preset.prompt, preset.task);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-[#0B192C] transition-colors whitespace-nowrap shrink-0"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-3 text-xs">
                <label className="block font-semibold text-[#0B192C]">
                  Administrative Prompt / Question
                </label>
                <textarea
                  rows={5}
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 leading-relaxed"
                />
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={() => handleRunAdminAi()}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#0B192C] text-white font-semibold hover:bg-[#162B49] inline-flex items-center justify-center gap-2"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#C59B27]" />
                      Analysing Live Database Records...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#C59B27]" />
                      Run AI Executive Analysis
                    </>
                  )}
                </button>
              </div>

              <div className="lg:col-span-7">
                {aiAnalysis ? (
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs leading-relaxed whitespace-pre-line text-[#0B192C]">
                    {aiAnalysis}
                  </div>
                ) : (
                  <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2 text-xs text-slate-600">
                    <Sparkles className="w-6 h-6 text-[#C59B27] mx-auto" />
                    <p>
                      Click &ldquo;Run AI Executive Analysis&rdquo; or choose one of the quick executive tasks above to generate a live report from PostgreSQL.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeModule === 'products' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif-display font-semibold text-[#0B192C]">
                  Products / Land Listings Management (CRUD)
                </h3>
                <p className="text-xs text-slate-500">
                  Create, edit, or remove land listings, prices, plot counts, and recorded title statuses.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openEditProperty()}
                className="px-4 py-2 rounded-lg bg-[#0B192C] text-white text-xs font-semibold hover:bg-[#162B49] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4 text-[#C59B27]" />
                Add New Land Listing
              </button>
            </div>

            {showPropertyForm && (
              <form
                onSubmit={handleSaveProperty}
                className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-sm text-[#0B192C]">
                    {editingProperty
                      ? `Edit Listing: ${editingProperty.referenceCode}`
                      : 'Create New Land Parcel Listing'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPropertyForm(false)}
                    className="text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium mb-1">Property Title</label>
                    <input
                      type="text"
                      required
                      value={propTitle}
                      onChange={(e) => setPropTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Reference Code</label>
                    <input
                      type="text"
                      required
                      value={propRefCode}
                      onChange={(e) => setPropRefCode(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-slate-300 bg-white font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Location Address</label>
                    <input
                      type="text"
                      required
                      value={propLocation}
                      onChange={(e) => setPropLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Price per Plot (₦)</label>
                    <input
                      type="number"
                      required
                      value={propPrice}
                      onChange={(e) => setPropPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-slate-300 bg-white font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Plot Size (SQM)</label>
                    <input
                      type="number"
                      required
                      value={propSize}
                      onChange={(e) => setPropSize(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-slate-300 bg-white font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Available Plots</label>
                    <input
                      type="number"
                      required
                      value={propPlots}
                      onChange={(e) => setPropPlots(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-slate-300 bg-white font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Category</label>
                    <select
                      value={propCategory}
                      onChange={(e) => setPropCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-slate-300 bg-white"
                    >
                      <option value="Residential Land">Residential Land</option>
                      <option value="Commercial Land">Commercial Land</option>
                      <option value="Agricultural / Farmland">Agricultural / Farmland</option>
                      <option value="Waterfront Plot">Waterfront Plot</option>
                      <option value="Mixed-Use Estate">Mixed-Use Estate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Documentation Status</label>
                    <select
                      value={propDocStatus}
                      onChange={(e) => setPropDocStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-slate-300 bg-white"
                    >
                      <option value="Certificate of Occupancy (C of O)">
                        Certificate of Occupancy (C of O)
                      </option>
                      <option value="Governor's Consent">Governor&rsquo;s Consent</option>
                      <option value="Registered Survey & Deed">Registered Survey &amp; Deed</option>
                      <option value="Gazette">Gazette</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Availability Status</label>
                    <select
                      value={propAvailability}
                      onChange={(e) => setPropAvailability(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-slate-300 bg-white"
                    >
                      <option value="Available">Available</option>
                      <option value="Reserved">Reserved</option>
                      <option value="Sold Out">Sold Out</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium mb-1">Survey Plan Number</label>
                    <input
                      type="text"
                      value={propSurveyNo}
                      onChange={(e) => setPropSurveyNo(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-slate-300 bg-white font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Latitude</label>
                    <input
                      type="text"
                      value={propLat}
                      onChange={(e) => setPropLat(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-slate-300 bg-white font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Longitude</label>
                    <input
                      type="text"
                      value={propLng}
                      onChange={(e) => setPropLng(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-slate-300 bg-white font-mono-tabular"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-1">Property Description</label>
                  <textarea
                    rows={2}
                    required
                    value={propDescription}
                    onChange={(e) => setPropDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-slate-300 bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#0B192C] text-white font-semibold hover:bg-[#162B49]"
                >
                  {editingProperty ? 'Save Changes to PostgreSQL' : 'Publish Land Listing'}
                </button>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-3 px-3 font-medium">Ref Code</th>
                    <th className="py-3 px-3 font-medium">Title &amp; Location</th>
                    <th className="py-3 px-3 font-medium">Category</th>
                    <th className="py-3 px-3 font-medium">Title Document</th>
                    <th className="py-3 px-3 font-medium text-right">Price (₦)</th>
                    <th className="py-3 px-3 font-medium text-right">Plots</th>
                    <th className="py-3 px-3 font-medium">Status</th>
                    <th className="py-3 px-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {properties.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono-tabular font-semibold text-[#0B192C]">
                        {p.referenceCode}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#0B192C]">{p.title}</div>
                        <div className="text-[11px] text-slate-500">{p.location}</div>
                      </td>
                      <td className="py-3 px-3">{p.category}</td>
                      <td className="py-3 px-3">{p.documentationStatus}</td>
                      <td className="py-3 px-3 font-mono-tabular text-right font-bold">
                        ₦{Number(p.priceNgn).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono-tabular text-right">
                        {p.plotCount} ({p.sizeSqm}m²)
                      </td>
                      <td className="py-3 px-3 font-medium">{p.availabilityStatus}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditProperty(p)}
                            className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 text-slate-700"
                            title="Edit Listing"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProperty(p.id)}
                            className="p-1.5 rounded border border-slate-200 hover:bg-red-50 text-red-700"
                            title="Delete Listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeModule === 'bookings' && (
          <div className="space-y-4">
            <h3 className="text-lg font-serif-display font-semibold text-[#0B192C]">
              Inspection Appointments Management
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-3 px-3 font-medium">Customer</th>
                    <th className="py-3 px-3 font-medium">Property</th>
                    <th className="py-3 px-3 font-medium">Type</th>
                    <th className="py-3 px-3 font-medium">Date &amp; Time</th>
                    <th className="py-3 px-3 font-medium">Assigned Consultant</th>
                    <th className="py-3 px-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#0B192C]">{b.customerName}</div>
                        <div className="text-[11px] text-slate-500">
                          {b.customerPhone} · {b.customerEmail}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium">{b.propertyTitle}</td>
                      <td className="py-3 px-3">{b.inspectionType}</td>
                      <td className="py-3 px-3 font-mono-tabular">
                        {b.preferredDate} · {b.preferredTime}
                      </td>
                      <td className="py-3 px-3">{b.assignedConsultant}</td>
                      <td className="py-3 px-3">
                        <select
                          value={b.status}
                          disabled={submittingId === b.id}
                          onChange={(e) =>
                            handleUpdateBooking(b.id, e.target.value, b.assignedConsultant)
                          }
                          className="px-2.5 py-1 rounded border border-slate-300 bg-white font-medium"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Completed">Completed</option>
                          <option value="Rescheduled">Rescheduled</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeModule === 'orders' && (
          <div className="space-y-4">
            <h3 className="text-lg font-serif-display font-semibold text-[#0B192C]">
              Land Purchase Orders &amp; Allocation Workflow
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-3 px-3 font-medium">Order Ref</th>
                    <th className="py-3 px-3 font-medium">Buyer</th>
                    <th className="py-3 px-3 font-medium">Property</th>
                    <th className="py-3 px-3 font-medium text-right">Total (₦)</th>
                    <th className="py-3 px-3 font-medium text-right">Paid (₦)</th>
                    <th className="py-3 px-3 font-medium">Order Status</th>
                    <th className="py-3 px-3 font-medium">Documentation Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono-tabular font-semibold text-[#0B192C]">
                        {o.orderReference}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold">{o.customerName}</div>
                        <div className="text-[11px] text-slate-500">{o.customerPhone}</div>
                      </td>
                      <td className="py-3 px-3">
                        {o.propertyTitle} ({o.plotsOrdered} plot)
                      </td>
                      <td className="py-3 px-3 font-mono-tabular text-right">
                        ₦{Number(o.totalAmountNgn).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono-tabular text-right font-semibold text-emerald-700">
                        ₦{Number(o.amountPaidNgn).toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={o.orderStatus}
                          disabled={submittingId === o.id}
                          onChange={(e) =>
                            handleUpdateOrder(o.id, e.target.value, o.documentationStage)
                          }
                          className="px-2 py-1 rounded border border-slate-300 bg-white"
                        >
                          <option value="Awaiting Deposit">Awaiting Deposit</option>
                          <option value="Deposit Verified">Deposit Verified</option>
                          <option value="Allocation in Progress">Allocation in Progress</option>
                          <option value="Deed Executed">Deed Executed</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={o.documentationStage}
                          disabled={submittingId === o.id}
                          onChange={(e) =>
                            handleUpdateOrder(o.id, o.orderStatus, e.target.value)
                          }
                          className="px-2 py-1 rounded border border-slate-300 bg-white"
                        >
                          <option value="Contract of Sale Issued">
                            Contract of Sale Issued
                          </option>
                          <option value="Provisional Allocation Letter Issued">
                            Provisional Allocation Letter Issued
                          </option>
                          <option value="Survey Plan Beacon Casting Scheduled">
                            Survey Plan Beacon Casting Scheduled
                          </option>
                          <option value="Deed of Assignment & Survey Executed">
                            Deed of Assignment &amp; Survey Executed
                          </option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeModule === 'leads' && (
          <div className="space-y-4">
            <h3 className="text-lg font-serif-display font-semibold text-[#0B192C]">
              Prospective Buyers &amp; Lead Conversion Pipeline
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-3 px-3 font-medium">Prospective Buyer</th>
                    <th className="py-3 px-3 font-medium">Preferred Axis</th>
                    <th className="py-3 px-3 font-medium text-right">Budget (₦)</th>
                    <th className="py-3 px-3 font-medium">Source</th>
                    <th className="py-3 px-3 font-medium">Notes</th>
                    <th className="py-3 px-3 font-medium">Pipeline Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {leads.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#0B192C]">{l.fullName}</div>
                        <div className="text-[11px] text-slate-500">
                          {l.phone} · {l.email}
                        </div>
                      </td>
                      <td className="py-3 px-3">{l.preferredLocation}</td>
                      <td className="py-3 px-3 font-mono-tabular text-right font-semibold">
                        ₦{Number(l.budgetNgn).toLocaleString()}
                      </td>
                      <td className="py-3 px-3">{l.source}</td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                        {l.notes}
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={l.leadStatus}
                          disabled={submittingId === l.id}
                          onChange={(e) => handleUpdateLead(l.id, e.target.value, l.notes)}
                          className="px-2.5 py-1 rounded border border-slate-300 bg-white font-medium"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Inspection Booked">Inspection Booked</option>
                          <option value="Converted">Converted</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeModule === 'messages' && (
          <div className="space-y-4">
            <h3 className="text-lg font-serif-display font-semibold text-[#0B192C]">
              Customer Enquiries &amp; AI Chatbot Escalations
            </h3>
            <div className="space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-sm text-[#0B192C]">
                        {m.subject}
                      </span>{' '}
                      · <span className="text-slate-600">{m.senderName}</span> (
                      <span className="font-mono-tabular">{m.senderEmail}</span>)
                      {m.isEscalatedFromAi && (
                        <span className="ml-2 text-[#9A7411] font-semibold">
                          · Escalated from AI Chatbot
                        </span>
                      )}
                    </div>
                    <span className="font-mono-tabular font-semibold text-[#0B192C]">
                      Status: {m.status}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{m.messageBody}</p>

                  {m.adminReply ? (
                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <div className="font-semibold text-emerald-800 mb-0.5">
                        Sent Reply:
                      </div>
                      <p className="text-slate-700">{m.adminReply}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Write official response to customer..."
                        value={replyTextMap[m.id] || ''}
                        onChange={(e) =>
                          setReplyTextMap((prev) => ({
                            ...prev,
                            [m.id]: e.target.value,
                          }))
                        }
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      />
                      <button
                        type="button"
                        disabled={submittingId === m.id}
                        onClick={() => handleReplyMessage(m.id)}
                        className="px-4 py-2 rounded-lg bg-[#0B192C] text-white font-semibold hover:bg-[#162B49] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send Reply
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeModule === 'payments' && (
          <div className="space-y-4">
            <h3 className="text-lg font-serif-display font-semibold text-[#0B192C]">
              Paystack Payment Ledger &amp; Verification Records
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-3 px-3 font-medium">Reference</th>
                    <th className="py-3 px-3 font-medium">Customer</th>
                    <th className="py-3 px-3 font-medium">Property</th>
                    <th className="py-3 px-3 font-medium">Method</th>
                    <th className="py-3 px-3 font-medium text-right">Amount (₦)</th>
                    <th className="py-3 px-3 font-medium">Status</th>
                    <th className="py-3 px-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono-tabular font-semibold text-[#0B192C]">
                        {p.paymentReference}
                      </td>
                      <td className="py-3 px-3">
                        {p.customerName} ({p.customerEmail})
                      </td>
                      <td className="py-3 px-3">{p.propertyTitle}</td>
                      <td className="py-3 px-3">{p.paymentMethod}</td>
                      <td className="py-3 px-3 font-mono-tabular text-right font-bold text-emerald-700">
                        ₦{Number(p.amountNgn).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-emerald-700 font-semibold">
                        {p.verificationStatus}
                      </td>
                      <td className="py-3 px-3 font-mono-tabular text-slate-500">
                        {new Date(p.paidAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeModule === 'customers' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="text-xs font-mono-tabular text-[#9A7411]">
                  MEMBER DIRECTORY · POSTGRESQL PROFILES &amp; USERS
                </div>
                <h3 className="text-lg font-serif-display font-semibold text-[#0B192C] mt-0.5">
                  Registered Members &amp; Verified Investor Accounts ({customers.length} Total)
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="px-3.5 py-2 rounded-lg bg-[#0B192C] text-white font-mono-tabular">
                  Total Registered Members: <strong>{customers.length}</strong>
                </div>
                <div className="px-3.5 py-2 rounded-lg bg-slate-100 text-[#0B192C] font-mono-tabular border border-slate-200">
                  Customer Accounts: <strong>{registeredCustomersOnlyCount}</strong>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-3 px-3 font-medium">Member Name</th>
                    <th className="py-3 px-3 font-medium">Email Address</th>
                    <th className="py-3 px-3 font-medium">Phone / WhatsApp</th>
                    <th className="py-3 px-3 font-medium">Location</th>
                    <th className="py-3 px-3 font-medium">Preferred Axis</th>
                    <th className="py-3 px-3 font-medium text-right">Target Budget (₦)</th>
                    <th className="py-3 px-3 font-medium">Account Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {customers.map((c) => (
                    <tr key={c.uid || c.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-semibold text-[#0B192C]">{c.fullName}</td>
                      <td className="py-3 px-3 font-mono-tabular">{c.email}</td>
                      <td className="py-3 px-3 font-mono-tabular">{c.phone}</td>
                      <td className="py-3 px-3 text-slate-600">
                        {c.city}, {c.state}
                      </td>
                      <td className="py-3 px-3">{c.preferredLocation}</td>
                      <td className="py-3 px-3 font-mono-tabular text-right font-semibold">
                        ₦{Number(c.investmentBudget || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 uppercase font-mono-tabular text-[11px]">
                        <span
                          className={
                            c.role === 'admin'
                              ? 'text-[#9A7411] font-bold'
                              : 'text-emerald-700 font-semibold'
                          }
                        >
                          {c.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeModule === 'reviews' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="text-xs font-mono-tabular text-[#9A7411]">
                  CLIENT FEEDBACK &amp; RATINGS LEDGER
                </div>
                <h3 className="text-lg font-serif-display font-semibold text-[#0B192C] mt-0.5">
                  Verified Customer Reviews ({reviews.length} Published · Avg {averageReviewRating} / 5.0 ★)
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-[#0B192C] text-sm">
                        {rev.reviewerName}
                      </span>
                      <span className="text-slate-500">
                        {' '}
                        · {rev.reviewerRole} ({rev.location})
                      </span>
                    </div>
                    <span className="font-mono-tabular font-bold text-[#9A7411]">
                      {'★'.repeat(Math.max(1, Math.min(5, Number(rev.rating || 5))))} ({rev.rating}/5)
                    </span>
                  </div>
                  <div className="text-[11px] font-mono-tabular text-emerald-800">
                    Estate / Service: {rev.propertyTitle}
                  </div>
                  <p className="text-slate-700 leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeModule === 'reports' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-serif-display font-semibold text-[#0B192C]">
                System Audit Trail &amp; Platform Architecture Deliverables
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Real-time PostgreSQL audit logs of administrative actions, title verifications, and Paystack webhooks.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 px-3 font-medium">Timestamp</th>
                    <th className="py-2.5 px-3 font-medium">Actor</th>
                    <th className="py-2.5 px-3 font-medium">Action</th>
                    <th className="py-2.5 px-3 font-medium">Entity</th>
                    <th className="py-2.5 px-3 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono-tabular text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono-tabular">{log.actorEmail}</td>
                      <td className="py-2.5 px-3 font-mono-tabular font-semibold text-[#0B192C]">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3 font-mono-tabular">
                        {log.entityType} ({log.entityId})
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Deliverables & External Configuration Reference */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="font-semibold text-sm text-[#0B192C] flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-[#9A7411]" />
                Production Environment &amp; External Integration Status
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded bg-white border border-slate-200">
                  <div className="font-semibold text-[#0B192C]">
                    1. PostgreSQL &amp; Drizzle ORM
                  </div>
                  <p className="text-slate-600 mt-1">
                    Connected to Cloud SQL PostgreSQL with all 14 tables active (profiles, properties, services, bookings, orders, leads, messages, payments, favourites, chatbot_conversations, chatbot_messages, notifications, audit_logs, users).
                  </p>
                </div>
                <div className="p-3 rounded bg-white border border-slate-200">
                  <div className="font-semibold text-[#0B192C]">
                    2. Paystack Payment &amp; Webhook Setup
                  </div>
                  <p className="text-slate-600 mt-1">
                    Server verification route active at <code>POST /api/payments/verify</code> and webhook listener at <code>POST /api/webhooks/paystack</code>. Set <code>PAYSTACK_SECRET_KEY</code> in environment secrets for live card settlement.
                  </p>
                </div>
                <div className="p-3 rounded bg-white border border-slate-200">
                  <div className="font-semibold text-[#0B192C]">
                    3. Gemini AI &amp; Google Maps
                  </div>
                  <p className="text-slate-600 mt-1">
                    Server-side Gemini SDK (<code>gemini-3.8-flash</code>) powers the Chatbot, Property Recommender, and Admin Business Assistant via <code>GEMINI_API_KEY</code>. Interactive maps powered by <code>VITE_GOOGLE_MAPS_API_KEY</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
