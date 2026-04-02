'use client';

import { useState } from 'react';
import Link from 'next/link';
import LiveChat from '@/components/LiveChat';

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-yellow-50 via-white to-amber-50">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="rounded-3xl border border-yellow-100 bg-white/80 p-6 shadow-xl backdrop-blur sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                ExtraHand Support
              </h1>
              <p className="mt-2 max-w-2xl text-base text-gray-600 sm:text-lg">
                Find answers in our knowledge base or start a live chat with the support team.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:items-end">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50"
              >
                Agent sign in
              </Link>
              <span className="text-xs text-gray-500">
                Agents: use this to access the dashboard
              </span>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-yellow-100 bg-gradient-to-br from-yellow-50 to-white p-5">
              <h2 className="text-base font-bold text-gray-900">Knowledge base</h2>
              <p className="mt-1 text-sm text-gray-600">
                Browse guides, FAQs, and troubleshooting steps.
              </p>
              <div className="mt-4">
                <Link
                  href="/knowledge-base"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 px-4 py-2.5 text-sm font-bold text-gray-900 shadow-lg transition hover:from-yellow-500 hover:to-amber-600"
                >
                  Open knowledge base
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-yellow-100 bg-gradient-to-br from-amber-50 to-white p-5">
              <h2 className="text-base font-bold text-gray-900">Live chat</h2>
              <p className="mt-1 text-sm text-gray-600">
                Start a chat session and we&apos;ll connect you to an available agent.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsChatOpen(true)}
                  className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-gray-800"
                >
                  Start live chat
                </button>
                <button
                  type="button"
                  onClick={() => setIsChatOpen(false)}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LiveChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
