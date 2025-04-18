This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Jazzil Crizhna Portfolio

## Deployment to Cloudflare Pages

This project is optimized for Cloudflare Pages deployment, which provides excellent performance and handling of GitHub LFS assets.

### Setup and Deployment

1. **Install Wrangler CLI**

   ```bash
   npm install -g wrangler
   ```

2. **Authenticate with Cloudflare**

   ```bash
   wrangler login
   ```

3. **Local Development**

   ```bash
   npm run dev
   ```

4. **Build for Production**

   ```bash
   npm run build
   ```

5. **Deploy to Cloudflare Pages**

   ```bash
   npm run cloudflare:deploy
   ```

   Or manually:

   ```bash
   wrangler pages publish .next --project-name=my-app
   ```

### LFS Image Optimization

This project uses GitHub LFS for image storage. The setup is optimized for Cloudflare Pages with the following features:

- WebP image format for best compression
- Optimized caching through Cloudflare Workers
- Progressive loading with blur placeholders
- Responsive images with proper sizing

### Environment Variables

Create a `.env.local` file with the following variables for local development:

```
# API Keys and secrets here
```

For production, set these variables in the Cloudflare Pages dashboard.

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server locally
- `npm run update-images` - Update image metadata
- `npm run cloudflare:deploy` - Deploy to Cloudflare Pages

## GitHub LFS Setup

This project uses Git LFS for tracking large files:

```bash
git lfs track "*.webp"
```
