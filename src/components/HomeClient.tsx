"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HomeClient({ writeupsCount }: { writeupsCount: number }) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const timings = [300, 900, 1800, 2600, 3400];
        const timers = timings.map((delay, i) =>
            setTimeout(() => setStep(i + 1), delay)
        );
        return () => timers.forEach(clearTimeout);
    }, []);

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-100px)] px-6">
            <div className="w-full max-w-4xl font-mono text-base md:text-lg leading-relaxed">

                {/* Initial prompt */}
                <div className="flex items-center gap-1">
                    <span className="text-primary">root@stager</span>
                    <span className="text-gray-600">:</span>
                    <span className="text-primary">~</span>
                    <span className="text-gray-600">#</span>
                </div>

                {/* Block 1 — whoami */}
                {step >= 1 && (
                    <div className="mt-3">
                        <div className="flex items-center gap-1">
                            <span className="text-primary">root@stager</span>
                            <span className="text-gray-600">:</span>
                            <span className="text-primary">~</span>
                            <span className="text-gray-600">#</span>
                            <span className="text-white ml-2">whoami</span>
                        </div>
                        <p className="text-gray-400 mt-1">stager</p>
                    </div>
                )}

                {/* Block 2 — about */}
                {step >= 2 && (
                    <div className="mt-4">
                        <div className="flex items-center gap-1">
                            <span className="text-primary">root@stager</span>
                            <span className="text-gray-600">:</span>
                            <span className="text-primary">~</span>
                            <span className="text-gray-600">#</span>
                            <span className="text-white ml-2">cat about.txt</span>
                        </div>
                        <div className="text-gray-400 mt-1 space-y-0.5">
                            <p><span className="font-bold text-gray-200">Penetration tester.</span> Security engineer.</p>
                            <p>Founder of <span className="font-bold text-primary">FashilHack</span> — offensive security for businesses.</p>
                            <p>I <span className="font-bold text-gray-200">break internal networks</span> and document exactly how.</p>
                        </div>
                    </div>
                )}

                {/* Block 3 — ls work */}
                {step >= 3 && (
                    <div className="mt-4">
                        <div className="flex items-center gap-1">
                            <span className="text-primary">root@stager</span>
                            <span className="text-gray-600">:</span>
                            <span className="text-primary">~</span>
                            <span className="text-gray-600">#</span>
                            <span className="text-white ml-2">ls ./work</span>
                        </div>
                        <div className="flex items-center gap-6 mt-1">
                            <Link href="/writeups" className="text-primary hover:text-emerald-400 transition-colors">
                                writeups/
                            </Link>
                            <Link href="/blog" className="text-primary hover:text-emerald-400 transition-colors">
                                blog/
                            </Link>
                            {/*
<a
    href="https://fashilhack.so"
    target="_blank"
    rel="noopener noreferrer"
    className="text-primary hover:text-emerald-400 transition-colors"
>
    engagements/
</a>
*/}
                        </div>
                    </div>
                )}

                {/* Block 4 — stats */}
                {step >= 4 && (
                    <div className="mt-4">
                        <div className="flex items-center gap-1">
                            <span className="text-primary">root@stager</span>
                            <span className="text-gray-600">:</span>
                            <span className="text-primary">~</span>
                            <span className="text-gray-600">#</span>
                            <span className="text-white ml-2">cat stats.txt</span>
                        </div>
                        <div className="flex items-center gap-8 mt-1 text-gray-500 text-sm md:text-base">
                            <span>boxes rooted <span className="text-primary">{writeupsCount}+</span></span>
                            <span>writeups <span className="text-primary">{writeupsCount}</span></span>
                        </div>
                    </div>
                )}

                {/* Blinking cursor */}
                {step >= 5 && (
                    <div className="mt-4 flex items-center gap-1">
                        <span className="text-primary">root@stager</span>
                        <span className="text-gray-600">:</span>
                        <span className="text-primary">~</span>
                        <span className="text-gray-600">#</span>
                        <span className="ml-2 text-primary animate-pulse">█</span>
                    </div>
                )}

            </div>
        </div>
    );
}