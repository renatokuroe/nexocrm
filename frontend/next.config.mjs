/** @type {import('next').NextConfig} */
const nextConfig = {
    // Keep strict mode enabled to catch potential side effects early.
    reactStrictMode: true,
    async rewrites() {
        if (process.env.NODE_ENV !== "development") {
            return [];
        }

        return [
            {
                source: "/api/:path*",
                destination: "http://localhost:3001/api/:path*",
            },
        ];
    },
    async headers() {
        return [
            {
                source: "/((?!_next/static|_next/image|favicon.ico).*)",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "no-store, no-cache, must-revalidate, max-age=0",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
