import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="w-full h-screen flex items-center justify-center">
      <SignIn />
    </main>
  );
}
