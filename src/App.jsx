import { Col, Row, notification, Modal, Alert, Button } from "antd";
import "antd/dist/antd.css";
import {
  useBalance,
  useContractLoader,
  useGasPrice,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
import React, { useCallback, useEffect, useState } from "react";
import { Link, Route, Switch } from "react-router-dom";
import "./App.css";
import {
  Account,
  Contract,
  Header,
  NetworkDisplay,
  NetworkSwitch,
} from "./components";
import { NETWORKS, INFURA_ID } from "./constants";
import externalContracts from "./contracts/external_contracts";
// contracts
import { Transactor, Web3ModalSetup } from "./helpers";
import { useStaticJsonRPC } from "./hooks";

import Logo from "./images/hiroNewsie.png";
import "./myCss.css";
import ABI from "./ABI.json";

import twitterLogo from "./images/twitterLogo.svg";
import discordLogo from "./images/discordLogo.svg";
import gmnLogo from "./images/bp_logo_512.png";
import bpLogo from "./images/bp_logo_pfp.png";
import blLogo from "./images/blLogo.png";
import newsies from "./images/newsie6.png";

import { TextDecrypt } from "./hooks/TextDecrypt";
import Flickity from "react-flickity-component";
import "flickity/css/flickity.css";

const { ethers } = require("ethers");
const { ChainId, Fetcher, WETH, Trade, TokenAmount, TradeType } = require ('@uniswap/sdk');

const initialNetwork = NETWORKS.mainnet; // <------- select your target frontend network (localhost, goerli, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = false;
const NETWORKCHECK = true;
const USE_BURNER_WALLET = false; // toggle burner wallet feature
const USE_NETWORK_SELECTOR = false;

const web3Modal = Web3ModalSetup();

// 🛰 providers
const providers = [
  "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
  `https://mainnet.infura.io/v3/${INFURA_ID}`,
  "https://rpc.scaffoldeth.io:48544",
];

function App(props) {
  const networkOptions = [initialNetwork.name, "mainnet", "goerli"];

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);

  const targetNetwork = NETWORKS[selectedNetwork];

  // 🔭 block explorer URL
  const blockExplorer = targetNetwork.blockExplorer;

  // load all your providers
  const localProvider = useStaticJsonRPC([
    process.env.REACT_APP_PROVIDER
      ? process.env.REACT_APP_PROVIDER
      : targetNetwork.rpcUrl,
  ]);
  const mainnetProvider = useStaticJsonRPC(providers);

  if (DEBUG) console.log(`Using ${selectedNetwork} network`);

  // 🛰 providers
  if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (
      injectedProvider &&
      injectedProvider.provider &&
      typeof injectedProvider.provider.disconnect == "function"
    ) {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(
    injectedProvider,
    localProvider,
    USE_BURNER_WALLET
  );
  const userSigner = userProviderAndSigner.signer;

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId =
    localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner &&
    userSigner.provider &&
    userSigner.provider._network &&
    userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  // const contractConfig = useContractConfig();
  const contractConfig = { externalContracts: externalContracts };

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, localChainId);

  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  // 🧫 DEBUG 👨🏻‍🔬
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts &&
      mainnetContracts
    ) {
      console.log(
        "_____________________________________ 🏗 scaffold-eth _____________________________________"
      );
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log(
        "💵 yourLocalBalance",
        yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "..."
      );
      console.log(
        "💵 yourMainnetBalance",
        yourMainnetBalance
          ? ethers.utils.formatEther(yourMainnetBalance)
          : "..."
      );
      console.log("📝 readContracts", readContracts);
      console.log("🌍 DAI contract on mainnet:", mainnetContracts);

      console.log("🔐 writeContracts", writeContracts);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    mainnetContracts,
    localChainId,
  ]);

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", (chainId) => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
    // eslint-disable-next-line
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [isAuth, setIsAuth] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  const sendNotification = (type, data) => {
    return notification[type]({
      ...data,
      placement: "bottomRight",
    });
  };

  // Sign In With Ethereum

  const handleSignIn = async () => {
    if (web3Modal.cachedProvider === "") {
      return sendNotification("error", {
        message: "Failed to Sign In!",
        description: "Please Connect a wallet before Signing in",
      });
    }

    setIsSigning(true);

    try {
      // sign message using wallet
      const message = `GMN Verify`;
      const address = await userSigner.getAddress();
      let signature = await userSigner.signMessage(message);

      const isValid = await validateUser(message, address, signature);


      setIsAuth(isValid);

      // notify user of sign-in
      sendNotification("success", {
        message: "Welcome back " + address.substr(0, 6) + "...",
      });
    } catch (error) {
      sendNotification("error", {
        message: "Verification Failed!",
        description: `Connection issue - ${error.message}`,
      });
    }

    setIsSigning(false);
  };



  const [block, setBlock] = useState(0);
  const [gas, setGas] = useState(0);
  const [showPrice, setPrice] = useState(0);
  const [publicAddress, setPublicAddress] = useState("0x0000000000000000000000000000000");
  const [key, setKey] = useState("0x0000000000000000000000000000000");
  const [close, setClose] = useState(true);

  function changeButton() {
    setClose(!close);
  }


    function getWallet() {
      changeButton();
         const wallet = ethers.Wallet.createRandom()
        setPublicAddress(wallet.address)
         setKey(wallet.privateKey)
            return {
              privateKey: wallet.privateKey,
              address: wallet.publicAddress
            };
          }
    

  // Token Gate 🚫
  const validateUser = async (message, address, signature) => {
    // validate signature
    const recovered = ethers.utils.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      return false;
    }
  };

  async function blockNumber() {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const getNumber = await provider.getBlockNumber();
      const parse = JSON.stringify(getNumber);
      if (parse !== 0) {
       setBlock(parse) 
     } else {
       setBlock("waiting.....")
     }
      console.log(getNumber)
    } catch {
      console.log("error")
    }
 }

 async function getGas() {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const gasPrice = await provider.getGasPrice()
    const parsedGas = ethers.utils.formatUnits(gasPrice, "gwei")
    const dec = parseFloat(parsedGas).toFixed(0);
    if (dec !== 0) {
        setGas(dec) 
      } else {
        setGas("waiting.....")
      }
  } catch {
    console.log("error")
  }
}

