import Image from "next/image";
import Herobutton from "@/components/Herobutton";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-neutral-900">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Expanded_Background.webp"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        {/* <Image
          src="/BACKG.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
        /> */}

        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gray-800/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col md:flex-row container lg:px-40 lg:py-10 top-15 lg:top-0 lg:left-30">
        <div className="flex flex-col md:w-fit items-center md:items-start text-center space-y">
          <Link href="/portfolio">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Yorticia
              <span className="text-white/80 text-2xl md:text-3xl">
                (Jazzil Sarinas)
              </span>
            </h1>
          </Link>
          <p className="text-gray-200 max-w-2xl text-md md:text-base text-center w-full">
            Model | Influencer | Ambasadress
          </p>
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <Herobutton text="Portfolio" />
      </div>
    </div>
  );
}
