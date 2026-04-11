import { getPostBySlug, getPosts } from "@/lib/posts";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Tag, Terminal } from "lucide-react";
import MDXCodeBlock from "@/components/MDXCodeBlock";

export async function generateStaticParams() {
    const posts = getPosts("writeups");
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

export default async function WriteupPost({ params }: { params: { slug: string } }) {
    const { slug } = await params;
    const post = getPostBySlug("writeups", slug);

    if (!post) {
        notFound();
    }

    return (
        <div className="container mx-auto px-6 py-12 max-w-3xl">
            <Link href="/writeups" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-8 font-mono text-sm transition-colors">
                <ArrowLeft size={16} />
                cd ..
            </Link>

            <div className="border border-gray-900 bg-gray-950/50 p-8 rounded-sm mb-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Terminal size={120} />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-100 relative z-10">{post.metadata.title}</h1>

                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 font-mono relative z-10">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>{post.metadata.date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {post.metadata.tags?.map(tag => (
                            <span key={tag} className="flex items-center gap-1 text-primary">
                                <Tag size={12} />
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <article className="prose prose-invert prose-purple max-w-none font-sans">
                <MDXRemote source={post.content} components={{ pre: MDXCodeBlock }} />
            </article>
        </div>
    );
}
