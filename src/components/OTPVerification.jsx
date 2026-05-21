import React, { useState, useEffect, useRef } from "react";
import {
  verifyOTPAPI,
  verifyOTPForResetAPI,
  resendOTPAPI,
  forgetPasswordAPI,
} from "./mockAPI";
import { getCookie } from "./cookieUtils.js";


const COUNTDOWN_SECONDS = 10 * 60;

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const OTPVerification = ({
  contact,
  onVerifySuccess,
  onSessionExpired,
  mode = "email_verification",
}) => {
  const [otp, setOtp] = useState("");
  //   const [userIdentity, setUserIdentity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const intervalRef = useRef(null);


  useEffect(() => {
    setTimeLeft(COUNTDOWN_SECONDS);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [mode]);
  useEffect(() => {
    if (mode === "email_verification") {
      const token = getCookie("user_token");
      if (!token) {
        console.error("[OTPVerification] No token on mount — redirecting");
        if (onSessionExpired) {
          onSessionExpired();
        } else {
          setError("Session expired. Please register again.");
        }
      }
    }
  }, [mode, onSessionExpired]);

  const content = {
    email_verification: {
      title: "Verify your Email",
      subtitle: "Enter the code sent to:",
      buttonLabel: "Verify Account",
    },
    forget_password: {
      title: "Enter Reset Code",
      subtitle: "Enter the OTP sent to:",
      buttonLabel: "Verify & Continue",
    },
  };

  const { title, subtitle, buttonLabel } = content[mode];

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    let result;

    if (mode === "email_verification") {
      result = await verifyOTPAPI(contact, otp);
      if (result.success) {
        onVerifySuccess(otp);
      } else {
        setError(result.message);
      }
    } else if (mode === "forget_password") {
      result = await verifyOTPForResetAPI(contact, otp);
      console.log("OTP Verification Result:", result);
      if (result.success) {
        const reset_token = result.data.reset_token;
        onVerifySuccess(reset_token);
      } else {
        setError(result.message);
      }
    }

    setIsLoading(false);
  };

  const handleResendOTP = async (e) => {
    e.preventDefault();
    setResendLoading(true);
    setError("");
    setSuccessMessage("");

    let result;
    if (mode === "forget_password") {
      result = await forgetPasswordAPI(contact);
    } else {
      result = await resendOTPAPI();
    }

    if (result.success) {
      setSuccessMessage(result.message || "OTP sent successfully.");
      setTimeout(() => {
        setSuccessMessage("");
      }, 2000);
    } else {
      setError(result.message);
    }
    setResendLoading(false);
  };

  return (
    <div className="tab-content active">
      <div className="form-header">
        <h2>{title}</h2>
        <p>
          {subtitle} <strong>{contact}</strong>
        </p>
      </div>

      <form onSubmit={handleVerify}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Enter OTP Code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength="6"
            style={{
              textAlign: "center",
              fontSize: "24px",
              letterSpacing: "8px",
            }}
          />
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMessage && (
          <div
            className="success-message"
            style={{
              color: "#10b981",
              marginBottom: "15px",
              padding: "10px",
              background: "var(--auth-success-bg, #d1fae5)",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            {successMessage}
          </div>
        )}

        <button
          type="submit"
          className={`btn-primary ${isLoading ? "loading" : ""}`}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          disabled={isLoading}
        >
          {isLoading ? "Verifying..." : buttonLabel}
        </button>
      </form>
    {timeLeft > 0 ? (
        <div
          style={{
            textAlign: "center",
            marginTop: "15px",
            color: "var(--text-muted, #6b7280)",
            fontSize: "14px",
          }}
        >
          Resend code available in{" "}
          <span
            style={{
              fontWeight: "600",
              color:
                timeLeft <= 60
                  ? "#e74c3c"
                  : "var(--primary, #3b82f6)",
            }}
          >
            {formatTime(timeLeft)}
          </span>
        </div>
      ) : (
        <div
          className="form-options"
          style={{ justifyContent: "center", marginTop: "15px" }}
        >
          <p>
            Didn't receive code?{" "}
            <a
              href="#"
              onClick={handleResendOTP}
              style={{ pointerEvents: resendLoading ? "none" : "auto" }}
            >
              {resendLoading ? "Resending..." : "Resend"}
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

export default OTPVerification;
