"use client";

import { QueryForm } from "@/app/components/QueryForm";

export default function Home() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-100">
            <QueryForm />
        </main>
    );
}