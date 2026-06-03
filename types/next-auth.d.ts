import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "supplier" | "reviewer";
      contactId: string | null;
      accountId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "supplier" | "reviewer";
    contactId?: string | null;
    accountId?: string | null;
  }
}
