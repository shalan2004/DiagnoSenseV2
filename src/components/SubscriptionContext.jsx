import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getCurrentSubscriptionAPI } from "./mockAPI";

const extractCredits = (response) => {
  if (!response) return null;
  const possibleValues = [
    response?.data?.credits,
    response?.data?.balance,
    response?.data?.data?.credits,
    response?.data?.data?.balance,
    response?.credits,
    response?.balance,
  ];

  for (const val of possibleValues) {
    if (val != null) {
      const parsed = typeof val === "string" ? parseFloat(val) : val;
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return null;
};

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [isSubLoading, setIsSubLoading] = useState(true);
  const [subError, setSubError] = useState(null);

  // Credits are derived from subscriptionData — no separate API call needed
  const [credits, setCredits] = useState(null);
  const [isCreditsLoading, setIsCreditsLoading] = useState(true);

  // ── Single fetch for both subscription data AND credits ───────────────────
  // /api/subscription/current returns all the data we need for both.
  // We call it once and split the result instead of making two separate requests.
  const fetchSubscription = useCallback(async () => {
    setIsSubLoading(true);
    setIsCreditsLoading(true);
    setSubError(null);
    try {
      const result = await getCurrentSubscriptionAPI();
      
      const extractedCredits = extractCredits(result);
      if (extractedCredits !== null) {
        setCredits(extractedCredits);
      }

      if (result && result.success && result.data) {
        setSubscriptionData(result.data);
      } else {
        setSubscriptionData(null);
        setSubError(result?.message || "Failed to load subscription data");
      }
    } catch (err) {
      console.error("[SubscriptionContext] fetch error:", err);
      setSubscriptionData(null);
      setSubError("Network error loading subscription data");
    }
    setIsSubLoading(false);
    setIsCreditsLoading(false);
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // refreshCredits re-uses the same combined fetch — avoids a separate call
  const refreshCredits = useCallback(async () => {
    try {
      const result = await getCurrentSubscriptionAPI();
      
      const extractedCredits = extractCredits(result);
      if (extractedCredits !== null) {
        setCredits(extractedCredits);
      }

      if (result && result.success && result.data) {
        // Also keep subscriptionData fresh (same response, no extra cost)
        setSubscriptionData(result.data);
      } else {
        setSubscriptionData(null);
      }
    } catch (err) {
      console.error("[SubscriptionContext] refreshCredits error:", err);
    }
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionData,
        isSubLoading,
        subError,
        refreshSubscription: fetchSubscription,
        // Credits
        credits,
        isCreditsLoading,
        refreshCredits,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    return {
      subscriptionData: null,
      isSubLoading: false,
      subError: null,
      refreshSubscription: () => {},
      credits: null,
      isCreditsLoading: false,
      refreshCredits: () => {},
    };
  }
  return ctx;
}
