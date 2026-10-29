export class BackendDownError extends Error {
  constructor() {
    super(
      "Backend is not reachable at this page's origin. Start it with: " +
        "cd backend && source ../.venv/bin/activate && uvicorn app.main:app --port 8000",
    );
    this.name = "BackendDownError";
  }
}

async function parse(res: Response): Promise<unknown> {
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      /* keep status text */
    }
    throw new Error(detail);
  }
  return res.json();
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    throw new BackendDownError();
  }
  return (await parse(res)) as T;
}

export async function apiForm<T>(path: string, form: FormData): Promise<T> {
  return api<T>(path, { method: "POST", body: form });
}

export async function apiJson<T>(path: string, method: string, body?: unknown): Promise<T> {
  return api<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
