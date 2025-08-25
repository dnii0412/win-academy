import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-[#111111] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-[#E10600] rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <span className="text-xl font-bold">Win Academy</span>
            </Link>
            <p className="text-gray-400 mb-4 max-w-md">
              Empowering local students with practical digital skills and connecting them to real job opportunities.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-[#E10600]">
                Facebook
              </a>
              <a href="#" className="text-gray-400 hover:text-[#E10600]">
                Instagram
              </a>
              <a href="#" className="text-gray-400 hover:text-[#E10600]">
                TikTok
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Courses</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/courses" className="hover:text-[#E10600]">
                  Digital Marketing
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-[#E10600]">
                  Design
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-[#E10600]">
                  AI Skills
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/about" className="hover:text-[#E10600]">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#E10600]">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-[#E10600]">
                  Careers
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Win Academy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
