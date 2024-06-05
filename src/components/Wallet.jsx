'use client';
import { useEffect, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';

export default function Balance() {
    const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
    const MINT_ADDRESS = process.env.MINT_ADDRESS;
    const [tableData, setTableData] = useState(null);
    const connection = new Connection(process.env.RPC_URL);

    useEffect(() => {
        getData();
    }, []);

    const getData = async () => {
        const address = new PublicKey(WALLET_ADDRESS);
        let tokenAccount = await connection.getTokenAccountBalance(address);
        let totalToken = tokenAccount.value.uiAmount;
        let transactionList =
            await connection.getConfirmedSignaturesForAddress2(address);
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
    };

    return (
        <div>
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
