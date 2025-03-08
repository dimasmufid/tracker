import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden lg:block bg-primary">
        <div className="absolute inset-0 flex flex-col p-10 items-start justify-end text-white dark:text-black">
          <blockquote className="text-2xl font-light italic text-left max-w-lg">
            &quot;Slow productivity isn&apos;t about getting more things done.
            It&apos;s about getting the right things done with less stress and
            more impact.&quot;
            <footer className="mt-4 text-lg">— Cal Newport</footer>
          </blockquote>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-end">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
