const passwordInput = document.getElementById("password");
const passwordRequirements = document.getElementById("password-requirements");

// Only registration displays password requirements.
if (passwordInput && passwordRequirements) {
    const passwordRules = [
        {element: document.getElementById("password-lowercase"), matches: value => /[a-z]/.test(value)},
        {element: document.getElementById("password-uppercase"), matches: value => /[A-Z]/.test(value)},
        {element: document.getElementById("password-number"), matches: value => /[0-9]/.test(value)},
        {element: document.getElementById("password-length"), matches: value => value.length >= 8},
        {element: document.getElementById("password-symbol"), matches: value => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)}
    ];

    function setPasswordRequirementsVisible(isVisible) {
        passwordRequirements.classList.toggle("is-open", isVisible);
        passwordRequirements.setAttribute("aria-hidden", String(!isVisible));
    }

    function updatePasswordRequirements() {
        for (const rule of passwordRules) {
            const isValid = rule.matches(passwordInput.value);
            rule.element.classList.toggle("is-valid", isValid);
            rule.element.classList.toggle("is-invalid", !isValid);
        }

        // Check if all requirements are met
        const allRequirementsValid = passwordRules.every(rule => rule.matches(passwordInput.value));
        passwordInput.setCustomValidity(allRequirementsValid ? "" :
            "Password must contain at least 8 characters, a lowercase letter, an uppercase letter, a number, and a symbol.");
        setPasswordRequirementsVisible(document.activeElement === passwordInput && !allRequirementsValid);
        
        return allRequirementsValid;
    }

    passwordInput.addEventListener("focus", function() {
        updatePasswordRequirements();
    });

    passwordInput.addEventListener("blur", function() {
        setPasswordRequirementsVisible(false);
    });

    passwordInput.addEventListener("input", function() {
        // Automatically blur the password input if all requirements are met
        if (updatePasswordRequirements()) {
            passwordInput.blur();
        }
    });
    updatePasswordRequirements();
}

const authForm = document.getElementById("auth-form");
const submitButton = authForm.querySelector('button[type="submit"]');

authForm.addEventListener("submit", async function(event) {
    event.preventDefault();
    if (submitButton.disabled || !authForm.reportValidity()) {
        return;
    }

    submitButton.disabled = true;

    try {
        if (document.getElementById("captcha-overlay")) {
            const completed = await window.registrationCaptcha.verify();
            if (!completed) {
                return;
            }
            if (!authForm.reportValidity()) {
                return;
            }
        }

        // Send the form data to the server using fetch
        const response = await fetch(authForm.action, {
            method: "POST",
            body: new FormData(authForm)
        });

        // Handle the response from the server
        if (!response.ok) {
            const message = [400, 401, 409].includes(response.status)
                ? await response.text()
                : "Something went wrong on the server. Please try again.";
            alert(message);
            return;
        }

        // If the response is a redirect, navigate to the new URL
        if (response.redirected) {
            window.location.href = response.url;
        }

    } catch {
        alert("Unable to reach the server. Please try again.");
        
    } finally {
        submitButton.disabled = false;
        submitButton.focus({ preventScroll: true });
    }
});

// Click event listeners for Google and Apple
for (const buttonId of ["google-auth-button", "apple-auth-button"]) {
    document.getElementById(buttonId).addEventListener("click", function() {
        alert("Nothing to see here");
    });
}
