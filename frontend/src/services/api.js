const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const api = async (endpoint, method = "GET", data = null, token = null) => {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: data ? JSON.stringify(data) : null
    });

    const result = await res.json();
    return result;
  } catch (err) {
    console.error("API Error:", err);
    return { success: false, message: "Network error. Please try again." };
  }
};