import Image from "next/image";
import Herobutton from "@/components/Herobutton";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-[100svh] md:min-h-[100vh] max-w-screen  mx-auto max-h-[100svh] md:max-h-[100vh] bg-neutral-900">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Expanded_Background.webp"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/10 md:bg-black/20" />
        <div className="absolute inset-0 bg-gray-800/20 md:bg-gray-800/20" />
      </div>

      {/* Content */}
      <div className="absolute z-10 flex left-1/2 translate-x-[-50%] top-16  flex-col lg:left-80 lg:translate-x-0 ">
        <Link href="/portfolio">
          <h1 className="text-3xl md:text-4xl font-bold text-white font-Montserrat text-nowrap">
            Yorticia
            <span className="text-white/80 text-2xl md:text-3xl">
              (Jazzil Sarinas)
            </span>
          </h1>
        </Link>
        <p className="text-gray-200 text-md text-center text-nowrap ">
          Model | Influencer | Ambassadress
        </p>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <Herobutton text="Portfolio" />
      </div>
    </div>
  );
}
