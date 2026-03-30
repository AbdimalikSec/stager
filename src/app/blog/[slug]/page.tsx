import { getPostBySlug, getPosts } from "@/lib/posts";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import type { JSX } from "react";

function extractHeadings(content: string) {
    const lines = content.split(/\r?\n/);
    const headings: { id: string; text: string; level: number }[] = [];

    for (const line of lines) {
        const match = line.match(/^(#{1,3})\s+(.+)$/);
        if (match) {
            const level = match[1].length;
            const text = match[2].trim();
            const id = text
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-")
                .trim();
            headings.push({ id, text, level });
        }
    }

    return headings;
}

function createHeading(level: number) {
    const Tag = `h${level}` as keyof JSX.IntrinsicElements;
    return function Heading({ children }: { children?: React.ReactNode }) {
        const text = typeof children === "string" ? children : "";
        const id = text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();
        return <Tag id={id}>{children}</Tag>;
    };
}

const components = {
    img: (props: any) => (
        <Image
            {...props}
            width={800}
            height={500}
            style={{ width: "100%", height: "auto", borderRadius: "6px", margin: "1.5rem 0" }}
            alt={props.alt || ""}
        />
    ),
    h1: createHeading(1),
    h2: createHeading(2),
    h3: createHeading(3),
    table: ({ children }: { children?: React.ReactNode }) => (
        <div style={{ overflowX: "auto", margin: "1.5rem 0", borderRadius: "6px", border: "1px solid #1f2937" }}>
            <table style={{ borderCollapse: "collapse", minWidth: "100%", fontSize: "0.875rem" }}>
                {children}
            </table>
        </div>
    ),
    th: ({ children }: { children?: React.ReactNode }) => (
        <th style={{
            padding: "10px 14px",
            textAlign: "left",
            borderBottom: "1px solid #374151",
            backgroundColor: "#111827",
            color: "#6b7280",
            fontWeight: 500,
            whiteSpace: "nowrap",
            fontSize: "0.7rem",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
        }}>
            {children}
        </th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
        <td style={{
            padding: "10px 14px",
            borderBottom: "1px solid #111827",
            verticalAlign: "top",
            lineHeight: "1.6",
            color: "#d1d5db",
        }}>
            {children}
        </td>
    ),
    tr: ({ children }: { children?: React.ReactNode }) => (
        <tr>{children}</tr>
    ),
};

export async function generateStaticParams() {
    const posts = getPosts("blog");
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
    const { slug } = await params;
    const post = getPostBySlug("blog", slug);

    if (!post) {
        notFound();
    }

    const headings = extractHeadings(post.content);

    return (
        <div className="w-full px-6 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(auto,48rem)_1fr] gap-x-8 w-full">

                {/* Sidebar / Table of Contents (Left) */}
                {headings.length > 0 ? (
                    <aside className="hidden lg:block w-56 justify-self-end pr-4">
                        <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pb-8">
                            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-widest mb-6">
                                On this page
                            </h3>
                            <nav className="flex flex-col gap-2 border-l border-gray-800 ml-1">
                                {headings.map((heading) => (
                                    <a
                                        key={heading.id}
                                        href={`#${heading.id}`}
                                        className={`block transition-all duration-200 hover:text-primary -ml-[1px] border-l border-transparent hover:border-primary py-1 ${heading.level <= 2
                                                ? 'text-gray-300 font-medium text-sm'
                                                : 'text-gray-500 text-sm'
                                            }`}
                                        style={{
                                            paddingLeft: heading.level <= 2
                                                ? "1rem"
                                                : heading.level === 3
                                                    ? "1.75rem"
                                                    : "2.5rem",
                                        }}
                                    >
                                        {heading.text}
                                    </a>
                                ))}
                            </nav>
                        </div>
                    </aside>
                ) : (
                    <div className="hidden lg:block"></div>
                )}

                {/* Main Content (Center) */}
                <div className="min-w-0 w-full max-w-full lg:max-w-none">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-8 font-mono text-sm transition-colors"
                    >
                        <ArrowLeft size={16} />
                        cd ..
                    </Link>

                    <header className="mb-10 border-b border-gray-800 pb-10">
                        <h1 className="text-3xl md:text-5xl font-bold mb-6 text-gray-100">
                            {post.metadata.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 font-mono">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} />
                                <span>{post.metadata.date}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {post.metadata.tags?.map((tag) => (
                                    <span key={tag} className="flex items-center gap-1 text-primary">
                                        <Tag size={12} />
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </header>

                    <article className="prose prose-invert prose-green max-w-none font-sans">
                        <MDXRemote source={post.content} components={components} />
                    </article>
                </div>

                {/* Empty element for grid balancing (Right) */}
                <div className="hidden lg:block"></div>
            </div>
        </div>
    );
}