'use client';
import { useCallback, useState } from 'react';
import {
    getAssociatedTokenAddress,
    TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';
import LoadingButton from './LoadingButton';

export default function Wallet() {
    const [isLoading, setIsLoading] = useState(false);
    const [wallet, setWallet] = useState(null);
    const [tableData, setTableData] = useState(null);
    const MINT_ADDRESS = process.env.MINT_ADDRESS;
    const connection = new Connection(process.env.RPC_URL);

    const getData = useCallback(async () => {
        setIsLoading(true);

        const walletAccount = await getWalletAccount();

        let tokenAccount = await connection.getTokenAccountBalance(
            walletAccount
        );
        let totalToken = tokenAccount.value.uiAmount;
        let transactionList =
            await connection.getConfirmedSignaturesForAddress2(walletAccount);
        let signatureList = transactionList.map(
            (transaction) => transaction.signature
        );
        let transactionDetails = await connection.getParsedTransactions(
            signatureList,
            { maxSupportedTransactionVersion: 0 }
        );
        let data = {};

        transactionList.forEach((transaction, i) => {
            if (transaction.err == null) {
                const transactionInstructions =
                    transactionDetails[i].transaction.message.instructions;
                transactionInstructions.forEach((instruction, n) => {
                    if (instruction.program == 'spl-token') {
                        const { source, amount, tokenAmount } =
                            instruction.parsed.info;
                        let amnt = data[source] ? data[source].amount : 0;

                        if (amount) {
                            amnt += Number(amount) / 10;
                        } else {
                            amnt += Number(tokenAmount.amount) / 10;
                        }
                        const percentage = ((amnt / totalToken) * 100).toFixed(
                            2
                        );

                        data[source] = {
                            amount: amnt,
                            percentage,
                        };
                    }
                });
            }
        });

        setTableData(data);
        setIsLoading(false);
    });

    const getWalletAccount = async () => {
        const sourceAccount = await getAssociatedTokenAddress(
            new PublicKey(MINT_ADDRESS),
            new PublicKey(wallet),
            false,
            TOKEN_2022_PROGRAM_ID
        );

        return sourceAccount;
    };

    const onChangeWallet = (e) => setWallet(e.target.value);

    return (
        <div>
            <div>
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
                            onChange={(e) => onChangeWallet(e)}
                        />
                    </div>
                </div>
                <LoadingButton isLoading={isLoading}>
                    {' '}
                    <button
                        onClick={getData}
                        class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    >
                        Send
                    </button>
                </LoadingButton>
            </div>
            <table class="table-auto">
                <thead>
                    <tr>
                        <th>Source</th>
                        <th>Amount</th>
                        <th>%</th>
                    </tr>
                </thead>
                <tbody>
                    {tableData
                        ? Object.keys(tableData).map((source) => (
                              <tr>
                                  <td>{source}</td>
                                  <td>{tableData[source].amount}</td>
                                  <td>{tableData[source].percentage}</td>
                              </tr>
                          ))
                        : ''}
                </tbody>
            </table>
        </div>
    );
}
