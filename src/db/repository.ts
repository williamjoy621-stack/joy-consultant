import { desc, eq, and } from 'drizzle-orm';
import { db } from './index.ts';
import {
  users,
  profiles,
  properties,
  services,
  bookings,
  orders,
  payments,
  leads,
  messages,
  favourites,
  chatbotConversations,
  chatbotMessages,
  notifications,
  auditLogs,
  reviews,
} from './schema.ts';

const ADMIN_EMAILS = ['williamjoy621@gmail.com'];

export async function getOrCreateUserProfile(
  uid: string,
  email: string,
  displayName?: string
) {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    const assignedRole = ADMIN_EMAILS.includes(cleanEmail) ? 'admin' : 'customer';
    const fullName = displayName || cleanEmail.split('@')[0] || 'Valued Client';

    await db
      .insert(users)
      .values({
        uid,
        email: cleanEmail,
        fullName,
        role: assignedRole,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: { email: cleanEmail, role: assignedRole },
      });

    const existingProfiles = await db
      .select()
      .from(profiles)
      .where(eq(profiles.uid, uid));

    if (existingProfiles.length > 0) {
      const current = existingProfiles[0];
      if (current.role !== assignedRole) {
        const updatedRole = await db
          .update(profiles)
          .set({ role: assignedRole, updatedAt: new Date() })
          .where(eq(profiles.uid, uid))
          .returning();
        return updatedRole[0];
      }
      return current;
    }

    const inserted = await db
      .insert(profiles)
      .values({
        uid,
        email: cleanEmail,
        fullName,
        role: assignedRole,
        phone: '+2348144833743',
        address: 'Victoria Island',
        city: 'Lagos',
        state: 'Lagos State',
        preferredLocation: 'Ibeju-Lekki, Lagos',
        investmentBudget: 20000000,
      })
      .onConflictDoUpdate({
        target: profiles.uid,
        set: { role: assignedRole, updatedAt: new Date() },
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUserProfile:', error);
    throw new Error('Failed to synchronize user profile.', { cause: error });
  }
}

export async function registerCustomerAccount(input: {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  preferredLocation?: string;
  investmentBudget?: number;
}) {
  const cleanEmail = input.email.trim().toLowerCase();
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, cleanEmail));

  if (existingUsers.length > 0 && existingUsers[0].passwordHash) {
    throw new Error('An account with this email address already exists. Please sign in.');
  }

  const assignedRole = ADMIN_EMAILS.includes(cleanEmail) ? 'admin' : 'customer';
  const uid = existingUsers[0]?.uid || `jc-cust-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  await db
    .insert(users)
    .values({
      uid,
      email: cleanEmail,
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
      passwordHash: input.passwordHash,
      role: assignedRole,
    })
    .onConflictDoUpdate({
      target: users.uid,
      set: {
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        passwordHash: input.passwordHash,
        role: assignedRole,
      },
    });

  const insertedProfile = await db
    .insert(profiles)
    .values({
      uid,
      email: cleanEmail,
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
      address: 'Lagos',
      city: 'Lagos',
      state: 'Lagos State',
      role: assignedRole,
      preferredLocation: input.preferredLocation || 'Ibeju-Lekki, Lagos',
      investmentBudget: Number(input.investmentBudget || 15000000),
    })
    .onConflictDoUpdate({
      target: profiles.uid,
      set: {
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        role: assignedRole,
        preferredLocation: input.preferredLocation || 'Ibeju-Lekki, Lagos',
        investmentBudget: Number(input.investmentBudget || 15000000),
        updatedAt: new Date(),
      },
    })
    .returning();

  await db.insert(notifications).values({
    userUid: uid,
    title: 'Welcome to JOY CONSULTANT Client Portal',
    body: `Hello ${input.fullName.trim()}, your verified investor account is active. You can now book physical or virtual inspections, place land purchase orders, and track title documentation.`,
    category: 'Account',
  });

  await db.insert(auditLogs).values({
    actorUid: uid,
    actorEmail: cleanEmail,
    action: 'CUSTOMER_ACCOUNT_REGISTERED',
    entityType: 'user',
    entityId: uid,
    details: `Registered customer account for ${input.fullName.trim()} (${cleanEmail})`,
  });

  return insertedProfile[0];
}

export async function findUserAccountByEmail(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  const matchedUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, cleanEmail));

  if (matchedUsers.length === 0) return null;
  const userRow = matchedUsers[0];
  const profileRow = await getOrCreateUserProfile(
    userRow.uid,
    cleanEmail,
    userRow.fullName || undefined
  );
  return {
    user: userRow,
    profile: profileRow,
  };
}

export async function resetCustomerPassword(input: {
  email: string;
  phone: string;
  newPasswordHash: string;
}) {
  const cleanEmail = input.email.trim().toLowerCase();
  const matchedUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, cleanEmail));

  if (matchedUsers.length === 0) {
    throw new Error('No account found with that email address.');
  }

  const userRow = matchedUsers[0];
  await db
    .update(users)
    .set({ passwordHash: input.newPasswordHash })
    .where(eq(users.uid, userRow.uid));

  const profileRow = await getOrCreateUserProfile(
    userRow.uid,
    cleanEmail,
    userRow.fullName || undefined
  );
  return profileRow;
}

export async function updateUserProfile(
  uid: string,
  updates: {
    fullName?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    preferredLocation?: string;
    investmentBudget?: number;
    role?: string;
  }
) {
  try {
    const updated = await db
      .update(profiles)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(profiles.uid, uid))
      .returning();

    if (updates.role) {
      await db
        .update(users)
        .set({ role: updates.role })
        .where(eq(users.uid, uid));
    }

    return updated[0];
  } catch (error) {
    console.error('Database query failed in updateUserProfile:', error);
    throw new Error('Failed to update user profile.', { cause: error });
  }
}

export async function listAllProfiles() {
  try {
    const [allProfiles, allUsers] = await Promise.all([
      db.select().from(profiles).orderBy(desc(profiles.createdAt)),
      db.select().from(users).orderBy(desc(users.createdAt)),
    ]);

    const profileMap = new Map(allProfiles.map((p) => [p.uid, p]));
    for (const u of allUsers) {
      if (!profileMap.has(u.uid)) {
        profileMap.set(u.uid, {
          id: u.id,
          uid: u.uid,
          email: u.email,
          fullName: u.fullName || u.email.split('@')[0] || 'Valued Client',
          phone: u.phone || '+2348144833743',
          address: 'Lagos',
          city: 'Lagos',
          state: 'Lagos State',
          role: u.role,
          preferredLocation: 'Ibeju-Lekki, Lagos',
          investmentBudget: 15000000,
          createdAt: u.createdAt,
          updatedAt: u.createdAt,
        });
      }
    }

    return Array.from(profileMap.values());
  } catch (error) {
    console.error('Database query failed in listAllProfiles:', error);
    throw new Error('Failed to load customer profiles.', { cause: error });
  }
}

export async function listProperties() {
  try {
    return await db.select().from(properties).orderBy(desc(properties.isFeatured), desc(properties.id));
  } catch (error) {
    console.error('Database query failed in listProperties:', error);
    throw new Error('Failed to fetch property listings.', { cause: error });
  }
}

export async function createPropertyRecord(
  data: typeof properties.$inferInsert,
  actorEmail: string
) {
  try {
    const result = await db.insert(properties).values(data).returning();
    const created = result[0];
    await db.insert(auditLogs).values({
      actorEmail,
      action: 'CREATE_PROPERTY',
      entityType: 'property',
      entityId: created.referenceCode,
      details: `Created land listing "${created.title}" (${created.location}) at ₦${Number(created.priceNgn).toLocaleString()}`,
    });
    return created;
  } catch (error) {
    console.error('Database query failed in createPropertyRecord:', error);
    throw new Error('Failed to create property listing.', { cause: error });
  }
}

export async function updatePropertyRecord(
  id: number,
  data: Partial<typeof properties.$inferInsert>,
  actorEmail: string
) {
  try {
    const result = await db
      .update(properties)
      .set(data)
      .where(eq(properties.id, id))
      .returning();
    const updated = result[0];
    if (updated) {
      await db.insert(auditLogs).values({
        actorEmail,
        action: 'UPDATE_PROPERTY',
        entityType: 'property',
        entityId: updated.referenceCode,
        details: `Updated listing "${updated.title}" — Status: ${updated.availabilityStatus}, Price: ₦${Number(updated.priceNgn).toLocaleString()}`,
      });
    }
    return updated;
  } catch (error) {
    console.error('Database query failed in updatePropertyRecord:', error);
    throw new Error('Failed to update property listing.', { cause: error });
  }
}

export async function deletePropertyRecord(id: number, actorEmail: string) {
  try {
    await db.delete(favourites).where(eq(favourites.propertyId, id));
    const deleted = await db
      .delete(properties)
      .where(eq(properties.id, id))
      .returning();
    if (deleted[0]) {
      await db.insert(auditLogs).values({
        actorEmail,
        action: 'DELETE_PROPERTY',
        entityType: 'property',
        entityId: deleted[0].referenceCode,
        details: `Deleted property listing "${deleted[0].title}"`,
      });
    }
    return deleted[0];
  } catch (error) {
    console.error('Database query failed in deletePropertyRecord:', error);
    throw new Error('Cannot delete property with linked orders or bookings.', { cause: error });
  }
}

export async function listServices() {
  try {
    return await db.select().from(services).orderBy(services.id);
  } catch (error) {
    console.error('Database query failed in listServices:', error);
    throw new Error('Failed to load consultancy services.', { cause: error });
  }
}

export async function createServiceRecord(
  data: typeof services.$inferInsert,
  actorEmail: string
) {
  try {
    const result = await db.insert(services).values(data).returning();
    await db.insert(auditLogs).values({
      actorEmail,
      action: 'CREATE_SERVICE',
      entityType: 'service',
      entityId: String(result[0].id),
      details: `Added consultancy service "${result[0].title}"`,
    });
    return result[0];
  } catch (error) {
    console.error('Database query failed in createServiceRecord:', error);
    throw new Error('Failed to create service record.', { cause: error });
  }
}

export async function listBookings(userUid?: string, isAdmin = false) {
  try {
    if (isAdmin) {
      return await db.select().from(bookings).orderBy(desc(bookings.createdAt));
    }
    if (!userUid) return [];
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.userUid, userUid))
      .orderBy(desc(bookings.createdAt));
  } catch (error) {
    console.error('Database query failed in listBookings:', error);
    throw new Error('Failed to fetch inspection bookings.', { cause: error });
  }
}

export async function createBookingRecord(data: typeof bookings.$inferInsert) {
  try {
    const result = await db.insert(bookings).values(data).returning();
    const created = result[0];

    // Also capture or update lead automatically
    await db.insert(leads).values({
      fullName: created.customerName,
      email: created.customerEmail,
      phone: created.customerPhone,
      preferredLocation: created.propertyTitle,
      budgetNgn: 15000000,
      interestType: created.inspectionType,
      source: 'Inspection Booking',
      leadStatus: 'Inspection Booked',
      notes: `Booked ${created.inspectionType} for ${created.preferredDate} at ${created.preferredTime}. ${created.notes || ''}`,
    });

    await db.insert(notifications).values({
      userUid: 'ADMIN',
      title: `New ${created.inspectionType} Booked`,
      body: `${created.customerName} scheduled an inspection for ${created.propertyTitle} on ${created.preferredDate} (${created.preferredTime}).`,
      category: 'booking',
    });

    if (created.userUid) {
      await db.insert(notifications).values({
        userUid: created.userUid,
        title: 'Inspection Appointment Confirmed',
        body: `Your ${created.inspectionType} for ${created.propertyTitle} on ${created.preferredDate} at ${created.preferredTime} has been logged.`,
        category: 'booking',
      });
    }

    await db.insert(auditLogs).values({
      actorUid: created.userUid || 'guest',
      actorEmail: created.customerEmail,
      action: 'BOOK_INSPECTION',
      entityType: 'booking',
      entityId: String(created.id),
      details: `${created.customerName} booked ${created.inspectionType} for ${created.propertyTitle} on ${created.preferredDate}`,
    });

    return created;
  } catch (error) {
    console.error('Database query failed in createBookingRecord:', error);
    throw new Error('Failed to schedule property inspection.', { cause: error });
  }
}

export async function updateBookingRecordStatus(
  id: number,
  status: string,
  assignedConsultant: string,
  actorEmail: string
) {
  try {
    const result = await db
      .update(bookings)
      .set({ status, assignedConsultant })
      .where(eq(bookings.id, id))
      .returning();
    const updated = result[0];
    if (updated) {
      await db.insert(auditLogs).values({
        actorEmail,
        action: 'UPDATE_BOOKING_STATUS',
        entityType: 'booking',
        entityId: String(id),
        details: `Updated booking #${id} (${updated.customerName}) status to ${status}`,
      });
      if (updated.userUid) {
        await db.insert(notifications).values({
          userUid: updated.userUid,
          title: `Inspection Status Updated: ${status}`,
          body: `Your inspection for ${updated.propertyTitle} is now marked "${status}". Assigned Consultant: ${assignedConsultant}.`,
          category: 'booking',
        });
      }
    }
    return updated;
  } catch (error) {
    console.error('Database query failed in updateBookingRecordStatus:', error);
    throw new Error('Failed to update booking status.', { cause: error });
  }
}

