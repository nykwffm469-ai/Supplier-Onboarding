import type { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

import { normalizeRole, type UserRole } from "@/lib/auth";
import { getRecords } from "@/lib/server/dataverse";

type DataverseContact = {
  contactid: string;
  _parentcustomerid_value?: string;
  msmfg_portalrole?: string;
};

function getRoleFromClaims(claimsRole: unknown): UserRole {
  if (typeof claimsRole === "string") {
    return normalizeRole(claimsRole);
  }

  if (Array.isArray(claimsRole) && claimsRole.length > 0) {
    return normalizeRole(String(claimsRole[0]));
  }

  return "supplier";
}

async function resolveUserLinkByEmail(email?: string | null): Promise<{
  role: UserRole;
  contactId: string | null;
  accountId: string | null;
}> {
  if (!email) {
    return { role: "supplier", contactId: null, accountId: null };
  }

  const escaped = email.replace(/'/g, "''");
  const contacts = await getRecords<DataverseContact>(
    "contacts",
    `$select=contactid,_parentcustomerid_value,msmfg_portalrole&$filter=emailaddress1 eq '${escaped}'&$top=1`
  );

  const contact = contacts[0];

  if (!contact) {
    return { role: "supplier", contactId: null, accountId: null };
  }

  return {
    role: normalizeRole(contact.msmfg_portalrole),
    contactId: contact.contactid,
    accountId: contact._parentcustomerid_value ?? null,
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.CLIENT_ID ?? "",
      clientSecret: process.env.CLIENT_SECRET ?? "",
      tenantId: process.env.TENANT_ID,
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        const profileClaims = profile as Record<string, unknown>;
        const claimsRole =
          profileClaims.roles ??
          profileClaims.role ??
          profileClaims.extension_role;

        const claimRole = getRoleFromClaims(claimsRole);
        const dataverseLink = await resolveUserLinkByEmail(token.email);

        token.role = dataverseLink.role ?? claimRole;
        token.contactId = dataverseLink.contactId;
        token.accountId = dataverseLink.accountId;
      }

      token.role = normalizeRole(typeof token.role === "string" ? token.role : null);
      token.contactId = typeof token.contactId === "string" ? token.contactId : null;
      token.accountId = typeof token.accountId === "string" ? token.accountId : null;

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = normalizeRole(typeof token.role === "string" ? token.role : null);
        session.user.contactId = typeof token.contactId === "string" ? token.contactId : null;
        session.user.accountId = typeof token.accountId === "string" ? token.accountId : null;
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
