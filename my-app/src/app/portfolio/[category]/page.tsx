"use client";
import React from "react";
import { projects } from "../data";

interface CategoryPageProps {
  params: {
    category: string;
  };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const categoryProjects = projects.filter(
    (project) => project.slug === params.category
  );

  return (
    <div className="min-h-screen bg-neutral-900 py-20">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-8 capitalize">
          {params.category}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categoryProjects.map((project) => (
            <div
              key={project.slug}
              className="group relative aspect-[9/16] overflow-hidden rounded-lg"
            >
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute bottom-4 right-4 text-right">
                  <h3 className="text-white text-lg font-medium">
                    {project.title}
                  </h3>
                  <p className="text-white/80 font-serif text-sm">
                    {project.photographer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
