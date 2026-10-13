import Link from "next/link";

import { AcceptInvitationForm, SignUpForm } from "../../../components/auth-forms";
import { AuthLayout } from "../../../components/auth-layout";
import { api, ApiError } from "../../../lib/api";
import { roleLabel } from "../../../lib/roles";

export const metadata = { title: "Invitation" };

/**
 * The landing page for an invite link. Signed-out visitors create an account with the invited
 * email and join in one step; signed-in visitors with the matching email join directly.
 */
export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let preview;
  try {
    preview = await api.previewInvitation(token);
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "This invitation cannot be opened";
    return (
      <AuthLayout title="Invitation unavailable" lead={message} footer={<Link href="/sign-in">Sign in</Link>}>
        <></>
      </AuthLayout>
    );
  }

  const me = await api.me();
  const lead = (
    <>
      {preview.invitedBy.name} invited <strong>{preview.email}</strong> to join <strong>{preview.organization.name}</strong> as{" "}
      {roleLabel(preview.role)}.
    </>
  );

  if (me && me.user.email === preview.email) {
    return (
      <AuthLayout title="Join the organization" lead={lead}>
        <AcceptInvitationForm token={token} organizationName={preview.organization.name} />
      </AuthLayout>
    );
  }

  if (me) {
    return (
      <AuthLayout
        title="Different account"
        lead={
          <>
            You are signed in as {me.user.email}, but this invitation is for {preview.email}. Sign out and open the link
            again with the invited account.
          </>
        }
        footer={<Link href="/app">Back to the app</Link>}
      >
        <></>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      lead={lead}
      footer={
        <>
          Already have an account for {preview.email}?{" "}
          <Link href={`/sign-in?next=${encodeURIComponent(`/invitations/${token}`)}`}>Sign in to accept</Link>.
        </>
      }
    >
      <SignUpForm invitationToken={token} email={preview.email} />
    </AuthLayout>
  );
}
