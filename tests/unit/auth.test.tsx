import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountSection as Section } from "@/components/modules/account/account-section";
import { __resetAuthForTests } from "@/lib/auth/store";
import { renderWithProviders } from "../utils/render";

const supabase = vi.hoisted(() => ({ client: null as unknown }));
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => supabase.client }));

function fakeClient() {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      verifyOtp: vi.fn().mockResolvedValue({ error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  };
}

beforeEach(() => {
  localStorage.clear();
  __resetAuthForTests();
});

async function load() {
  return Section;
}

describe("account", () => {
  it("is hidden entirely when Supabase is not configured", async () => {
    supabase.client = null;
    const AccountSection = await load();
    const { container } = renderWithProviders(<AccountSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it("never shows sign-in to someone under 16", async () => {
    supabase.client = fakeClient();
    const AccountSection = await load();
    const user = userEvent.setup();
    renderWithProviders(<AccountSection />);
    await user.click(await screen.findByRole("button", { name: /sign in to back up/i }));
    await user.click(await screen.findByRole("button", { name: /not yet/i }));
    expect(screen.queryByRole("textbox", { name: /email/i })).not.toBeInTheDocument();
    expect(localStorage.getItem("mc:age-ok")).toBe("no");
    expect(screen.queryByRole("button", { name: /sign in to back up/i })).not.toBeInTheDocument();
  });

  it("asks for an email, then a code, after confirming age", async () => {
    const client = fakeClient();
    supabase.client = client;
    const AccountSection = await load();
    const user = userEvent.setup();
    renderWithProviders(<AccountSection />);
    await user.click(await screen.findByRole("button", { name: /sign in to back up/i }));
    await user.click(await screen.findByRole("button", { name: /yes, i'm 16 or older/i }));
    await user.type(await screen.findByRole("textbox", { name: /email/i }), "me@example.com");
    await user.click(screen.getByRole("button", { name: /send code/i }));
    // Works whether the email carries a code or a link (the link returns to /<lang>/auth/callback).
    expect(client.auth.signInWithOtp).toHaveBeenCalledWith({
      email: "me@example.com",
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/en/auth/callback` },
    });
    const code = await screen.findByRole("textbox", { name: /code/i });
    // Supabase lets projects use 6–10 digit codes.
    await user.type(code, "12345678");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(client.auth.verifyOtp).toHaveBeenCalledWith({ email: "me@example.com", token: "12345678", type: "email" });
  });

  it("lets a signed-in user turn backup off", async () => {
    const client = fakeClient();
    client.auth.getSession.mockResolvedValue({
      data: { session: { access_token: "t", user: { id: "u1", email: "me@example.com" } } },
    });
    supabase.client = client;
    const AccountSection = await load();
    const user = userEvent.setup();
    renderWithProviders(<AccountSection />);
    const toggle = await screen.findByRole("switch", { name: /back up automatically/i });
    expect(toggle).toBeChecked();
    await user.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(localStorage.getItem("mc:backup")).toBe("off");
    expect(screen.getByText(/backup is off/i)).toBeInTheDocument();
  });
});
