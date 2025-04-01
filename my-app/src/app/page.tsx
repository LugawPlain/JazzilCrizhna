import Image from "next/image";

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Expanded_Background.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Fixed Contact Icon */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-50">
        <a
          href="mailto:contact@example.com"
          className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all duration-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </a>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="flex flex-col items-center text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white">
            Yorticia{" "}
            <span className="text-white/80 text-4xl">(Jazzil Sarinas)</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 max-w-2xl">
            Model | Influencer | Ambasadress
          </p>
        </div>
      </div>
      {/* <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute text-white font-bold text-5xl sm:text-6xl md:text-7xl">
          <span className="border-t-4 border-l-4 absolute -top-5 -left-5 w-8 h-8"></span>
          <span className="border-b-4 border-r-4 absolute bottom-0 right-0 w-8 h-8"></span>
          Modeling
        </div>
      </div> */}
      <div className="relative w-full h-full flex items-center mt-8 justify-center">
        <svg
          className="absolute"
          width="200"
          height="200"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 100 L0 0 L100 0"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            strokeOpacity="0.5"
            fill="none"
          />
          <path
            d="M200 100 L200 200 L100 200"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            strokeOpacity="0.5"
            fill="none"
          />
        </svg>
        <span>
          <p
            className="text-white text-4xl font-normal"
            style={{ fontFamily: "acumin-pro-regular, sans-serif" }}
          >
            Modeling
          </p>
        </span>
      </div>
    </div>
  );
}
