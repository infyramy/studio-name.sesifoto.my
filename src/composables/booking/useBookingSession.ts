const SESSION_ID_KEY = "booking_session_id";
const SESSION_TS_KEY = "booking_session_timestamp";
const BOOKING_STATE_KEY = "booking_state";
const REFERRAL_KEY = "referral_code";
const SESSION_MAX_HOURS = 24;

export function useBookingSession() {
  function getSessionId(): string {
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      localStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
  }

  function getReferralCode(): string | undefined {
    try {
      return sessionStorage.getItem(REFERRAL_KEY) || undefined;
    } catch {
      return undefined;
    }
  }

  function clearSession(): void {
    localStorage.removeItem(SESSION_ID_KEY);
    localStorage.removeItem(SESSION_TS_KEY);
    localStorage.removeItem(BOOKING_STATE_KEY);
  }

  function initializeSession(): void {
    const sessionTimestamp = localStorage.getItem(SESSION_TS_KEY);
    const now = Date.now();

    if (sessionTimestamp) {
      const hoursSinceSession =
        (now - parseInt(sessionTimestamp, 10)) / (1000 * 60 * 60);
      if (hoursSinceSession > SESSION_MAX_HOURS) {
        clearSession();
      }
    } else {
      localStorage.setItem(SESSION_TS_KEY, now.toString());
    }

    getSessionId();
  }

  return {
    getSessionId,
    getReferralCode,
    initializeSession,
    clearSession,
    BOOKING_STATE_KEY,
  };
}
