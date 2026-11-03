export interface PropertyItem {
  id: number;
  title: string;
  referenceCode: string;
  location: string;
  city: string;
  state: string;
  coordinatesLat: string;
  coordinatesLng: string;
  priceNgn: number;
  sizeSqm: number;
  plotCount: number;
  category: string;
  documentationStatus: string;
  surveyPlanStatus: string;
  deedOfAssignmentStatus: string;
  cOfOStatus: string;
  surveyPlanNumber: string;
  availabilityStatus: string;
  isFeatured: boolean;
  description: string;
  landmarks: string;
  paymentPlanSummary: string;
  imageType: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface ServiceItem {
  id: number;
  title: string;
  category: string;
  priceLabel: string;
  durationEstimate: string;
  description: string;
  deliverables: string;
  availabilityStatus: string;
}

export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  role: 'customer' | 'admin' | string;
  preferredLocation: string;
  investmentBudget: number;
  createdAt?: string;
}

export interface BookingItem {
  id: number;
  userUid: string | null;
  propertyId: number | null;
  propertyTitle: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  inspectionType: string;
  preferredDate: string;
  preferredTime: string;
  attendeesCount: number;
  notes: string;
  status: string;
  assignedConsultant: string;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  orderReference: string;
  userUid: string;
  propertyId: number | null;
  propertyTitle: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  plotsOrdered: number;
  totalAmountNgn: number;
  amountPaidNgn: number;
  paymentPlan: string;
  orderStatus: string;
  documentationStage: string;
  notes: string;
  createdAt: string;
}

export interface PaymentItem {
  id: number;
  paymentReference: string;
  orderId: number | null;
  userUid: string;
  customerName: string;
  customerEmail: string;
  propertyTitle: string;
  amountNgn: number;
  paymentMethod: string;
  verificationStatus: string;
  paidAt: string;
}

export interface LeadItem {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  preferredLocation: string;
  budgetNgn: number;
  interestType: string;
  source: string;
  leadStatus: string;
  notes: string;
  lastActivityAt: string;
  createdAt: string;
}

export interface MessageItem {
  id: number;
  userUid: string | null;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  subject: string;
  propertyId: number | null;
  propertyTitle: string;
  messageBody: string;
  adminReply: string;
  isEscalatedFromAi: boolean;
  status: string;
  createdAt: string;
}

export interface NotificationItem {
  id: number;
  userUid: string;
  title: string;
  body: string;
  category: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: number;
  actorUid: string | null;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
}

export interface AiRecommendationResult {
  executiveSummary: string;
  recommendations: {
    propertyId: number;
    referenceCode: string;
    title: string;
    matchReason: string;
    affordabilityStrategy: string;
    verifiedTitleStatus: string;
  }[];
  dueDiligenceChecklist: string[];
  complianceDisclaimer: string;
}

export interface ReviewItem {
  id: number;
  userUid: string | null;
  reviewerName: string;
  reviewerRole: string;
  reviewerEmail: string;
  location: string;
  propertyTitle: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  status: string;
  createdAt: string;
}