export async function listOrders(userUid?: string, isAdmin = false) {
  try {
    if (isAdmin) {
      return await db.select().from(orders).orderBy(desc(orders.createdAt));
    }
    if (!userUid) return [];
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userUid, userUid))
      .orderBy(desc(orders.createdAt));
  } catch (error) {
    console.error('Database query failed in listOrders:', error);
    throw new Error('Failed to load land purchase orders.', { cause: error });
  }
}

export async function createOrderRecord(data: typeof orders.$inferInsert) {
  try {
    const result = await db.insert(orders).values(data).returning();
    const created = result[0];

    await db.insert(notifications).values({
      userUid: 'ADMIN',
      title: `New Land Purchase Order: ${created.orderReference}`,
      body: `${created.customerName} placed an order for ${created.plotsOrdered} plot(s) of ${created.propertyTitle} (₦${Number(created.totalAmountNgn).toLocaleString()}).`,
      category: 'order',
    });

    await db.insert(notifications).values({
      userUid: created.userUid,
      title: `Order Created (${created.orderReference})`,
      body: `Your land acquisition order for ${created.propertyTitle} is active. Proceed with Paystack verification to lock allocation.`,
      category: 'order',
    });

    await db.insert(auditLogs).values({
      actorUid: created.userUid,
      actorEmail: created.customerEmail,
      action: 'CREATE_ORDER',
      entityType: 'order',
      entityId: created.orderReference,
      details: `Order ${created.orderReference} created for ${created.plotsOrdered} plot(s) of ${created.propertyTitle}`,
    });

    return created;
  } catch (error) {
    console.error('Database query failed in createOrderRecord:', error);
    throw new Error('Failed to create purchase order.', { cause: error });
  }
}

