import Link from "next/link";

import { SignInForm } from "../../components/auth-forms";
import { AuthLayout } from "../../components/auth-layout";

export const metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <AuthLayout
      title="Sign in"
      footer={
        <>
          New to Sydeso? <Link href="/sign-up">Create an account</Link>.
        </>
      }
    >
      <SignInForm next={next} />
    </AuthLayout>
  );
}
