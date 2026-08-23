const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() ?? null;
  }
  return null;
}

interface RequestOptions extends RequestInit {
  data?: unknown;
}

export async function apiRequest(endpoint: string, options: RequestOptions = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  
  // Set JSON headers by default if data is sent
  if (options.data && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    options.body = JSON.stringify(options.data);
  }

  // Inject CSRF token header for mutating methods
  const method = options.method?.toUpperCase() || "GET";
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    const csrfToken = getCookie("XSRF-TOKEN");
    if (csrfToken) {
      headers.set("X-XSRF-TOKEN", csrfToken);
    }
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include", // Ensure cookies are sent and received
  };

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    let errorMessage = "An error occurred";
    try {
      const errorData = await response.json();
      errorMessage = (errorData as { error?: string }).error || errorMessage;
      if (errorData.details && Array.isArray(errorData.details)) {
        errorMessage += `: ${errorData.details.join(", ")}`;
      }
    } catch {
      // JSON parsing failed, fallback to status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses (like 204 or logout responses with no body)
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}