export async function updateOrderRecordStatus(
  id: number,
  orderStatus: string,
  documentationStage: string,
  actorEmail: string
) {
  try {
    const result = await db
      .update(orders)
      .set({ orderStatus, documentationStage })
      .where(eq(orders.id, id))
      .returning();
    const updated = result[0];
    if (updated) {
      await db.insert(auditLogs).values({
        actorEmail,
        action: 'UPDATE_ORDER_STAGE',
        entityType: 'order',
        entityId: updated.orderReference,
        details: `Order ${updated.orderReference} updated to status="${orderStatus}", documentation="${documentationStage}"`,
      });
      await db.insert(notifications).values({
        userUid: updated.userUid,
        title: `Order Update: ${updated.orderReference}`,
        body: `Status: ${orderStatus} · Documentation: ${documentationStage}`,
        category: 'order',
      });
    }
    return updated;
  } catch (error) {
    console.error('Database query failed in updateOrderRecordStatus:', error);
    throw new Error('Failed to update order status.', { cause: error });
  }
}

export async function listPayments(userUid?: string, isAdmin = false) {
  try {
    if (isAdmin) {
      return await db.select().from(payments).orderBy(desc(payments.paidAt));
    }
    if (!userUid) return [];
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userUid, userUid))
      .orderBy(desc(payments.paidAt));
  } catch (error) {
    console.error('Database query failed in listPayments:', error);
    throw new Error('Failed to load payment records.', { cause: error });
  }
}

