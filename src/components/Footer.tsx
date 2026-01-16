export default function Footer() {
    return (
        <footer className="border-t border-[#333] bg-black py-8 mt-20">
            <div className="container mx-auto px-6 text-center text-gray-500 font-mono text-sm">
                <p>&copy; {new Date().getFullYear()} Stager. All systems operational.</p>
                <p className="mt-2 text-xs">Built with Next.js + Tailwind</p>
            </div>
        </footer>
    );
}
