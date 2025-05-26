module.exports = {
  siteUrl: "https://www.yorticia.com", // TODO: Replace with your actual domain
  generateRobotsTxt: true,
  exclude: ["/admin/*", "/calendar/test"], // Exclude admin and test pages from sitemap
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/admin", "/admin/*", "/calendar/test"] },
    ],
  },
  // Optionally, you can add additionalPaths for dynamic routes if you have a list of categories
  // additionalPaths: async (config) => [
  //   await config.transform(config, '/portfolio/category1'),
  //   await config.transform(config, '/portfolio/category2'),
  // ],
};
