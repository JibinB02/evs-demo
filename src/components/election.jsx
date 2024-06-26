import React, { useState, useEffect } from 'react';
import instance from "../../ethereum/election_creation";
import web3 from "../../ethereum/web3.js";
import supabase from "../../supaBase";
import ballot from '../../ethereum/ballot'

const StartElection = () => {
    const [electionAddresses, setElectionAddresses] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [showNotifyPopup, setShowNotifyPopup] = useState(false);
    const [countdown, setCountdown] = useState(1 * 10); // countdown in seconds

    const startElection = async(event) => {
        event.preventDefault();
        setShowPopup(true);
        try {
            const electionAddresses = await instance.methods.getDeployedBallots().call();
            setElectionAddresses(electionAddresses);
            console.log(electionAddresses)
            const ballotAddresses = []
            for (const address of electionAddresses) {
                const balloAddress = await ballot(address);
                ballotAddresses.push(balloAddress)
            }
            for (const addresses of ballotAddresses) {
                const accounts = await web3.eth.getAccounts();
                const start = await addresses.methods.electionStarted().call()
                console.log(addresses)
                const owner = await addresses.methods.manager().call()
                if(owner==accounts[0]&&start==false) {
                    await addresses.methods.startVoting(5).send({
                        from: owner
                    })
                    const start = await addresses.methods.electionStarted().call()
                    console.log(start)
                }
                else {
                    console.log("Election already started or only owner can start voting")
                }
            }
        } catch (error) {
            console.log(error)
        }
        let timer = setInterval(() => {
            setCountdown(prevCountdown => {
                if (prevCountdown <= 1) {
                    clearInterval(timer);
                    console.log("Election started");
                    return 0;
                } else {
                    return prevCountdown - 1;
                }
            });
        }, 1000); // update every second
    }

    const notifyVoters = () => {
        console.log("Voters notified");
        setShowNotifyPopup(true);
    }

    const closePopup = () => {
        setShowPopup(false);
        setShowNotifyPopup(false);
        setCountdown(1 * 10); // reset countdown
    }

    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;

    return (
        <div className={`flex flex-col items-center justify-center min-h-screen bg-custom-gray text-white p-4 ${showPopup ? 'backdrop-blur-md' : ''}`}>
            <header className="mb-8 text-center">
                <h1 className="text-4xl font-bold mb-2">Election Dashboard</h1>
                <p className="text-xl">Use the buttons below to start the election and notify voters.</p>
            </header>
            <button 
                onClick={startElection} 
                className="mb-4 px-8 py-4 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700 transition-colors duration-300"
            >
                Start Voting
            </button>
            <button 
                onClick={notifyVoters} 
                className="px-8 py-4 font-bold text-white bg-green-500 rounded-full hover:bg-green-700 transition-colors duration-300"
            >
                Notify Voters
            </button>
            
            {showPopup && (
                <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-md">
                <div className="relative p-8 bg-blue-200 rounded text-black shadow-lg">
                <button onClick={closePopup} className="absolute top-2 right-2 text-lg font-bold">&times;</button>
                {countdown > 0 ? (
                    <>
                        <h2 className="text-2xl mb-4 text-center">Election Starting Soon</h2>
                        <p className="text-center">The election will start in {minutes} minutes and {seconds} seconds.</p>
                    </>
                ) : (
                    <h2 className="text-2xl mb-4 text-center">Election Has Started</h2>
                )}
                </div>
                </div>
)}
             {showNotifyPopup && (
            <div className={`fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-md}`}>
            <div className="relative p-8 bg-blue-200 rounded text-black shadow-lg">
                <button onClick={closePopup} className="absolute top-2 right-2 text-lg font-bold">&times;</button>
                    <h2 className="text-2xl mb-4 text-center">Notification Has been Sent to Voters</h2>
                </div>
            </div>
        )}
        </div>
        
    );
}

export default StartElection;