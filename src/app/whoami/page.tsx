import { Terminal } from "lucide-react";

export default function WhoamiPage() {
    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl">
            <div className="flex items-center gap-2 text-primary font-mono mb-8 border-b border-gray-800 pb-4">
                <Terminal size={20} />
                <h1 className="text-2xl font-bold">~/whoami</h1>
            </div>

            <div className="prose prose-invert prose-green max-w-none font-sans">
                <h1 className="text-3xl font-bold mb-6 text-white">
                    Hello, stranger on the internet.
                </h1>

                <p className="text-lg text-gray-300 mb-6">
                    I’m <span className="text-white font-bold">Abdimalik Yuusuf</span> — also known as{" "}
                    <span className="text-primary font-mono">stager</span>.
                </p>

                <p className="mb-6">
                    I work and learn in the field of <strong className="text-white">cybersecurity</strong>, with a
                    strong focus on <strong className="text-white">offensive security and internal network compromise</strong>.
                    Most of my time is spent understanding how attackers operate inside environments — especially{" "}
                    <strong className="text-white">Active Directory networks</strong> — and how everyday
                    misconfigurations turn into full domain compromise.
                </p>

                <p className="mb-6">
                    My interests center on <strong className="text-white">internal enumeration, privilege escalation,
                        lateral movement, and post-exploitation</strong>. I’m less interested in isolated exploits and
                    more interested in how trust relationships, credentials, and access controls are abused once an
                    attacker gains a foothold.
                </p>

                <p className="italic text-gray-400 border-l-4 border-primary/30 pl-4 py-2 my-8 bg-gray-900/30">
                    This site is not just a blog.
                </p>

                <p className="mb-6">
                    Here, I publish <strong className="text-white">write-ups, experiments, and lessons learned</strong>
                    from labs and projects I build to simulate realistic attack paths inside internal networks. Some of
                    the content is polished, some is intentionally raw — but everything here reflects how I learn:
                    by breaking systems carefully and understanding why they fail.
                </p>

                <p className="mb-6">
                    I didn’t arrive in cybersecurity with a predefined roadmap.<br />
                    I grew into it by asking uncomfortable questions about systems —{" "}
                    <em>what happens after the first foothold, how attackers move quietly, and where defenders
                        lose visibility</em>.
                </p>

                <div className="my-8 space-y-2">
                    <p className="mb-2">I believe:</p>
                    <ul className="list-disc pl-6 space-y-2 text-gray-300">
                        <li>Understanding attacker behavior matters more than memorizing tools</li>
                        <li>Internal networks fail silently, not dramatically</li>
                        <li>Security improves when offense and defense learn from each other</li>
                    </ul>
                </div>

                <p className="mb-8">
                    That mindset pushed me to build projects, hands-on labs, and detailed write-ups, and eventually to
                    create <strong className="text-primary">FashilHack</strong> — a platform focused on simulating
                    realistic internal attack scenarios so organizations can understand how attackers actually move
                    through their environments and where defenses quietly fail.
                </p>

                <p className="mb-6">
                    Beyond technology, I’m deeply interested in{" "}
                    <strong className="text-white">psychology, philosophy, and human behavior</strong>.
                    Many security problems are not purely technical — they are trust and decision-making failures
                    expressed through technology.
                </p>

                <div className="mb-8">
                    <p className="mb-2">I try to understand:</p>
                    <ul className="list-disc pl-6 space-y-1 text-gray-300">
                        <li>systems under stress</li>
                        <li>how attackers think inside networks</li>
                        <li>where assumptions quietly break</li>
                    </ul>
                </div>

                <div className="space-y-6 text-lg">
                    <p>
                        Knowledge shared is knowledge multiplied.<br />
                        If something here helps you see an attack path more clearly or avoid a costly mistake,
                        then this site has done its job.
                    </p>

                    <p className="font-mono text-primary pt-4">
                        Stay curious.<br />
                        Break things ethically.<br />
                        Build defenses intentionally.
                    </p>

                    <p className="text-xl font-bold text-white pt-2">
                        Good luck.
                    </p>
                </div>
            </div>
        </div>
    );
}
