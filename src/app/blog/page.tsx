import { getPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import { Terminal } from "lucide-react";

export default function BlogPage() {
    const posts = getPosts("blog");

    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl">
            <div className="flex items-center gap-2 text-primary font-mono mb-8 border-b border-gray-800 pb-4">
                <Terminal size={20} />
                <h1 className="text-2xl font-bold">/var/log/blog</h1>
            </div>

            <div className="grid gap-6">
                {posts.map((post) => (
                    <PostCard key={post.slug} post={post} type="blog" />
                ))}
            </div>
        </div>
    );
}
