document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const startOverlay = document.getElementById('start-overlay');
    const bgMusic = document.getElementById('bg-music');
    const nextBtn = document.getElementById('next-btn');
    const page1 = document.getElementById('page-1');
    const page2 = document.getElementById('page-2');
    const enableMicBtn = document.getElementById('enable-mic-btn');
    const micStatus = document.getElementById('mic-status');
    const instructionText = document.getElementById('instruction-text');
    let candlesOut = false;

    // --- Audio & Start ---
    startBtn.addEventListener('click', () => {
        bgMusic.play().then(() => {
            startOverlay.style.opacity = '0';
            setTimeout(() => startOverlay.remove(), 500);
            createBalloons();
            startPartyPoppers(); // Start confetti

            // Show and animate photo
            const photoContainer = document.querySelector('.photo-container');
            const photo = document.querySelector('.revolving-photo');
            const birthdayText = document.querySelector('.birthday-text');
            const nextBtn = document.getElementById('next-btn');

            // Dramatic reveal sequence
            setTimeout(() => {
                photoContainer.classList.add('visible');
                photo.classList.add('animate');
            }, 300);

            setTimeout(() => {
                birthdayText.classList.add('visible');
            }, 1500); // Text appears after photo spin starts

            setTimeout(() => {
                nextBtn.classList.add('visible');
            }, 2500); // Button appears last

        }).catch(err => {
            console.error("Audio playback failed:", err);
            alert("Please click anywhere to start music.");
        });
    });

    // --- Navigation ---
    nextBtn.addEventListener('click', () => {
        page1.classList.remove('active-section');
        page2.classList.add('active-section');
        stopPartyPoppers(); // Stop confetti on page transition
    });

    // --- Balloons & Poppers Logic ---
    let popperInterval;

    function startPartyPoppers() {
        // Pop confetti every 2 seconds randomly
        popperInterval = setInterval(() => {
            confetti({
                particleCount: 50,
                startVelocity: 30,
                spread: 360,
                origin: { x: Math.random(), y: Math.random() * 0.5 + 0.2 },
                colors: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff9ff3', '#54a0ff'],
                disableForReducedMotion: true
            });
        }, 1500);
    }

    function stopPartyPoppers() {
        clearInterval(popperInterval);
    }

    function createBalloons() {
        const container = document.getElementById('balloons-container');
        const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff9ff3', '#54a0ff'];

        // Create initial batch
        for (let i = 0; i < 5; i++) {
            const b = document.createElement('div');
            b.className = 'balloon';
            b.style.left = Math.random() * 100 + 'vw';
            b.style.bottom = (Math.random() * 20 - 20) + 'vh'; // Start slightly on screen
            b.style.background = colors[Math.floor(Math.random() * colors.length)];
            b.style.animationDuration = (Math.random() * 5 + 5) + 's';
            container.appendChild(b);
            setTimeout(() => b.remove(), 10000);
        }

        setInterval(() => {
            const b = document.createElement('div');
            b.className = 'balloon';
            b.style.left = Math.random() * 100 + 'vw';
            b.style.background = colors[Math.floor(Math.random() * colors.length)];
            b.style.animationDuration = (Math.random() * 5 + 5) + 's';
            container.appendChild(b);

            setTimeout(() => b.remove(), 10000);
        }, 500); // More frequent (was 800)
    }

    // --- Microphone & Candle Logic ---
    const flames = document.querySelectorAll('.flame');

    enableMicBtn.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            micStatus.textContent = "Microphone: On 🟢 Listening...";
            enableMicBtn.style.display = 'none';

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 1024;

            microphone.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(audioContext.destination);

            // Add a warm-up delay to ignore initial noise spike
            let micReady = false;
            setTimeout(() => {
                micReady = true;
            }, 2000); // Wait 2 seconds before listening for "blow"

            scriptProcessor.onaudioprocess = function () {
                if (candlesOut || !micReady) return; // Ignore if not ready

                const array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);

                let values = 0;
                const length = array.length;
                for (let i = 0; i < length; i++) {
                    values += array[i];
                }

                const average = values / length;

                // Lower threshold for better response (was 40)
                // Blowing creates a lot of noise, but 25 should be responsive enough
                if (average > 25) {
                    blowOutCandles();
                }
            };

        } catch (err) {
            console.error("Mic Error:", err);
            instructionText.innerText = "Mic access denied. Click candles to blow them out!";
            micStatus.textContent = "Microphone: Blocked 🔴";

            // Fallback: Click to blow out
            document.querySelector('.cake').addEventListener('click', blowOutCandles);
        }
    });

    function blowOutCandles() {
        if (candlesOut) return;
        candlesOut = true;

        flames.forEach(flame => flame.classList.add('out'));
        instructionText.innerText = "Yay! Happy Birthday! 🥳";
        micStatus.textContent = "Request Granted! 🎂";

        // Play Clapping Sound
        const clappingAudio = document.getElementById('clapping-audio');
        clappingAudio.volume = 0.8;
        clappingAudio.play();

        // Stop clapping after 5 seconds
        setTimeout(() => {
            clappingAudio.pause();
            clappingAudio.currentTime = 0;
        }, 5000);

        // Detailed Confetti
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    }
});
