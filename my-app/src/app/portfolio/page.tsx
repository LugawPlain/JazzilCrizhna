import React from "react";

export default function Portfolio() {
  const projects = [
    {
      title: "Project 1",
      description: "Description of project 1",
      image: "/project1.jpg",
      technologies: ["React", "Next.js", "TailwindCSS"],
      link: "#",
    },
    {
      title: "Project 2",
      description: "Description of project 2",
      image: "/project2.jpg",
      technologies: ["TypeScript", "Node.js", "MongoDB"],
      link: "#",
    },
    // Add more projects as needed
  ];

  return (
    <main className="min-h-screen p-8 md:p-24">
      <h1 className="text-4xl font-bold mb-8 text-center">My Portfolio</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm p-6 hover:bg-white/20 transition-all duration-300"
          >
            {/* Project Image */}
            <div className="relative h-48 mb-4 overflow-hidden rounded-lg">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${project.image})` }}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Project Details */}
            <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
            <p className="text-gray-300 mb-4">{project.description}</p>

            {/* Technologies */}
            <div className="flex flex-wrap gap-2 mb-4">
              {project.technologies.map((tech, techIndex) => (
                <span
                  key={techIndex}
                  className="px-3 py-1 text-sm rounded-full bg-white/5 hover:bg-white/10 transition-colors duration-300"
                >
                  {tech}
                </span>
              ))}
            </div>

            {/* View Project Link */}
            <a
              href={project.link}
              className="inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors duration-300"
            >
              View Project
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}