export async function recordVerifiedPayment(params: {
  orderId: number;
  userUid: string;
  amountNgn: number;
  paymentMethod: string;
  paymentReference?: string;
}) {
  try {
    const existingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.id, params.orderId));
    const order = existingOrders[0];
    if (!order) {
      throw new Error('Order not found for payment verification.');
    }

    const reference =
      params.paymentReference ||
      `PSTK-JC-${Date.now().toString().slice(-7)}`;

    const paymentResult = await db
      .insert(payments)
      .values({
        paymentReference: reference,
        orderId: order.id,
        userUid: order.userUid,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        propertyTitle: order.propertyTitle,
        amountNgn: params.amountNgn,
        paymentMethod: params.paymentMethod,
        verificationStatus: 'Verified',
      })
      .returning();

    const newPaidTotal = Number(order.amountPaidNgn) + Number(params.amountNgn);
    const isFullyPaid = newPaidTotal >= Number(order.totalAmountNgn);
    const nextOrderStatus = isFullyPaid ? 'Completed' : 'Deposit Verified';
    const nextDocStage = isFullyPaid
      ? 'Deed of Assignment & Survey Ready for Collection'
      : 'Provisional Allocation Letter Issued';

    await db
      .update(orders)
      .set({
        amountPaidNgn: newPaidTotal,
        orderStatus: nextOrderStatus,
        documentationStage: nextDocStage,
      })
      .where(eq(orders.id, order.id));

    await db.insert(notifications).values({
      userUid: order.userUid,
      title: `Payment Verified (${reference})`,
      body: `We verified your payment of ₦${Number(params.amountNgn).toLocaleString()} for ${order.propertyTitle}. Current stage: ${nextDocStage}.`,
      category: 'payment',
    });

    await db.insert(notifications).values({
      userUid: 'ADMIN',
      title: `Paystack Webhook Verified: ₦${Number(params.amountNgn).toLocaleString()}`,
      body: `Ref ${reference} for Order ${order.orderReference} (${order.customerName}).`,
      category: 'payment',
    });

    await db.insert(auditLogs).values({
      actorUid: params.userUid,
      actorEmail: order.customerEmail,
      action: 'VERIFY_PAYMENT_WEBHOOK',
      entityType: 'payment',
      entityId: reference,
      details: `Verified payment of ₦${Number(params.amountNgn).toLocaleString()} via ${params.paymentMethod} for Order ${order.orderReference}`,
    });

    return paymentResult[0];
  } catch (error) {
    console.error('Database query failed in recordVerifiedPayment:', error);
    throw new Error('Failed to verify and record payment.', { cause: error });
  }
}

