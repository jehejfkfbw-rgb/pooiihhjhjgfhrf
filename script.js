<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>🚍 ميكروباص إسكندرية</title>
    <style>
        /* ===== RESET & BASE ===== */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            overflow: hidden;
            background: #000;
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            user-select: none;
            -webkit-user-select: none;
            touch-action: none;
        }

        #gameCanvas {
            display: block;
            width: 100vw;
            height: 100vh;
        }

        /* ===== LOADING SCREEN ===== */
        #loadingScreen {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: linear-gradient(135deg, #0a1628 0%, #1a3a5c 50%, #0d2137 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            transition: opacity 0.8s ease;
        }

        #loadingScreen.hidden {
            opacity: 0;
            pointer-events: none;
        }

        #loadingScreen h1 {
            color: #FFD700;
            font-size: 3em;
            text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
            margin-bottom: 10px;
            animation: pulse 2s infinite;
        }

        #loadingScreen .subtitle {
            color: #87CEEB;
            font-size: 1.3em;
            margin-bottom: 40px;
        }

        .loading-bar-container {
            width: 350px;
            height: 12px;
            background: rgba(255,255,255,0.15);
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid rgba(255,215,0,0.3);
        }

        .loading-bar-fill {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #FFD700, #FFA500);
            border-radius: 10px;
            transition: width 0.3s ease;
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
        }

        #loadingText {
            color: #ccc;
            margin-top: 15px;
            font-size: 0.95em;
        }

        .microbus-icon {
            font-size: 5em;
            margin-bottom: 20px;
            animation: driveAnim 3s ease-in-out infinite;
        }

        @keyframes driveAnim {
            0%, 100% { transform: translateX(-20px) rotate(-2deg); }
            50% { transform: translateX(20px) rotate(2deg); }
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }

        /* ===== START MENU ===== */
        #startMenu {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: linear-gradient(135deg, #0a1628 0%, #1a3a5c 50%, #0d2137 100%);
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9000;
        }

        #startMenu.active {
            display: flex;
        }

        #startMenu h1 {
            color: #FFD700;
            font-size: 2.8em;
            text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
            margin-bottom: 5px;
        }

        #startMenu .tagline {
            color: #87CEEB;
            font-size: 1.1em;
            margin-bottom: 40px;
        }

        .menu-btn {
            width: 280px;
            padding: 16px 30px;
            margin: 8px;
            border: none;
            border-radius: 12px;
            font-size: 1.2em;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
        }

        .menu-btn:hover {
            transform: scale(1.05);
        }

        .btn-guest {
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #1a1a2e;
            box-shadow: 0 5px 25px rgba(255, 215, 0, 0.4);
        }

        .btn-guest:hover {
            box-shadow: 0 8px 35px rgba(255, 215, 0, 0.6);
        }

        .btn-routes {
            background: linear-gradient(135deg, #4CAF50, #2E7D32);
            color: white;
            box-shadow: 0 5px 25px rgba(76, 175, 80, 0.4);
        }

        .btn-settings {
            background: linear-gradient(135deg, #2196F3, #1565C0);
            color: white;
            box-shadow: 0 5px 25px rgba(33, 150, 243, 0.4);
        }

        .menu-features {
            display: flex;
            gap: 30px;
            margin-top: 40px;
            flex-wrap: wrap;
            justify-content: center;
        }

        .feature-item {
            text-align: center;
            color: #aaa;
            font-size: 0.85em;
        }

        .feature-item .icon {
            font-size: 2em;
            display: block;
            margin-bottom: 5px;
        }

        /* ===== ROUTE SELECTION ===== */
        #routeSelect {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(10, 22, 40, 0.97);
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9500;
        }

        #routeSelect.active {
            display: flex;
        }

        #routeSelect h2 {
            color: #FFD700;
            font-size: 2em;
            margin-bottom: 30px;
        }

        .route-card {
            width: 340px;
            padding: 18px 24px;
            margin: 8px;
            background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
            border: 1px solid rgba(255, 215, 0, 0.2);
            border-radius: 14px;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .route-card:hover {
            border-color: #FFD700;
            background: linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05));
            transform: translateY(-3px);
        }

        .route-card .route-name {
            font-size: 1.2em;
            font-weight: bold;
            color: #FFD700;
        }

        .route-card .route-desc {
            font-size: 0.85em;
            color: #aaa;
            margin-top: 5px;
        }

        .route-card .route-fare {
            font-size: 0.9em;
            color: #4CAF50;
            margin-top: 5px;
        }

        .back-btn {
            margin-top: 20px;
            padding: 12px 40px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            border-radius: 10px;
            font-size: 1em;
            cursor: pointer;
            transition: all 0.3s;
        }

        .back-btn:hover {
            background: rgba(255,255,255,0.2);
        }

        /* ===== HUD - HEADS UP DISPLAY ===== */
        #hud {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            pointer-events: none;
            z-index: 100;
            display: none;
        }

        #hud.active {
            display: block;
        }

        /* Speed Panel */
        .speed-panel {
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 20px;
            border: 1px solid rgba(255, 215, 0, 0.3);
            min-width: 200px;
        }

        .speedometer {
            position: relative;
            width: 160px;
            height: 90px;
            margin: 0 auto;
        }

        .speed-value {
            text-align: center;
            font-size: 3em;
            font-weight: bold;
            color: #FFD700;
            line-height: 1;
            text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
        }

        .speed-unit {
            text-align: center;
            color: #888;
            font-size: 0.85em;
            margin-top: 2px;
        }

        .speed-arc {
            width: 160px;
            height: 80px;
            margin: 0 auto 5px;
            position: relative;
        }

        .speed-arc svg {
            width: 100%;
            height: 100%;
        }

        .gear-display {
            text-align: center;
            margin-top: 10px;
            display: flex;
            justify-content: center;
            gap: 6px;
        }

        .gear-item {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            background: rgba(255,255,255,0.1);
            color: #666;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8em;
            font-weight: bold;
            transition: all 0.2s;
        }

        .gear-item.active {
            background: #FFD700;
            color: #000;
            box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }

        /* Info Panel - Top */
        .info-panel {
            position: absolute;
            top: 15px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 12px 25px;
            display: flex;
            gap: 30px;
            align-items: center;
            border: 1px solid rgba(255, 215, 0, 0.2);
        }

        .info-item {
            text-align: center;
        }

        .info-item .label {
            color: #888;
            font-size: 0.7em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .info-item .value {
            color: #fff;
            font-size: 1.3em;
            font-weight: bold;
        }

        .info-item .value.money {
            color: #4CAF50;
        }

        .info-item .value.fuel-low {
            color: #FF5252;
            animation: blink 0.5s infinite;
        }

        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }

        /* Fuel Bar */
        .fuel-bar-container {
            width: 120px;
            height: 10px;
            background: rgba(255,255,255,0.15);
            border-radius: 5px;
            overflow: hidden;
            margin-top: 4px;
        }

        .fuel-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #FF5252, #FFC107, #4CAF50);
            border-radius: 5px;
            transition: width 0.3s ease;
        }

        /* Passengers Panel */
        .passengers-panel {
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 18px 22px;
            border: 1px solid rgba(76, 175, 80, 0.3);
            min-width: 180px;
        }

        .passengers-title {
            color: #888;
            font-size: 0.75em;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }

        .passengers-icons {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-bottom: 8px;
        }

        .passenger-seat {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.65em;
            transition: all 0.3s;
        }

        .passenger-seat.occupied {
            background: #4CAF50;
            box-shadow: 0 0 8px rgba(76,175,80,0.5);
        }

        .fare-total {
            color: #4CAF50;
            font-size: 1.3em;
            font-weight: bold;
        }

        /* Route Info */
        .route-info {
            position: absolute;
            top: 75px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.65);
            backdrop-filter: blur(8px);
            border-radius: 10px;
            padding: 8px 20px;
            color: #87CEEB;
            font-size: 0.9em;
            border: 1px solid rgba(135, 206, 235, 0.2);
        }

        /* Notification */
        .notification {
            position: absolute;
            top: 120px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 215, 0, 0.9);
            color: #000;
            padding: 12px 30px;
            border-radius: 10px;
            font-weight: bold;
            font-size: 1.1em;
            opacity: 0;
            transition: all 0.4s ease;
            pointer-events: none;
        }

        .notification.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }

        /* Minimap */
        .minimap {
            position: absolute;
            top: 15px;
            right: 15px;
            width: 160px;
            height: 160px;
            background: rgba(0, 20, 40, 0.85);
            border-radius: 50%;
            border: 2px solid rgba(255, 215, 0, 0.4);
            overflow: hidden;
        }

        .minimap canvas {
            width: 100%;
            height: 100%;
            border-radius: 50%;
        }

        /* Mobile Controls */
        .mobile-controls {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            display: none;
            justify-content: space-between;
            padding: 10px 20px 30px;
            pointer-events: all;
        }

        @media (max-width: 768px) {
            .mobile-controls {
                display: flex;
            }
            .speed-panel {
                bottom: 140px;
                left: 10px;
                transform: scale(0.85);
                transform-origin: bottom left;
            }
            .passengers-panel {
                bottom: 140px;
                right: 10px;
                transform: scale(0.85);
                transform-origin: bottom right;
            }
        }

        .control-group {
            display: flex;
            gap: 10px;
        }

        .ctrl-btn {
            width: 65px;
            height: 65px;
            border-radius: 50%;
            border: 2px solid rgba(255,255,255,0.3);
            background: rgba(255,255,255,0.1);
            color: white;
            font-size: 1.5em;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.15s;
            -webkit-tap-highlight-color: transparent;
        }

        .ctrl-btn:active, .ctrl-btn.pressed {
            background: rgba(255, 215, 0, 0.4);
            border-color: #FFD700;
            transform: scale(0.92);
        }

        .ctrl-btn.gas {
            background: rgba(76, 175, 80, 0.3);
            border-color: rgba(76, 175, 80, 0.5);
        }

        .ctrl-btn.brake {
            background: rgba(244, 67, 54, 0.3);
            border-color: rgba(244, 67, 54, 0.5);
        }

        .ctrl-btn.horn {
            background: rgba(255, 193, 7, 0.3);
            border-color: rgba(255, 193, 7, 0.5);
            width: 55px;
            height: 55px;
            font-size: 1.2em;
        }

        /* Fuel Station Popup */
        .fuel-popup {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(15px);
            border-radius: 20px;
            padding: 30px 40px;
            border: 2px solid #FFD700;
            text-align: center;
            display: none;
            pointer-events: all;
            z-index: 200;
        }

        .fuel-popup.active {
            display: block;
        }

        .fuel-popup h3 {
            color: #FFD700;
            font-size: 1.5em;
            margin-bottom: 15px;
        }

        .fuel-popup p {
            color: #ccc;
            margin-bottom: 20px;
        }

        .fuel-popup .fuel-btn {
            padding: 12px 35px;
            border: none;
            border-radius: 10px;
            font-size: 1.1em;
            font-weight: bold;
            cursor: pointer;
            margin: 5px;
            transition: all 0.3s;
        }

        .fuel-btn.fill {
            background: linear-gradient(135deg, #4CAF50, #2E7D32);
            color: white;
        }

        .fuel-btn.cancel {
            background: rgba(255,255,255,0.1);
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
        }

        /* Pause Menu */
        #pauseMenu {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.8);
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 5000;
        }

        #pauseMenu.active {
            display: flex;
        }

        #pauseMenu h2 {
            color: #FFD700;
            font-size: 2.5em;
            margin-bottom: 30px;
        }

        /* FPS Counter */
        .fps-counter {
            position: absolute;
            top: 15px;
            left: 15px;
            color: #0f0;
            font-size: 0.75em;
            font-family: monospace;
            background: rgba(0,0,0,0.5);
            padding: 3px 8px;
            border-radius: 5px;
        }

        /* Station Indicator */
        .station-indicator {
            position: absolute;
            bottom: 180px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 10px 25px;
            border-radius: 10px;
            font-weight: bold;
            display: none;
            pointer-events: all;
        }

        .station-indicator.show {
            display: block;
            animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
            from { transform: translateX(-50%) translateY(20px); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }

        .station-indicator button {
            margin-right: 10px;
            padding: 6px 15px;
            border: none;
            border-radius: 6px;
            background: white;
            color: #2E7D32;
            font-weight: bold;
            cursor: pointer;
            pointer-events: all;
        }
    </style>
</head>
<body>

<!-- Loading Screen -->
<div id="loadingScreen">
    <div class="microbus-icon">🚍</div>
    <h1>ميكروباص إسكندرية</h1>
    <p class="subtitle">Alexandria Microbus Simulator</p>
    <div class="loading-bar-container">
        <div class="loading-bar-fill" id="loadingBar"></div>
    </div>
    <p id="loadingText">جاري تحميل شوارع إسكندرية...</p>
</div>

<!-- Start Menu -->
<div id="startMenu">
    <div class="microbus-icon" style="font-size:4em;">🚍</div>
    <h1>ميكروباص إسكندرية</h1>
    <p class="tagline">⚡ سوق ميكروباصك على كورنيش إسكندرية!</p>
    <button class="menu-btn btn-guest" onclick="startGame('guest')">🎮 ابدأ كضيف - العب فوراً</button>
    <button class="menu-btn btn-routes" onclick="showRoutes()">🗺️ اختار خط السير</button>
    <button class="menu-btn btn-settings" onclick="toggleSettings()">⚙️ الإعدادات</button>
    <div class="menu-features">
        <div class="feature-item"><span class="icon">🌊</span>كورنيش إسكندرية</div>
        <div class="feature-item"><span class="icon">⛽</span>محطات وقود</div>
        <div class="feature-item"><span class="icon">👥</span>ركاب ومحطات</div>
        <div class="feature-item"><span class="icon">🏛️</span>معالم شهيرة</div>
    </div>
</div>

<!-- Route Selection -->
<div id="routeSelect">
    <h2>🗺️ اختار خط السير</h2>
    <div class="route-card" onclick="startGame('bahary-montaza')">
        <div class="route-name">🔵 بحري ↔ المنتزه</div>
        <div class="route-desc">الكورنيش الساحلي الكامل - قايتباي → محطة الرمل → ستانلي → سان ستيفانو → المنتزه</div>
        <div class="route-fare">💰 الأجرة: 8 جنيه | ⏱️ المسافة: 18 كم</div>
    </div>
    <div class="route-card" onclick="startGame('mahatta-smouha')">
        <div class="route-name">🟢 محطة مصر ↔ سموحة</div>
        <div class="route-desc">الشوارع الداخلية - محطة مصر → محور المحمودية → سموحة</div>
        <div class="route-fare">💰 الأجرة: 5 جنيه | ⏱️ المسافة: 8 كم</div>
    </div>
    <div class="route-card" onclick="startGame('bahary-45')">
        <div class="route-name">🟡 بحري ↔ نفق 45</div>
        <div class="route-desc">الخط الطويل - بحري → سيدي بشر → ميامي → 45</div>
        <div class="route-fare">💰 الأجرة: 10 جنيه | ⏱️ المسافة: 22 كم</div>
    </div>
    <button class="back-btn" onclick="hideRoutes()">↩️ رجوع للقائمة</button>
</div>

<!-- Pause Menu -->
<div id="pauseMenu">
    <h2>⏸️ اللعبة متوقفة</h2>
    <button class="menu-btn btn-guest" onclick="resumeGame()">▶️ استكمال اللعب</button>
    <button class="menu-btn btn-settings" onclick="restartGame()">🔄 إعادة البدء</button>
    <button class="menu-btn" style="background:rgba(255,255,255,0.1);color:white;border:1px solid rgba(255,255,255,0.3);" onclick="quitToMenu()">🚪 القائمة الرئيسية</button>
</div>

<!-- HUD -->
<div id="hud">
    <!-- FPS -->
    <div class="fps-counter" id="fpsCounter">60 FPS</div>

    <!-- Top Info Panel -->
    <div class="info-panel">
        <div class="info-item">
            <div class="label">⛽ الوقود</div>
            <div class="value" id="fuelPercent">100%</div>
            <div class="fuel-bar-container">
                <div class="fuel-bar-fill" id="fuelBar" style="width: 100%"></div>
            </div>
        </div>
        <div class="info-item">
            <div class="label">💰 الفلوس</div>
            <div class="value money" id="moneyDisplay">0 ج.م</div>
        </div>
        <div class="info-item">
            <div class="label">📍 المسافة</div>
            <div class="value" id="distanceDisplay">0.0 كم</div>
        </div>
        <div class="info-item">
            <div class="label">⏱️ الوقت</div>
            <div class="value" id="timeDisplay">00:00</div>
        </div>
    </div>

    <!-- Route Info -->
    <div class="route-info" id="routeInfo">🛣️ بحري ← المنتزه | المحطة التالية: <span id="nextStation">محطة الرمل</span></div>

    <!-- Speed Panel -->
    <div class="speed-panel">
        <div class="speed-arc">
            <svg viewBox="0 0 160 85">
                <!-- Background arc -->
                <path d="M 15 80 A 65 65 0 0 1 145 80" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8" stroke-linecap="round"/>
                <!-- Speed arc -->
                <path id="speedArc" d="M 15 80 A 65 65 0 0 1 145 80" fill="none" stroke="#FFD700" stroke-width="8" stroke-linecap="round" stroke-dasharray="204" stroke-dashoffset="204"/>
                <!-- Speed markers -->
                <text x="10" y="78" fill="#555" font-size="8">0</text>
                <text x="35" y="30" fill="#555" font-size="8">40</text>
                <text x="72" y="18" fill="#555" font-size="8">80</text>
                <text x="110" y="30" fill="#555" font-size="8">120</text>
                <text x="135" y="78" fill="#555" font-size="8">160</text>
            </svg>
        </div>
        <div class="speed-value" id="speedValue">0</div>
        <div class="speed-unit">km/h</div>
        <div class="gear-display">
            <div class="gear-item" id="gearR">R</div>
            <div class="gear-item" id="gearN">N</div>
            <div class="gear-item active" id="gear1">1</div>
            <div class="gear-item" id="gear2">2</div>
            <div class="gear-item" id="gear3">3</div>
            <div class="gear-item" id="gear4">4</div>
            <div class="gear-item" id="gear5">5</div>
        </div>
    </div>

    <!-- Passengers Panel -->
    <div class="passengers-panel">
        <div class="passengers-title">👥 الركاب</div>
        <div class="passengers-icons" id="passengerSeats"></div>
        <div>الأجرة: <span class="fare-total" id="fareTotal">0 ج.م</span></div>
    </div>

    <!-- Minimap -->
    <div class="minimap">
        <canvas id="minimapCanvas" width="160" height="160"></canvas>
    </div>

    <!-- Notification -->
    <div class="notification" id="notification"></div>

    <!-- Station Indicator -->
    <div class="station-indicator" id="stationIndicator">
        <button onclick="game.pickupPassengers()" style="pointer-events:all;">📥 تحميل ركاب</button>
        <button onclick="game.dropPassengers()" style="pointer-events:all;">📤 نزول ركاب</button>
        <span id="stationName">محطة الرمل</span>
    </div>

    <!-- Fuel Popup -->
    <div class="fuel-popup" id="fuelPopup">
        <h3>⛽ محطة وقود</h3>
        <p>الوقود الحالي: <span id="fuelPopupPercent">50</span>%</p>
        <p>تكلفة التموين: <span id="fuelCost">30</span> ج.م</p>
        <button class="fuel-btn fill" onclick="game.refuel()">⛽ تعبئة كاملة</button>
        <button class="fuel-btn cancel" onclick="game.closeFuelPopup()">❌ إلغاء</button>
    </div>

    <!-- Mobile Controls -->
    <div class="mobile-controls">
        <div class="control-group">
            <button class="ctrl-btn" id="btnLeft" ontouchstart="game.touchControl('left',true)" ontouchend="game.touchControl('left',false)">⬅️</button>
            <button class="ctrl-btn" id="btnRight" ontouchstart="game.touchControl('right',true)" ontouchend="game.touchControl('right',false)">➡️</button>
        </div>
        <div class="control-group" style="flex-direction: column; align-items: center;">
            <button class="ctrl-btn horn" id="btnHorn" ontouchstart="game.honk()">📯</button>
        </div>
        <div class="control-group">
            <button class="ctrl-btn brake" id="btnBrake" ontouchstart="game.touchControl('brake',true)" ontouchend="game.touchControl('brake',false)">🛑</button>
            <button class="ctrl-btn gas" id="btnGas" ontouchstart="game.touchControl('gas',true)" ontouchend="game.touchControl('gas',false)">🚀</button>
        </div>
    </div>
</div>

<!-- Three.js & Cannon.js CDN -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.min.js"></script>

<script>
// ============================================
// 🚍 ALEXANDRIA MICROBUS GAME - MAIN ENGINE
// ============================================

class AlexandriaMicrobusGame {
    constructor() {
        // Core
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.world = null; // Physics
        this.clock = new THREE.Clock();

        // Game State
        this.state = 'loading'; // loading, menu, playing, paused
        this.speed = 0;
        this.maxSpeed = 160;
        this.acceleration = 0;
        this.steering = 0;
        this.gear = 1;
        this.fuel = 100;
        this.money = 50; // Start with 50 EGP
        this.passengers = 0;
        this.maxPassengers = 14;
        this.farePerPassenger = 8;
        this.distance = 0;
        this.gameTime = 0;
        this.currentRoute = 'bahary-montaza';

        // Vehicle
        this.microbus = null;
        this.microbusBody = null;
        this.wheels = [];

        // Controls
        this.keys = {};
        this.touchControls = { left: false, right: false, gas: false, brake: false };

        // World Objects - Object Pooling
        this.buildings = [];
        this.landmarks = [];
        this.stations = [];
        this.fuelStations = [];
        this.trees = [];
        this.otherVehicles = [];
        this.seaPlane = null;

        // Optimization
        this.objectPool = new Map();
        this.frustumCulling = true;
        this.lodLevels = 3;
        this.renderDistance = 500;
        this.lastFPSUpdate = 0;
        this.frameCount = 0;
        this.fps = 60;

        // Audio
        this.audioCtx = null;
        this.sounds = {};

        // Stations Data
        this.stationData = [
            { name: 'بحري', nameEn: 'Bahary', pos: { x: 0, z: 0 }, type: 'station' },
            { name: 'الأنفوشي', nameEn: 'Anfushi', pos: { x: 80, z: -30 }, type: 'station' },
            { name: 'محطة الرمل', nameEn: 'Raml Station', pos: { x: 200, z: -60 }, type: 'station' },
            { name: 'محطة وقود بحري', nameEn: 'Bahary Fuel', pos: { x: 120, z: -40 }, type: 'fuel' },
            { name: 'ستانلي', nameEn: 'Stanley', pos: { x: 400, z: -100 }, type: 'station' },
            { name: 'محطة وقود ستانلي', nameEn: 'Stanley Fuel', pos: { x: 350, z: -90 }, type: 'fuel' },
            { name: 'سان ستيفانو', nameEn: 'San Stefano', pos: { x: 550, z: -130 }, type: 'station' },
            { name: 'سيدي جابر', nameEn: 'Sidi Gaber', pos: { x: 650, z: -150 }, type: 'station' },
            { name: 'محطة وقود ميامي', nameEn: 'Miami Fuel', pos: { x: 750, z: -160 }, type: 'fuel' },
            { name: 'سيدي بشر', nameEn: 'Sidi Bishr', pos: { x: 800, z: -170 }, type: 'station' },
            { name: 'ميامي', nameEn: 'Miami', pos: { x: 900, z: -180 }, type: 'station' },
            { name: 'المنتزه', nameEn: 'Montaza', pos: { x: 1100, z: -200 }, type: 'station' },
            { name: 'نفق 45', nameEn: 'Tunnel 45', pos: { x: 1300, z: -220 }, type: 'station' },
        ];

        this.landmarkData = [
            { name: 'قلعة قايتباي', pos: { x: -30, z: 20 }, type: 'castle', color: 0xD2B48C },
            { name: 'مكتبة الإسكندرية', pos: { x: 150, z: -50 }, type: 'library', color: 0xC0C0C0 },
            { name: 'كوبري ستانلي', pos: { x: 420, z: -105 }, type: 'bridge', color: 0x808080 },
            { name: 'سان ستيفانو مول', pos: { x: 560, z: -135 }, type: 'mall', color: 0x4169E1 },
        ];

        // Shout phrases
        this.shouts = [
            'بحري يا أسطى!', 'سيدي بشر!', 'ميامي يا ميامي!', 'المنتزه!',
            'محطة الرمل!', 'على جنب يا أسطى!', 'الفكة يا باشا!',
            'ستانلي يا أسطى!', 'سيدي جابر!', 'الأجرة لو سمحت!',
            'يا أسطى على المحطة!', 'نفق 45!'
        ];

        this.nearStation = null;
        this.nearFuel = null;

        this.init();
    }

    // ===== INITIALIZATION =====
    async init() {
        this.updateLoading(10, 'تهيئة محرك الرسومات...');
        await this.sleep(200);

        this.initRenderer();
        this.updateLoading(20, 'تحميل محرك الفيزياء...');
        await this.sleep(200);

        this.initPhysics();
        this.updateLoading(30, 'بناء مشهد إسكندرية...');
        await this.sleep(200);

        this.initScene();
        this.updateLoading(50, 'تصميم الميكروباص...');
        await this.sleep(200);

        this.createMicrobus();
        this.updateLoading(60, 'بناء كورنيش إسكندرية...');
        await this.sleep(200);

        this.createAlexandriaWorld();
        this.updateLoading(75, 'إنشاء المحطات والمعالم...');
        await this.sleep(200);

        this.createStationsAndLandmarks();
        this.updateLoading(85, 'تحميل الأصوات...');
        await this.sleep(200);

        this.initAudio();
        this.initControls();
        this.initPassengerSeats();
        this.updateLoading(95, 'ضبط الأداء...');
        await this.sleep(200);

        this.updateLoading(100, 'جاهز للانطلاق! 🚍');
        await this.sleep(500);

        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('startMenu').classList.add('active');
        this.state = 'menu';

        this.animate();
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    updateLoading(percent, text) {
        document.getElementById('loadingBar').style.width = percent + '%';
        document.getElementById('loadingText').textContent = text;
    }

    // ===== RENDERER =====
    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: window.innerWidth > 768,
            powerPreference: 'high-performance',
            stencil: false,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        document.body.appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    // ===== PHYSICS =====
    initPhysics() {
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0)
        });
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.solver.iterations = 5;
        this.world.allowSleep = true;

        // Ground physics
        const groundBody = new CANNON.Body({
            type: CANNON.Body.STATIC,
            shape: new CANNON.Plane()
        });
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.world.addBody(groundBody);
    }

    // ===== SCENE =====
    initScene() {
        this.scene = new THREE.Scene();

        // Sky gradient
        const skyGeo = new THREE.SphereGeometry(2000, 16, 16);
        const skyMat = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077be) },
                bottomColor: { value: new THREE.Color(0x87CEEB) },
                offset: { value: 20 },
                exponent: { value: 0.4 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        this.scene.add(new THREE.Mesh(skyGeo, skyMat));

        // Fog for performance
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.0012);

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 2500);
        this.camera.position.set(0, 8, -15);

        // Lights
        const ambientLight = new THREE.AmbientLight(0x6688cc, 0.6);
        this.scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xFFEECC, 1.2);
        sunLight.position.set(200, 300, 100);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 1024;
        sunLight.shadow.mapSize.height = 1024;
        sunLight.shadow.camera.near = 10;
        sunLight.shadow.camera.far = 800;
        sunLight.shadow.camera.left = -200;
        sunLight.shadow.camera.right = 200;
        sunLight.shadow.camera.top = 200;
        sunLight.shadow.camera.bottom = -200;
        this.sunLight = sunLight;
        this.scene.add(sunLight);

        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x444422, 0.5);
        this.scene.add(hemiLight);
    }

    // ===== CREATE MICROBUS =====
    createMicrobus() {
        this.microbus = new THREE.Group();

        // Main body
        const bodyGeo = new THREE.BoxGeometry(2.5, 2, 5.5);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.3,
            metalness: 0.2
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.4;
        body.castShadow = true;
        body.receiveShadow = true;
        this.microbus.add(body);

        // Colored stripe (blue & white microbus classic)
        const stripeGeo = new THREE.BoxGeometry(2.52, 0.5, 5.52);
        const stripeMat = new THREE.MeshStandardMaterial({
            color: 0x1565C0,
            roughness: 0.4,
            metalness: 0.3
        });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.y = 1.6;
        this.microbus.add(stripe);

        // Upper stripe
        const stripe2Geo = new THREE.BoxGeometry(2.52, 0.15, 5.52);
        const stripe2 = new THREE.Mesh(stripe2Geo, stripeMat);
        stripe2.position.y = 2.2;
        this.microbus.add(stripe2);

        // Roof
        const roofGeo = new THREE.BoxGeometry(2.3, 0.3, 5);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0xDDDDDD, roughness: 0.5 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 2.55;
        roof.castShadow = true;
        this.microbus.add(roof);

        // Roof rack
        const rackGeo = new THREE.BoxGeometry(1.8, 0.15, 4);
        const rackMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
        const rack = new THREE.Mesh(rackGeo, rackMat);
        rack.position.y = 2.8;
        this.microbus.add(rack);

        // Windshield (front)
        const windshieldGeo = new THREE.BoxGeometry(2.2, 1.2, 0.1);
        const windshieldMat = new THREE.MeshStandardMaterial({
            color: 0x88CCFF,
            transparent: true,
            opacity: 0.5,
            roughness: 0.1,
            metalness: 0.5
        });
        const windshield = new THREE.Mesh(windshieldGeo, windshieldMat);
        windshield.position.set(0, 1.9, 2.75);
        this.microbus.add(windshield);

        // Rear window
        const rearWindow = windshield.clone();
        rearWindow.position.z = -2.75;
        this.microbus.add(rearWindow);

        // Side windows
        for (let side = -1; side <= 1; side += 2) {
            for (let i = -2; i <= 2; i++) {
                const winGeo = new THREE.BoxGeometry(0.1, 0.7, 0.8);
                const win = new THREE.Mesh(winGeo, windshieldMat);
                win.position.set(side * 1.26, 1.9, i * 1.1);
                this.microbus.add(win);
            }
        }

        // Headlights
        for (let side = -1; side <= 1; side += 2) {
            const headlightGeo = new THREE.SphereGeometry(0.15, 8, 8);
            const headlightMat = new THREE.MeshStandardMaterial({
                color: 0xFFFF88,
                emissive: 0xFFFF44,
                emissiveIntensity: 0.5
            });
            const headlight = new THREE.Mesh(headlightGeo, headlightMat);
            headlight.position.set(side * 0.9, 1.1, 2.78);
            this.microbus.add(headlight);
        }

        // Tail lights
        for (let side = -1; side <= 1; side += 2) {
            const tailGeo = new THREE.BoxGeometry(0.3, 0.2, 0.1);
            const tailMat = new THREE.MeshStandardMaterial({
                color: 0xFF0000,
                emissive: 0xFF0000,
                emissiveIntensity: 0.3
            });
            const tail = new THREE.Mesh(tailGeo, tailMat);
            tail.position.set(side * 0.9, 1.1, -2.78);
            this.microbus.add(tail);
        }

        // Bumpers
        const bumperGeo = new THREE.BoxGeometry(2.6, 0.25, 0.2);
        const bumperMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7 });
        const frontBumper = new THREE.Mesh(bumperGeo, bumperMat);
        frontBumper.position.set(0, 0.55, 2.85);
        this.microbus.add(frontBumper);

        const rearBumper = frontBumper.clone();
        rearBumper.position.z = -2.85;
        this.microbus.add(rearBumper);

        // Mirrors
        for (let side = -1; side <= 1; side += 2) {
            const mirrorArm = new THREE.Mesh(
                new THREE.BoxGeometry(0.4, 0.05, 0.05),
                new THREE.MeshStandardMaterial({ color: 0x222222 })
            );
            mirrorArm.position.set(side * 1.45, 1.8, 2.2);
            this.microbus.add(mirrorArm);

            const mirror = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.15, 0.05),
                new THREE.MeshStandardMaterial({ color: 0xAAAAAA, metalness: 0.9 })
            );
            mirror.position.set(side * 1.65, 1.8, 2.2);
            this.microbus.add(mirror);
        }

        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
        const hubGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.32, 8);
        const hubMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9 });

        const wheelPositions = [
            { x: -1.3, y: 0.4, z: 1.8 },
            { x: 1.3, y: 0.4, z: 1.8 },
            { x: -1.3, y: 0.4, z: -1.5 },
            { x: 1.3, y: 0.4, z: -1.5 }
        ];

        wheelPositions.forEach(pos => {
            const wheelGroup = new THREE.Group();
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.castShadow = true;
            wheelGroup.add(wheel);

            const hub = new THREE.Mesh(hubGeo, hubMat);
            hub.rotation.z = Math.PI / 2;
            wheelGroup.add(hub);

            // Tire tread
            const tireGeo = new THREE.TorusGeometry(0.4, 0.08, 6, 12);
            const tireMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1 });
            const tire = new THREE.Mesh(tireGeo, tireMat);
            tire.rotation.y = Math.PI / 2;
            wheelGroup.add(tire);

            wheelGroup.position.set(pos.x, pos.y, pos.z);
            this.microbus.add(wheelGroup);
            this.wheels.push(wheelGroup);
        });

        // Door indication
        const doorGeo = new THREE.BoxGeometry(0.05, 1.5, 1.2);
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x0D47A1 });
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(1.27, 1.2, 0.5);
        this.microbus.add(door);

        this.microbus.position.set(0, 0.5, 0);
        this.scene.add(this.microbus);

        // Physics body for microbus
        const chassisShape = new CANNON.Box(new CANNON.Vec3(1.25, 0.8, 2.75));
        this.microbusBody = new CANNON.Body({
            mass: 2500,
            shape: chassisShape,
            position: new CANNON.Vec3(0, 2, 0),
            linearDamping: 0.3,
            angularDamping: 0.5
        });
        this.world.addBody(this.microbusBody);
    }

    // ===== CREATE WORLD =====
    createAlexandriaWorld() {
        // === ROAD - Corniche ===
        const roadPoints = this.generateCornichePath();
        this.createRoad(roadPoints);

        // === SEA ===
        const seaGeo = new THREE.PlaneGeometry(3000, 1500, 64, 64);
        const seaMat = new THREE.MeshStandardMaterial({
            color: 0x006994,
            transparent: true,
            opacity: 0.85,
            roughness: 0.2,
            metalness: 0.3
        });
        this.seaPlane = new THREE.Mesh(seaGeo, seaMat);
        this.seaPlane.rotation.x = -Math.PI / 2;
        this.seaPlane.position.set(500, -0.3, -350);
        this.seaPlane.receiveShadow = true;
        this.scene.add(this.seaPlane);

        // Sea waves - vertex animation stored
        this.seaVertices = seaGeo.attributes.position.array.slice();

        // === BEACH ===
        const beachGeo = new THREE.PlaneGeometry(2500, 50);
        const beachMat = new THREE.MeshStandardMaterial({ color: 0xF4E4B0, roughness: 0.9 });
        const beach = new THREE.Mesh(beachGeo, beachMat);
        beach.rotation.x = -Math.PI / 2;
        beach.position.set(500, 0.05, -250);
        beach.receiveShadow = true;
        this.scene.add(beach);

        // === GROUND / SIDEWALKS ===
        const groundGeo = new THREE.PlaneGeometry(3000, 800);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x8B8B7A, roughness: 0.95 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(500, 0.02, 100);
        ground.receiveShadow = true;
        this.scene.add(ground);

        // === BUILDINGS ===
        this.generateBuildings();

        // === TREES (Palm Trees) ===
        this.generatePalmTrees();

        // === STREET LIGHTS ===
        this.generateStreetLights();

        // === OTHER VEHICLES ===
        this.generateTrafficVehicles();
    }

    generateCornichePath() {
        const points = [];
        for (let i = -100; i <= 1500; i += 10) {
            const x = i;
            const z = -20 + Math.sin(i * 0.003) * 40 - (i * 0.12);
            points.push(new THREE.Vector3(x, 0, z));
        }
        return points;
    }

    createRoad(points) {
        // Main road
        for (let i = 0; i < points.length - 1; i++) {
            const start = points[i];
            const end = points[i + 1];
            const dir = new THREE.Vector3().subVectors(end, start);
            const length = dir.length();
            const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

            const roadGeo = new THREE.PlaneGeometry(length + 1, 16);
            const roadMat = new THREE.MeshStandardMaterial({
                color: 0x333333,
                roughness: 0.85
            });
            const road = new THREE.Mesh(roadGeo, roadMat);
            road.rotation.x = -Math.PI / 2;
            road.position.set(center.x, 0.1, center.z);
            road.rotation.z = -Math.atan2(dir.z, dir.x);
            road.receiveShadow = true;
            this.scene.add(road);

            // Center line
            if (i % 3 === 0) {
                const lineGeo = new THREE.PlaneGeometry(length * 0.6, 0.2);
                const lineMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
                const line = new THREE.Mesh(lineGeo, lineMat);
                line.rotation.x = -Math.PI / 2;
                line.position.set(center.x, 0.12, center.z);
                line.rotation.z = road.rotation.z;
                this.scene.add(line);
            }

            // Sidewalk
            for (let side = -1; side <= 1; side += 2) {
                const swGeo = new THREE.BoxGeometry(length + 1, 0.25, 3);
                const swMat = new THREE.MeshStandardMaterial({ color: 0xAAAAAA });
                const sidewalk = new THREE.Mesh(swGeo, swMat);
                sidewalk.position.set(center.x, 0.15, center.z + side * 9);
                sidewalk.rotation.y = Math.atan2(dir.z, dir.x);
                sidewalk.receiveShadow = true;
                sidewalk.castShadow = true;
                this.scene.add(sidewalk);
            }
        }
    }

    generateBuildings() {
        const buildingColors = [
            0xE8D5B7, 0xF5E6CA, 0xD4C4A8, 0xC9B99A, 0xBEB09A,
            0xE0D0B0, 0xF0E0C0, 0xCCBB99, 0xDDD0BB, 0xE5D5BF
        ];

        for (let i = -50; i < 1400; i += 15 + Math.random() * 20) {
            for (let row = 0; row < 3; row++) {
                const height = 8 + Math.random() * 25;
                const width = 6 + Math.random() * 10;
                const depth = 6 + Math.random() * 8;

                const z_offset = 25 + row * 18 + Math.random() * 5;
                const x_offset = i + Math.random() * 8;
                const roadZ = -20 + Math.sin(x_offset * 0.003) * 40 - (x_offset * 0.12);

                const geo = new THREE.BoxGeometry(width, height, depth);
                const mat = new THREE.MeshStandardMaterial({
                    color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
                    roughness: 0.85
                });
                const building = new THREE.Mesh(geo, mat);
                building.position.set(x_offset, height / 2, roadZ + z_offset);
                building.castShadow = true;
                building.receiveShadow = true;
                this.scene.add(building);
                this.buildings.push(building);

                // Windows
                const windowMat = new THREE.MeshStandardMaterial({
                    color: 0x88BBDD,
                    emissive: 0x112233,
                    emissiveIntensity: 0.1,
                    transparent: true,
                    opacity: 0.7
                });

                const floors = Math.floor(height / 3.5);
                for (let f = 0; f < floors; f++) {
                    for (let w = 0; w < 3; w++) {
                        const winGeo = new THREE.PlaneGeometry(1.2, 1.5);
                        const win = new THREE.Mesh(winGeo, windowMat);
                        win.position.set(
                            x_offset + (w - 1) * 2,
                            2 + f * 3.5,
                            roadZ + z_offset - depth / 2 - 0.01
                        );
                        this.scene.add(win);
                    }
                }
            }
        }
    }

    generatePalmTrees() {
        const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, 6, 6);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B6914 });
        const leafGeo = new THREE.ConeGeometry(2.5, 2, 6);
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });

        for (let i = -50; i < 1400; i += 20 + Math.random() * 15) {
            const roadZ = -20 + Math.sin(i * 0.003) * 40 - (i * 0.12);

            for (let side = -1; side <= 1; side += 2) {
                const tree = new THREE.Group();

                const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                trunk.position.y = 3;
                trunk.castShadow = true;
                tree.add(trunk);

                // Multiple leaf layers
                for (let l = 0; l < 3; l++) {
                    const leaf = new THREE.Mesh(leafGeo, leafMat);
                    leaf.position.y = 6 + l * 0.5;
                    leaf.rotation.x = Math.random() * 0.3;
                    leaf.rotation.z = Math.random() * 0.3;
                    leaf.scale.setScalar(1 - l * 0.2);
                    leaf.castShadow = true;
                    tree.add(leaf);
                }

                tree.position.set(
                    i + Math.random() * 5,
                    0,
                    roadZ + side * 11 + Math.random() * 2
                );
                this.scene.add(tree);
                this.trees.push(tree);
            }
        }
    }

    generateStreetLights() {
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7 });

        for (let i = 0; i < 1400; i += 40) {
            const roadZ = -20 + Math.sin(i * 0.003) * 40 - (i * 0.12);

            const pole = new THREE.Group();
            const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 7, 6);
            const poleMesh = new THREE.Mesh(poleGeo, poleMat);
            poleMesh.position.y = 3.5;
            pole.add(poleMesh);

            // Lamp arm
            const armGeo = new THREE.BoxGeometry(2, 0.08, 0.08);
            const arm = new THREE.Mesh(armGeo, poleMat);
            arm.position.set(-1, 7, 0);
            pole.add(arm);

            // Light
            const lampGeo = new THREE.SphereGeometry(0.2, 8, 8);
            const lampMat = new THREE.MeshStandardMaterial({
                color: 0xFFDD66,
                emissive: 0xFFDD66,
                emissiveIntensity: 0.3
            });
            const lamp = new THREE.Mesh(lampGeo, lampMat);
            lamp.position.set(-2, 6.8, 0);
            pole.add(lamp);

            pole.position.set(i, 0, roadZ - 10);
            this.scene.add(pole);
        }
    }

    generateTrafficVehicles() {
        const vehicleColors = [0xFF4444, 0x4444FF, 0x44FF44, 0xFFFF44, 0xFF8800, 0x8844FF, 0xFFFFFF, 0x222222];

        for (let i = 0; i < 25; i++) {
            const vGroup = new THREE.Group();
            const color = vehicleColors[Math.floor(Math.random() * vehicleColors.length)];

            const vBody = new THREE.Mesh(
                new THREE.BoxGeometry(1.8, 1.2, 4),
                new THREE.MeshStandardMaterial({ color: color, roughness: 0.4 })
            );
            vBody.position.y = 0.9;
            vBody.castShadow = true;
            vGroup.add(vBody);

            // Cabin
            const cabin = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 0.8, 2),
                new THREE.MeshStandardMaterial({ color: color, roughness: 0.3 })
            );
            cabin.position.y = 1.9;
            cabin.position.z = -0.3;
            vGroup.add(cabin);

            // Wheels for vehicle
            for (let wx = -1; wx <= 1; wx += 2) {
                for (let wz = -1; wz <= 1; wz += 2) {
                    const w = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8),
                        new THREE.MeshStandardMaterial({ color: 0x111111 })
                    );
                    w.rotation.z = Math.PI / 2;
                    w.position.set(wx * 0.95, 0.3, wz * 1.4);
                    vGroup.add(w);
                }
            }

            const xPos = 50 + Math.random() * 1200;
            const roadZ = -20 + Math.sin(xPos * 0.003) * 40 - (xPos * 0.12);
            vGroup.position.set(xPos, 0, roadZ + (Math.random() - 0.5) * 6);
            vGroup.rotation.y = Math.random() * Math.PI * 0.1;

            // Movement data
            vGroup.userData = {
                speed: 0.3 + Math.random() * 0.5,
                direction: Math.random() > 0.5 ? 1 : -1,
                originalX: xPos
            };

            this.scene.add(vGroup);
            this.otherVehicles.push(vGroup);
        }
    }

    // ===== STATIONS & LANDMARKS =====
    createStationsAndLandmarks() {
        // Stations
        this.stationData.forEach(station => {
            const marker = new THREE.Group();

            if (station.type === 'station') {
                // Station shelter
                const shelterGeo = new THREE.BoxGeometry(3, 3, 1.5);
                const shelterMat = new THREE.MeshStandardMaterial({
                    color: 0x2196F3,
                    transparent: true,
                    opacity: 0.7
                });
                const shelter = new THREE.Mesh(shelterGeo, shelterMat);
                shelter.position.y = 1.5;
                marker.add(shelter);

                // Pole
                const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 4, 8);
                const pole = new THREE.Mesh(poleGeo,
                    new THREE.MeshStandardMaterial({ color: 0x1565C0 }));
                pole.position.set(1.8, 2, 0);
                marker.add(pole);

                // Sign
                const signGeo = new THREE.BoxGeometry(1.5, 0.8, 0.1);
                const signMat = new THREE.MeshStandardMaterial({
                    color: 0x1565C0,
                    emissive: 0x1565C0,
                    emissiveIntensity: 0.2
                });
                const sign = new THREE.Mesh(signGeo, signMat);
                sign.position.set(1.8, 3.8, 0);
                marker.add(sign);

                // Waiting people (simple cylinders)
                const numPeople = 2 + Math.floor(Math.random() * 5);
                for (let p = 0; p < numPeople; p++) {
                    const person = new THREE.Group();
                    const pBody = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.15, 0.15, 1.2, 6),
                        new THREE.MeshStandardMaterial({
                            color: [0xFF6B6B, 0x6BCB77, 0x4D96FF, 0xFFD93D, 0xFF922B][Math.floor(Math.random() * 5)]
                        })
                    );
                    pBody.position.y = 0.6;
                    person.add(pBody);

                    const pHead = new THREE.Mesh(
                        new THREE.SphereGeometry(0.15, 8, 8),
                        new THREE.MeshStandardMaterial({ color: 0xDEB887 })
                    );
                    pHead.position.y = 1.35;
                    person.add(pHead);

                    person.position.set(-0.5 + p * 0.6, 0, 1.5);
                    marker.add(person);
                }

            } else if (station.type === 'fuel') {
                // Fuel station
                const canopy = new THREE.Mesh(
                    new THREE.BoxGeometry(6, 0.3, 4),
                    new THREE.MeshStandardMaterial({ color: 0xE53935 })
                );
                canopy.position.y = 4;
                marker.add(canopy);

                // Pillars
                for (let px = -1; px <= 1; px += 2) {
                    for (let pz = -1; pz <= 1; pz += 2) {
                        const pillar = new THREE.Mesh(
                            new THREE.CylinderGeometry(0.12, 0.12, 4, 8),
                            new THREE.MeshStandardMaterial({ color: 0xBDBDBD })
                        );
                        pillar.position.set(px * 2.5, 2, pz * 1.5);
                        marker.add(pillar);
                    }
                }

                // Pump
                const pump = new THREE.Mesh(
                    new THREE.BoxGeometry(0.6, 1.8, 0.6),
                    new THREE.MeshStandardMaterial({ color: 0xFFEB3B })
                );
                pump.position.y = 0.9;
                marker.add(pump);

                // Fuel sign
                const fuelSign = new THREE.Mesh(
                    new THREE.BoxGeometry(2, 1.5, 0.1),
                    new THREE.MeshStandardMaterial({
                        color: 0xE53935,
                        emissive: 0xE53935,
                        emissiveIntensity: 0.3
                    })
                );
                fuelSign.position.set(0, 5, 0);
                marker.add(fuelSign);
            }

            marker.position.set(station.pos.x, 0, station.pos.z + 12);
            this.scene.add(marker);

            if (station.type === 'station') {
                this.stations.push({ marker, data: station });
            } else {
                this.fuelStations.push({ marker, data: station });
            }
        });

        // Landmarks
        this.landmarkData.forEach(lm => {
            const landmark = new THREE.Group();

            if (lm.type === 'castle') {
                // Qaitbay Castle
                const base = new THREE.Mesh(
                    new THREE.BoxGeometry(15, 8, 15),
                    new THREE.MeshStandardMaterial({ color: 0xD2B48C, roughness: 0.9 })
                );
                base.position.y = 4;
                base.castShadow = true;
                landmark.add(base);

                // Tower
                const tower = new THREE.Mesh(
                    new THREE.CylinderGeometry(3, 3.5, 12, 8),
                    new THREE.MeshStandardMaterial({ color: 0xC8AD7F, roughness: 0.85 })
                );
                tower.position.y = 14;
                tower.castShadow = true;
                landmark.add(tower);

                // Battlements
                for (let b = 0; b < 8; b++) {
                    const angle = (b / 8) * Math.PI * 2;
                    const batt = new THREE.Mesh(
                        new THREE.BoxGeometry(1, 2, 1),
                        new THREE.MeshStandardMaterial({ color: 0xC8AD7F })
                    );
                    batt.position.set(Math.cos(angle) * 3, 21, Math.sin(angle) * 3);
                    landmark.add(batt);
                }

            } else if (lm.type === 'library') {
                // Bibliotheca Alexandrina (disc shape)
                const disc = new THREE.Mesh(
                    new THREE.CylinderGeometry(12, 12, 2, 32, 1, false, 0, Math.PI),
                    new THREE.MeshStandardMaterial({ color: 0xC0C0C0, metalness: 0.3 })
                );
                disc.position.y = 8;
                disc.rotation.z = Math.PI * 0.15;
                disc.castShadow = true;
                landmark.add(disc);

                const wall = new THREE.Mesh(
                    new THREE.CylinderGeometry(12, 12, 16, 32, 1, true),
                    new THREE.MeshStandardMaterial({
                        color: 0xBBBBBB,
                        side: THREE.DoubleSide,
                        roughness: 0.6
                    })
                );
                wall.position.y = 8;
                landmark.add(wall);

            } else if (lm.type === 'bridge') {
                // Stanley Bridge
                const bridgeDeck = new THREE.Mesh(
                    new THREE.BoxGeometry(4, 0.5, 40),
                    new THREE.MeshStandardMaterial({ color: 0x808080, metalness: 0.4 })
                );
                bridgeDeck.position.y = 6;
                bridgeDeck.castShadow = true;
                landmark.add(bridgeDeck);

                // Arches
                for (let a = 0; a < 4; a++) {
                    const arch = new THREE.Mesh(
                        new THREE.TorusGeometry(4, 0.4, 8, 12, Math.PI),
                        new THREE.MeshStandardMaterial({ color: 0x696969 })
                    );
                    arch.position.set(0, 2, -12 + a * 8);
                    arch.rotation.y = Math.PI / 2;
                    landmark.add(arch);
                }

                // Rails
                for (let side = -1; side <= 1; side += 2) {
                    const rail = new THREE.Mesh(
                        new THREE.BoxGeometry(0.1, 1.2, 40),
                        new THREE.MeshStandardMaterial({ color: 0x444444 })
                    );
                    rail.position.set(side * 2, 6.8, 0);
                    landmark.add(rail);
                }

            } else if (lm.type === 'mall') {
                // San Stefano Mall
                const tower1 = new THREE.Mesh(
                    new THREE.BoxGeometry(12, 35, 12),
                    new THREE.MeshStandardMaterial({
                        color: 0x4169E1,
                        transparent: true,
                        opacity: 0.8,
                        metalness: 0.5
                    })
                );
                tower1.position.y = 17.5;
                tower1.castShadow = true;
                landmark.add(tower1);

                // Glass effect
                const glass = new THREE.Mesh(
                    new THREE.BoxGeometry(12.1, 35, 12.1),
                    new THREE.MeshStandardMaterial({
                        color: 0x88BBFF,
                        transparent: true,
                        opacity: 0.2,
                        metalness: 0.8
                    })
                );
                glass.position.y = 17.5;
                landmark.add(glass);

                // Base
                const base = new THREE.Mesh(
                    new THREE.BoxGeometry(20, 6, 16),
                    new THREE.MeshStandardMaterial({ color: 0xBBBBBB })
                );
                base.position.y = 3;
                landmark.add(base);
            }

            landmark.position.set(lm.pos.x, 0, lm.pos.z);
            this.scene.add(landmark);
            this.landmarks.push({ mesh: landmark, data: lm });
        });
    }

    // ===== AUDIO =====
    initAudio() {
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
        }
    }

    playSound(type) {
        if (!this.audioCtx) return;
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            switch (type) {
                case 'horn':
                    osc.frequency.setValueAtTime(350, this.audioCtx.currentTime);
                    osc.frequency.setValueAtTime(440, this.audioCtx.currentTime + 0.1);
                    osc.type = 'sawtooth';
                    gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);
                    osc.start();
                    osc.stop(this.audioCtx.currentTime + 0.5);
                    break;
                case 'engine':
                    osc.frequency.setValueAtTime(80 + this.speed * 2, this.audioCtx.currentTime);
                    osc.type = 'sawtooth';
                    gain.gain.setValueAtTime(0
