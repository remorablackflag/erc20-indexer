import {
    Box,
    Button,
    Center,
    Flex,
    Heading,
    Image,
    Input,
    SimpleGrid,
    Text,
} from '@chakra-ui/react';
import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

function App() {
    const [inputAddress, setInputAddress] = useState('');
    const [userAddress, setUserAddress] = useState('');
    const [network, setNetwork] = useState();
    const [results, setResults] = useState([]);
    const [hasQueried, setHasQueried] = useState(false);
    const [tokenDataObjects, setTokenDataObjects] = useState([]);
    const [providerListener, setProviderListener] = useState();
    const [windowListener, setWindowListener] = useState();

    function accountsChanged(newAddresses) {
        setUserAddress(newAddresses[0]);
        setResults([]);
    }

    async function connectWallet() {
        const accounts = await provider.send('eth_requestAccounts', []);
        const listener1 = await provider.on("network", setNetwork);
        const listener2 = await window.ethereum.on("accountsChanged", accountsChanged);
        setProviderListener(listener1);
        setWindowListener(listener2);
        setUserAddress(accounts[0]);
    }

    async function disconnectWallet() {
        await providerListener.off("network");
        await windowListener.off("accountsChanged", accountsChanged);
        setUserAddress("");
        setResults("");
    }

    async function getTokenBalance(e) {
        e.preventDefault();
        if(
            (!inputAddress && !userAddress)
            || hasQueried
        ) {
            return;
        }

        const resolvedAddress = await provider.resolveName(inputAddress);

        if (
            inputAddress
            && !ethers.utils.isAddress(resolvedAddress)
        ) {
            window.alert("Invalid address");
            return;
        }

        setHasQueried(true);
        setResults([]);

        const config = {
            apiKey: 'uuphKlEYWdIVXPP0JTsfpX9PTPN1Wu12',
            network: Network.ETH_MAINNET,
        };

        const alchemy = new Alchemy(config);
        try {
            const data = await alchemy.core.getTokenBalances(inputAddress || userAddress);

            const tokenDataPromises = [];
            for (let i = 0; i < data.tokenBalances.length; i++) {
                const tokenData = alchemy.core.getTokenMetadata(
                    data.tokenBalances[i].contractAddress
                );
                tokenDataPromises.push(tokenData);
            }

            const dataObjects = await Promise.all(tokenDataPromises)

            setTokenDataObjects(dataObjects);

            setHasQueried(false);

            setResults(data);
        } catch(err) {
            setHasQueried(false);
            window.alert("Query failed");
            throw err;
        }
    }

    return (
        <Box w="100vw">
            <Center>
                <Flex
                    alignItems={'center'}
                    justifyContent="center"
                    flexDirection={'column'}
                >
                    <Heading mb={0} fontSize={36}>
                        ERC-20 Token Indexer
                    </Heading>
                    <Text>
                        Connect a wallet, or plug in an address and this website will return all of its ERC-20
                        token balances!
                    </Text>
                </Flex>
            </Center>
            <Flex
                w="100%"
                flexDirection="column"
                alignItems="center"
                justifyContent={'center'}
            >
                <Heading mt={42}>
                    Get all the ERC-20 token balances of this address:
                </Heading>
                {!userAddress
                    ? <Button fontSize={20} onClick={connectWallet} mt={36} bgColor="blue">
                        Connect
                    </Button>
                    : <Button fontSize={20} onClick={disconnectWallet} mt={36} bgColor="blue">
                        Disconnect
                    </Button>}
                <Text>- OR -</Text>
                <Input
                    onChange={(e) => setInputAddress(e.target.value)}
                    color="black"
                    w="600px"
                    textAlign="center"
                    p={4}
                    bgColor="white"
                    fontSize={24}
                />
                <Button fontSize={20} onClick={getTokenBalance} mt={36} bgColor="blue">
                    Check ERC-20 Token Balances
                </Button>

                <Heading my={36}>ERC-20 token balances of {inputAddress || userAddress || "?"} ({results.tokenBalances && results.tokenBalances.length}):</Heading>
                {hasQueried
                    ? <Text>Loading ... (This may take a few seconds.)</Text>
                    : <Text>Please make a query!</Text>}
                {(results.tokenBalances && results.tokenBalances.length)
                    ? (<SimpleGrid w={'90vw'} columns={8} spacing={24}>
                        {results.tokenBalances.map((e, i) => (
                                    <Flex
                                        flexDir={'column'}
                                        color="white"
                                        bg="blue"
                                        w={'10vw'}
                                        key={e.id}
                                    >
                                        <Box h={'3.5vw'}>
                                            {tokenDataObjects[i].logo
                                                ? <Image src={tokenDataObjects[i].logo} h={'3.5vw'} />
                                                : "-no logo-"}
                                        </Box>
                                        <Box>
                                            <b>Symbol:</b> ${tokenDataObjects[i].symbol}&nbsp;
                                        </Box>
                                        <Box>
                                            <b>Balance:</b>&nbsp;
                                            {parseFloat(
                                                Utils.formatUnits(
                                                    e.tokenBalance,
                                                    tokenDataObjects[i].decimals
                                                )
                                            ).toLocaleString(navigator.languages[0] || "en-US", { maximumFractionDigits: 10, minimumFractionDigits: 2 })}
                                        </Box>
                                    </Flex>)
                            )}
                        </SimpleGrid>)
                        : ""}
            </Flex>
        </Box>
    );
}

export default App;
