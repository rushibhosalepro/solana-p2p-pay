"use client";
import { Button } from "@/components/ui/button";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

console.log(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
export default function Home() {
  return (
    <main className="max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex items-center justify-between gap-5">
          <SignedIn>
            <Link
              href={"/dashboard"}
              className="cursor-pointer flex items-center gap-2 font-semibold"
            >
              Go To Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
          </SignedIn>
          <SignedOut>
            <SignInButton />
            <SignUpButton>
              <Button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                Sign Up
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </main>
  );
}
