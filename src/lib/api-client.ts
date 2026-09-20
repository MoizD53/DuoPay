export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "An unexpected error occurred");
  }

  return data.data as T;
}
