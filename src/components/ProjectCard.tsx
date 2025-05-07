import Image from "next/image";

// Define the props based on actual usage and data being passed
interface ProjectCardProps {
  project: {
    category: string;
    title: string;
    image: string; // Expecting the image URL directly
    link?: string; // Link might be optional based on HorizontalScrollCarousel usage
    photographer?: string;
    photographerlink?: string; // Lowercase 'l' as used in the component
  };
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  return (
    <div
      className="group relative flex-shrink-0 cursor-pointer"
      style={{
        width: "min(375px, 80vw)",
        aspectRatio: "9/16",
      }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-lg ">
        <Image
          src={project.image}
          alt={project.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transform transition-transform duration-700 md:group-hover:scale-110"
          priority={false}
        />

        {/* Gradient Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-black/70 to-transparent pointer-events-none md:hidden"></div>

        <div className="absolute font-montserrat inset-0 bg-transparent md:bg-black/60 md:opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute -left-10 -rotate-90 top-1/2 -translate-y-1/2 origin-center hidden md:block">
            <span className="text-white/60 tracking-widest text-sm">
              VIEW PROJECT
            </span>
          </div>

          <div className="absolute hidden md:flex inset-0  items-center justify-center">
            <span className="text-white font-bold text-xl tracking-wider md:text-2xl md:translate-y-8 md:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
              {project.category}
            </span>
          </div>

          <div className="absolute bottom-0 right-0 text-right">
            <h3 className="text-white md:hidden text-base font-medium md:text-lg md:translate-y-4 md:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 md:delay-100">
              {project.title}
            </h3>
            <p className="text-white/80 font-serif text-xs md:text-sm md:translate-y-4 md:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 md:delay-200">
              {project.photographerlink !== "#" ? (
                <span
                  className="pointer-events-auto p-5 inline-block"
                  onClick={(e) => {
                    console.log("Photographer link clicked!");
                    e.nativeEvent.stopImmediatePropagation();
                    window.open(
                      project.photographerlink,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                >
                  📸
                  <span className="underline cursor-pointer">
                    {project.photographer}
                  </span>
                </span>
              ) : (
                <span className="p-5 inline-block">{project.photographer}</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
