import { useNavigate } from "react-router-dom";
import BlurCircle from "../components/BlurCircle";
const theaters = [
  {
    id: 1,
    name: "PVR Jaipur",
    city: "Jaipur",
    seats: 250,
    facility: "IMAX",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba"
  },
  {
    id: 2,
    name: "INOX Jaipur",
    city: "Jaipur",
    seats: 300,
    facility: "Dolby Atmos",
    image:
      "https://images.unsplash.com/photo-1513106580091-1d82408b8cd6"
  },
  {
    id: 3,
    name: "Cinepolis Jaipur",
    city: "Jaipur",
    seats: 120,
    facility: "4DX Cinema",
    image:
     "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c"
  }
];

const Theaters = () => {
    const navigate = useNavigate();
  return (
    <div className="relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]">
      <BlurCircle top="150px" left="0px" />
      <BlurCircle bottom="50px" right="50px" />
      <h1 className="text-4xl font-bold mb-8">
        Theaters Near You
      </h1>

      <div className="grid md:grid-cols-3 gap-8">
        {theaters.map((theater) => (
          <div
    key={theater.id}
    onClick={() => navigate(`/theater/${theater.id}`)}
    className="bg-gray-900 rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition"
>
            <img
              src={theater.image}
              alt={theater.name}
              className="w-full h-60 object-cover"
            />

            <div className="p-4">
              <h2 className="text-xl font-bold">
                {theater.name}
              </h2>

              <p>{theater.city}</p>

              <p>Seats: {theater.seats}</p>

              <p>{theater.facility}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Theaters;