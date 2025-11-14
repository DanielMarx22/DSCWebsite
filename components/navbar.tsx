import Link from "next/link";


export const Navbar = () => {
    return (
        <nav className = "sticky top-0 z-50 bg-gray-500 shadow"> 
            {/* Sets the logo as a link to the home page*/}
            <div className = "container mx-auto flex items-center justify-between px-4 py-4"> 
                <Link href = "/" className = "hover:text-blue-500">
                Down South Corals
                </Link>

                {/* Links to the different pages in the NavBar */}
                <div className = "hidden md:flex space-x-6">
                    <Link href = "/" className = "hover:text-blue-500">
                    Home
                    </Link>

                    <Link href = "/products" className = "hover:text-blue-500">
                    Products
                    </Link>

                    <Link href = "/checkout" className = "hover:text-blue-500">
                    Checkout
                    </Link>
                </div>

                <div className = "flex items-center space-x-4"></div>

            </div>


        </nav>
    );
};
