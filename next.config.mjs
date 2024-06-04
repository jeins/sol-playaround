/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        WALLET_ADDRESS: process.env.WALLET_ADDRESS,
        MINT_ADDRESS: process.env.MINT_ADDRESS,
        RPC_URL: process.env.RPC_URL,
    }
};

export default nextConfig;
