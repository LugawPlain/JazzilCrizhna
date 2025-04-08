import Image from "next/image";
import { CategoryData } from "../CategoryData";

interface ProjectCardProps {
  project: CategoryData;
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
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <Image
          src={project.image}
          alt={project.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transform transition-transform duration-700 group-hover:scale-110"
          priority={false}
        />

        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute -left-10 -rotate-90 top-1/2 -translate-y-1/2  origin-center">
            <span className="text-white/60 tracking-widest text-sm">
              VIEW PROJECT
            </span>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-2xl tracking-wider transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
              {project.category}
            </span>
          </div>

          <div className="absolute bottom-4 right-4 text-right">
            <h3 className="text-white text-lg font-medium transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
              {project.title}
            </h3>
            <p className="text-white/80 font-serif text-sm transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-200">
              {project.photographer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
