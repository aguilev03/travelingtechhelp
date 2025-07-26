document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contact-form");
  const status = document.createElement("p");
  status.id = "form-status";
  status.style.marginTop = "1rem";
  form.appendChild(status);

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    status.textContent = "Sending...";

    // Collect field values
    const firstName = form.firstName.value.trim();
    const lastName = form.lastName.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const issue = form.issue.value.trim();

    // Basic validation
    if (!firstName || !lastName || !email || !phone || !issue) {
      status.textContent = "Please fill out all fields.";
      status.style.color = "red";
      return;
    }

    // Prepare payload
    const payload = {
      firstName,
      lastName,
      email,
      phone,
      issue,
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

      if (response.ok) {
        status.textContent = "Thank you! Your message has been sent.";
        status.style.color = "green";
        form.reset();
      } else {
        const error = await response.text();
        status.textContent = "Something went wrong: " + error;
        status.style.color = "red";
      }
    } catch (err) {
      console.error(err);
      status.textContent = "Network error. Please try again later.";
      status.style.color = "red";
    }
  });
});
