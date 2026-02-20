import { SignIn } from "@clerk/nextjs";
import { connection } from "next/server";
import { Suspense } from "react";

export default async function SignInPage() {
  await connection();
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
      <Suspense>
        <SignIn />
      </Suspense>
    </div>
  );
}
