import { getPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import { Terminal, Shield } from "lucide-react";

export default function WriteupsPage() {
    const posts = getPosts("writeups");

    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl">
            <div className="flex items-center gap-2 text-primary font-mono mb-8 border-b border-gray-800 pb-4">
                <Shield size={20} />
                <h1 className="text-2xl font-bold">/usr/share/writeups</h1>
            </div>

            <div className="grid gap-6">
                {posts.map((post) => (
                    <PostCard key={post.slug} post={post} type="writeups" />
                ))}
            </div>
        </div>
    );
}
