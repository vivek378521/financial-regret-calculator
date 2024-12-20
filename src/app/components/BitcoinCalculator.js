'use client';

import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';

const BitcoinCalculator = () => {
    const [amount, setAmount] = useState('1000');
    const [date, setDate] = useState('2020-01-01');
    const [currentPrice, setCurrentPrice] = useState(null);
    const [historicalPrice, setHistoricalPrice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const currencies = [
        { code: 'USDT', symbol: '$', pair: 'BTCUSDT', name: 'US Dollar' },
        {
            code: 'INR',
            symbol: '₹',
            pair: 'BTCUSDT',
            name: 'Indian Rupee'
        },
        { code: 'EUR', symbol: '€', pair: 'BTCEUR', name: 'Euro' },
        { code: 'GBP', symbol: '£', pair: 'BTCGBP', name: 'British Pound' },
        { code: 'AUD', symbol: 'A$', pair: 'BTCAUD', name: 'Australian Dollar' },
        { code: 'BRL', symbol: 'R$', pair: 'BTCBRL', name: 'Brazilian Real' },
        { code: 'TRY', symbol: '₺', pair: 'BTCTRY', name: 'Turkish Lira' },
        { code: 'RUB', symbol: '₽', pair: 'BTCRUB', name: 'Russian Ruble' },
        { code: 'UAH', symbol: '₴', pair: 'BTCUAH', name: 'Ukrainian Hryvnia' },
        { code: 'BIDR', symbol: 'Rp', pair: 'BTCBIDR', name: 'Indonesian Rupiah' },
        { code: 'ZAR', symbol: 'R', pair: 'BTCZAR', name: 'South African Rand' },
        { code: 'DAI', symbol: '◈', pair: 'BTCDAI', name: 'Dai' },
        { code: 'NGN', symbol: '₦', pair: 'BTCNGN', name: 'Nigerian Naira' },
        { code: 'BUSD', symbol: '$', pair: 'BTCBUSD', name: 'Binance USD' },
        { code: 'VAI', symbol: 'V', pair: 'BTCVAI', name: 'VAI Stablecoin' },
        { code: 'PLN', symbol: 'zł', pair: 'BTCPLN', name: 'Polish Złoty' },
        { code: 'RON', symbol: 'lei', pair: 'BTCRON', name: 'Romanian Leu' },
        { code: 'ARS', symbol: '$', pair: 'BTCARS', name: 'Argentine Peso' },
        { code: 'JPY', symbol: '¥', pair: 'BTCJPY', name: 'Japanese Yen' },
    ];

    const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);

    const fetchExchangeRate = async (date) => {
        try {
            const formattedDate = new Date(date).toISOString().split('T')[0] // API wants date in YYYY-MM-DD
            const response = await fetch(
                `https://api.exchangerate.host/timeseries?start_date=${formattedDate}&end_date=${formattedDate}&symbols=INR&base=USD`
            );
            const data = await response.json();
            if (data && data.rates && data.rates[formattedDate] && data.rates[formattedDate].INR) {
                return data.rates[formattedDate].INR;
            } else {
                console.error("Failed to fetch USD to INR rate from Forex API")
                return null
            }

        } catch (error) {
            console.error('Error fetching exchange rate:', error);
            setError("Failed to fetch Forex exchange rate")
            return null;
        }
    };

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                let currentBtcPrice, historicalBtcPrice;
                let currentUsdInrRate = 1;
                let historicalUsdInrRate = 1;


                // Fetch BTC price
                const btcResponse = await fetch(
                    `https://api.binance.com/api/v3/ticker/price?symbol=${selectedCurrency.pair}`
                );
                const btcData = await btcResponse.json();
                currentBtcPrice = parseFloat(btcData.price);

                const timestamp = new Date(date).getTime();

                const historicalResponse = await fetch(
                    `https://api.binance.com/api/v3/klines?symbol=${selectedCurrency.pair}&interval=1d&startTime=${timestamp}&limit=1`
                );
                const historicalData = await historicalResponse.json();
                if (historicalData && historicalData.length > 0) {
                    historicalBtcPrice = parseFloat(historicalData[0][1]);
                }

                // If INR is selected, fetch USD/INR price
                if (selectedCurrency.code === 'INR') {

                    const fetchedCurrentRate = await fetchExchangeRate(new Date());
                    if (fetchedCurrentRate) {
                        currentUsdInrRate = fetchedCurrentRate;
                    }

                    const fetchedHistoricalRate = await fetchExchangeRate(date);
                    if (fetchedHistoricalRate) {
                        historicalUsdInrRate = fetchedHistoricalRate;
                    }
                }

                setCurrentPrice({
                    [selectedCurrency.code.toLowerCase()]: currentBtcPrice * currentUsdInrRate
                });


                setHistoricalPrice({
                    [selectedCurrency.code.toLowerCase()]: historicalBtcPrice * historicalUsdInrRate
                });

            } catch (err) {
                setError('Failed to fetch price data');
            }
            setLoading(false);
        };

        setLoading(true);
        fetchPrices();
        const intervalId = setInterval(fetchPrices, 10000);
        return () => clearInterval(intervalId);

    }, [date, selectedCurrency]);


    const calculateWorth = () => {
        if (!currentPrice || !historicalPrice || loading) return "...";

        const histPrice = historicalPrice[selectedCurrency.code.toLowerCase()];
        const currPrice = currentPrice[selectedCurrency.code.toLowerCase()];
        const bitcoinAmount = parseFloat(amount) / histPrice;
        const currentWorth = bitcoinAmount * currPrice;

        return currentWorth.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };


    const downloadScreenshot = () => {
        html2canvas(document.body).then((canvas) => {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'bitcoin_calculator.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };


    if (error) {
        return <div className="text-red-500 p-4">{error}</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="max-w-4xl w-full  p-10 bg-white rounded-xl shadow-xl">
                <p className="text-xl leading-relaxed text-black">
                    If I had invested
                    <select
                        value={selectedCurrency.code}
                        onChange={(e) => setSelectedCurrency(currencies.find(c => c.code === e.target.value))}
                        className="mx-2 px-3 py-1 inline-block border rounded bg-white text-black"
                    >
                        {currencies.map(curr => (
                            <option key={curr.code} value={curr.code}>
                                {curr.symbol} - {curr.name}
                            </option>
                        ))}
                    </select>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-28 mx-2 px-3 py-1 inline-block border rounded text-black"
                    />
                    in Bitcoin on
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="mx-2 px-3 py-1 inline-block border rounded text-black"
                        max={new Date().toISOString().split('T')[0]}
                    />
                    it would be worth {selectedCurrency.symbol}{loading ? "..." : calculateWorth()} today
                </p>
            </div>
            <div className="flex justify-center mt-4">
                <button
                    onClick={downloadScreenshot}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                    Download as PNG
                </button>
            </div>
            <footer className="mt-4 p-4 text-center">
                <p className="text-gray-600">
                    Made with love by <a href="https://peculiarvivek.com" className="text-blue-500 hover:underline">peculiarvivek</a> (<a href="https://x.com/peculiarvivek" className="text-blue-500 hover:underline">X</a>)
                </p>
            </footer>
        </div>
    );
};

export default BitcoinCalculator;