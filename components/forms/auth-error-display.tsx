"use client";

import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import * as React from "react";

const ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    "OAuth configuration error. Please make sure the redirect URI is configured in Google Cloud Console.",
  AccessDenied:
    "Access denied. You may have cancelled the sign-in or your account is not authorized.",
  OAuthSignin: "Error starting OAuth sign-in. Please try again.",
  OAuthCallback: "Error completing OAuth sign-in. Please try again.",
  OAuthCreateAccount: "Error creating your account. Please try again.",
  EmailCreateAccount: "Error creating your account. Please try again.",
  Callback: "Unexpected error during sign-in. Please try again.",
  OAuthAccountNotLinked:
    "This email is already linked to a different sign-in method.",
  EmailSignin: "Error sending the sign-in email. Please try again.",
  CredentialsSignin: "Invalid email or password. Please try again.",
  SessionRequired: "Please sign in to access this page.",
  default: "An unexpected error occurred. Please try again.",
};

export function AuthErrorDisplay() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");
  const [origin, setOrigin] = React.useState("");

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (!error) return null;

  const message =
    ERROR_MESSAGES[error] ||
    ERROR_MESSAGES.default;

  return (
    <div className="rounded-md bg-destructive/15 p-3 text-sm">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div>
          <p className="font-medium text-destructive">Sign In Error</p>
          <p className="mt-1 text-muted-foreground">{message}</p>
          {error === "Configuration" && (
            <p className="mt-2 text-xs text-muted-foreground">
              Expected redirect URI:{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                {origin
                  ? `${origin}/api/auth/callback/google`
                  : "/api/auth/callback/google"}
              </code>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
