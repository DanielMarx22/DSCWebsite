import Link from "next/link";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { client } from "@/sanity/lib/client";

export const Footer = async () => {
  // 1. Fetch the Settings
  // We use [0] to just grab the first settings document we find
  const settings = await client.fetch(`*[_type == "settings"][0]`);

  // 2. Fetch the Policy Pages (for the links)
  const policies = await client.fetch(
    `*[_type == "policy"]{ title, "slug": slug.current }`
  );

  return (
    <footer className="relative z-50 bg-gray-950 border-t border-gray-900 text-white py-16">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand & Socials */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">
            {settings?.storeName || "Down South Corals"}
          </h3>
          <p className="text-gray-400 text-sm">
            Premium WYSIWYG corals and expert advice.
          </p>
          <div className="flex space-x-4">
            {settings?.facebook && (
              <Link
                href={settings.facebook}
                target="_blank"
                className="text-gray-400 hover:text-blue-500"
              >
                <FaFacebook size={24} />
              </Link>
            )}
            {settings?.instagram && (
              <Link
                href={settings.instagram}
                target="_blank"
                className="text-gray-400 hover:text-pink-500"
              >
                <FaInstagram size={24} />
              </Link>
            )}
          </div>
        </div>

        {/* Shop Links (Static is fine here) */}
        <div>
          <h4 className="font-bold mb-4">Shop</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>
              <Link href="/products/corals" className="hover:text-white">
                Corals
              </Link>
            </li>
            <li>
              <Link href="/products/fish" className="hover:text-white">
                Fish
              </Link>
            </li>
            <li>
              <Link href="/products/inverts" className="hover:text-white">
                Inverts
              </Link>
            </li>
            <li>
              <Link href="/products/supplies" className="hover:text-white">
                Supplies
              </Link>
            </li>
          </ul>
        </div>

        {/* Dynamic Policy Links */}
        <div>
          <h4 className="font-bold mb-4">Support</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            {policies.map((page: any) => (
              <li key={page.slug}>
                {/* We will build this dynamic page route next */}
                <Link
                  href={`/policies/${page.slug}`}
                  className="hover:text-white"
                >
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Dynamic Contact Info */}
        <div>
          <h4 className="font-bold mb-4">Contact</h4>
          <ul className="space-y-2 text-gray-400 text-sm whitespace-pre-line">
            <li>{settings?.address}</li>
            <li className="">{settings?.email}</li>
            <li>{settings?.phone}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-900 mt-12 pt-8 text-center text-gray-600 text-sm">
        © {new Date().getFullYear()} {settings?.storeName}. All rights
        reserved.
      </div>
    </footer>
  );
};
