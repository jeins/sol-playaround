'use client';

import BuyTokenViaPaypal from '@/components/BuyTokenViaPaypal';
import SendToken from '@/components/SendToken';
import Wallet from '@/components/Wallet';

export default function page() {
    return (
        <div>
            <div className="flex items-center p-5 border-b border-gray-100 justify-center">
                {/* <Wallet /> */}
                {/* <SendToken /> */}
                <BuyTokenViaPaypal />
            </div>
        </div>
    );
}
