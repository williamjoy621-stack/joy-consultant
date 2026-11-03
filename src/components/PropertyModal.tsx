import React, { useState } from 'react';
import { PropertyItem, UserProfile } from '../types.ts';
import { PropertyVisual } from './PropertyVisual.tsx';
import {
  X,
  ShieldCheck,
  Calendar,
  ShoppingBag,
  MessageSquare,
  FileCheck2,
  CheckCircle2,
  Heart,
  CreditCard,
  Loader2,
} from 'lucide-react';

interface PropertyModalProps {
  property: PropertyItem;
  initialTab?: 'overview' | 'book' | 'order' | 'enquire';
  onClose: () => void;
  authToken: string | null;
  profile: UserProfile | null;
  isSaved: boolean;
  onToggleSave: (propertyId: number) => void;
  onRequestSignIn: () => void;
  onActionSuccess: () => void;
}

export const PropertyModal: React.FC<PropertyModalProps> = ({
  property,
  initialTab = 'overview',
  onClose,
  authToken,
  profile,
  isSaved,
  onToggleSave,
  onRequestSignIn,
  onActionSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'book' | 'order' | 'enquire'>(
    initialTab
  );

  // Booking State
  const [bookingName, setBookingName] = useState(profile?.fullName || '');
  const [bookingEmail, setBookingEmail] = useState(profile?.email || '');
  const [bookingPhone, setBookingPhone] = useState(profile?.phone || '');
  const [inspectionType, setInspectionType] = useState('Physical Site Inspection');
  const [preferredDate, setPreferredDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [preferredTime, setPreferredTime] = useState('10:00 AM');
  const [attendeesCount, setAttendeesCount] = useState(1);
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingStatusMsg, setBookingStatusMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Order & Paystack State
  const [plotsOrdered, setPlotsOrdered] = useState(1);
  const [paymentPlan, setPaymentPlan] = useState('Outright Payment');
  const [orderPhone, setOrderPhone] = useState(profile?.phone || '+2348144833743');
  const [orderNotes, setOrderNotes] = useState('');
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<any | null>(null);
  const [orderError, setOrderError] = useState('');

  // Enquiry State
  const [enquiryName, setEnquiryName] = useState(profile?.fullName || '');
  const [enquiryEmail, setEnquiryEmail] = useState(profile?.email || '');
  const [enquiryPhone, setEnquiryPhone] = useState(profile?.phone || '');
  const [enquiryBody, setEnquiryBody] = useState(
    `I would like to verify plot availability and receive the full survey coordinates for ${property.title} (${property.referenceCode}).`
  );
  const [enquirySent, setEnquirySent] = useState(false);

  const totalOrderAmount = Number(property.priceNgn) * plotsOrdered;
  const initialDepositAmount =
    paymentPlan === 'Outright Payment'
      ? totalOrderAmount
      : Math.round(totalOrderAmount * 0.3);

  const handleBookInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setBookingStatusMsg(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          propertyId: property.id,
          propertyTitle: property.title,
          customerName: bookingName,
          customerEmail: bookingEmail,
          customerPhone: bookingPhone,
          inspectionType,
          preferredDate,
          preferredTime,
          attendeesCount,
          notes: bookingNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      setBookingStatusMsg({
        type: 'success',
        text: `Inspection confirmed for ${preferredDate} at ${preferredTime} (${inspectionType}). Assigned Consultant: ${data.assignedConsultant}.`,
      });
      onActionSuccess();
    } catch (err: any) {
      setBookingStatusMsg({
        type: 'error',
        text: err.message || 'Could not complete booking.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken || !profile) {
      onRequestSignIn();
      return;
    }
    setIsSubmitting(true);
    setOrderError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          propertyId: property.id,
          propertyTitle: property.title,
          customerName: profile.fullName,
          customerEmail: profile.email,
          customerPhone: orderPhone,
          plotsOrdered,
          totalAmountNgn: totalOrderAmount,
          paymentPlan,
          notes: orderNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create order');
      setCreatedOrder(data);
      onActionSuccess();
    } catch (err: any) {
      setOrderError(err.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaystackVerification = async () => {
    if (!createdOrder || !authToken) return;
    setIsSubmitting(true);
    setOrderError('');
    try {
      const generatedRef = `PSTK-JC-${Date.now().toString().slice(-7)}`;
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          orderId: createdOrder.id,
          amountNgn: initialDepositAmount,
          paymentMethod: 'Paystack Checkout (Server Verified)',
          paymentReference: generatedRef,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment verification failed');
      setPaymentSuccess(data);
      onActionSuccess();
    } catch (err: any) {
      setOrderError(err.message || 'Payment verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          senderName: enquiryName,
          senderEmail: enquiryEmail,
          senderPhone: enquiryPhone,
          subject: `Property Enquiry: ${property.title} (${property.referenceCode})`,
          propertyId: property.id,
          propertyTitle: property.title,
          messageBody: enquiryBody,
          captureAsLead: true,
          budgetNgn: property.priceNgn,
        }),
      });
      if (res.ok) {
        setEnquirySent(true);
        onActionSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Modal Header */}
        <div className="px-6 py-4 bg-[#0B192C] text-white flex items-center justify-between gap-4 border-b border-white/10">
          <div>
            <div className="text-xs font-mono-tabular text-[#C59B27]">
              {property.referenceCode} · {property.location} · {property.availabilityStatus}
            </div>
            <h3 className="text-xl font-serif-display font-semibold mt-0.5">
              {property.title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleSave(property.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                isSaved
                  ? 'bg-[#C59B27] text-[#0B192C] border-[#C59B27]'
                  : 'border-white/20 text-white hover:bg-white/10'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? 'Saved' : 'Save Parcel'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interactive Mode Tabs */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Details & Title Verification', icon: FileCheck2 },
            { id: 'book', label: 'Book Physical / Virtual Inspection', icon: Calendar },
            { id: 'order', label: 'Purchase Order & Paystack', icon: ShoppingBag },
            { id: 'enquire', label: 'Submit Purchase Enquiry', icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-[#0B192C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#0B192C] hover:bg-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-7 rounded-xl overflow-hidden border border-slate-200">
                  <PropertyVisual
                    imageType={property.imageType}
                    imageUrl={property.imageUrl}
                    referenceCode={property.referenceCode}
                    sizeSqm={property.sizeSqm}
                    coordinatesLat={property.coordinatesLat}
                    coordinatesLng={property.coordinatesLng}
                    className="h-64 lg:h-full min-h-[250px]"
                  />
                </div>
                <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  <div>
                    <div className="text-xs text-slate-500">Outright Plot Price</div>
                    <div className="text-2xl font-mono-tabular font-bold text-[#0B192C] mt-0.5">
                      ₦{Number(property.priceNgn).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {property.sizeSqm} sqm per plot · {property.plotCount} plots available ·{' '}
                      {property.category}
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500">Primary Title:</span>{' '}
                      <span className="font-semibold text-[#0B192C]">
                        {property.documentationStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Payment Structure:</span>{' '}
                      <span className="text-slate-800">{property.paymentPlanSummary}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">GPS Coordinates:</span>{' '}
                      <span className="font-mono-tabular text-slate-800">
                        {property.coordinatesLat}°N, {property.coordinatesLng}°E
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('book')}
                      className="flex-1 py-2.5 px-4 rounded-lg bg-[#0B192C] text-white text-xs font-semibold hover:bg-[#162B49] transition-colors whitespace-nowrap shrink-0"
                    >
                      Book Inspection
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('order')}
                      className="flex-1 py-2.5 px-4 rounded-lg bg-[#C59B27] text-[#0B192C] text-xs font-semibold hover:bg-[#d4aa32] transition-colors whitespace-nowrap shrink-0"
                    >
                      Initiate Purchase Order
                    </button>
                  </div>
                </div>
              </div>

              {/* Land Verification & Documentation Tracker */}
              <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="text-base font-semibold text-[#0B192C] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#C59B27]" />
                      Land Verification &amp; Documentation Tracker
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Recorded legal and cadastral registry status from the JOY CONSULTANT database
                    </p>
                  </div>
                  <span className="text-xs font-mono-tabular text-slate-600">
                    Survey Plan: {property.surveyPlanNumber}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-slate-500">1. Survey Plan &amp; Charting</div>
                    <div className="font-semibold text-[#0B192C] mt-1">
                      {property.surveyPlanStatus}
                    </div>
                    <div className="font-mono-tabular text-[11px] text-slate-600 mt-1">
                      No: {property.surveyPlanNumber}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-slate-500">2. Deed of Assignment</div>
                    <div className="font-semibold text-[#0B192C] mt-1">
                      {property.deedOfAssignmentStatus}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">
                      Prepared by JOY CONSULTANT Legal Chambers
                    </div>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-slate-500">3. C of O / Statutory Title</div>
                    <div className="font-semibold text-[#0B192C] mt-1">
                      {property.cOfOStatus}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">
                      {property.documentationStatus}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description & Landmarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                <div>
                  <h5 className="font-semibold text-sm text-[#0B192C] mb-1.5">
                    Cadastral &amp; Infrastructure Summary
                  </h5>
                  <p className="text-slate-600">{property.description}</p>
                </div>
                <div>
                  <h5 className="font-semibold text-sm text-[#0B192C] mb-1.5">
                    Surrounding Infrastructure &amp; Landmarks
                  </h5>
                  <p className="text-slate-600">{property.landmarks}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'book' && (
            <form onSubmit={handleBookInspection} className="space-y-4 max-w-2xl">
              <div>
                <h4 className="text-lg font-serif-display font-semibold text-[#0B192C]">
                  Schedule Physical Site Inspection or Virtual Consultation
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Choose an on-site accompanied visit with our Lead Land Surveyor or a live HD drone/beacon virtual walkthrough.
                </p>
              </div>

              {bookingStatusMsg && (
                <div
                  className={`p-3.5 rounded-lg text-xs border ${
                    bookingStatusMsg.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  {bookingStatusMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  'Physical Site Inspection',
                  'Virtual Live Video Tour',
                  'Consultant Office Briefing',
                ].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setInspectionType(mode)}
                    className={`py-2.5 px-3 rounded-lg text-xs font-medium border text-left transition-colors ${
                      inspectionType === mode
                        ? 'bg-[#0B192C] text-white border-[#0B192C]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    placeholder="Dr. / Chief / Mr. / Ms."
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
                    value={bookingEmail}
                    onChange={(e) => setBookingEmail(e.target.value)}
                    placeholder="you@company.com"
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
                    value={bookingPhone}
                    onChange={(e) => setBookingPhone(e.target.value)}
                    placeholder="+2348144833743"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Number of Attendees
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={attendeesCount}
                    onChange={(e) => setAttendeesCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    required
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Preferred Time Slot
                  </label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="10:00 AM">10:00 AM Morning Batch</option>
                    <option value="12:00 PM">12:00 PM Midday Batch</option>
                    <option value="02:00 PM">02:00 PM Afternoon Batch</option>
                    <option value="04:00 PM">04:00 PM Diaspora Virtual Slot</option>
                  </select>
                </div>
              </div>

              <div className="text-xs">
                <label className="block font-medium text-slate-700 mb-1">
                  Inspection Notes / Specific Requirements
                </label>
                <textarea
                  rows={3}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="E.g. Coming with our family surveyor to verify beacon coordinates..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg bg-[#0B192C] text-white text-xs font-semibold hover:bg-[#162B49] transition-colors inline-flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Inspection Appointment
              </button>
            </form>
          )}

          {activeTab === 'order' && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <h4 className="text-lg font-serif-display font-semibold text-[#0B192C]">
                  Land Purchase Order &amp; Paystack Payment Verification
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Lock your plot allocation and generate your Contract of Sale &amp; Paystack verification receipt.
                </p>
              </div>

              {!authToken ? (
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <p className="text-xs text-slate-700">
                    To protect your land title allocation and payment records, please sign in with your Google account before placing a purchase order.
                  </p>
                  <button
                    type="button"
                    onClick={onRequestSignIn}
                    className="px-4 py-2 rounded-lg bg-[#0B192C] text-white text-xs font-semibold hover:bg-[#162B49]"
                  >
                    Sign In to Place Order
                  </button>
                </div>
              ) : !createdOrder ? (
                <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
                  {orderError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800">
                      {orderError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Number of Plots ({property.sizeSqm} sqm each)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={property.plotCount}
                        value={plotsOrdered}
                        onChange={(e) => setPlotsOrdered(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono-tabular"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Payment Plan
                      </label>
                      <select
                        value={paymentPlan}
                        onChange={(e) => setPaymentPlan(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="Outright Payment">Outright Payment (100%)</option>
                        <option value="3-Month Milestone">
                          3-Month Milestone (30% Initial Deposit)
                        </option>
                        <option value="6-Month Structured">
                          6-Month Structured (30% Initial Deposit)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Buyer Phone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
                      value={orderPhone}
                      onChange={(e) => setOrderPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Allocation Instructions (Name to appear on Deed of Assignment)
                    </label>
                    <input
                      type="text"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="E.g. Register Deed in the name of Dr. & Mrs. ..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-slate-500">Total Purchase Contract Value</div>
                      <div className="text-lg font-mono-tabular font-bold text-[#0B192C]">
                        ₦{totalOrderAmount.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-500">Payable Now ({paymentPlan})</div>
                      <div className="text-lg font-mono-tabular font-bold text-[#9A7411]">
                        ₦{initialDepositAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-lg bg-[#0B192C] text-white font-semibold hover:bg-[#162B49] transition-colors inline-flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Generate Contract Order &amp; Proceed to Payment
                  </button>
                </form>
              ) : (
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-slate-500">Order Reference:</span>{' '}
                      <span className="font-mono-tabular font-bold text-[#0B192C]">
                        {createdOrder.orderReference}
                      </span>
                    </div>
                    <span className="font-medium text-emerald-700">
                      {paymentSuccess ? 'Payment Verified' : createdOrder.orderStatus}
                    </span>
                  </div>

                  {!paymentSuccess ? (
                    <div className="space-y-3">
                      <p className="text-slate-700">
                        Your purchase order for <strong>{plotsOrdered} plot(s)</strong> of{' '}
                        <strong>{property.title}</strong> has been logged in PostgreSQL. Click below to complete and verify your payment of{' '}
                        <strong className="font-mono-tabular">
                          ₦{initialDepositAmount.toLocaleString()}
                        </strong>{' '}
                        via Paystack Server Verification.
                      </p>
                      <button
                        type="button"
                        onClick={handlePaystackVerification}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 rounded-lg bg-[#C59B27] text-[#0B192C] font-semibold hover:bg-[#d4aa32] transition-colors inline-flex items-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        {isSubmitting
                          ? 'Verifying Transaction...'
                          : `Complete & Verify ₦${initialDepositAmount.toLocaleString()} via Paystack`}
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        Paystack Payment Verified ({paymentSuccess.paymentReference})
                      </div>
                      <p>
                        Amount Verified:{' '}
                        <span className="font-mono-tabular font-bold">
                          ₦{Number(paymentSuccess.amountNgn).toLocaleString()}
                        </span>
                        . Your Provisional Allocation Letter and payment receipt are now available in your Customer Dashboard.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'enquire' && (
            <form onSubmit={handleSendEnquiry} className="space-y-4 max-w-2xl text-xs">
              <div>
                <h4 className="text-lg font-serif-display font-semibold text-[#0B192C]">
                  Submit Official Property &amp; Title Enquiry
                </h4>
                <p className="text-slate-600 mt-0.5">
                  Have questions about survey charting, solicitor verification, or custom bulk plot acquisition? Message our advisory desk directly.
                </p>
              </div>

              {enquirySent && (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                  Your enquiry has been logged in our database and assigned to our Legal &amp; Cadastral Desk. Track replies inside your Customer Dashboard.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={enquiryName}
                    onChange={(e) => setEnquiryName(e.target.value)}
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
                    value={enquiryEmail}
                    onChange={(e) => setEnquiryEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={enquiryPhone}
                    onChange={(e) => setEnquiryPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Enquiry Details
                </label>
                <textarea
                  rows={4}
                  required
                  value={enquiryBody}
                  onChange={(e) => setEnquiryBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg bg-[#0B192C] text-white font-semibold hover:bg-[#162B49] transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Purchase Enquiry'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
