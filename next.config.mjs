/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Sprites e artwork oficiais (PokeAPI)
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/PokeAPI/**',
      },

      // Sprites animados/estaticos do dex Showdown (via @pkmn/img, populados
      // pelo worker scripts/sync/showdown.ts)
      {
        protocol: 'https',
        hostname: 'play.pokemonshowdown.com',
        pathname: '/sprites/**',
      },

      // CDN próprio
      {
        protocol: 'https',
        hostname: 'cdn.metaforge.gg',
        pathname: '/**',
      },

      // Discord avatars
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '/**',
      },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;