import Link from "next/link";
import { FaFacebook, FaInstagram } from "react-icons/fa"; // You might need: npm install react-icons

export const Footer = () => {
  return (
    <footer className="bg-gray-950 border-t border-gray-900 text-white py-16">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">Down South Corals</h3>
          <p className="text-gray-400 text-sm">
            Providing premium WYSIWYG corals and expert advice to hobbyists
            nationwide.
          </p>
          <div className="flex space-x-4">
            <Link
              href="https://facebook.com"
              className="text-gray-400 hover:text-blue-500"
            >
              <FaFacebook size={24} />
            </Link>
            <Link
              href="https://instagram.com"
              className="text-gray-400 hover:text-pink-500"
            >
              <FaInstagram size={24} />
            </Link>
          </div>
        </div>

        {/* Links */}
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

        {/* Support */}
        <div>
          <h4 className="font-bold mb-4">Support</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>
              <Link href="/shipping" className="hover:text-white">
                Shipping Policy
              </Link>
            </li>
            <li>
              <Link href="/guarantee" className="hover:text-white">
                Arrive Alive Guarantee
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-bold mb-4">Contact</h4>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>123 Reef Way</li>
            <li>Ocean City, FL 33000</li>
            <li className="pt-2">support@downsouthcorals.com</li>
            <li>(555) 123-4567</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-900 mt-12 pt-8 text-center text-gray-600 text-sm">
        © {new Date().getFullYear()} Down South Corals. All rights reserved.
      </div>
    </footer>
  );
};
