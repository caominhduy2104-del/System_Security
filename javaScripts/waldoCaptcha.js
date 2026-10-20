const firstCaptcha = document.getElementById("humanCheck");
const firstCaptchaInput = document.getElementById("checkbox");
const confirmationCaptcha = document.getElementById("captcha-confirmation");
const confirmationInput = document.getElementById("captcha-confirmation-input");
const waldoChallenge = document.getElementById("waldo-challenge");
const waldoCanvas = document.getElementById("waldo-canvas");
const waldoStatus = document.getElementById("waldo-status");
const context = waldoCanvas.getContext("2d");
const waldoImage = new Image();
const captchaOverlay = document.getElementById("captcha-overlay");
const captchaContainers = captchaOverlay.querySelector(".captcha-containers");

let resolveVerification = null;
let captchaAttempt = 0;

let imageReady = false;
let captchaComplete = false;
let keyboardCursor = null;

// Waldo's box in the original image, stored as fractions
const waldoTarget = { left: 32 / 751, top: 870 / 1200, right: 112 / 751, bottom: 1005 / 1200 };

function finishCaptcha(completed) {
    if (!resolveVerification) return;
    const resolve = resolveVerification;
    resolveVerification = null;
    captchaAttempt += 1;
    captchaOverlay.close();
    resolve(completed);
}

// This function is called when the user clicks outside the captcha containers or presses the Esc key
window.registrationCaptcha = {
    verify() {
        if (resolveVerification) return Promise.resolve(false);
        captchaAttempt += 1;
        captchaComplete = false;
        keyboardCursor = null;

        for (const panel of [firstCaptcha, confirmationCaptcha, waldoChallenge]) {
            for (const animation of panel.getAnimations()) animation.cancel();
            panel.hidden = panel !== firstCaptcha;
        }

        for (const input of [firstCaptchaInput, confirmationInput]) {
            input.checked = false;
            input.disabled = false;
        }

        waldoChallenge.classList.remove("is-complete");
        if (imageReady) {
            drawWaldo();
            waldoStatus.textContent = "Click on Waldo to finish.";
        }

        return new Promise(resolve => {
            resolveVerification = resolve;
            captchaOverlay.showModal();
            firstCaptchaInput.focus({ preventScroll: true });
        });
    }
};

captchaOverlay.addEventListener("click", function(event) {
    if (!captchaContainers.contains(event.target)) finishCaptcha(false);
});

captchaOverlay.addEventListener("cancel", function(event) {
    event.preventDefault();
    finishCaptcha(false);
});

captchaOverlay.addEventListener("close", function() {
    // Also resolve if another caller closes the dialog directly
    if (!captchaOverlay.open && resolveVerification) finishCaptcha(false);
});

// Switches the visible captcha panel with a fade animation, then focuses the specified target element
async function switchCaptcha(previous, next, focusTarget) {
    const attempt = captchaAttempt;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220;

    // Wait for the previous panel to fade out before showing the next panel
    try {
        await previous.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration, easing: "ease-out", fill: "forwards"
        }).finished;

    } catch {
        return; // Reopening cancels animations from the previous attempt
    }

    // If the captcha attempt has changed or the verification has been resolved, do not proceed with showing the next panel
    if (attempt !== captchaAttempt || !resolveVerification) return;
    previous.hidden = true;
    next.hidden = false;
    focusTarget.focus({ preventScroll: true });
    next.animate([{ opacity: 0 }, { opacity: 1 }], { duration, easing: "ease-in" });
}

firstCaptchaInput.addEventListener("change", async function() {
    if (!firstCaptchaInput.checked || firstCaptchaInput.disabled) {
        return;
    }

    firstCaptchaInput.disabled = true;
    await switchCaptcha(firstCaptcha, confirmationCaptcha, confirmationInput);
});

confirmationInput.addEventListener("change", async function() {
    if (!confirmationInput.checked || confirmationInput.disabled) return;
    confirmationInput.disabled = true;
    await switchCaptcha(confirmationCaptcha, waldoChallenge, waldoCanvas);
});

function drawWaldo() {
    context.clearRect(0, 0, waldoCanvas.width, waldoCanvas.height);
    context.drawImage(waldoImage, 0, 0);

    // Draw a rectangle around Waldo if the captcha is complete, or draw a cursor if the user is navigating with the keyboard.
    if (captchaComplete) {
        context.strokeStyle = "#16a34a";
        context.lineWidth = 6;
        context.strokeRect(
            waldoTarget.left * waldoCanvas.width, waldoTarget.top * waldoCanvas.height,
            (waldoTarget.right - waldoTarget.left) * waldoCanvas.width,
            (waldoTarget.bottom - waldoTarget.top) * waldoCanvas.height
        );

    } else if (keyboardCursor) {
        context.strokeStyle = "#fff";
        context.lineWidth = 5;
        context.strokeRect(keyboardCursor.x - 10, keyboardCursor.y - 10, 20, 20);
        context.strokeStyle = "#111827";
        context.lineWidth = 2;
        context.strokeRect(keyboardCursor.x - 10, keyboardCursor.y - 10, 20, 20);
    }
}

waldoImage.addEventListener("load", function() {
    waldoCanvas.width = waldoImage.naturalWidth;
    waldoCanvas.height = waldoImage.naturalHeight;
    imageReady = true;
    drawWaldo();
    waldoStatus.textContent = "Click on Waldo to finish.";
});
waldoImage.addEventListener("error", function() {
    waldoStatus.textContent = "Picture could not load. Refresh the page to try again.";
});
waldoImage.src = "../assets/Logo/waldo.jpg";

// Handle keyboard navigation for the Waldo challenge
function selectWaldo(x, y) {
    if (!imageReady || captchaComplete || !resolveVerification || waldoChallenge.hidden) return;
    const normalizedX = x / waldoCanvas.width;
    const normalizedY = y / waldoCanvas.height;
    if (normalizedX >= waldoTarget.left && normalizedX <= waldoTarget.right && normalizedY >= waldoTarget.top && normalizedY <= waldoTarget.bottom) {
        captchaComplete = true;
        waldoChallenge.classList.add("is-complete");
        waldoStatus.textContent = "✓ CAPTCHA complete. You found Waldo!";

    } else {
        waldoStatus.textContent = "That's not Waldo. Try again.";
    }
    drawWaldo();

    // If the captcha is complete, resolve the verification after a short delay to allow the user to see the success message.
    if (captchaComplete) {
        setTimeout(() => {
            if (resolveVerification) finishCaptcha(true);
        }, 2000);
    } 
}

waldoCanvas.addEventListener("click", function(event) {
    const bounds = waldoCanvas.getBoundingClientRect();
    // Convert displayed coordinates into original image coordinates.
    selectWaldo(
        (event.clientX - bounds.left) * waldoCanvas.width / bounds.width,
        (event.clientY - bounds.top) * waldoCanvas.height / bounds.height
    );
});

waldoCanvas.addEventListener("keydown", function(event) {
    if (!imageReady || captchaComplete) return;

    const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    
    if (!directions[event.key] && event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    keyboardCursor ??= { x: waldoCanvas.width / 2, y: waldoCanvas.height / 2 };
    
    if (directions[event.key]) {
        const [dx, dy] = directions[event.key];
        keyboardCursor.x = Math.max(0, Math.min(waldoCanvas.width, keyboardCursor.x + dx * 10));
        keyboardCursor.y = Math.max(0, Math.min(waldoCanvas.height, keyboardCursor.y + dy * 10));
        drawWaldo();
    } else {
        selectWaldo(keyboardCursor.x, keyboardCursor.y);
    }
});
