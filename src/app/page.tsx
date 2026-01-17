"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Terminal } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] py-12 px-6">
      <div className="max-w-4xl w-full space-y-8">
        {/* Terminal Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 text-gray-500 font-mono text-sm mb-4"
        >
          <span className="text-primary">root@stager:~#</span>
        </motion.div>

        {/* Hero Content */}
        <div className="space-y-6">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-5xl md:text-7xl font-bold font-sans tracking-tight"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-600">
              Cybersecurity
            </span>
            <br />
            Researcher & <span className="text-white">Developer</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-xl text-gray-400 max-w-2xl font-mono leading-relaxed"
          >
            Welcome to Stager. Access granted. Here I document my journey through CTFs,
            vulnerability research, and secure coding practices.
          </motion.p>
        </div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-wrap gap-4 pt-4"
        >
          <Link
            href="/writeups"
            className="group flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-sm font-bold font-mono hover:bg-emerald-400 transition-all"
          >
            <Terminal size={18} />
            View Writeups
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/blog"
            className="flex items-center gap-2 border border-gray-700 text-gray-300 px-6 py-3 rounded-sm font-mono hover:border-primary hover:text-primary transition-all bg-black/50"
          >
            Read Blog
          </Link>
        </motion.div>

        {/* Statistics or Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-12 border-t border-gray-800 mt-12"
        >
          {[
            { label: 'Total Writeups', value: '3' },
            { label: 'CTFs Solved', value: '1' },
            { label: 'Latest Post', value: 'Today' }
          ].map((stat, i) => (
            <div key={stat.label} className="p-4 border border-gray-900 bg-gray-950/50 rounded-sm">
              <div className="text-xs text-gray-500 font-mono uppercase mb-1">{stat.label}</div>
              <div className="text-primary font-mono font-bold">
                {stat.value}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
