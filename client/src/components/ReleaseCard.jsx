import { useNavigate } from "react-router-dom";
const ReleaseCard = ({ movie }) => {
const navigate = useNavigate();    
  return (
    
    <div
  onClick={() => {
    navigate(`/movies/${movie.id}`);
    window.scrollTo(0, 0);
  }}
  className="w-60 bg-gray-800 rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 transition duration-300"
>
      <img
        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
        alt={movie.title}
        className="w-full h-80 object-cover object-right-bottom rounded-lg"
      />

      <div className="p-4">
        <h2 className="mt-2 font-semibold truncate">
          {movie.title}
        </h2>

        <p className="text-gray-400 text-sm mt-2">
          Release: {movie.release_date}
        </p>
      </div>
    </div>
  );
};

export default ReleaseCard;