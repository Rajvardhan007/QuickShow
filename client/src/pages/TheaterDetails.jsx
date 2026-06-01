import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const TheaterDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { shows } = useAppContext();

  const theaterNames = {
    1: "PVR Jaipur",
    2: "INOX Jaipur",
    3: "Cinepolis Jaipur",
  };

  return (
    <div className="px-6 md:px-16 py-10 min-h-screen">
      <h1 className="text-4xl font-bold mb-8">
        {theaterNames[id]}
      </h1>

      <h2 className="text-2xl font-semibold mb-6">
        Now Playing
      </h2>

      <div className="grid md:grid-cols-4 gap-6">
        {shows?.slice(0, 8).map((movie) => (
          <div
            key={movie._id}
            className="bg-gray-900 rounded-xl overflow-hidden cursor-pointer"
            onClick={() =>
              navigate(`/movies/${movie._id}`)
            }
          >
            <img
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              className="w-full h-72 object-cover"
            />

            <div className="p-4">
              <h3 className="font-bold">
                {movie.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TheaterDetails;