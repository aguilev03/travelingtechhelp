document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const issue = document.getElementById("issue").value.trim();

    // ✅ Strip non-digits for validation
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    const token = document.querySelector(
      '[name="cf-turnstile-response"]'
    ).value;

    const payload = {
      firstName,
      lastName,
      email,
      phone,
      issue,
      "cf-turnstile-response": token, // required
    };

    try {
      const response = await fetch(
        "https://contact-worker.evan-bf0.workers.dev",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const resultText = await response.text();

      if (!response.ok) {
        throw new Error("Something went wrong: " + resultText);
      }

      form.style.display = "none";
      document.getElementById("form-message").textContent =
        "✅ Your message was successfully sent. We’ll be reaching out shortly!";
      document.getElementById("form-message").style.display = "block";
    } catch (error) {
      console.error(error);
      alert(error.message || "Network error. Please try again later.");
    }
  });

  // 📞 Auto-format phone as user types
  document.getElementById("phone").addEventListener("input", function (e) {
    let cleaned = e.target.value.replace(/\D/g, ""); // remove non-digits

    if (cleaned.length > 10) {
      cleaned = cleaned.slice(0, 10);
    }

    let formatted = cleaned;
    if (cleaned.length > 6) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(
        3,
        6
      )}-${cleaned.slice(6)}`;
    } else if (cleaned.length > 3) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    }

    e.target.value = formatted;
  });
});
