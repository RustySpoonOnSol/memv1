import Head from 'next/head';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Connection, PublicKey } from '@solana/web3.js';

export default function Home() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [tier, setTier] = useState(0);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_SOLANA_TOKEN_ADDRESS;
  const TIER_LIMITS = [50000, 100000, 500000]; // Bronze, Silver, Gold, Diamond

  useEffect(() => {
    const connectWallet = async () => {
      if ('solana' in window) {
        try {
          const provider = window.solana;
          if (provider.isPhantom) {
            const resp = await provider.connect();
            setWalletAddress(resp.publicKey.toString());
            checkTier(resp.publicKey.toString());
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    connectWallet();
  }, []);

  const checkTier = async (wallet) => {
    try {
      const connection = new Connection('https://api.mainnet-beta.solana.com');
      const tokenPublicKey = new PublicKey(TOKEN_ADDRESS);
      const accounts = await connection.getParsedTokenAccountsByOwner(
        new PublicKey(wallet),
        { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
      );

      let balance = 0;
      accounts.value.forEach((account) => {
        const info = account.account.data.parsed.info;
        if (info.mint === TOKEN_ADDRESS) {
          balance = parseInt(info.tokenAmount.amount) / (10 ** info.tokenAmount.decimals);
        }
      });

      if (balance >= TIER_LIMITS[2]) setTier(3);
      else if (balance >= TIER_LIMITS[1]) setTier(2);
      else if (balance >= TIER_LIMITS[0]) setTier(1);
      else setTier(0);
    } catch (err) {
      console.error('Error checking tier:', err);
    }
  };

  const sendMessage = async () => {
    if (!message) return;
    setLoading(true);
    setChatHistory(prev => [...prev, { user: true, text: message }]);
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, tier, wallet: walletAddress }),
    });
    const data = await res.json();
    setResponse(data.reply);
    setChatHistory(prev => [...prev, { user: false, text: data.reply }]);
    setMessage('');
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Crush AI - Flirty Girlfriend</title>
      </Head>
      <main className="p-4 max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">💋 Crush AI Girlfriend</h1>
        <p className="mb-4 text-sm">Tier: {['Bronze', 'Silver', 'Gold', 'Diamond'][tier]}</p>
        <div className="bg-gray-100 p-4 rounded mb-4 h-64 overflow-y-scroll">
          {chatHistory.map((msg, idx) => (
            <p key={idx} className={msg.user ? 'text-blue-600' : 'text-pink-600'}>{msg.text}</p>
          ))}
        </div>
        <input
          className="w-full p-2 border rounded mb-2"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Say something flirty..."
        />
        <button
          className="bg-pink-500 text-white px-4 py-2 rounded w-full"
          onClick={sendMessage}
          disabled={loading}
        >
          {loading ? 'Flirting...' : 'Send 💌'}
        </button>
      </main>
    </>
  );
}