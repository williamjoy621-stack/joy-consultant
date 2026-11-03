import React, { useState } from 'react';
import {
  PropertyItem,
  UserProfile,
  BookingItem,
  OrderItem,
  PaymentItem,
  MessageItem,
  NotificationItem,
} from '../types.ts';
import {
  Calendar,
  ShoppingBag,
  Heart,
  MessageSquare,
  CreditCard,
  User,
  Bell,
  CheckCircle2,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';

interface CustomerDashboardProps {
  profile: UserProfile;
  properties: PropertyItem[];
  bookings: BookingItem[];
  orders: OrderItem[];
  payments: PaymentItem[];
  messages: MessageItem[];
  notifications: NotificationItem[];
  favourites: number[];
  authToken: string;
  onRefresh: () => void;
  onSelectProperty: (property: PropertyItem, tab?: 'overview' | 'book' | 'order') => void;
  onToggleSave: (propertyId: number) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  profile,
  properties,
  bookings,
  orders,
  payments,
  messages,
  notifications,
  favourites,
  authToken,
  onRefresh,
  onSelectProperty,
  onToggleSave,
}) => {
  const [activeTab, setActiveTab] = useState<
    'bookings' | 'orders' | 'saved' | 'messages' | 'payments' | 'notifications' | 'profile'
  >('orders');

  // Profile Edit State
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [address, setAddress] = useState(profile.address || '');
  const [city, setCity] = useState(profile.city || '');
  const [stateName, setStateName] = useState(profile.state || '');
  const [preferredLocation, setPreferredLocation] = useState(
    profile.preferredLocation || ''
  );
  const [investmentBudget, setInvestmentBudget] = useState(
    String(profile.investmentBudget || 20000000)
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState('');
  const [payingOrderId, setPayingOrderId] = useState<number | null>(null);

  const savedPropertiesList = properties.filter((p) => favourites.includes(p.id));
  const totalPaidNgn = payments.reduce((sum, p) => sum + Number(p.amountNgn), 0);

  const handlePayBalanceOrTranche = async (order: OrderItem) => {
    const remaining = Math.max(
      0,
      Number(order.totalAmountNgn) - Number(order.amountPaidNgn)
    );
    const amountToPay =
      remaining > 0 ? remaining : Math.round(Number(order.totalAmountNgn) * 0.3);

    setPayingOrderId(order.id);
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          amountNgn: amountToPay,
          paymentMethod: 'Paystack Checkout (Tranche Verification)',
          paymentReference: `PSTK-JC-${Date.now().toString().slice(-7)}`,
        }),
      });
      if (res.ok) {
        onRefresh();
      }
    } finally {
      setPayingOrderId(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSavedMsg('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          fullName,
          phone,
          address,
          city,
          state: stateName,
          preferredLocation,
          investmentBudget: Number(investmentBudget),
        }),
      });
      if (res.ok) {
        setProfileSavedMsg('Your investor profile has been saved to PostgreSQL.');
        onRefresh();
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleMarkNotificationRead = async (id: number) => {
    await fetch(`/api/notifications/${id}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    onRefresh();
  };

  return (
    <div className="space-y-8">
      {/* Live Customer Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500">Active Land Orders</div>
          <div className="text-2xl font-mono-tabular font-bold text-[#0B192C] mt-1">
            {orders.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Tracked in PostgreSQL
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500">Inspection Appointments</div>
          <div className="text-2xl font-mono-tabular font-bold text-[#0B192C] mt-1">
            {bookings.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Physical &amp; Virtual Tours
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500">Verified Payments Made</div>
          <div className="text-2xl font-mono-tabular font-bold text-[#0B192C] mt-1">
            ₦{totalPaidNgn.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {payments.length} Paystack Record(s)
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500">Saved Properties</div>
          <div className="text-2xl font-mono-tabular font-bold text-[#0B192C] mt-1">
            {savedPropertiesList.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Shortlisted Parcels
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto">
        {[
          { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
          { id: 'bookings', label: `Inspections (${bookings.length})`, icon: Calendar },
          { id: 'payments', label: `Payments (${payments.length})`, icon: CreditCard },
          { id: 'saved', label: `Saved Lands (${savedPropertiesList.length})`, icon: Heart },
          { id: 'messages', label: `Enquiries (${messages.length})`, icon: MessageSquare },
          {
            id: 'notifications',
            label: `Alerts (${notifications.filter((n) => !n.isRead).length})`,
            icon: Bell,
          },
          { id: 'profile', label: 'Investor Profile', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
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

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-serif-display font-semibold text-[#0B192C]">
                Land Purchase Orders &amp; Documentation Progress
              </h3>
            </div>
            {orders.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <p className="text-xs text-slate-600">
                  You have not placed any land purchase orders yet. Explore our verified parcels to initiate an order.
                </p>
                {properties[0] && (
                  <button
                    type="button"
                    onClick={() => onSelectProperty(properties[0], 'order')}
                    className="px-4 py-2 rounded-lg bg-[#0B192C] text-white text-xs font-semibold"
                  >
                    Place Your First Land Order
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-3 px-3 font-medium">Order Ref</th>
                      <th className="py-3 px-3 font-medium">Property</th>
                      <th className="py-3 px-3 font-medium">Plots</th>
                      <th className="py-3 px-3 font-medium text-right">Contract Total</th>
                      <th className="py-3 px-3 font-medium text-right">Paid So Far</th>
                      <th className="py-3 px-3 font-medium">Order Status</th>
                      <th className="py-3 px-3 font-medium">Documentation Stage</th>
                      <th className="py-3 px-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {orders.map((ord) => {
                      const remaining =
                        Number(ord.totalAmountNgn) - Number(ord.amountPaidNgn);
                      return (
                        <tr key={ord.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-mono-tabular font-semibold text-[#0B192C]">
                            {ord.orderReference}
                          </td>
                          <td className="py-3 px-3 font-medium">{ord.propertyTitle}</td>
                          <td className="py-3 px-3 font-mono-tabular">{ord.plotsOrdered}</td>
                          <td className="py-3 px-3 font-mono-tabular text-right">
                            ₦{Number(ord.totalAmountNgn).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 font-mono-tabular text-right text-emerald-700 font-semibold">
                            ₦{Number(ord.amountPaidNgn).toLocaleString()}
                          </td>
                          <td className="py-3 px-3">{ord.orderStatus}</td>
                          <td className="py-3 px-3 text-slate-600">
                            {ord.documentationStage}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {remaining > 0 ? (
                              <button
                                type="button"
                                disabled={payingOrderId === ord.id}
                                onClick={() => handlePayBalanceOrTranche(ord)}
                                className="px-3 py-1.5 rounded bg-[#C59B27] text-[#0B192C] font-semibold hover:bg-[#d4aa32] inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                              >
                                {payingOrderId === ord.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : null}
                                Pay ₦{remaining.toLocaleString()} via Paystack
                              </button>
                            ) : (
                              <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Fully Settled
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <h3 className="text-lg font-serif-display font-semibold text-[#0B192C]">
              Property Inspection Appointments
            </h3>
            {bookings.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <p className="text-xs text-slate-600">
                  No inspection bookings recorded under your account yet.
                </p>
                {properties[0] && (
                  <button
                    type="button"
                    onClick={() => onSelectProperty(properties[0], 'book')}
                    className="px-4 py-2 rounded-lg bg-[#0B192C] text-white text-xs font-semibold"
                  >
                    Schedule Site Inspection
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-3 px-3 font-medium">Property</th>
                      <th className="py-3 px-3 font-medium">Mode</th>
                      <th className="py-3 px-3 font-medium">Date &amp; Time</th>
                      <th className="py-3 px-3 font-medium">Assigned Surveyor / Consultant</th>
                      <th className="py-3 px-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-medium text-[#0B192C]">
                          {b.propertyTitle}
                        </td>
                        <td className="py-3 px-3">{b.inspectionType}</td>
                        <td className="py-3 px-3 font-mono-tabular">
                          {b.preferredDate} · {b.preferredTime}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {b.assignedConsultant}
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#0B192C]">
                          {b.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-4">
            <h3 className="text-lg font-serif-display font-semibold text-[#0B192C]">
              Verified Payment Records &amp; Transaction References
            </h3>
            {payments.length === 0 ? (
              <p className="text-xs text-slate-600 py-8 text-center">
                No verified payment transactions recorded yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-3 px-3 font-medium">Transaction Reference</th>
                      <th className="py-3 px-3 font-medium">Property</th>
                      <th className="py-3 px-3 font-medium">Channel</th>
                      <th className="py-3 px-3 font-medium text-right">Amount (₦)</th>
                      <th className="py-3 px-3 font-medium">Verification Status</th>
                      <th className="py-3 px-3 font-medium">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {payments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono-tabular font-semibold text-[#0B192C]">
                          {pay.paymentReference}
                        </td>
                        <td className="py-3 px-3">{pay.propertyTitle}</td>
                        <td className="py-3 px-3">{pay.paymentMethod}</td>
                        <td className="py-3 px-3 font-mono-tabular text-right font-bold text-emerald-700">
                          ₦{Number(pay.amountNgn).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-emerald-700 font-medium">
                          {pay.verificationStatus}
                        </td>
                        <td className="py-3 px-3 font-mono-tabular text-slate-500">
                          {new Date(pay.paidAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="space-y-4">
            <h3 className="text-lg font-serif-display font-semibold text-[#0B192C]">
              Saved Properties
            </h3>
            {savedPropertiesList.length === 0 ? (
              <p className="text-xs text-slate-600 py-8 text-center">
                You have not saved any properties yet. Click &ldquo;Save Parcel&rdquo; on any land listing to bookmark it here.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedPropertiesList.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="font-mono-tabular text-[#9A7411]">
                        {prop.referenceCode} · {prop.sizeSqm} sqm
                      </div>
                      <div className="font-semibold text-sm text-[#0B192C]">
                        {prop.title}
                      </div>
                      <div className="text-slate-600">{prop.location}</div>
                      <div className="font-mono-tabular font-bold text-[#0B192C]">
                        ₦{Number(prop.priceNgn).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onSelectProperty(prop, 'overview')}
                        className="px-3 py-1.5 rounded bg-[#0B192C] text-white text-xs font-medium inline-flex items-center gap-1"
                      >
                        Inspect <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleSave(prop.id)}
                        className="px-3 py-1 rounded border border-slate-200 text-xs text-slate-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-4">
            <h3 className="text-lg font-serif-display font-semibold text-[#0B192C]">
              Purchase Enquiries &amp; Consultant Communications
            </h3>
            {messages.length === 0 ? (
              <p className="text-xs text-slate-600 py-8 text-center">
                No enquiries submitted yet.
              </p>
            ) : (
              <div className="space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0B192C]">{m.subject}</span>
                      <span className="font-mono-tabular text-slate-500">
                        Status: {m.status}
                      </span>
                    </div>
                    <p className="text-slate-700">{m.messageBody}</p>
                    {m.adminReply && (
                      <div className="p-3 rounded-lg bg-white border border-slate-200 mt-2">
                        <div className="font-semibold text-[#9A7411] mb-1">
                          Official Response from JOY CONSULTANT Advisory Desk:
                        </div>
                        <p className="text-slate-800">{m.adminReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h3 className="text-lg font-serif-display font-semibold text-[#0B192C]">
              Account &amp; Documentation Notifications
            </h3>
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-600 py-8 text-center">
                No notifications yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-4 ${
                      n.isRead
                        ? 'bg-white border-slate-200 text-slate-600'
                        : 'bg-slate-50 border-[#C59B27]/40 text-[#0B192C]'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{n.title}</div>
                      <p className="mt-0.5">{n.body}</p>
                    </div>
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkNotificationRead(n.id)}
                        className="px-2.5 py-1 rounded border border-slate-300 text-[11px] hover:bg-white whitespace-nowrap shrink-0"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl text-xs">
            <h3 className="text-lg font-serif-display font-semibold text-[#0B192C]">
              Investor Profile &amp; Acquisition Preferences
            </h3>
            {profileSavedMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                {profileSavedMsg}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Full Legal Name (for Title Deeds)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Phone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Residential / Office Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  City &amp; State
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Preferred Growth Corridor
                </label>
                <input
                  type="text"
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Target Investment Budget (₦)
                </label>
                <input
                  type="number"
                  value={investmentBudget}
                  onChange={(e) => setInvestmentBudget(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono-tabular"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2.5 rounded-lg bg-[#0B192C] text-white font-semibold hover:bg-[#162B49]"
            >
              {savingProfile ? 'Saving...' : 'Update Investor Profile'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
