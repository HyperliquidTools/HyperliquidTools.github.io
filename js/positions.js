let pieChartInstance = null;
let barChartInstance = null;
let longShortChartInstance = null;

const mockData = {
    assetPositions: [
        { position: { coin: "BTC", positionValue: "561681.58828", szi: "5.20852", leverage: "5x" } },
        { position: { coin: "ETH", positionValue: "564109.939", szi: "221.6542", leverage: "3x" } },
        { position: { coin: "ATOM", positionValue: "-84743.80365", szi: "-19627.98", leverage: "10x" } },
        { position: { coin: "AVAX", positionValue: "-90854.13632", szi: "-4347.92", leverage: "8x" } },
        { position: { coin: "BNB", positionValue: "301199.64675", szi: "459.475", leverage: "2x" } },
        { position: { coin: "APE", positionValue: "-83149.285459", szi: "-116869.7", leverage: "4x" } },
        { position: { coin: "OP", positionValue: "-82817.978364", szi: "-133349.4", leverage: "4x" } },
        { position: { coin: "ARB", positionValue: "-86525.921644", szi: "-246962.9", leverage: "6x" } }
    ],
    crossMarginSummary: { accountValue: "2000000" }
};

function getAddress() {
    const urlParams = new URLSearchParams(window.location.search);
    const inputAddress = document.getElementById('addressInput')?.value;
    return inputAddress || urlParams.get('address') || '0x07fd993f0fa3a185f7207adccd29f7a87404689d';
}

function updateUrl(address) {
    const url = new URL(window.location);
    url.searchParams.set('address', address);
    history.replaceState(null, '', url);
}

async function fetchPositions(address) {
    try {
        const response = await fetch("https://api.hyperliquid.xyz/info", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: "clearinghouseState",
                user: address
            })
        });
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('获取持仓失败:', error);
        document.getElementById('content').innerHTML += '<p class="text-red-500 text-center">获取持仓数据失败，使用模拟数据</p>';
        return mockData;
    }
}

function calculatePositions(data) {
    if (!window.Decimal) {
        console.error('Decimal.js 未加载');
        document.getElementById('content').innerHTML += '<p class="text-red-500 text-center">计算失败：Decimal.js 未加载</p>';
        return null;
    }

    const Decimal = window.Decimal;
    const target_account_value = new Decimal(data.crossMarginSummary.accountValue);
    let total_position_value = new Decimal('0');
    let long_value = new Decimal('0');
    let short_value = new Decimal('0');

    data.assetPositions.forEach(item => {
        const position_value = new Decimal(item.position.positionValue).abs();
        total_position_value = total_position_value.add(position_value);
        if (new Decimal(item.position.szi).gt('0')) {
            long_value = long_value.add(position_value);
        } else {
            short_value = short_value.add(position_value);
        }
    });

    const long_percentage = total_position_value.gt(0)
        ? long_value.div(total_position_value).mul(100).toDecimalPlaces(4, Decimal.ROUND_DOWN)
        : new Decimal('0');
    const short_percentage = total_position_value.gt(0)
        ? short_value.div(total_position_value).mul(100).toDecimalPlaces(4, Decimal.ROUND_DOWN)
        : new Decimal('0');

    const positions = data.assetPositions.map(item => {
        const pos = item.position;
        const position_value = new Decimal(pos.positionValue);
        const size = new Decimal(pos.szi);
        const direction = size.gt(0) ? '多头' : '空头';
        const leverage = pos.leverage || '未知';

        const market_price = size.eq(0) ? new Decimal('0') : position_value.div(size).abs();
        const market_price_rounded = market_price.toDecimalPlaces(2, Decimal.ROUND_DOWN);

        const follow_percentage = target_account_value.gt(0)
            ? position_value.abs().div(target_account_value).mul(100)
            : new Decimal('0');
        const follow_percentage_rounded = follow_percentage.toDecimalPlaces(4, Decimal.ROUND_DOWN);

        const position_percentage = total_position_value.gt(0)
            ? position_value.abs().div(total_position_value).mul(100)
            : new Decimal('0');
        const position_percentage_rounded = position_percentage.toDecimalPlaces(4, Decimal.ROUND_DOWN);

        return {
            name: pos.coin.toUpperCase(),
            direction,
            value: position_value.abs().toNumber(),
            market_price: market_price_rounded.toNumber(),
            follow_percentage: follow_percentage_rounded.toNumber(),
            position_percentage: position_percentage_rounded.toNumber(),
            leverage
        };
    });

    positions.sort((a, b) => b.value - a.value);

    return {
        positions,
        target_account_value: target_account_value.toNumber(),
        total_position_value: total_position_value.toNumber(),
        long_short: {
            long_value: long_value.toNumber(),
            short_value: short_value.toNumber(),
            long_percentage: long_percentage.toNumber(),
            short_percentage: short_percentage.toNumber()
        }
    };
}

