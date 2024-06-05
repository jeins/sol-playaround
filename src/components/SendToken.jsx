'use client';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCallback, useState } from 'react';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import {
    getAssociatedTokenAddress,
    createTransferInstruction,
    TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';

export default function SendToken() {
    const { publicKey, sendTransaction } = useWallet();
    const [transferBalance, setTransferBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [destinationWallet, setDestination] = useState(null);
    const connection = new Connection(process.env.RPC_URL);
    const MINT_ADDRESS = process.env.MINT_ADDRESS;

    const sendTokens = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();

        setIsLoading(true);

        //step1 get source account
        let sourceAccount = await getAssociatedTokenAddress(
            new PublicKey(MINT_ADDRESS),
            publicKey,
            false,
            TOKEN_2022_PROGRAM_ID
        );

        //step2 get destination account
        let destinationAccount = await getAssociatedTokenAddress(
            new PublicKey(MINT_ADDRESS),
            new PublicKey(destinationWallet),
            false,
            TOKEN_2022_PROGRAM_ID
        );

        //step3 fetch token decimal
        const numberDecimals = await getNumberDecimals(MINT_ADDRESS);

        //step4 create transaction
        const transaction = new Transaction().add(
            /* SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: Keypair.generate().publicKey,
                lamports,
            }) */
            createTransferInstruction(
                sourceAccount,
                destinationAccount,
                publicKey,
                transferBalance * Math.pow(10, numberDecimals),
                [],
                TOKEN_2022_PROGRAM_ID
            )
        );

        //step5 get last block hash
        const {
            context: { slot: minContextSlot },
            value: { blockhash, lastValidBlockHeight },
        } = await connection.getLatestBlockhashAndContext();

        //step6 send and confirm transaction
        const signature = await sendTransaction(transaction, connection, {
            minContextSlot,
        });
        await connection.confirmTransaction({
            blockhash,
            lastValidBlockHeight,
            signature,
        });

        console.log(signature);
        clearData();
    }, [publicKey, sendTransaction, connection]);

    const getNumberDecimals = async () => {
        const info = await connection.getParsedAccountInfo(
            new PublicKey(MINT_ADDRESS)
        );
        const result = (info.value?.data).parsed.info.decimals;
        return result;
    };

    const onChangeDestionation = (event) => setDestination(event.target.value);
    const onChangeTransferBalance = (event) =>
        setTransferBalance(event.target.value);
    const isButtonDisabled = destinationWallet == null || transferBalance <= 0;
    const clearData = () => {
        setDestination(null);
        setTransferBalance(0);
        setIsLoading(false);
    };

    return (
        <form>
            <div class="grid gap-6 mb-6 md:grid-cols-2">
                <div>
                    <label
                        for="destination_wallet"
                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                        Destination Wallet
                    </label>
                    <input
                        type="text"
                        id="destination_wallet"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder=""
                        required
                        onChange={(e) => onChangeDestionation(e)}
                    />
                </div>
                <div>
                    <label
                        for="last_name"
                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                        Token Amount
                    </label>
                    <input
                        type="number"
                        id="visitors"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder=""
                        required
                        onChange={(e) => onChangeTransferBalance(e)}
                    />
                </div>
            </div>
            {isLoading ? (
                <button
                    disabled=""
                    type="button"
                    class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded text-sm px-5 py-2.5 text-center mr-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 inline-flex items-center"
                >
                    <svg
                        aria-hidden="true"
                        role="status"
                        class="inline mr-3 w-4 h-4 text-white animate-spin"
                        viewBox="0 0 100 101"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                            fill="#E5E7EB"
                        ></path>
                        <path
                            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                            fill="currentColor"
                        ></path>
                    </svg>
                    Loading...
                </button>
            ) : (
                <button
                    disabled={isButtonDisabled}
                    onClick={sendTokens}
                    class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                    Send
                </button>
            )}
        </form>
    );
}
