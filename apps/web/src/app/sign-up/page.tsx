import Link from "next/link";

import { SignUpForm } from "../../components/auth-forms";
import { AuthLayout } from "../../components/auth-layout";

export const metadata = { title: "Create an account" };

export default function SignUpPage() {
  return (
    <AuthLayout
      title="Create an account"
      lead="You start with no organization. Create one on the next screen, or join one from an invite link."
      footer={
        <>
          Already have an account? <Link href="/sign-in">Sign in</Link>.
        </>
      }
    >
      <SignUpForm />
    </AuthLayout>
  );
}
