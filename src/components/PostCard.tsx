import Link from "next/link";
import { ArrowRight, Calendar, Tag } from "lucide-react";
import { Post } from "@/lib/posts";

interface PostCardProps {
    post: Post;
    type: "blog" | "writeups";
}

export default function PostCard({ post, type }: PostCardProps) {
    return (
        <Link
            href={`/${type}/${post.slug}`}
            className="group block border border-gray-900 bg-gray-950/30 p-6 rounded-sm hover:border-primary transition-colors"
        >
            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono mb-3">
                <Calendar size={12} />
                <span>{post.metadata.date}</span>
            </div>

            <h3 className="text-xl font-bold font-sans text-gray-100 group-hover:text-primary transition-colors mb-2">
                {post.metadata.title}
            </h3>

            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {post.metadata.description}
            </p>

            <div className="flex items-center justify-between mt-auto">
                <div className="flex gap-2">
                    {post.metadata.tags?.map(tag => (
                        <span key={tag} className="text-xs bg-gray-900 text-gray-400 px-2 py-1 rounded-sm flex items-center gap-1">
                            <Tag size={10} />
                            {tag}
                        </span>
                    ))}
                </div>
                <ArrowRight
                    size={16}
                    className="text-gray-600 group-hover:text-primary group-hover:translate-x-1 transition-all"
                />
            </div>
        </Link>
    );
}
