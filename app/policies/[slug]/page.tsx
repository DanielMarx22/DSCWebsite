import { client } from "@/sanity/lib/client";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import Image from "next/image";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;

  const page = await client.fetch(
    `*[_type == "policy" && slug.current == "${slug}"][0]`
  );

  if (!page) return notFound();

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center py-20 px-4">
      {/* 1. BACKGROUND LAYER */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/policyimage.png" // Using your banner, or change to a specific policy image
          alt="Background"
          fill
          className="object-cover blur-[3px] opacity-100 brightness-100" // blur and opacity for style
          priority
        />
        {/* Dark overlay to ensure text contrast */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* 2. CONTENT CARD LAYER */}
      <div className="relative z-10 w-full max-w-4xl bg-gray-900/95 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Header Section */}
        <div className="bg-black/40 p-8 md:p-12 text-center border-b border-gray-800">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white uppercase drop-shadow-lg">
            {page.title}
          </h1>
          <div className="w-24 h-1 bg-blue-500 mx-auto mt-6 rounded-full" />
        </div>

        {/* Text Content Section */}
        <div className="p-8 md:p-16">
          <div
            className="prose prose-invert prose-lg max-w-none 
            prose-headings:text-blue-400 prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-wide
            prose-p:text-gray-300 prose-p:leading-relaxed
            prose-li:text-gray-300
            prose-strong:text-white prose-strong:font-extrabold
            marker:text-blue-500"
          >
            {/* We center the CONTAINER, but standard text looks best left-aligned.
               If you truly want centered text, add 'text-center' to the div above.
            */}
            <PortableText
              value={page.content}
              components={{
                // Custom styling for specific block types if needed
                block: {
                  normal: ({ children }) => <p className="mb-6">{children}</p>,
                  h2: ({ children }) => (
                    <h2 className="text-2xl mt-12 mb-6 text-center border-b border-gray-800 pb-2">
                      {children}
                    </h2>
                  ),
                },
              }}
            />
          </div>
        </div>

        {/* Footer of the Card */}
        <div className="bg-black/20 p-6 text-center text-gray-500 text-sm border-t border-gray-800">
          Down South Corals Policies • Updated {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
