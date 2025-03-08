import { RegisterForm } from "@/components/register-form";
import { Logo } from "@/components/Logo";

export default function SignUp() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden lg:block bg-primary">
        <div className="absolute inset-0 flex flex-col p-10 items-start justify-end text-white dark:text-black">
          <blockquote className="text-2xl font-light italic text-left max-w-lg">
            &quot;The key is not to prioritize what&apos;s on your schedule, but
            to schedule your priorities.&quot;
            <footer className="mt-4 text-lg">— Stephen Covey</footer>
          </blockquote>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-end">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  );
}
