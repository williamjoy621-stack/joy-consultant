import {
  bigint,
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  fullName: text('full_name'),
  phone: text('phone'),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('customer'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  fullName: text('full_name').notNull(),
  phone: text('phone').default(''),
  address: text('address').default(''),
  city: text('city').default('Lagos'),
  state: text('state').default('Lagos State'),
  role: text('role').notNull().default('customer'),
  preferredLocation: text('preferred_location').default('Ibeju-Lekki, Lagos'),
  investmentBudget: bigint('investment_budget', { mode: 'number' }).default(15000000),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  referenceCode: text('reference_code').notNull().unique(),
  location: text('location').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  coordinatesLat: text('coordinates_lat').notNull(),
  coordinatesLng: text('coordinates_lng').notNull(),
  priceNgn: bigint('price_ngn', { mode: 'number' }).notNull(),
  sizeSqm: integer('size_sqm').notNull(),
  plotCount: integer('plot_count').notNull().default(12),
  category: text('category').notNull(),
  documentationStatus: text('documentation_status').notNull(),
  surveyPlanStatus: text('survey_plan_status').notNull().default('Verified & Registered'),
  deedOfAssignmentStatus: text('deed_of_assignment_status').notNull().default('Ready for Execution'),
  cOfOStatus: text('c_of_o_status').notNull().default('Verified in State Registry'),
  surveyPlanNumber: text('survey_plan_number').notNull(),
  availabilityStatus: text('availability_status').notNull().default('Available'),
  isFeatured: boolean('is_featured').notNull().default(false),
  description: text('description').notNull(),
  landmarks: text('landmarks').notNull(),
  paymentPlanSummary: text('payment_plan_summary').notNull(),
  imageType: text('image_type').notNull().default('coastal-estate'),
  imageUrl: text('image_url').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  priceLabel: text('price_label').notNull(),
  durationEstimate: text('duration_estimate').notNull(),
  description: text('description').notNull(),
  deliverables: text('deliverables').notNull(),
  availabilityStatus: text('availability_status').notNull().default('Active'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid'),
  propertyId: integer('property_id').references(() => properties.id),
  propertyTitle: text('property_title').notNull(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone').notNull(),
  inspectionType: text('inspection_type').notNull(),
  preferredDate: text('preferred_date').notNull(),
  preferredTime: text('preferred_time').notNull(),
  attendeesCount: integer('attendees_count').notNull().default(1),
  notes: text('notes').default(''),
  status: text('status').notNull().default('Confirmed'),
  assignedConsultant: text('assigned_consultant').notNull().default('Engr. Tunde Bakare (Lead Surveyor)'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderReference: text('order_reference').notNull().unique(),
  userUid: text('user_uid').notNull(),
  propertyId: integer('property_id').references(() => properties.id),
  propertyTitle: text('property_title').notNull(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone').notNull(),
  plotsOrdered: integer('plots_ordered').notNull().default(1),
  totalAmountNgn: bigint('total_amount_ngn', { mode: 'number' }).notNull(),
  amountPaidNgn: bigint('amount_paid_ngn', { mode: 'number' }).notNull().default(0),
  paymentPlan: text('payment_plan').notNull(),
  orderStatus: text('order_status').notNull().default('Awaiting Deposit'),
  documentationStage: text('documentation_stage').notNull().default('Contract of Sale Issued'),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  paymentReference: text('payment_reference').notNull().unique(),
  orderId: integer('order_id').references(() => orders.id),
  userUid: text('user_uid').notNull(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  propertyTitle: text('property_title').notNull(),
  amountNgn: bigint('amount_ngn', { mode: 'number' }).notNull(),
  paymentMethod: text('payment_method').notNull().default('Paystack Checkout'),
  verificationStatus: text('verification_status').notNull().default('Verified'),
  paidAt: timestamp('paid_at').defaultNow(),
});

export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  preferredLocation: text('preferred_location').notNull(),
  budgetNgn: bigint('budget_ngn', { mode: 'number' }).notNull(),
  interestType: text('interest_type').notNull(),
  source: text('source').notNull().default('Website Enquiry'),
  leadStatus: text('lead_status').notNull().default('New'),
  notes: text('notes').default(''),
  lastActivityAt: timestamp('last_activity_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid'),
  senderName: text('sender_name').notNull(),
  senderEmail: text('sender_email').notNull(),
  senderPhone: text('sender_phone').default(''),
  subject: text('subject').notNull(),
  propertyId: integer('property_id'),
  propertyTitle: text('property_title').default(''),
  messageBody: text('message_body').notNull(),
  adminReply: text('admin_reply').default(''),
  isEscalatedFromAi: boolean('is_escalated_from_ai').notNull().default(false),
  status: text('status').notNull().default('Open'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const favourites = pgTable('favourites', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').notNull(),
  propertyId: integer('property_id')
    .references(() => properties.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const chatbotConversations = pgTable('chatbot_conversations', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull().unique(),
  userUid: text('user_uid'),
  customerName: text('customer_name').default(''),
  customerEmail: text('customer_email').default(''),
  customerPhone: text('customer_phone').default(''),
  escalatedToHuman: boolean('escalated_to_human').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const chatbotMessages = pgTable('chatbot_messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id')
    .references(() => chatbotConversations.id)
    .notNull(),
  senderRole: text('sender_role').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  category: text('category').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorUid: text('actor_uid'),
  actorEmail: text('actor_email').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').default(''),
  details: text('details').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
