/** @type {import('next').NextConfig} */
const nextConfig = {
    // Keep strict mode enabled to catch potential side effects early.
    reactStrictMode: true,
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
