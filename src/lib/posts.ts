import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDirectory = path.join(process.cwd(), "content");

export interface Post {
    slug: string;
    metadata: {
        title: string;
        date: string;
        description: string;
        tags?: string[];
    };
    content: string;
}

export function getPosts(type: "blog" | "writeups"): Post[] {
    const dir = path.join(contentDirectory, type);
    if (!fs.existsSync(dir)) return [];

    const files = fs.readdirSync(dir);

    const posts = files.map((filename) => {
        const slug = filename.replace(".md", "").replace(".mdx", "");
        const markdownWithMeta = fs.readFileSync(path.join(dir, filename), "utf-8");
        const { data, content } = matter(markdownWithMeta);

        return {
            slug,
            metadata: data as Post["metadata"],
            content,
        };
    });

    return posts.sort((a, b) => {
        return new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime();
    });
}

export function getPostBySlug(type: "blog" | "writeups", slug: string): Post | null {
    try {
        const dir = path.join(contentDirectory, type);
        const filePath = path.join(dir, `${slug}.md`); // simplify to .md for now
        // check if exists, try mdx if not
        let fileToRead = filePath;
        if (!fs.existsSync(filePath)) {
            fileToRead = path.join(dir, `${slug}.mdx`);
        }

        if (!fs.existsSync(fileToRead)) return null;

        const markdownWithMeta = fs.readFileSync(fileToRead, "utf-8");
        const { data, content } = matter(markdownWithMeta);

        return {
            slug,
            metadata: data as Post["metadata"],
            content,
        };
    } catch (e) {
        return null;
    }
}
