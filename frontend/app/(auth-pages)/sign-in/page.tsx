import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-green-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md border-t-8 border-green-600 flex flex-col items-center mx-auto">
        {/* AccuRate Text Logo */}
        <div className="mb-8">
          <span className="text-4xl font-extrabold text-green-600 font-sans">Accu</span>
          <span className="text-4xl font-extrabold text-green-500 font-sans">Rate</span>
        </div>
        <form className="w-full flex flex-col gap-6" >
          <h1 className="text-2xl font-bold text-green-700 mb-2 text-center">Sign in</h1>
          <p className="text-sm text-gray-600 text-center">
            Don't have an account?{' '}
            <Link className="text-green-700 font-medium underline" href="/sign-up">
              Sign up
            </Link>
          </p>
          <div className="flex flex-col gap-4 mt-2">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input name="email" placeholder="you@example.com" required className="mt-1" />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link className="text-xs text-green-700 underline" href="/forgot-password">
                  Forgot Password?
                </Link>
              </div>
              <Input type="password" name="password" placeholder="Your password" required className="mt-1" />
            </div>
            <SubmitButton pendingText="Signing In..." formAction={signInAction} variant="agro">
              Sign in
            </SubmitButton>
            <FormMessage message={searchParams} />
          </div>
        </form>
      </div>
    </div>
  );
}
