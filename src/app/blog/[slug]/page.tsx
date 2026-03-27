import { getPostBySlug, getPosts } from "@/lib/posts";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Tag } from "lucide-react";

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

    return (
        <div className="container mx-auto px-6 py-12 max-w-3xl">
            <Link href="/blog" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-8 font-mono text-sm transition-colors">
                <ArrowLeft size={16} />
                cd ..
            </Link>

            <header className="mb-10 border-b border-gray-800 pb-10">
                <h1 className="text-3xl md:text-5xl font-bold mb-6 text-gray-100">{post.metadata.title}</h1>

                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 font-mono">
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
            </header>

            <article className="prose prose-invert prose-green max-w-none font-sans">
                <MDXRemote source={post.content} components={components} />
            </article>
        </div>
    );
}