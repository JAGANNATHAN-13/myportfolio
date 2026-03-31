gsap.registerPlugin(TextPlugin);

let isAudioEnabled = false;

// Basic Audio Synthesizer inside JS (No need for external sound files!)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const masterGain = audioCtx.createGain();
masterGain.gain.value = 0.1; // Master volume
masterGain.connect(audioCtx.destination);

function playBeep(freq = 600, type = 'sine', duration = 0.05, vol = 0.1) {
    if (!isAudioEnabled) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq / 2, audioCtx.currentTime + duration);
    
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(masterGain);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playHoverSound() { playBeep(300, 'square', 0.05, 0.05); }
function playClickSound() { playBeep(800, 'triangle', 0.1, 0.1); }
function playTypeSound() { playBeep(400 + Math.random()*200, 'square', 0.02, 0.02); }

document.addEventListener('DOMContentLoaded', () => {

    // --- Cursor Follower ---
    const cursor = document.getElementById('cursor');
    const follower = document.getElementById('cursor-follower');

    // Only run cursor on desktop, hide on mobile/touch
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        let mouseX = 0, mouseY = 0;
        let currX = 0, currY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursor.style.left = mouseX + 'px';
            cursor.style.top = mouseY + 'px';
        });

        gsap.ticker.add(() => {
            currX += (mouseX - currX) * 0.15;
            currY += (mouseY - currY) * 0.15;
            follower.style.left = currX + 'px';
            follower.style.top = currY + 'px';
        });
    } else {
        // Mobile — hide cursor elements completely
        if (cursor) cursor.style.display = 'none';
        if (follower) follower.style.display = 'none';
    }

    // Interactive elements hover logic
    const interactives = document.querySelectorAll('.interactive, a, button, .project-card, .skill-card');
    interactives.forEach(el => {
        el.addEventListener('mouseenter', () => {
            document.body.classList.add('hovering');
            playHoverSound();
        });
        el.addEventListener('mouseleave', () => {
            document.body.classList.remove('hovering');
        });
        el.addEventListener('click', () => {
            playClickSound();
            // Pulse the cursor
            gsap.fromTo(follower, {scale: 0.5}, {scale: 2, opacity: 0, duration: 0.5, clearProps: "all"});
        });
    });

    // --- Boot Sequence Animation ---
    const bootLines = [
        "INITIALIZING SYSTEM PROTOCOLS...",
        "LOADING ASSETS... [ OK ]",
        "CONNECTING TO DATABASE... [ OK ]",
        "ESTABLISHING SECURE CONNECTION...",
        "VERIFYING CACHE",
        "LOADING UI MODULES... [ 100% ]",
        "SYSTEM READY."
    ];
    
    const bootTextEl = document.getElementById('boot-text');
    let currentLine = 0;
    
    function showNextLine() {
        if (currentLine < bootLines.length) {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'mb-2';
            bootTextEl.appendChild(lineDiv);
            
            let i = 0;
            const line = bootLines[currentLine];
            
            // Typewriter effect per char
            const typingInterval = setInterval(() => {
                lineDiv.textContent += line.charAt(i);
                playTypeSound();
                i++;
                if (i >= line.length) {
                    clearInterval(typingInterval);
                    currentLine++;
                    setTimeout(showNextLine, Math.random() * 200 + 100);
                }
            }, 20); // typing speed
        } else {
            // Boot finished
            setTimeout(() => {
                document.getElementById('access-granted').classList.remove('hidden');
                playBeep(900, 'sine', 1, 0.2); // Success sound
                
                gsap.to('#access-granted', {
                    opacity: 1, duration: 0.5, yoyo: true, repeat: 5, onComplete: revealMainContent
                });
            }, 500);
        }
    }
    
    function revealMainContent() {
        // Fade out boot screen, fade in main
        const tl = gsap.timeline();
        tl.to('#boot-screen', { opacity: 0, duration: 1, ease: 'power2.inOut', onComplete: () => {
            document.getElementById('boot-screen').style.display = 'none';
        }})
        .to('#main-content', { display: 'block', opacity: 1, duration: 1.5 })
        .from('.gs-reveal', { y: 50, opacity: 0, duration: 1, stagger: 0.1, ease: 'power3.out'}, "-=1");
    }

    // Start boot sequence
    setTimeout(showNextLine, 500);

    // --- Audio Toggle ---
    const audioToggle = document.getElementById('audio-toggle');
    audioToggle.addEventListener('click', () => {
        isAudioEnabled = !isAudioEnabled;
        if (isAudioEnabled) {
            audioCtx.resume();
            audioToggle.innerHTML = '[ AUDIO: ENABLED ]';
            audioToggle.classList.add('bg-ciaRed', 'text-black');
            playBeep(1200, 'sine', 0.1);
        } else {
            audioToggle.innerHTML = '[ AUDIO: DISABLED ]';
            audioToggle.classList.remove('bg-ciaRed', 'text-black');
        }
    });

    // --- 3D Card Tilt Effect ---
    const cards = document.querySelectorAll('.skill-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;
            
            gsap.to(card, {
                rotationX: rotateX,
                rotationY: rotateY,
                transformPerspective: 1000,
                ease: 'power1.out',
                duration: 0.5
            });
            
            // Show hidden desc
            const desc = card.querySelector('.hidden-desc');
            if(desc) {
                gsap.to(desc, {opacity: 1, y: 0, duration: 0.3});
            }
        });
        
        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                rotationX: 0,
                rotationY: 0,
                ease: 'elastic.out(1, 0.3)',
                duration: 1
            });
            
            const desc = card.querySelector('.hidden-desc');
            if(desc) {
                gsap.to(desc, {opacity: 0, y: 10, duration: 0.3});
            }
        });
    });

    // --- Uptime Counter ---
    const uptimeEl = document.getElementById('uptime-counter');
    let seconds = 0;
    setInterval(() => {
        seconds++;
        const d = Math.floor(seconds / (3600*24));
        const h = Math.floor(seconds % (3600*24) / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        const s = Math.floor(seconds % 60);
        uptimeEl.textContent = `${String(d).padStart(2,'0')}:${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }, 1000);

    // --- Contact Form Handling ---
    const contactForm = document.getElementById('contact-form');
    if(contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button');
            const submitText = document.getElementById('submit-text');
            const statusDiv = document.getElementById('contact-status');
            
            const name = document.getElementById('contact-name').value;
            const email = document.getElementById('contact-email').value;
            const message = document.getElementById('contact-message').value;
            
            submitText.textContent = '[ ENCRYPTING... ]';
            playTypeSound();
            
            try {
                const res = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({name, email, message})
                });
                const data = await res.json();
                
                if(data.success) {
                    submitText.textContent = '[ TRANSMISSION_SUCCESSFUL ]';
                    btn.classList.add('bg-green-900', 'border-green-500', 'text-green-500');
                    btn.classList.remove('border-ciaRed', 'text-ciaRed');
                    
                    statusDiv.innerHTML = 'DATA SECURELY TRANSMITTED.';
                    statusDiv.className = 'text-center text-sm font-bold border border-green-500 text-green-500 p-2 mt-4 bg-green-900/20 blink';
                    statusDiv.classList.remove('hidden');
                    
                    playBeep(1500, 'sine', 0.2);
                    contactForm.reset();
                    
                    setTimeout(() => {
                        submitText.textContent = '[ EXECUTE_TRANSMISSION ]';
                        btn.classList.remove('bg-green-900', 'border-green-500', 'text-green-500');
                        btn.classList.add('border-ciaRed', 'text-ciaRed');
                        statusDiv.classList.add('hidden');
                    }, 5000);
                }
            } catch(e) {
                console.error(e);
                submitText.textContent = '[ TRANSMISSION_FAILED ]';
                statusDiv.innerHTML = 'ERROR: PACKET LOSS DETECTED.';
                statusDiv.className = 'text-center text-sm font-bold border border-ciaRed text-ciaRed p-2 mt-4 blink';
                statusDiv.classList.remove('hidden');
                playBeep(200, 'square', 0.5);
            }
        });
    }

});// existing code (animations, cursor, etc...)

// 👇 PASTE HERE AT END

fetch("https://myportfolio-653w.onrender.com/api/projects")
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById("projects");

    container.innerHTML = "";

    data.forEach(project => {
      const card = document.createElement("div");

      card.className = "project-card border border-gray-800/80 p-1 group transition-all duration-500 hover:border-red-600 bg-white/5";

      card.innerHTML = `
        ...
      `;

      container.appendChild(card);
    });
  })
  .catch(err => console.error("Error:", err));
  // your existing code (animations, cursor, etc...)


// 🔥 PASTE HERE AT VERY BOTTOM

document.addEventListener("DOMContentLoaded", () => {

  fetch("https://myportfolio-653w.onrender.com/api/projects")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("projects");

      container.innerHTML = "";

      data.forEach(project => {
        const card = document.createElement("div");

        card.className = "project-card border border-gray-800 p-4";

        card.innerHTML = `
          <h2 class="text-white text-xl">${project.title}</h2>
          <p class="text-gray-400">${project.description}</p>
        `;

        container.appendChild(card);
      });
    })
    .catch(err => console.error("Error:", err));

});
