document.addEventListener('DOMContentLoaded', () => {
    const navPlaceholder = document.getElementById('nav-placeholder');
    if (navPlaceholder) {
        navPlaceholder.innerHTML = `
            <nav class="bg-blue-600 text-white p-2 shadow-md">
                <div class="flex justify-between items-center max-w-4xl mx-auto flex-wrap">
                    <a href="/" class="nav-link flex items-center space-x-2">
                        <img src="/logo.png" style="width:32px;" alt="HyperX Logo"/>
                        <span class="text-xl font-bold">HyperX</span>
                    </a>
                    <div class="flex items-center space-x-6">
                        <ul class="flex space-x-4">
                            <li><a href="/views/positions.html" class="nav-link hover:underline hover:text-gray-200">仓位分析</a></li>
                            <li><a href="/views/vaults.html" class="nav-link hover:underline hover:text-gray-200">金库数据</a></li>
                            <li><a href="/views/about.html" class="nav-link hover:underline hover:text-gray-200">关于</a></li>
                        </ul>

                    </div>
                                            <ul class="flex space-x-4">
                            <li><a href="https://app.hyperliquid.xyz/join/STARDREAM" class="nav-link hover:underline hover:text-gray-200" target="_blank" rel="noopener">Hyperliquid</a></li>
                            <li><a href="https://cpython666.github.io/" class="nav-link hover:underline hover:text-gray-200" target="_blank" rel="noopener">博客</a></li>
                            <li><a href="https://x.com/stardreamfly" class="nav-link hover:underline hover:text-gray-200" target="_blank" rel="noopener">X 币圈感悟</a></li>
                        </ul>
                </div>
            </nav>
        `;
    }
});