import { getPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import { StickyNote } from "lucide-react";

export default function NotesPage() {
    // reusing writeups or we could add a new type. 
    // For now let's just use "writeups" or if we want separate, we need to update getPosts.
    // Let's assume we update getPosts or just show a construction message.

    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl">
            <div className="flex items-center gap-2 text-primary font-mono mb-8 border-b border-gray-800 pb-4">
                <StickyNote size={20} />
                <h1 className="text-2xl font-bold">~/notes</h1>
            </div>

            <div className="border border-dashed border-gray-800 p-12 text-center rounded-sm">
                <p className="text-gray-500 font-mono">No notes found. System is empty.</p>
            </div>
        </div>
    );
}
