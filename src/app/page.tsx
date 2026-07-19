import Link from "next/link";
import { FileText, Bell, Download, Clock, IndianRupee, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Invoicely</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
            Built for Indian freelancers
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            Stop chasing payments.
            <br />
            <span className="text-blue-600">Let your invoices do it.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Create GST-compliant invoices, send them via WhatsApp and email, and automate payment
            reminders. Get paid faster without the awkward follow-ups.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-blue-600 text-white font-medium px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-base"
            >
              Start Free — No Card Required
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center border border-gray-300 text-gray-700 font-medium px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors text-base"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            Free for up to 5 invoices/month. No credit card needed.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Everything you need to get paid on time
            </h2>
            <p className="mt-3 text-gray-600 max-w-xl mx-auto">
              No more spreadsheets, no more manual follow-ups. Invoicely handles the boring stuff so
              you can focus on your work.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: "Professional Invoices",
                description:
                  "Create clean, GST-compliant invoices in seconds. Add your branding, line items, and tax details.",
              },
              {
                icon: Bell,
                title: "Auto Payment Reminders",
                description:
                  "Set it and forget it. Automatic reminders via WhatsApp and email when invoices are overdue.",
              },
              {
                icon: Download,
                title: "PDF Download",
                description:
                  "Generate professional PDF invoices ready to share with clients or keep for your records.",
              },
              {
                icon: Clock,
                title: "Track Payment Status",
                description:
                  "Know exactly which invoices are paid, pending, or overdue at a glance from your dashboard.",
              },
              {
                icon: IndianRupee,
                title: "Built for India",
                description:
                  "GST-ready, INR formatting, UPI-friendly. Designed for how Indian freelancers actually work.",
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description:
                  "Your data is encrypted and stored securely. Only you can access your invoices and client information.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Simple pricing</h2>
            <p className="mt-3 text-gray-600">Start free, upgrade when you grow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="rounded-xl border border-gray-200 p-8">
              <h3 className="text-lg font-semibold text-gray-900">Free</h3>
              <p className="text-sm text-gray-500 mt-1">Perfect to get started</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">₹0</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="mt-6 space-y-3">
                {[
                  "5 invoices/month",
                  "2 clients",
                  "PDF generation",
                  "Email reminders",
                  "Basic dashboard",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block w-full text-center bg-gray-100 text-gray-900 font-medium py-2.5 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="rounded-xl border-2 border-blue-600 p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                Most Popular
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Pro</h3>
              <p className="text-sm text-gray-500 mt-1">For growing freelancers</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">₹199</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="mt-6 space-y-3">
                {[
                  "Unlimited invoices",
                  "Unlimited clients",
                  "WhatsApp reminders",
                  "Auto payment reminders",
                  "Expense tracking",
                  "Priority support",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block w-full text-center bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Start Pro Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center">
              <FileText className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Invoicely</span>
          </div>
          <p className="text-sm text-gray-500">
            Built for Indian freelancers who deserve to get paid on time.
          </p>
        </div>
      </footer>
    </div>
  );
}
