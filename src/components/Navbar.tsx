import Link from "next/link";
import { Terminal } from "lucide-react";

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#333] bg-black/80 backdrop-blur-md">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-primary font-mono text-xl hover:text-white transition-colors">

                    Stager
                </Link>
                <div className="flex items-center gap-8 font-mono text-sm">
                    <Link href="/blog" className="hover:text-primary transition-colors hover:underline decoration-primary underline-offset-4">
                        /blog
                    </Link>
                    <Link href="/writeups" className="hover:text-primary transition-colors hover:underline decoration-primary underline-offset-4">
                        /writeups
                    </Link>
                    <Link href="/notes" className="hover:text-primary transition-colors hover:underline decoration-primary underline-offset-4">
                        /notes
                    </Link>
                </div>
            </div>
        </nav>
    );
}
