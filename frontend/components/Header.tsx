import Link from "next/link"

export default function Header() {
    return (
        <header className="bg-white text-gray-800">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-green-600">AccuRate</span>
                </Link>
                <nav>
                    <ul className="flex space-x-4">
                        <li>
                            <Link href="/" className="hover:text-green-600 transition-colors">
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link href="/about" className="hover:text-green-600 transition-colors">
                                About
                            </Link>
                        </li>
                        <li>
                            <Link href="/contact" className="hover:text-green-600 transition-colors">
                                Contact
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    )
}