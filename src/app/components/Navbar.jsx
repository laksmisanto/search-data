import React from 'react'

const Navbar = () => {
  return (
    <>
      <div className="w-full h-auto py-1  bg-secondary">
        <nav className="container mx-auto">
          <ul className="flex justify-end space-x-8">
            <p className="text-sm text-white">
              <span>Author : </span>
              <a
                href="https://ls-santo-portfolio.vercel.app/"
                target="blank"
                className="font-medium text-400 underline hover:text-accent"
              >
                ls_santo
              </a>
            </p>
            <p className="text-sm text-white">laksmisanto1998@gmail.com</p>
            <p className="text-sm text-white">01826746761 || 01793940504</p>
          </ul>
        </nav>
      </div>
    </>
  )
}

export default Navbar
