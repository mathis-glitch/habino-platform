"use client";
/**
 * Habino Analytics — thin wrapper around PostHog.
 * All key funnel events go through here so we have one place to audit.
 *
 * Funnel: search → property_view → contact_agent → booking_requested → booking_confirmed
 */

import posthog from "posthog-js";

function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  try {
    posthog.capture(event, props);
  } catch { /* non-blocking */ }
}

// ── Search ────────────────────────────────────────────────────────────────────
export const analytics = {
  /** User submits a search (filter or AI) */
  search(params: {
    query?: string;
    listing_type?: string;
    property_type?: string;
    city?: string;
    neighbourhood?: string;
    result_count: number;
    source: "filter" | "ai" | "map";
  }) {
    track("search", params);
  },

  /** User opens a property detail page */
  propertyView(params: {
    property_id: string;
    property_type: string;
    listing_type: string;
    price: number;
    currency: string;
    city?: string;
    neighbourhood?: string;
  }) {
    track("property_view", params);
  },

  /** User saves a property */
  propertySaved(params: { property_id: string }) {
    track("property_saved", params);
  },

  /** User opens the message agent modal */
  contactStarted(params: { property_id: string; agent_name?: string }) {
    track("contact_started", params);
  },

  /** User successfully sends a message to agent */
  contactSent(params: { property_id: string }) {
    track("contact_sent", params);
  },

  /** User requests a viewing appointment */
  bookingRequested(params: {
    property_id: string;
    scheduled_date?: string;
  }) {
    track("booking_requested", params);
  },

  /** User opens AI chat */
  aiChatOpened() {
    track("ai_chat_opened");
  },

  /** AI chat returns results */
  aiSearchCompleted(params: { result_count: number; query_length: number }) {
    track("ai_search_completed", params);
  },

  /** User signs up */
  signedUp(params: { method: "email" | "google" | "phone" }) {
    track("signed_up", params);
  },

  /** User logs in */
  loggedIn(params: { method: "email" | "google" | "phone" }) {
    track("logged_in", params);
  },

  /** User views broker profile */
  brokerViewed(params: { broker_id: string }) {
    track("broker_viewed", params);
  },
};
