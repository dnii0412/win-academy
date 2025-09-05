"use client"

import Link from "next/link"
import Image from "next/image"
import Logo from "./logo"

export default function Footer() {

  return (
    <footer className="bg-[#111111] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <div className="relative w-8 h-8 flex-shrink-0">
                <Image
                  src="/images/win_logo_deault_red_bg.jpg"
                  alt="WIN Academy Logo"
                  fill
                  className="object-contain rounded-full"
                  priority
                />
              </div>
            </div>
            <p className="text-gray-400 mb-4 max-w-md text-left font-bold text-sm">
              Дижитал маркетинг, борлуулалт, график дизайн, хиймэл оюуны хамгийн шинэлэг хөтөлбөрүүд
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-[#E10600]">
                Facebook
              </a>
              <a href="#" className="text-gray-400 hover:text-[#E10600]">
                Instagram
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/" className="hover:text-[#E10600]">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-[#E10600]">
                  Courses
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="hover:text-[#E10600]">
                  Contacts
                </Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-8 pt-8 text-center text-gray-400">
          <p>
            &copy; 2025 Win Academy. All rights reserved. |{" "}
            <a
              href="https://xp-hazel-eta.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E10600] hover:text-[#C70500] transition-colors"
            >
              Made by XP
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
