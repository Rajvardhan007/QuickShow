import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { MenuIcon, SearchIcon, TicketPlus, XIcon } from "lucide-react";
import { useState } from "react";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { useAppContext } from "../context/AppContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { user } = useUser();
  const { openSignIn } = useClerk();

  const navigate = useNavigate();

  const { favouriteMovies, shows } = useAppContext();
  const filteredMovies = shows?.filter((movie) =>
  movie.title
    ?.toLowerCase()
    .includes(search.toLowerCase())
);

  return (
    <div className="fixed top-0 left-0 z-50 flex items-center justify-between w-full px-6 py-5 md:px-16 lg:px-36">
      <Link to="/" className="max-md:flex-1">
        <img src={assets.logo} alt="" className="h-auto w-36" />
      </Link>

      <div
        className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:font-medium max-md:text-lg z-50 flex flex-col md:flex-row items-center max-md:justify-center gap-8 min-md:px-8 py-3 max-md:h-screen min-md:rounded-full backdrop-blur bg-black/70 md:bg-white/10 md:border border-gray-300/20 overflow-hidden transition-[width] duration-300 ${
          isOpen ? "max-md:w-full" : "max-md:w-0 "
        }`}
      >
        <XIcon
          className="absolute w-6 h-6 cursor-pointer md:hidden top-6 right-6"
          onClick={() => setIsOpen(!isOpen)}
        />
        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/"
        >
          Home
        </Link>

        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/movies"
        >
          Movies
        </Link>

        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/theaters"
        >
          Theaters
        </Link>

        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/releases"
        >
          Releases
        </Link>

        {favouriteMovies.length > 0 && (
          <Link
            onClick={() => {
              scrollTo(0, 0);
              setIsOpen(false);
            }}
            to="/favourite"
          >
            Favourites
          </Link>
        )}
      </div>

      <div className="flex items-center gap-8">
        <div className="relative max-md:hidden">
  <input
    type="text"
    placeholder="Search movie..."
    value={search}
    onChange={(e) =>
      setSearch(e.target.value)
    }
    className="bg-black border border-primary/20 rounded-full px-4 py-2 text-white w-56"
  />

  {search && filteredMovies?.length > 0 && (
    <div className="absolute top-12 left-0 bg-black border border-primary/20 rounded-lg w-full z-50 max-h-60 overflow-y-auto shadow-x1">
      {filteredMovies
        .slice(0, 5)
        .map((movie) => (
          <div
            key={movie._id}
            onClick={() => {
              navigate(`/movies/${movie._id}`);
              setSearch("");
            }}
            className="p-3 cursor-pointer hover:bg-primary/20 truncate"
          >
            {movie.title}
          </div>
        ))}
    </div>
  )}
</div>
        {!user ? (
          <button
            onClick={openSignIn}
            className="px-4 py-1 font-medium transition rounded-full cursor-pointer sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull"
          >
            Login
          </button>
        ) : (
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Action
                label="My Bookings"
                labelIcon={<TicketPlus width={15} />}
                onClick={() => navigate("/my-bookings")}
              />
            </UserButton.MenuItems>
          </UserButton>
        )}
      </div>

      <MenuIcon
        className="w-8 h-8 cursor-pointer max-md:ml-4 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      />
    </div>
  );
};

export default Navbar;