function renderPositions(data, address) {
    if (!data) {
        return '<p class="text-red-500 text-center">无法渲染仓位数据</p>';
    }
    return `
       <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-800">目标账户仓位可视化</h1>
    <div class="flex items-center space-x-4">
        <div class="flex">
            <input 
                id="addressInput" 
                type="text" 
                value="${address}" 
                placeholder="输入地址" 
                class="border border-gray-300 bg-white text-gray-900 p-3 rounded-l-md w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 shadow-sm"
            >
            <button 
                id="fetchButton" 
                class="bg-blue-600 text-white p-3 rounded-r-md hover:bg-blue-700 active:scale-95 transition duration-200 shadow-sm"
            >
                查询
            </button>
        </div>
        <a 
            href="https://hyperdash.info/zh-CN/trader/${address}" 
            class="text-blue-600 hover:text-blue-800 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full" 
            target="_blank"
        >
            查看 Hyperdash 详情
        </a>
        <div class="summary bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
            <p class="text-base text-gray-700">账户总余额: <span class="font-semibold">${data.target_account_value.toFixed(2)}</span> USDC</p>
            <p class="text-base text-gray-700">总仓位价值: <span class="font-semibold">${data.total_position_value.toFixed(2)}</span> USDC</p>
        </div>
    </div>
</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="bg-white p-4 rounded-lg shadow-md">
                <h2 class="text-lg font-semibold text-gray-800 text-center mb-4">持仓占比</h2>
                <canvas id="pieChart" class="w-full h-64"></canvas>
            </div>
            <div class="bg-white p-4 rounded-lg shadow-md">
                <h2 class="text-lg font-semibold text-gray-800 text-center mb-4">多空仓位占比</h2>
                <canvas id="longShortChart" class="w-full h-64"></canvas>
            </div>
        </div>
        <div class="mb-8 bg-white p-4 rounded-lg shadow-md">
            <h2 class="text-lg font-semibold text-gray-800 text-center mb-4">持仓价值占保证金百分比</h2>
            <canvas id="barChart" class="w-full h-64"></canvas>
        </div>
        <table class="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
            <thead>
                <tr class="bg-gray-200 text-gray-700">
                    <th class="border border-gray-300 p-3 font-semibold">币种</th>
                    <th class="border border-gray-300 p-3 font-semibold">方向</th>
                    <th class="border border-gray-300 p-3 font-semibold">仓位价值 (USDC)</th>
                    <th class="border border-gray-300 p-3 font-semibold">市价 (USDC)</th>
                    <th class="border border-gray-300 p-3 font-semibold">跟单百分比</th>
                    <th class="border border-gray-300 p-3 font-semibold">仓位占比</th>
                    <th class="border border-gray-300 p-3 font-semibold">杠杆</th>
                </tr>
            </thead>
            <tbody>
                ${data.positions.map(pos => `
                    <tr class="hover:bg-gray-50 transition duration-100">
                        <td class="border border-gray-300 p-3 text-gray-800">${pos.name}</td>
                        <td class="border border-gray-300 p-3 text-gray-800">${pos.direction}</td>
                        <td class="border border-gray-300 p-3 text-gray-800">${pos.value.toFixed(2)}</td>
                        <td class="border border-gray-300 p-3 text-gray-800">${pos.market_price.toFixed(2)}</td>
                        <td class="border border-gray-300 p-3 text-gray-800">${pos.follow_percentage.toFixed(4)}%</td>
                        <td class="border border-gray-300 p-3 text-gray-800">${pos.position_percentage.toFixed(4)}%</td>
                        <td class="border border-gray-300 p-3 text-gray-800">${pos.leverage}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderCharts(data) {
    if (!data) return;

    const positions = data.positions;
    const long_short = data.long_short;

    if (pieChartInstance) {
        pieChartInstance.destroy();
        pieChartInstance = null;
    }
    if (barChartInstance) {
        barChartInstance.destroy();
        barChartInstance = null;
    }
    if (longShortChartInstance) {
        longShortChartInstance.destroy();
        longShortChartInstance = null;
    }

    const pieCtx = document.getElementById('pieChart')?.getContext('2d');
    if (pieCtx) {
        try {
            pieChartInstance = new Chart(pieCtx, {
                type: 'pie',
                data: {
                    labels: positions.map(pos => pos.name),
                    datasets: [{
                        data: positions.map(pos => pos.position_percentage),
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                            '#9966FF', '#FF9F40', '#C9CBCF', '#7BC225'
                        ],
                        borderColor: '#fff',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'left' },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const pos = positions[context.dataIndex];
                                    return [
                                        `币种: ${pos.name}`,
                                        `占比: ${pos.position_percentage.toFixed(2)}%`,
                                        `价值: ${pos.value.toFixed(2)} USDC`,
                                        `市价: ${pos.market_price.toFixed(2)} USDC`,
                                        `杠杆: ${pos.leverage}`,
                                        `方向: ${pos.direction}`
                                    ];
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: '持仓占比',
                            font: { size: 16 }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('持仓占比饼状图渲染失败:', error);
            document.getElementById('content').innerHTML += '<p class="text-red-500 text-center">持仓占比饼状图渲染失败</p>';
        }
    }

    const longShortCtx = document.getElementById('longShortChart')?.getContext('2d');
    if (longShortCtx) {
        try {
            longShortChartInstance = new Chart(longShortCtx, {
                type: 'pie',
                data: {
                    labels: ['多头', '空头'],
                    datasets: [{
                        data: [long_short.long_percentage, long_short.short_percentage],
                        backgroundColor: ['#36A2EB', '#FF6384'],
                        borderColor: '#fff',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'left' },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const isLong = context.dataIndex === 0;
                                    const value = isLong ? long_short.long_value : long_short.short_value;
                                    const percentage = isLong ? long_short.long_percentage : long_short.short_percentage;
                                    return [
                                        `类型: ${isLong ? '多头' : '空头'}`,
                                        `占比: ${percentage.toFixed(2)}%`,
                                        `价值: ${value.toFixed(2)} USDC`
                                    ];
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: '多空仓位占比',
                            font: { size: 16 }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('多空仓位占比饼状图渲染失败:', error);
            document.getElementById('content').innerHTML += '<p class="text-red-500 text-center">多空仓位占比饼状图渲染失败</p>';
        }
    }

    const barCtx = document.getElementById('barChart')?.getContext('2d');
    if (barCtx) {
        try {
            barChartInstance = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: positions.map(pos => pos.name),
                    datasets: [{
                        label: '占保证金百分比',
                        data: positions.map(pos => pos.follow_percentage),
                        backgroundColor: '#36A2EB',
                        borderColor: '#fff',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: '百分比 (%)' }
                        },
                        x: {
                            title: { display: true, text: '币种' }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const pos = positions[context.dataIndex];
                                    return [
                                        `币种: ${pos.name}`,
                                        `占比: ${pos.follow_percentage.toFixed(2)}%`,
                                        `价值: ${pos.value.toFixed(2)} USDC`,
                                        `市价: ${pos.market_price.toFixed(2)} USDC`,
                                        `杠杆: ${pos.leverage}`,
                                        `方向: ${pos.direction}`
                                    ];
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: '持仓价值占保证金百分比',
                            font: { size: 16 }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('柱状图渲染失败:', error);
            document.getElementById('content').innerHTML += '<p class="text-red-500 text-center">柱状图渲染失败</p>';
        }
    }
}

async function initPositions() {
    const address = getAddress();
    const data = calculatePositions(await fetchPositions(address));
    console.log('计算后的数据为：', data);
    document.getElementById('content').innerHTML = renderPositions(data, address);
    if (data) renderCharts(data);

    document.getElementById('fetchButton')?.addEventListener('click', async () => {
        const newAddress = document.getElementById('addressInput')?.value || address;
        updateUrl(newAddress);
        const newData = calculatePositions(await fetchPositions(newAddress));
        console.log('查询新数据为：', newData);
        document.getElementById('content').innerHTML = renderPositions(newData, newAddress);
        if (newData) renderCharts(newData);
    });
}

function waitForDecimal(callback) {
    if (window.Decimal) {
        callback();
    } else {
        setTimeout(() => waitForDecimal(callback), 100);
    }
}

waitForDecimal(initPositions);