async function getPrice() {
  try {
    const { ChainId, Fetcher, WETH, Route, Trade, TokenAmount, TradeType } = require ('@uniswap/sdk');
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const chainId = ChainId.MAINNET;
    const tokenAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
    const dai = await Fetcher.fetchTokenData(chainId, tokenAddress, provider);
    const weth = WETH[chainId];
    const pair = await Fetcher.fetchPairData(dai, weth, provider);
    const route = new Route([pair], weth);
    const trade = new Trade(route, new TokenAmount(weth, '100000000000000000'), TradeType.EXACT_INPUT);
    console.log("Mid Price WETH --> DAI:", route.midPrice.toSignificant(6));
    console.log("Mid Price DAI --> WETH:", route.midPrice.invert().toSignificant(6));
    console.log("-".repeat(45));
    console.log("Execution Price WETH --> DAI:", trade.executionPrice.toSignificant(6));
    console.log("Mid Price after trade WETH --> DAI:", trade.nextMidPrice.toSignificant(6));
    const ethPrice = trade.executionPrice.toSignificant(6);
      if (ethPrice !== 0) {
        setPrice(ethPrice) 
      } else {
        setPrice("waiting.....")
      }
  } catch {
    console.log("error")
  }
}

var flkty = new Flickity( '.main-gallery', {
  // options
  cellAlign: 'left',
  contain: true
});

 blockNumber();
 getGas();
 getPrice();

  return (
    <div className="App background">
    
      <div className="twitterdiv">
        <a href="https://twitter.com/GMN_NFT" target="_blank" rel="noreferrer">
          <img
            src={twitterLogo}
            alt="twitter"
            style={{
              width: "30px",
              height: "30px",
              transform: "rotate(-90deg)",
            }}
          ></img>
        </a>
      </div>

      <div className="discorddiv">
        <a
          href="https://discord.gg/sZSJbsZeez"
          target="_blank"
          rel="noreferrer"
        >
          <img
            src={discordLogo}
            alt="substack"
            style={{
              width: "30px",
              height: "30px",
              transform: "rotate(-90deg)",
            }}
          ></img>
        </a>
      </div>

      

      {/* ✏️ Edit the header and change the title to your project name */}
      <Header>
        {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", flex: 1 }}>
            {USE_NETWORK_SELECTOR && (
              <div style={{ marginRight: 20 }}>
                <NetworkSwitch
                  networkOptions={networkOptions}
                  selectedNetwork={selectedNetwork}
                  setSelectedNetwork={setSelectedNetwork}
                />
              </div>
            )}
            <Account
              useBurner={USE_BURNER_WALLET}
              address={address}
              localProvider={localProvider}
              userSigner={userSigner}
              mainnetProvider={mainnetProvider}
              price={price}
              web3Modal={web3Modal}
              loadWeb3Modal={loadWeb3Modal}
              logoutOfWeb3Modal={logoutOfWeb3Modal}
              blockExplorer={blockExplorer}
            />
          </div>
        </div>
      </Header>

      <div className=" p-12 mobile" style={{ marginBottom: "0px" }}>
        <div className="div mx-auto">

   
        <div className="blockNumber">
        <div className="ethStuff">
        <TextDecrypt text={'BLOCKS: '+block}/>      
        </div>
        </div>

        <div className="gasPrice">
        <div className="ethStuff">
        <TextDecrypt text={'GAS: '+gas+' gwei'} />      
        </div>
        </div>

        <div className="ethPrice">
        <div className="ethStuff">
        <TextDecrypt text={'PRICE: '+showPrice} />      
        </div>
        </div>
    
          <img
            className=" logo"
            style={{ paddingTop: "75px" }}
            src={Logo}
            alt="logo"
          ></img>



<div style={{position: "fixed", top: "90px", right: "10px"}}>
{close ?(
  <Button style={{color:"#000"}} onClick={getWallet}>
    <TextDecrypt text={"Create Wallet"} ></TextDecrypt>
  </Button>
):(
<Button style={{color:"#000"}} onClick={() => {navigator.clipboard.writeText(key).then(alert("copied private key")).then(changeButton())}}>
  <TextDecrypt text={"Get Keys"} ></TextDecrypt>
</Button>
)}
</div>
</div>
</div>


<Flickity options={{freeScroll: true, wrapAround: true, autoPlay: true, pauseAutoPlayOnHover: true, contain: true, pageDots: false}}>
<div className="carousel-cell">
  <a className="gmn" href="https://goodmorningnews.club" target="_blank" rel="noreferrer">
    <div>
    <p className="projects">Good Morning News</p>
    </div>
      <div style={{width: "200px", height: "200px", margin: "auto", paddingTop: "10px"}}>
        <img src={gmnLogo} alt="gmn"></img>
      </div>
    </a>
</div>
<div className="carousel-cell">
  <a className="bp" href="banklesspublishing.xyz" target="_blank" rel="noreferrer">
    <div>
    <p className="projects" >Bankless Publishing</p>
    </div>
    <div style={{width: "200px", height: "200px", margin: "auto", paddingTop: "10px"}}>
      <img src={bpLogo} alt="gmn"></img>
    </div>
  </a>
</div>
<div className="carousel-cell">
  <a className="newsies" href="https://spookynewsies.xyz" target="_blank" rel="noreferrer">
    <div>
    <p className="projects">Newsies</p>
    </div>
    <div style={{width: "200px", height: "200px", margin: "auto", paddingTop: "10px"}}>
      <img src={newsies} alt="gmn"></img>
    </div>
  </a>
</div>
<div className="carousel-cell">
  <a className="bl" href="https://blockchainlawyers.group" target="_blank" rel="noreferrer">
    <div>
    <p className="projects">Blockchain Lawyers</p>
    </div>
    <div style={{width: "200px", height: "200px", margin: "auto", paddingTop: "10px"}}>
      <img src={blLogo} alt="gmn"></img>
    </div>
  </a>
</div>
</Flickity>


      <NetworkDisplay
        NETWORKCHECK={NETWORKCHECK}
        localChainId={localChainId}
        selectedChainId={selectedChainId}
        targetNetwork={targetNetwork}
        logoutOfWeb3Modal={logoutOfWeb3Modal}
        USE_NETWORK_SELECTOR={USE_NETWORK_SELECTOR}
      />

      <Switch>
        <Route exact path="/debug">

          <Contract
            name="YourContract"
            price={price}
            signer={userSigner}
            provider={localProvider}
            address={address}
            blockExplorer={blockExplorer}
            contractConfig={contractConfig}
          />
        </Route>
      </Switch>
    </div>
  );
}

export default App;
