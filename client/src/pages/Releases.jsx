import { useEffect, useState } from "react";
import BlurCircle from "../components/BlurCircle";
import ReleaseCard from "../components/ReleaseCard";

const Releases = () => {
  const [movies, setMovies] = useState([]);

  const fetchUpcomingMovies = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/show/upcoming"
      );

      const data = await response.json();

      if (data.success) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of today

        const upcomingMovies = data.movies
          .filter((movie) => {
            const releaseDate = new Date(movie.release_date);
            return releaseDate >= today; // Only include movies with future or today's release date
          })
          .map((movie) => ({
            ...movie,
            genres: movie.genre_ids || [],
          }));

        setMovies(upcomingMovies);
      }
    } catch (error) {
      console.error("Error fetching upcoming movies:", error);
    }
  };

  useEffect(() => {
    fetchUpcomingMovies();
  }, []);

  return (
    <div className="relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]">
      <BlurCircle top="150px" left="0px" />
      <BlurCircle bottom="50px" right="50px" />
      <h1 className="text-3xl font-bold mb-8">
        Upcoming Releases
      </h1>

      <div className="flex flex-wrap gap-8 max-sm:justify-center">
        {movies.map((movie) => (
          <ReleaseCard
            key={movie.id}
            movie={movie}
          />
        ))}
      </div>
    </div>
  );
};

export default Releases;