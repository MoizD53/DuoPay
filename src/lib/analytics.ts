/**
 * Privacy-conscious product analytics.
 * Does not track sensitive financial values unnecessarily.
 */

type EventName = 
  | "group_created" 
  | "expense_created" 
  | "expense_confirmed" 
  | "settlement_started" 
  | "settlement_completed" 
  | "get_to_zero_clicked" 
  | "get_to_zero_completed" 
  | "circle_created" 
  | "just_tell_duopay_used";

export function trackEvent(eventName: EventName, properties?: Record<string, string | number | boolean>) {
  if (typeof window !== "undefined") {
    // In a real app, this would push to Mixpanel, Amplitude, PostHog, etc.
    // We log it locally for beta observability.
    console.log(`[ANALYTICS] ${eventName}`, properties || {});
  } else {
    // Server-side tracking
    console.log(`[ANALYTICS-SERVER] ${eventName}`, properties || {});
  }
}
