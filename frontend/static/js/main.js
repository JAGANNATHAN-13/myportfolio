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
            
            const name = document.getElementById('contact-name').value;
            const email = document.getElementById('contact-email').value;
            const message = document.getElementById('contact-message').value;
            
            const subject = encodeURIComponent(`Portfolio Contact from ${name}`);
            const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
            
            window.location.href = `mailto:jaganeleven2006@gmail.com?subject=${subject}&body=${body}`;
        });
    }

    // --- Load Projects ---
    fetch("/api/projects")
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById("projects");

        if (!container) return;

        container.innerHTML = "";

        data.forEach(project => {
          const card = document.createElement("div");

          card.className = "project-card border border-gray-800/80 p-6 group transition-all duration-500 hover:border-ciaRed bg-gray-900/50 hover:bg-gray-900 cursor-pointer relative overflow-hidden min-h-[200px]";

          const demoLink = project.demo_link ? `
            <a href="${project.demo_link}" target="_blank" class="inline-block mt-4 px-4 py-2 bg-ciaRed text-white text-sm font-bold hover:bg-ciaRedLight transition-colors">
              VIEW PROJECT
            </a>
          ` : '';

          card.innerHTML = `
            <div class="absolute top-0 left-0 w-1 h-full bg-ciaRed transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <h2 class="text-white text-2xl font-bold mb-2 group-hover:text-ciaRed transition-colors">${project.title}</h2>
            <p class="text-gray-400 text-sm leading-relaxed mb-4">${project.description}</p>
            <div class="flex flex-wrap gap-2">
              ${project.tech_stack.split(',').map(tech => `<span class="text-xs text-ciaRed border border-ciaRed/50 px-2 py-1">${tech.trim()}</span>`).join('')}
            </div>
            ${demoLink}
          `;

          if (project.demo_link && !demoLink) {
            card.onclick = () => window.open(project.demo_link, '_blank');
          }

          container.appendChild(card);
        });
      })
      .catch(err => console.error("Error:", err));
});
