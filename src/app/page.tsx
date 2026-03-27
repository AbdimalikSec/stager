import HomeClient from "@/components/HomeClient";
import { getPosts } from "@/lib/posts";

export default function Home() {
  const writeups = getPosts("writeups");

  return <HomeClient writeupsCount={writeups.length} />;
}