export async function listLeads() {
  try {
    return await db.select().from(leads).orderBy(desc(leads.createdAt));
  } catch (error) {
    console.error('Database query failed in listLeads:', error);
    throw new Error('Failed to fetch leads.', { cause: error });
  }
}

export async function createLeadRecord(data: typeof leads.$inferInsert) {
  try {
    const result = await db.insert(leads).values(data).returning();
    await db.insert(notifications).values({
      userUid: 'ADMIN',
      title: `New Prospective Buyer Lead: ${result[0].fullName}`,
      body: `Budget: ₦${Number(result[0].budgetNgn).toLocaleString()} · Preferred Location: ${result[0].preferredLocation}`,
      category: 'enquiry',
    });
    return result[0];
  } catch (error) {
    console.error('Database query failed in createLeadRecord:', error);
    throw new Error('Failed to save lead information.', { cause: error });
  }
}

export async function updateLeadRecordStatus(
  id: number,
  leadStatus: string,
  notes: string,
  actorEmail: string
) {
  try {
    const result = await db
      .update(leads)
      .set({ leadStatus, notes, lastActivityAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    if (result[0]) {
      await db.insert(auditLogs).values({
        actorEmail,
        action: 'UPDATE_LEAD',
        entityType: 'lead',
        entityId: String(id),
        details: `Updated lead "${result[0].fullName}" status to ${leadStatus}`,
      });
    }
    return result[0];
  } catch (error) {
    console.error('Database query failed in updateLeadRecordStatus:', error);
    throw new Error('Failed to update lead status.', { cause: error });
  }
}

export async function listMessages(userUid?: string, isAdmin = false, userEmail?: string) {
  try {
    if (isAdmin) {
      return await db.select().from(messages).orderBy(desc(messages.createdAt));
    }
    const allMessages = await db
      .select()
      .from(messages)
      .orderBy(desc(messages.createdAt));
    return allMessages.filter(
      (m) =>
        (userUid && m.userUid === userUid) ||
        (userEmail && m.senderEmail.toLowerCase() === userEmail.toLowerCase())
    );
  } catch (error) {
    console.error('Database query failed in listMessages:', error);
    throw new Error('Failed to load messages.', { cause: error });
  }
}

export async function createMessageRecord(data: typeof messages.$inferInsert) {
  try {
    const result = await db.insert(messages).values(data).returning();
    const created = result[0];

    await db.insert(notifications).values({
      userUid: 'ADMIN',
      title: created.isEscalatedFromAi
        ? `AI Escalation: ${created.subject}`
        : `New Enquiry: ${created.subject}`,
      body: `From ${created.senderName} (${created.senderEmail}): ${created.messageBody.slice(0, 120)}`,
      category: 'enquiry',
    });

    return created;
  } catch (error) {
    console.error('Database query failed in createMessageRecord:', error);
    throw new Error('Failed to submit enquiry message.', { cause: error });
  }
}

export async function replyToMessageRecord(
  id: number,
  adminReply: string,
  status: string,
  actorEmail: string
) {
  try {
    const result = await db
      .update(messages)
      .set({ adminReply, status })
      .where(eq(messages.id, id))
      .returning();
    const updated = result[0];
    if (updated) {
      if (updated.userUid) {
        await db.insert(notifications).values({
          userUid: updated.userUid,
          title: `Response from Joy Consultant: ${updated.subject}`,
          body: adminReply.slice(0, 160),
          category: 'enquiry',
        });
      }
      await db.insert(auditLogs).values({
        actorEmail,
        action: 'REPLY_ENQUIRY',
        entityType: 'message',
        entityId: String(id),
        details: `Replied to enquiry #${id} from ${updated.senderName}`,
      });
    }
    return updated;
  } catch (error) {
    console.error('Database query failed in replyToMessageRecord:', error);
    throw new Error('Failed to send reply.', { cause: error });
  }
}

export async function listFavourites(userUid: string) {
  try {
    return await db
      .select()
      .from(favourites)
      .where(eq(favourites.userUid, userUid));
  } catch (error) {
    console.error('Database query failed in listFavourites:', error);
    throw new Error('Failed to load saved properties.', { cause: error });
  }
}

export async function toggleFavouriteRecord(userUid: string, propertyId: number) {
  try {
    const existing = await db
      .select()
      .from(favourites)
      .where(
        and(
          eq(favourites.userUid, userUid),
          eq(favourites.propertyId, propertyId)
        )
      );

    if (existing.length > 0) {
      await db
        .delete(favourites)
        .where(eq(favourites.id, existing[0].id));
      return { saved: false, propertyId };
    } else {
      await db.insert(favourites).values({ userUid, propertyId });
      return { saved: true, propertyId };
    }
  } catch (error) {
    console.error('Database query failed in toggleFavouriteRecord:', error);
    throw new Error('Failed to update saved properties.', { cause: error });
  }
}

export async function listNotifications(userUid?: string, isAdmin = false) {
  try {
    const all = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt));
    if (isAdmin) {
      return all.filter((n) => n.userUid === 'ADMIN' || n.userUid === userUid);
    }
    return all.filter((n) => n.userUid === userUid);
  } catch (error) {
    console.error('Database query failed in listNotifications:', error);
    throw new Error('Failed to fetch notifications.', { cause: error });
  }
}

