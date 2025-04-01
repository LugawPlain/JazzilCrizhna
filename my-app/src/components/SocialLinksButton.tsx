const SocialLinksButton = () => {
  return (
    <div className="fixed right-8 bottom-8 z-50">
      <a
        href="#"
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
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </a>
    </div>
  );
};

export default SocialLinksButton;
