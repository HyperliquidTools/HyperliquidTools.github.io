document.addEventListener('DOMContentLoaded', () => {
    const navPlaceholder = document.getElementById('nav-placeholder');
    if (navPlaceholder) {
        navPlaceholder.innerHTML = `
            <nav class="bg-blue-600 text-white p-2 shadow-md">
                <div class="flex justify-between items-center max-w-4xl mx-auto">
                    <a href="/" class="nav-link flex items-center space-x-2">
                                                <img src="/logo.png" style="width:32px;"/>
                        <span class="text-xl font-bold">Hyperliquid 仓位可视化</span>
                    </a>
                    <ul class="flex space-x-4">
                        <li><a href="/views/positions.html" class="nav-link hover:underline">仓位分析</a></li>
                        <li><a href="/views/vaults.html" class="nav-link hover:underline">金库数据</a></li>
                        <li><a href="/views/about.html" class="nav-link hover:underline">关于</a></li>
                    </ul>
                </div>
            </nav>
        `;
    }
});