export async function markNotificationAsRead(id: number) {
  try {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in markNotificationAsRead:', error);
    throw new Error('Failed to update notification.', { cause: error });
  }
}

export async function listAuditLogs() {
  try {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(100);
  } catch (error) {
    console.error('Database query failed in listAuditLogs:', error);
    throw new Error('Failed to fetch audit logs.', { cause: error });
  }
}

export async function logChatbotExchange(params: {
  sessionId: string;
  userUid?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  userMessage: string;
  assistantReply: string;
  escalate?: boolean;
}) {
  try {
    const existingConv = await db
      .select()
      .from(chatbotConversations)
      .where(eq(chatbotConversations.sessionId, params.sessionId));

    let convId: number;
    if (existingConv.length === 0) {
      const inserted = await db
        .insert(chatbotConversations)
        .values({
          sessionId: params.sessionId,
          userUid: params.userUid || null,
          customerName: params.customerName || '',
          customerEmail: params.customerEmail || '',
          customerPhone: params.customerPhone || '',
          escalatedToHuman: Boolean(params.escalate),
        })
        .returning();
      convId = inserted[0].id;
    } else {
      convId = existingConv[0].id;
      if (params.escalate || params.customerEmail || params.customerName) {
        await db
          .update(chatbotConversations)
          .set({
            customerName: params.customerName || existingConv[0].customerName,
            customerEmail: params.customerEmail || existingConv[0].customerEmail,
            customerPhone: params.customerPhone || existingConv[0].customerPhone,
            escalatedToHuman:
              existingConv[0].escalatedToHuman || Boolean(params.escalate),
          })
          .where(eq(chatbotConversations.id, convId));
      }
    }

    await db.insert(chatbotMessages).values([
      {
        conversationId: convId,
        senderRole: 'user',
        content: params.userMessage,
      },
      {
        conversationId: convId,
        senderRole: 'assistant',
        content: params.assistantReply,
      },
    ]);

    return convId;
  } catch (error) {
    console.error('Database query failed in logChatbotExchange:', error);
    throw new Error('Failed to log chatbot conversation.', { cause: error });
  }
}

