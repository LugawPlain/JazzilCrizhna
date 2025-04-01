import Image from "next/image";
import Herobutton from "@/components/Herobutton";
import SocialLinksButton from "@/components/SocialLinksButton";
import TiktokIcon from "@/components/icons/TiktokIcon";

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
        <div className="absolute inset-0 bg-gray-800/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-row container ">
        <div className="flex flex-col relative items-center left-80 top-8 text-center space-y">
          <h1 className="text-3xl font-bold text-white">
            Yorticia{" "}
            <span className="text-white/80 text-2xl">(Jazzil Sarinas)</span>
          </h1>
          <p className=" text-gray-200 max-w-2xl">
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
