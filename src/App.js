import React, { useEffect, useCallback } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faGithub } from "@fortawesome/free-brands-svg-icons";

const getEthereumObject = () => window.ethereum;

export default function App() {
  const [currentAccount, setCurrentAccount] = React.useState("");
  const [userMessage, setUserMessage] = React.useState("");

  const [allWaves, setAllWaves] = React.useState([]);

  const contractAddress = "0x47E7ead63474cEad996DA6B7aCEe2657896c1c37";
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = useCallback(async () => {
    try {
      const ethereum = getEthereumObject();

      if (!ethereum) {
        console.error("Make sure you have MetaMask!");
        return null;
      }

      console.log("We have the Ethereum object", ethereum);
      const accounts = await ethereum.request({ method: "eth_accounts" });

      let chainId = await ethereum.request({ method: "eth_chainId" });
      console.log("Connected to chain " + chainId);

      const sepoliaChainId = "0xaa36a7"; // Sepolia Test network
      if (chainId !== sepoliaChainId) {
        toast.error("You are not connected to the Sepolia Test Network!");
        return;
      }

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  const connectWallet = async () => {
    try {
      const ethereum = getEthereumObject();
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach((wave) => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(Number(wave.timestamp) * 1000),
            message: wave.message,
          });
        });

        setAllWaves(wavesCleaned);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(Number(timestamp) * 1000),
          message: message,
        },
      ]);
    };

    (async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        wavePortalContract.on("NewWave", onNewWave);
      }
    })();

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, [contractABI]);

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        if (!userMessage) {
          alert("Please enter a message!");
          return;
        }

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count);

        const waveTxn = await wavePortalContract.wave(userMessage);
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="App">
      <ToastContainer />
      <section className="wavePortal py-5">
        <div className="container">
          <div className="col-lg-8 mx-lg-auto mx-3">
            <h1 className="heading">
              <span className="gradient">Decentralized</span>{" "}
              <span className="solid-blue">Dialogue</span>
            </h1>
            <div className="intro-text">
              I am <span className="solid-blue">Tanuj</span> and I am on a path
              to learn <span className="solid-red">Web3</span>!
            </div>
            <div className="intro-text py-3">
              Drop me a line on the blockchain - your words encrypted, your
              message immortalized in the digital ether. Let's chat, encrypted
              and unstoppable.
            </div>

            <textarea
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              className="message-box mb-3 p-3"
              rows="5"
              placeholder="Speak your vibe here - type it, send it, own it."
            />

            <div className="d-flex justify-content-center align-items-center">
              {currentAccount && (
                <button className="btn-style mx-3 mb-5" onClick={wave}>
                  Quantum Send
                </button>
              )}

              {!currentAccount && (
                <button className="btn-style mx-3 mb-5" onClick={connectWallet}>
                  Connect Wallet
                </button>
              )}
            </div>

            {[...allWaves].reverse().map((wave, index) => {
              return (
                <div key={index} className="message-box p-4 mb-4">
                  <div className="intro-text mb-5">{wave.message}</div>
                  <div className="time mt-1">{wave.timestamp.toString()}</div>
                  <div className="address">{wave.address}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <footer className="text-white text-center py-4">
        <div className="container">
          <div className="d-flex g-5 align-items-center justify-content-center">
            <a
              href="https://www.linkedin.com/in/tanujn45/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 text-white"
            >
              <FontAwesomeIcon icon={faLinkedin} size="lg" />
            </a>
            <a
              href="https://github.com/tanujn45"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 text-white"
            >
              <FontAwesomeIcon icon={faGithub} size="lg" />
            </a>
          </div>
          <p className="text-white">❤️ Tanuj Namdeo</p>
        </div>
      </footer>
    </div>
  );
}