export async function listReviews() {
  try {
    return await db.select().from(reviews).orderBy(desc(reviews.createdAt), desc(reviews.id));
  } catch (error) {
    console.error('Database query failed in listReviews:', error);
    throw new Error('Failed to fetch customer reviews.', { cause: error });
  }
}

export async function createReviewRecord(data: {
  userUid?: string | null;
  reviewerName: string;
  reviewerRole?: string;
  reviewerEmail?: string;
  location?: string;
  propertyTitle?: string;
  rating: number;
  comment: string;
}) {
  try {
    const cleanRating = Math.min(5, Math.max(1, Number(data.rating || 5)));
    const inserted = await db
      .insert(reviews)
      .values({
        userUid: data.userUid || null,
        reviewerName: data.reviewerName.trim(),
        reviewerRole: (data.reviewerRole || 'Verified Land Investor').trim(),
        reviewerEmail: (data.reviewerEmail || '').trim(),
        location: (data.location || 'Lagos, Nigeria').trim(),
        propertyTitle: (data.propertyTitle || 'General Consultancy & Verification').trim(),
        rating: cleanRating,
        comment: data.comment.trim(),
        verifiedPurchase: true,
        status: 'Published',
      })
      .returning();

    const created = inserted[0];

    await db.insert(notifications).values({
      userUid: 'ADMIN',
      title: `New ${cleanRating}-Star Customer Review Published`,
      body: `${created.reviewerName} reviewed "${created.propertyTitle}": "${created.comment.slice(0, 100)}"`,
      category: 'review',
    });

    await db.insert(auditLogs).values({
      actorUid: created.userUid || 'customer',
      actorEmail: created.reviewerEmail || 'verified-client@joyconsultant.ng',
      action: 'SUBMIT_CUSTOMER_REVIEW',
      entityType: 'review',
      entityId: String(created.id),
      details: `${created.reviewerName} submitted a ${cleanRating}-star review for ${created.propertyTitle}`,
    });

    return created;
  } catch (error) {
    console.error('Database query failed in createReviewRecord:', error);
    throw new Error('Failed to submit customer review.', { cause: error });
  }
}

